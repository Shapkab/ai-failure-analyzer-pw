import assert from 'node:assert/strict';
import test from 'node:test';

import { runAnalysis } from '../domain/services/analysis-orchestrator.service';
import type { PlaywrightReport } from '../domain/types/analysis.types';

test('runAnalysis clusters normalized failures and skips AI when disabled', async () => {
  const report: PlaywrightReport = {
    suites: [
      {
        specs: [
          {
            title: 'first timeout',
            file: 'tests/a.spec.ts',
            tests: [
              {
                results: [
                  {
                    status: 'failed',
                    error: { message: 'Timeout after 1200ms on step 9' }
                  }
                ]
              }
            ]
          },
          {
            title: 'second timeout',
            file: 'tests/b.spec.ts',
            tests: [
              {
                results: [
                  {
                    status: 'failed',
                    error: { message: 'Timeout after 2500ms on step 2' }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const clusters = await runAnalysis(report, { summarizeWithAi: false });

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].count, 2);
  assert.equal(clusters[0].failedCount, 2);
  assert.equal(clusters[0].flakyCount, 0);
  assert.equal(clusters[0].summary, 'AI summary skipped');
  assert.equal(clusters[0].summaryStatus, 'skipped');
  assert.match(clusters[0].signature, /\[num\]/);
});
