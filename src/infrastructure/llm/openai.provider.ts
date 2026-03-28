import OpenAI from 'openai';
import { env } from '../../config/env';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function summarizeCluster(cluster: any) {
  if (!env.OPENAI_API_KEY) return "AI disabled";

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [{
      role: 'user',
      content: `Summarize failure: ${cluster.signature}`
    }]
  });

  return response.choices[0].message.content;
}
