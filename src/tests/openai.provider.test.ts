import assert from 'node:assert/strict';
import test from 'node:test';

import { summarizeCluster } from '../infrastructure/llm/openai.provider';
import type { FailureCluster } from '../domain/types/analysis.types';

const clusterFixture: FailureCluster = {
  signature: 'Timeout error [num]',
  count: 2,
  failedCount: 2,
  flakyCount: 0,
  tests: [
    {
      title: 'times out on login',
      file: 'tests/auth.spec.ts',
      error: 'Timeout 1200ms',
      attempts: 1,
      isFlaky: false,
      normalizedError: 'Timeout [num]ms'
    }
  ]
};

test('summarizeCluster returns disabled status when AI client is not configured', async () => {
  const result = await summarizeCluster(clusterFixture);

  assert.equal(result.summaryStatus, 'disabled');
  assert.equal(result.attempts, 0);
});

test('summarizeCluster retries and returns timeout failure status', async () => {
  const result = await summarizeCluster(clusterFixture, {
    timeoutMs: 10,
    maxRetries: 1,
    retryDelayMs: 1,
    callModel: async () =>
      new Promise<string>(resolve => {
        setTimeout(() => resolve('late summary'), 50);
      })
  });

  assert.equal(result.summaryStatus, 'failed_timeout');
  assert.equal(result.attempts, 2);
});

test('summarizeCluster succeeds on retry after transient failure', async () => {
  let attempt = 0;
  const result = await summarizeCluster(clusterFixture, {
    timeoutMs: 100,
    maxRetries: 1,
    retryDelayMs: 1,
    callModel: async () => {
      attempt += 1;
      if (attempt === 1) throw new Error('temporary failure');
      return 'recovered summary';
    }
  });

  assert.equal(result.summaryStatus, 'success');
  assert.equal(result.attempts, 2);
  assert.equal(result.summary, 'recovered summary');
});
