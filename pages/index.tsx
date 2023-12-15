import type { PageMetadataFunction } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { useForm, Input } from '@nokkio/forms';
import { useNavigate } from '@nokkio/router';

export const getPageMetadata: PageMetadataFunction = () => {
  return { title: "Tonight's Bedtime Story" };
};

export default function Index(): JSX.Element {
  const navigate = useNavigate();
  const { Form, isProcessing } = useForm(Story, {
    onSuccess: (story) => {
      navigate(`/stories/${story.id}/processing`);
    },
  });

  return (
    <div className="text-gray-50 bg-gray-800 p-6 w-96 flex flex-col space-y-6 rounded-md">
      <h1 className="text-2xl font-bold">Tonight's Bedtime Story</h1>

      <Form className="flex flex-col">
        <Input
          type="text"
          name="prompt"
          placeholder="What's the subject of tonight's story?"
          className="p-3 bg-gray-600 rounded-md"
        />

        <button
          disabled={isProcessing}
          className="mt-5 rounded-md p-3 bg-gray-600 font-bold"
        >
          Create
        </button>
      </Form>
    </div>
  );
}
