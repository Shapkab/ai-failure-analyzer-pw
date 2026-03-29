import assert from 'node:assert/strict';
import test from 'node:test';

import { parsePlaywrightReport } from '../infrastructure/parsers/playwright-json.parser';
import type { PlaywrightReport } from '../domain/types/analysis.types';

const report: PlaywrightReport = {
  suites: [
    {
      specs: [
        {
          title: 'root failure',
          file: 'tests/root.spec.ts',
          tests: [
            {
              results: [
                {
                  status: 'failed',
                  error: { message: 'Timeout 123ms' }
                }
              ]
            }
          ]
        }
      ],
      suites: [
        {
          specs: [
            {
              title: 'flaky test',
              file: 'tests/flaky.spec.ts',
              tests: [
                {
                  results: [
                    {
                      status: 'failed',
                      error: { message: 'Connection reset 42' }
                    },
                    {
                      status: 'passed'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

test('parsePlaywrightReport handles nested suites and terminal failures', () => {
  const failures = parsePlaywrightReport(report);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].title, 'root failure');
  assert.equal(failures[0].isFlaky, false);
  assert.equal(failures[0].attempts, 1);
});

test('parsePlaywrightReport includes flaky signals when requested', () => {
  const failures = parsePlaywrightReport(report, { includeFlaky: true });

  assert.equal(failures.length, 2);
  const flaky = failures.find(failure => failure.title === 'flaky test');

  assert.ok(flaky);
  assert.equal(flaky.isFlaky, true);
  assert.equal(flaky.attempts, 2);
});
