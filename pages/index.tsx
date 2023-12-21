import { usePageData, Link } from '@nokkio/router';
import type { PageMetadataFunction, PageDataArgs } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { Img } from '@nokkio/image';

import { secondsToHumanReadable } from 'utils/media';
import Footer from 'components/Footer';

export async function getPageData({ auth }: PageDataArgs) {
  if (auth?.isAdmin) {
    return Story.find({
      filter: { state: 'ready' },
      with: ['user'],
      sort: '-createdAt',
    });
  }

  return Story.find({
    filter: { isPublic: true, state: 'ready' },
    with: ['user'],
    sort: '-createdAt',
  });
}

export const getPageMetadata: PageMetadataFunction<typeof getPageData> = () => {
  return { title: "Tonight's Bedtime Story: All stories" };
};

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
      <div className="px-6 lg:px-12 grid grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <div
            className={`rounded-xl overflow-hidden${
              story.isPublic ? '' : ' opacity-50'
            }`}
          >
            <Link className="relative" to={`/stories/${story.id}`}>
              <div className="aspect-square">
                {story.image && <Img image={story.image} crop />}
              </div>
              <div className="absolute bottom-0 left-0 bg-gray-900 p-6 w-full space-y-1 opacity-95">
                <div className="uppercase text-sm font-bold">{story.title}</div>
                {story.duration && (
                  <div className="mono text-sm text-gray-400">
                    {secondsToHumanReadable(story.duration)}
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
}
