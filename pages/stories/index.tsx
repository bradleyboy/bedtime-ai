import { usePageData, Link } from '@nokkio/router';
import type { PageMetadataFunction, PageDataArgs } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { Img } from '@nokkio/image';

export async function getPageData(args: PageDataArgs) {
  return Story.find({ filter: { isPublic: true, state: 'ready' } });
}

export const getPageMetadata: PageMetadataFunction<typeof getPageData> = () => {
  return { title: '' };
};

export default function (): JSX.Element {
  const stories = usePageData<typeof getPageData>();

  return (
    <>
      <div className="grid grid-cols-3">
        {stories.map((story) => (
          <div>
            <Link to={`/stories/${story.id}`}>
              {story.title}: {story.duration}
            </Link>
            {story.image && <Img image={story.image} />}
          </div>
        ))}
      </div>
    </>
  );
}
