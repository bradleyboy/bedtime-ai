import { usePageData, Link } from '@nokkio/router';
import type { PageMetadataFunction } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { Img } from '@nokkio/image';

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
      <div className="grid grid-cols-4 gap-6">
        {stories.map((story) => (
          <div>
            <Link className="relative" to={`/stories/${story.id}`}>
              <div className="aspect-square">
                {story.image && <Img image={story.image} />}
              </div>
              <div className="absolute bottom-0 left-0 bg-gray-900 p-6 w-full font-bold opacity-80">
                {story.title}: {story.duration}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
