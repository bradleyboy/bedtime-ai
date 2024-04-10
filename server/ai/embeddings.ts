import process from 'node:process';

import { Story } from '@nokkio/magic';

import { openai, pinecone } from 'server/ai/clients.ts';

// TODO: Support .env for endpoints so we don't have to do stuff like this
const PINECONE_INDEX_NAMESPACE =
  process.env.NODE_ENV === 'production' ? 'bedtime-ai' : 'bedtime-ai-dev';

const pineconeIndex = pinecone.index<{ isPublic: boolean; userId: string }>(
  'nokkio-test',
);

async function getEmbeddingsForStory(story: Story): Promise<Array<number>> {
  if (story.text === null) {
    throw new Error(
      'Cannot generate embeddings when Story does not have text.',
    );
  }

  const result = await openai.embeddings.create({
    input: story.text,
    model: 'text-embedding-3-small',
    dimensions: 512,
  });

  return result.data[0].embedding;
}

export async function batchEmbeddingsForStories(
  stories: Array<Story>,
): Promise<void> {
  const batch: Array<{ record: Story; vector: Array<number> }> = [];

  for (const story of stories) {
    const vector = await getEmbeddingsForStory(story);
    batch.push({ record: story, vector });
  }

  await storeVectorsForStories(batch);
}

export async function updateEmbeddingForStory(story: Story): Promise<void> {
  const vector = await getEmbeddingsForStory(story);

  await storeVectorsForStories([{ record: story, vector }]);
}

async function storeVectorsForStories(
  stories: Array<{ record: Story; vector: Array<number> }>,
): Promise<void> {
  await pineconeIndex.namespace(PINECONE_INDEX_NAMESPACE).upsert(
    stories.map(({ record, vector }) => ({
      id: record.id,
      values: vector,
      metadata: { isPublic: record.isPublic, userId: record.userId },
    })),
  );
}

export async function findSimilarStories(story: Story): Promise<Array<Story>> {
  const results = await pineconeIndex
    .namespace(PINECONE_INDEX_NAMESPACE)
    .query({
      id: story.id,
      topK: 5,
      filter: { $or: [{ isPublic: true }, { userId: story.userId }] },
    });

  const ids = results.matches.map((m) => m.id).filter((id) => id !== story.id);

  const stories = await Story.find({
    filter: {
      id: ids,
    },
  });

  const final: Array<Story> = [];

  stories.forEach((s) => {
    final[ids.indexOf(s.id)] = s;
  });

  return final;
}
