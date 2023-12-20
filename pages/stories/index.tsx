import { usePageData, Link } from '@nokkio/router';
import type { PageMetadataFunction } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { Img } from '@nokkio/image';

import { secondsToHumanReadable } from 'utils/media';
import Footer from 'components/Footer';

export async function getPageData() {
  return Story.find({ filter: { isPublic: true, state: 'ready' } });
}

export const getPageMetadata: PageMetadataFunction<typeof getPageData> = () => {
  return { title: "Tonight's Bedtime Story: All stories" };
};

export default function (): JSX.Element {
  const stories = usePageData<typeof getPageData>();

  return (
    <>
      <h1 className="text-2xl lg:text-6xl font-bold px-6 lg:px-12">
        All stories
      </h1>
      <div className="px-6 lg:px-12 grid grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <div className="rounded-xl overflow-hidden">
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
