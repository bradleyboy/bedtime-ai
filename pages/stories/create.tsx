import { useState, ChangeEvent, KeyboardEventHandler, type JSX } from 'react';

import type { PageMetadataFunction } from '@nokkio/router';
import { usePageData } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { useForm, Textarea } from '@nokkio/forms';
import { useAuth } from '@nokkio/auth';
import { Img } from '@nokkio/image';

import SignInWithGoogleButton from 'components/SignInWithGoogleButton';

export const getPageMetadata: PageMetadataFunction = () => {
  return { title: "Tonight's Bedtime Story: Create a story" };
};

export async function getPageData() {
  const params = new URLSearchParams(location.search);
  const from = params.get('from');

  if (from) {
    return {
      basedOn: await Story.findById(from),
    };
  }

  return { basedOn: null };
}

const listenForEnter: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  }
};

export default function Index(): JSX.Element {
  const { basedOn } = usePageData<typeof getPageData>();
  const { logout, isAuthenticated, user } = useAuth();
  const [isSubmittable, setIsSubmittable] = useState(false);
  const { Form, isProcessing } = useForm(Story, {
    initialValues:
      basedOn !== null
        ? {
            parentStoryId: basedOn.id,
          }
        : undefined,
    redirectOnSuccess: (story) => {
      return `/stories/${story.id}/processing`;
    },
  });

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setIsSubmittable(e.currentTarget.value.trim().length > 0);
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center mx-6 md:mx-0">
        <div className="w-96 bg-gray-900 rounded-md flex space-y-6 p-6 flex-col">
          <div className="text-xl font-bold">Login to continue</div>
          <p>Authenticate with Google to create your first story.</p>
          <div className="inline-flex h-[44px]">
            <SignInWithGoogleButton />
          </div>
        </div>
      </div>
    );
  }

  if (user.isBanned) {
    return (
      <div className="flex h-full items-center justify-center mx-6 md:mx-0">
        <div className="w-96 bg-gray-900 rounded-md flex space-y-6 p-6 flex-col">
          <div className="text-xl font-bold">Not authorized</div>
          <p>You are no longer allowed to create stories.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1
        onClick={() => logout()}
        className="text-2xl lg:text-6xl font-bold px-6 lg:px-12"
      >
        Tonight's Bedtime Story
      </h1>
      {basedOn !== null && (
        <div className="px-6 lg:px-12 flex space-x-4">
          <div>
            <Img className="h-24 w-24" crop image={basedOn.image!} />
          </div>
          <div className="space-y-1 flex justify-center flex-col">
            <div className="uppercase text-xs text-gray-400">
              Creating a new story based on
            </div>
            <div className="text-lg">{basedOn.title}</div>
            <div className="text-gray-400">
              Enter the changes you'd like to make below, and a new version will
              be created.
            </div>
          </div>
        </div>
      )}

      <Form className="flex flex-col flex-1">
        <Textarea
          onKeyDown={listenForEnter}
          onChange={handleChange}
          autoFocus
          disabled={isProcessing}
          name="prompt"
          placeholder={
            basedOn === null
              ? `What's the subject of tonight's story? You can also try: "make up a story for me"`
              : 'Update the story so that...'
          }
          className="leading-relaxed lg:leading-relaxed resize-none disabled:text-gray-600 flex-1 mx-6 lg:mx-12 text-gray-200 bg-transparent text-2xl lg:text-5xl focus:outline-none rounded-md"
        />
        <button
          disabled={!isSubmittable || isProcessing}
          className="disabled:bg-gray-900 disabled:text-gray-600 mt-6 text-2xl lg:text-5xl rounded-md p-6 lg:p-12 hover:bg-gray-600 transition-colors bg-gray-800 font-bold"
        >
          {isProcessing ? 'Creating...' : 'Create'}
        </button>
      </Form>
    </>
  );
}
