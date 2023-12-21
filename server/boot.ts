import { RESTRICT_TO_ENDPOINTS, Story } from '@nokkio/magic';
import { getPublicFileUrl } from '@nokkio/endpoints';
import { NotAuthorizedError } from '@nokkio/errors';

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
  // Do not allow stories to be listed unless the public
  // query param is set and true, or we are in a trusted
  // environment (e.g. endpoints)
  Story.beforeFind(({ isTrusted, query }) => {
    if (isTrusted || query.id || query.isPublic) {
      return query;
    }

    throw new NotAuthorizedError();
  });

  Story.beforeDelete(RESTRICT_TO_ENDPOINTS);

  Story.beforeUpdate(({ isTrusted, fields }) => {
    if (isTrusted) {
      return fields;
    }

    const updatedKeys = Object.keys(fields);

    // duration is currently the only thing we allow to be updated
    // fron the client.
    if (updatedKeys.length === 1 && updatedKeys[0] === 'duration') {
      return fields;
    }

    throw new NotAuthorizedError();
  });

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

  Story.beforeCreate(({ fields, userId }) => {
    if (!userId) {
      throw new NotAuthorizedError();
    }

    return fields;
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
