import OpenAI from 'npm:openai@^4.83';
import { Pinecone } from 'npm:@pinecone-database/pinecone@^2.2';

import { getSecret } from '@nokkio/endpoints';

export const openai = new OpenAI({
  apiKey: getSecret('openAIApiKey'),
});

export const pinecone = new Pinecone({
  apiKey: getSecret('pineconeApiKey'),
});
