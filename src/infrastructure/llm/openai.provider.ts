import OpenAI from 'openai';
import { env } from '../../config/env';
import type { FailureCluster } from '../../domain/types/analysis.types';

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export async function summarizeCluster(cluster: FailureCluster): Promise<string> {
  if (!client) return 'AI summary disabled';

  try {
    const sampleTests = cluster.tests
      .slice(0, 3)
      .map(test => `${test.file}: ${test.title}`)
      .join('\n');

    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior test engineer. Give a concise root-cause hypothesis and next debugging steps.'
        },
        {
          role: 'user',
          content:
            `Failure signature: ${cluster.signature}\n` +
            `Occurrences: ${cluster.count}\n` +
            `Failed: ${cluster.failedCount}, flaky: ${cluster.flakyCount}\n` +
            `Example tests:\n${sampleTests}`
        }
      ]
    });

    return response.choices?.[0]?.message?.content?.trim() || 'No AI summary generated';
  } catch {
    return 'AI summary unavailable';
  }
}
