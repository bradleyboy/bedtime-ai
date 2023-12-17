import OpenAI from 'npm:openai';
import { Story } from '@nokkio/magic';
import { getSecret, writeFile, writeImage } from '@nokkio/endpoints';

const openai = new OpenAI({
  apiKey: getSecret('openAIApiKey'),
});

const PROMPT_COMMON = [
  {
    role: 'system',
    content: `You are a helpful assistant who works with parents to create unique, engaging, age appropriate bedtime stories that help a child relax and fall asleep.

When given a prompt, you will create the story, generate a title for the story, and generate an image prompt that will later be used to create a unique cover image for the story. The guidelines for the story are below.

When creating the story, follow these rules:
- it should be a soothing, uplifting tale appropriate to children of all ages.
- this story should be between 500 and 750 words long, DO NOT return stories outside of shorter or longer than this.

Once the story is created, generating a title that is less than 100 characters. When adding the title to the response, write only the title, do not add any explaination before or after in your response. Do not wrap the title in any punctuation.

Finally, create an image prompt following these directions:
- the image prompt should be based on the generated story and will be used as cover art when shown to the child during storytime
- The prompt should create an image with a modern, whimsical, flat cartoon style that appeals to young children.
- IMPORTANT: make sure the prompt results in an image that is appropriate for children.
- Return ONLY the prompt, do not include any text that is not part of the prompt.

Once you have all this information, return it in a JSON string with the keys: title, story, image_prompt. You MUST return valid JSON. Do NOT wrap the json output in \`\`\`json ... \`\`\`!
      `,
  },
  {
    role: 'assistant',
    content: "What is the topic of tonight's bedtime story?",
  },
] as const;

export async function generateStoryFromPrompt(prompt: string) {
  const completion = await openai.chat.completions.create({
    response_format: { type: 'json_object' },
    messages: [
      ...PROMPT_COMMON,
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'gpt-4-1106-preview',
  });

  const r = completion.choices[0].message.content;

  if (!r) {
    throw new Error('no response from API');
  }

  try {
    return JSON.parse(r) as {
      title: string;
      story: string;
      image_prompt: string;
    };
  } catch (e) {
    console.log('parsing JSON from OpenAI failed', r);
    throw e;
  }
}

export function generateStory(story: Story) {
  return generateStoryFromPrompt(story.prompt);
}

export async function generateStoryTitle(story: Story) {
  if (!story.text) {
    throw new Error('story does not yet have generated text');
  }

  const completion = await openai.chat.completions.create({
    messages: [
      ...PROMPT_COMMON,
      {
        role: 'user',
        content: story.prompt,
      },
      {
        role: 'assistant',
        content: story.text,
      },
      {
        role: 'user',
        content:
          'Generate a short title for the story in less than 100 characters. Return only the title, do not add any explaination before or after in your response. Do not wrap the title in any punctuation',
      },
    ],
    model: 'gpt-3.5-turbo',
  });

  return completion.choices[0].message.content;
}

export async function generateImagePrompt(story: Story) {
  const completion = await openai.chat.completions.create({
    messages: [
      ...PROMPT_COMMON,
      {
        role: 'user',
        content: story.prompt,
      },
      {
        role: 'assistant',
        content: story.text,
      },
      {
        role: 'user',
        content:
          'generate an image prompt based on that story that will be used as cover art for the story. The prompt should create an image with a vibrant, colorful, cinematic illustration style that appeals to young children. IMPORTANT: make sure the prompt results in an image that is appropriate for children. Return ONLY the prompt, do not include any text that is not part of the prompt.',
      },
    ],
    model: 'gpt-3.5-turbo',
  });

  return completion.choices[0].message.content;
}

export async function generateImage(story: Story) {
  if (!story.imagePrompt) {
    throw new Error('story does not yet have an image prompt');
  }

  const image = await openai.images.generate({
    model: 'dall-e-3',
    // Since the AI is generated our image prompt, they are already very detailed.
    // Use this preamble to turn off the default behavior of this endpoint where
    // it rewrites the prompt with more detail.
    prompt: `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: In a vibrant, colorful, cinematic illustration style: ${story.imagePrompt}`,
    quality: 'hd',
    size: '1792x1024',
  });

  const url = image.data[0].url;

  if (!url) {
    throw new Error('error generating imasge');
  }

  const r = await fetch(url);

  if (!r.ok || !r.body) {
    throw new Error('error fetching imasge');
  }

  const { path, metadata } = await writeImage('cover.png', r.body);

  return {
    path,
    ...metadata,
  };
}

export async function generateAudio(story: Story): Promise<string> {
  if (!story.text) {
    throw new Error('story does not yet have generated text');
  }

  const audio = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: story.text,
  });

  if (!audio.body) {
    throw new Error('nope');
  }

  const { path } = await writeFile(`${story.id}.mp3`, audio.body);

  return path;
}
