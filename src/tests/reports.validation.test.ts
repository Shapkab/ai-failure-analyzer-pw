import assert from 'node:assert/strict';
import test from 'node:test';

import { validateReportPayload } from '../app/routes/reports.routes';

test('validateReportPayload rejects invalid body', () => {
  const parsed = validateReportPayload({});
  assert.equal(parsed.success, false);
});

test('validateReportPayload accepts minimal valid body', () => {
  const parsed = validateReportPayload({
    suites: [
      {
        specs: [
          {
            title: 'example',
            file: 'tests/example.spec.ts',
            tests: [
              {
                results: [{ status: 'failed', error: { message: 'boom' } }]
              }
            ]
          }
        ]
      }
    ],
    options: {
      summarizeWithAi: false
    }
  });

  assert.equal(parsed.success, true);
});
