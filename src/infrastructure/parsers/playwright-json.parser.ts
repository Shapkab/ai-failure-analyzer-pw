export function parsePlaywrightReport(report: any) {
  const failures: any[] = [];

  for (const suite of report.suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          if (result.status === 'failed') {
            failures.push({
              title: spec.title,
              file: spec.file,
              error: result.error?.message || 'unknown error'
            });
          }
        }
      }
    }
  }
  return failures;
}
