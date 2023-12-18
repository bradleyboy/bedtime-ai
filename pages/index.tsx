import type { PageMetadataFunction } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { useForm, Textarea } from '@nokkio/forms';
import { useState, ChangeEvent, KeyboardEventHandler } from 'react';

export const getPageMetadata: PageMetadataFunction = () => {
  return { title: "Tonight's Bedtime Story" };
};

const listenForEnter: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  }
};

export default function Index(): JSX.Element {
  const [isSubmittable, setIsSubmittable] = useState(false);
  const { Form, isProcessing } = useForm(Story, {
    redirectOnSuccess: (story) => {
      return `/stories/${story.id}/processing`;
    },
  });

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setIsSubmittable(e.currentTarget.value.trim().length > 0);
  }

  return (
    <>
      <h1 className="text-2xl lg:text-6xl font-bold px-6 lg:px-12">
        Tonight's Bedtime Story
      </h1>

      <Form className="flex flex-col flex-1">
        <Textarea
          onKeyDown={listenForEnter}
          onChange={handleChange}
          autoFocus
          disabled={isProcessing}
          name="prompt"
          placeholder="What's the subject of tonight's story?"
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
