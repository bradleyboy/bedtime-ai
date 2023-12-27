import {
  RESTRICT_TO_ENDPOINTS,
  Story,
  User,
  isOrConditionBlock,
} from '@nokkio/magic';
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
  // All user operations happen in endpoints only, do not allow
  // the client to perform these or direct access to the data endpoints.
  User.beforeFind(RESTRICT_TO_ENDPOINTS);
  User.beforeCreate(RESTRICT_TO_ENDPOINTS);
  User.beforeUpdate(RESTRICT_TO_ENDPOINTS);
  User.beforeDelete(RESTRICT_TO_ENDPOINTS);

  // Do not allow stories to be listed unless the public
  // query param is set and true, or we are in a trusted
  // environment (e.g. endpoints)
  Story.beforeFind(async ({ userId, isTrusted, query }) => {
    if (isTrusted) {
      return query;
    }

    // Basic home page / detail page query should either provide
    // an ID or have isPublic set to true
    if (query.length === 1) {
      if (isOrConditionBlock(query[0])) {
        throw new NotAuthorizedError();
      }

      if (query[0].id || query[0].isPublic) {
        return query;
      }
    }

    // Logged in user home page feed query should have state = ready
    // and isPublic = true OR userId that matches the logged in user.
    if (query.length === 2) {
      const [stateQuery, orQuery] = query;

      if (isOrConditionBlock(stateQuery) || !isOrConditionBlock(orQuery)) {
        throw new NotAuthorizedError();
      }

      if (stateQuery.state !== 'ready') {
        throw new NotAuthorizedError();
      }

      if (orQuery.$or.isPublic !== true || orQuery.$or.userId !== userId) {
        throw new NotAuthorizedError();
      }
    }

    // Fallback for when an admin is present, allow the query through
    if (userId !== null) {
      const user = await User.findById(userId);

      if (user !== null && user.isAdmin) {
        return query;
      }
    }

    // Everything else should not be allowed client-side
    throw new NotAuthorizedError();
  });

  Story.beforeDelete(RESTRICT_TO_ENDPOINTS);

  Story.beforeUpdate(async ({ isTrusted, userId, fields }) => {
    if (isTrusted) {
      return fields;
    }

    const updatedKeys = Object.keys(fields);

    // duration is currently the only thing we allow to be updated
    // fron the client, other than isPublic (see below)
    if (updatedKeys.length === 1 && updatedKeys[0] === 'duration') {
      return fields;
    }

    if (
      updatedKeys.length === 1 &&
      updatedKeys[0] === 'isPublic' &&
      userId !== null
    ) {
      const user = await User.findById(userId);

      // Only admins can modify isPublic
      if (user && user.isAdmin) {
        return fields;
      }
    }

    throw new NotAuthorizedError();
  });

  Story.beforeRead(({ records }) => {
    return records.map((story) => {
      if (story.audio === null) {
        return story;
      }

      // We only store the audio relative path and turn it
      // into a full path at read time.
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

  // The rest of these model events implement a pseudo state
  // machine that moves the story through the different stages
  // of generation.
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
