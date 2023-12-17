import type { PageMetadataFunction } from '@nokkio/router';
import { useStory } from '@nokkio/magic';
import { useNavigate, Link } from '@nokkio/router';
import { useEffect } from 'react';

export const getPageMetadata: PageMetadataFunction = () => {
  return { title: "Tonight's Bedtime Story: Creating..." };
};

type PageParams = { id: string };

function Spinner() {
  return (
    <svg
      className="animate-spin -mb-0.5 lg:-mb-1 mr-1 lg:mr-3 h4 lg:h-8 w-4 lg:w-8 text-gray-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

function InProgress({ children }: { children: string }) {
  return (
    <div className="flex text-gray-200 items-center justify-start space-x-1">
      <Spinner />
      <p>{children}</p>
    </div>
  );
}

function Done({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-start space-x-1 text-gray-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="text-green-300 -ml-0.5 lg:-ml-1 w-5 h-5 lg:w-10 lg:h-10 -mb-0.5 lg:-mb-1 mr-0.5 lg:mr-2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
        />
      </svg>
      <p>{children}</p>
    </div>
  );
}

export default function ({ params }: { params: PageParams }) {
  const story = useStory(params.id, { live: true });
  const navigate = useNavigate();

  useEffect(() => {
    if (story.state === 'ready') {
      navigate(`/stories/${story.id}`, true);
    }
  }, [story.state]);

  if (story.state === 'ready') {
    // This will redirect from the effect above, so just render nothing
    // to prevent flashing content
    return null;
  }

  if (story.state === 'failed') {
    return (
      <>
        <h1 className="text-2xl lg:text-6xl font-bold px-6 lg:px-12">Uh oh.</h1>
        <div className="px-6 space-y-3 text-gray-100 lg:px-12 lg:space-y-8 lg:text-5xl">
          <p>
            Your story failed to create, sorry. Please{' '}
            <Link className="underline" to="/">
              go back to the home page
            </Link>{' '}
            and try again.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl lg:text-6xl font-bold px-6 lg:px-12">
        Tonight's Bedtime Story
      </h1>
      <div className="px-6 space-y-3 text-gray-600 lg:px-12 lg:space-y-8 lg:text-5xl">
        {story.title === null && (
          <InProgress>Generating a story from your prompt...</InProgress>
        )}
        {story.title !== null && <Done>Created "{story.title}"</Done>}
        {story.title !== null && (
          <InProgress>Generating image and audio...</InProgress>
        )}
      </div>
    </>
  );
}
