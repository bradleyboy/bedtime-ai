import { useState } from 'react';

import { usePageData, Link } from '@nokkio/router';
import type { PageMetadataFunction, PageDataArgs } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { Img } from '@nokkio/image';

import { secondsToHumanReadable } from 'utils/media';
import Footer from 'components/Footer';
import Spinner from 'components/Spinner';

export async function getPageData({ auth }: PageDataArgs) {
  if (auth !== null) {
    if (auth.isAdmin) {
      return Story.find({
        filter: { state: 'ready' },
        sort: '-createdAt',
      });
    }

    return Story.find({
      filter: [
        { state: 'ready' },
        { $or: { isPublic: true, userId: auth.id } },
      ],
      sort: '-createdAt',
    });
  }

  return Story.find({
    filter: { state: 'ready', isPublic: true },
    sort: '-createdAt',
  });
}

export const getPageMetadata: PageMetadataFunction<typeof getPageData> = () => {
  return { title: "Tonight's Bedtime Story: All stories" };
};

function StoryImage({ story }: { story: Story }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative aspect-square${story.isPublic ? '' : ' grayscale'}`}
    >
      {!loaded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Spinner />
        </div>
      )}
      {story.image && (
        <Img onLoad={() => setLoaded(true)} image={story.image} crop />
      )}
      {loaded && story.isPublic === false && (
        <div className="absolute text-white top-6 right-6 bg-gray-800 px-3 py-1 text-sm bg-opacity-70">
          Visible only to you
        </div>
      )}
    </div>
  );
}

export default function (): JSX.Element {
  const stories = usePageData<typeof getPageData>();

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
      <div className="px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <div key={story.id} className="rounded-xl overflow-hidden">
            <Link className="relative block" to={`/stories/${story.id}`}>
              <StoryImage story={story} />
              <div className="absolute bottom-0 left-0 bg-gray-900 p-6 w-full space-y-1 opacity-95">
                <div className="uppercase text-sm font-bold">{story.title}</div>
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
      <Footer />
    </>
  );
}
