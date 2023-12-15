import type { PageMetadataFunction } from '@nokkio/router';
import { useStory } from '@nokkio/magic';
import { useNavigate, Link } from '@nokkio/router';
import { useEffect } from 'react';

export const getPageMetadata: PageMetadataFunction = () => {
  return { title: "Tonight's Bedtime Story: Creating..." };
};

type PageParams = { id: string };

export default function ({ params }: { params: PageParams }) {
  const story = useStory(params.id, { live: true });
  const navigate = useNavigate();

  useEffect(() => {
    if (story.state === 'ready') {
      navigate(`/stories/${story.id}`, true);
    }
  }, [story.state]);

  if (story.state === 'failed') {
    return (
      <div className="text-gray-50 bg-gray-800 p-6 w-96 flex flex-col space-y-6 rounded-md">
        <h1 className="text-2xl font-bold">Oh no.</h1>
        <p>
          Your story failed to create, sorry. Please{' '}
          <Link className="underline" to="/">
            go back to the home page
          </Link>{' '}
          and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="text-gray-50 bg-gray-800 p-6 w-96 flex flex-col space-y-6 rounded-md">
      <h1 className="text-2xl font-bold">Creating your bedtime story</h1>
      {story.title === null && <p>Imagining your story...</p>}
      {story.title && <p>Creating "{story.title}"...</p>}
    </div>
  );
}
