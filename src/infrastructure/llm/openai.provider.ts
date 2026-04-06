import OpenAI from 'openai';
import { env } from '../../config/env';
import type { ClusterSummaryResult, FailureCluster } from '../../domain/types/analysis.types';

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

type SummarizeOptions = {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  callModel?: (cluster: FailureCluster) => Promise<string | null | undefined>;
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new TimeoutError('LLM call timed out')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

async function defaultCallModel(cluster: FailureCluster): Promise<string | null> {
  if (!client) return null;

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

  return response.choices?.[0]?.message?.content?.trim() || null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function summarizeCluster(
  cluster: FailureCluster,
  options: SummarizeOptions = {}
): Promise<ClusterSummaryResult> {
  const callModel = options.callModel ?? defaultCallModel;
  const timeoutMs = options.timeoutMs ?? env.OPENAI_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? env.OPENAI_MAX_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? 200;

  if (!client && !options.callModel) {
    return {
      summary: 'AI summary disabled',
      summaryStatus: 'disabled',
      attempts: 0
    };
  }

  let lastError: unknown;
  const totalAttempts = maxRetries + 1;

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    try {
      const summary = await withTimeout(callModel(cluster), timeoutMs);
      if (!summary) {
        return {
          summary: 'No AI summary generated',
          summaryStatus: 'no_content',
          attempts: attempt
        };
      }

      return {
        summary,
        summaryStatus: 'success',
        attempts: attempt
      };
    } catch (error) {
      lastError = error;
      if (attempt < totalAttempts) {
        await sleep(retryDelayMs * attempt);
      }
    }
  }

  if (lastError instanceof TimeoutError) {
    return {
      summary: 'AI summary unavailable (timeout)',
      summaryStatus: 'failed_timeout',
      attempts: totalAttempts
    };
  }

  return {
    summary: 'AI summary unavailable',
    summaryStatus: 'failed_error',
    attempts: totalAttempts
  };
}
