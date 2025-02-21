import { Story } from '@nokkio/magic';
import { writeFile, writeImage } from '@nokkio/endpoints';
import { z } from 'npm:zod';
import { zodResponseFormat } from 'npm:openai@^4.83/helpers/zod';

import { openai } from 'server/ai/clients.ts';

const PROMPT_COMMON = [
  {
    role: 'system',
    content: `You are a creative storyteller who works with parents to create unique, engaging, age-appropriate bedtime stories that help a child relax and fall asleep.

When given a prompt, you will create the story, generate a title for the story, generate a short summary, and generate an image prompt that will later be used to create a unique cover image for the story. The guidelines for the story are below.

When creating the story, follow these rules:
- it should be a soothing, uplifting tale appropriate to children of all ages.
- it should have a main character that the reader can relate to.
- this story should be between 500 and 750 words long, DO NOT return stories outside of these boundaries.
- If at all possible, create the story in the same language that the prompt is in. For example, if the user prompts in French, write the story in French. If you are unsure or do not support that language, default to English.
- If the prompt asks you to create the story randomly, DO NOT overuse the "whispering" theme.

Once the story is created, generate a title that is less than 100 characters. When adding the title to the response, write only the title, do not add any explanation before or after in your response. Do not wrap the title in any punctuation.

For the summary, create a 1-2 sentence overview of the story that draws the reader in without giving away the entire story.

Finally, create an image prompt following these directions:
- The prompt should create an image in a modern cartoon style similar to those found in other children's books.
- IMPORTANT: make sure the prompt results in an image that is appropriate for children.
- Children can often spot an AI generated image, try to prevent that by keeping the image simple and not cluttering the scene up with too many concepts at once.
- Return ONLY the prompt, do not include any text that is not part of the prompt.
      `,
  },
  {
    role: 'assistant',
    content: "What is the topic of tonight's bedtime story?",
  },
] as const;

export async function generateStory(story: Story) {
  const promptHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
    [];

  // We pass a seed for determinism, which is important for stories created
  // later based off of this story.
  let seed = story.createdAt.getTime();

  // If the story was forked from another story, backfill the prompt history
  if (story.parentStoryId) {
    const parent = await Story.findById(story.parentStoryId);

    if (parent) {
      // Use the seed of the original story for better determinism
      seed = parent.createdAt.getTime();

      promptHistory.push({
        role: 'user',
        content: parent.prompt,
      });

      promptHistory.push({
        role: 'assistant',
        content: JSON.stringify({
          title: parent.title,
          summary: parent.summary,
          image_prompt: parent.imagePrompt,
          story: parent.text,
        }),
      });
    }
  }

  const Output = z.object({
    title: z.string(),
    story: z.string(),
    summary: z.string(),
    image_prompt: z.string(),
  });

  const completion = await openai.beta.chat.completions.parse({
    response_format: zodResponseFormat(Output, 'story'),
    seed,
    messages: [
      ...PROMPT_COMMON,
      ...promptHistory,
      {
        role: 'user',
        content: story.prompt,
      },
    ],
    model: 'gpt-4o',
    // Send the Nokkio user ID through per OpenAI's best practices
    // for safety: https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids
    user: story.userId,
  });

  const r = completion.choices[0].message.parsed;

  if (!r) {
    throw new Error('no response from API');
  }

  return r;
}

export async function generateImage(story: Story) {
  if (!story.imagePrompt) {
    throw new Error('story does not yet have an image prompt');
  }

  const image = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `In a vibrant, colorful, cinematic illustration style: ${story.imagePrompt}`,
    size: '1792x1024',
  });

  const url = image.data[0].url;

  if (!url) {
    throw new Error('error generating image');
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

  const { path } = await writeFile(
    `${story.id}.mp3`,
    // weird issue here with the openai types and deno /shrug
    audio.body as unknown as ReadableStream,
  );

  return path;
}
