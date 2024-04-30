import { useState } from 'react';

import { usePageData, Link } from '@nokkio/router';
import type { PageMetadataFunction, PageDataArgs } from '@nokkio/router';
import { Story, User } from '@nokkio/magic';
import { Img } from '@nokkio/image';

import { secondsToHumanReadable } from 'utils/media';
import Footer from 'components/Footer';
import Spinner from 'components/Spinner';

function getStories(user: User | null) {
  if (user !== null) {
    if (user.isAdmin) {
      return Story.find({
        filter: { state: 'ready' },
        sort: '-createdAt',
      });
    }

    return Story.find({
      filter: [
        { state: 'ready' },
        { $or: { isPublic: true, userId: user.id } },
      ],
      sort: '-createdAt',
    });
  }

  return Story.find({
    filter: { state: 'ready', isPublic: true },
    sort: '-createdAt',
  });
}

export async function getPageData({ auth }: PageDataArgs) {
  const [stories, features] = await Promise.all([
    getStories(auth),
    Story.find({
      filter: { state: 'ready', isDailyStory: true, isPublic: true },
      sort: '-createdAt',
      limit: 1,
    }),
  ]);

  return {
    stories,
    daily: features.length ? features[0] : null,
  };
}

export const getPageMetadata: PageMetadataFunction<typeof getPageData> = () => {
  return {
    title:
      "Tonight's Bedtime Story: AI-powered bedtime stories generated daily",
  };
};

function StoryImage({
  loading,
  story,
  crop = true,
}: {
  loading?: 'lazy';
  story: Story;
  crop?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative ${crop ? `aspect-square` : ''}${
        story.isPublic ? '' : ' grayscale'
      }`}
    >
      {!loaded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Spinner />
        </div>
      )}
      {story.image && (
        <Img
          loading={loading}
          onLoad={() => setLoaded(true)}
          image={story.image}
          crop={crop}
        />
      )}
      {loaded && story.isPublic === false && (
        <div className="absolute text-white top-6 right-6 bg-gray-800 px-3 py-1 text-sm bg-opacity-70">
          Visible only to you
        </div>
      )}
    </div>
  );
}

function FeaturedStory({ story }: { story: Story }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 bg-gray-900 mb-6 lg:gap-6 rounded-xl overflow-hidden">
      <div className="md:col-span-2">
        <StoryImage story={story} crop={false} />
      </div>
      <div className="xl:text-xl lg:col-span-1 pl-6 lg:pl-0 py-6 space-y-3 lg:space-y-6 pr-6">
        <div className="uppercase text-sm text-gray-300">Tonight's story</div>
        <div className="lg:text-xl xl:text-2xl font-bold">{story.title}</div>
        <p>{story.summary}</p>
        <Link
          className="inline-flex items-center justify-between rounded bg-gray-600 px-3 py-2 text-sm xl:text-lg hover:bg-gray-700 transition-colors"
          to={`/stories/${story.id}`}
        >
          Listen now{' '}
          <span className="bg-gray-900 px-1 py-1.5 rounded ml-2 text-xs items-center">
            {story.duration ? secondsToHumanReadable(story.duration) : '3:00'}
          </span>
        </Link>
      </div>
    </div>
  );
}

export default function (): JSX.Element {
  const { stories, daily } = usePageData<typeof getPageData>();

  return (
    <>
      <div className="px-6 lg:px-12 space-y-3 lg:space-y-6">
        <h1 className="text-2xl lg:text-6xl font-bold">
          Tonight's Bedtime Story
        </h1>
        <p className="text-gray-300">
          Stories, images, and audio generated with the OpenAI API.{' '}
          <Link className="underline hover:text-gray-50" to="/stories/create">
            Try creating your own
          </Link>
          .
        </p>
      </div>
      <div className="px-6 lg:px-12">
        {daily && <FeaturedStory story={daily} />}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories
            .filter((story) => story.id !== daily?.id)
            .map((story) => (
              <div key={story.id} className="rounded-xl overflow-hidden">
                <Link className="relative block" to={`/stories/${story.id}`}>
                  <StoryImage loading="lazy" story={story} />
                  <div className="absolute bottom-0 left-0 bg-gray-900 p-6 w-full space-y-1 opacity-95">
                    <div className="uppercase text-sm font-bold">
                      {story.title}
                    </div>
                    <div className="mono text-sm text-gray-400">
                      {story.duration
                        ? secondsToHumanReadable(story.duration)
                        : '3:00'}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
