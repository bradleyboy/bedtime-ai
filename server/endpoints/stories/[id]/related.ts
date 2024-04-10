import { findSimilarStories } from 'server/ai/index.ts';
import { Story } from '@nokkio/magic';
import { NokkioRequest, json } from '@nokkio/endpoints';

export async function get(req: NokkioRequest) {
  const story = await Story.findById(req.params.id as string);

  if (!story) {
    return json({ error: 'not found' }, { status: 404 });
  }

  const relatedStories = await findSimilarStories(story);

  return json({ story, relatedStories });
}
