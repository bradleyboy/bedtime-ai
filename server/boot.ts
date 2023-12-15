import { Story } from '@nokkio/magic';
import { getPublicFileUrl } from '@nokkio/endpoints';

import {
  generateImage,
  generateStory,
  generateAudio,
} from 'server/ai/tasks.ts';

function getNextState(state: Story['state']): Story['state'] {
  if (state === 'created') {
    return 'generating_story';
  }

  if (state === 'generating_story') {
    return 'generating_media';
  }

  return 'ready';
}

export default function boot() {
  Story.beforeRead(({ records }) => {
    return records.map((story) => {
      if (story.audio === null) {
        return story;
      }

      return {
        ...story,
        audio: getPublicFileUrl(story.audio),
      };
    });
  });

  Story.afterCreate(async (story) => {
    await story.update({
      state: getNextState(story.state),
    });
  });

  Story.afterUpdate(async (story) => {
    if (story.state === 'ready' || story.state === 'failed') {
      return;
    }

    try {
      if (story.state === 'generating_story') {
        const {
          story: text,
          title,
          image_prompt: imagePrompt,
        } = await generateStory(story);

        await story.update({
          text,
          title,
          imagePrompt,
          state: getNextState(story.state),
        });

        return;
      }

      if (story.state === 'generating_media') {
        const [image, audio] = await Promise.all([
          generateImage(story),
          generateAudio(story),
        ]);

        await story.update({
          image,
          audio,
          state: getNextState(story.state),
          completedAt: new Date(),
        });

        return;
      }

      await story.update({
        state: getNextState(story.state),
      });
    } catch (e) {
      if (story.attempt === 3) {
        console.log('error processing story, giving up', {
          state: story.state,
          error: e.message,
        });

        await story.update({
          state: 'failed',
        });

        return;
      }
      console.log('error processing story, retrying', {
        state: story.state,
        attempt: story.attempt,
        error: e.message,
      });

      await story.update({
        attempt: story.attempt + 1,
      });
    }
  });
}
