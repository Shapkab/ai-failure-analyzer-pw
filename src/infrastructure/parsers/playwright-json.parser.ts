import type {
  AnalysisOptions,
  ParsedFailure,
  PlaywrightReport,
  PlaywrightSpec,
  PlaywrightSuite,
  PlaywrightTestCase,
  PlaywrightTestResult
} from '../../domain/types/analysis.types';

function toFailure(
  spec: PlaywrightSpec,
  result: PlaywrightTestResult,
  attempts: number,
  isFlaky: boolean
): ParsedFailure {
  return {
    title: spec.title || 'unknown test',
    file: spec.file || 'unknown file',
    error: result.error?.message || 'unknown error',
    attempts,
    isFlaky
  };
}

function parseTestResults(
  spec: PlaywrightSpec,
  test: PlaywrightTestCase,
  includeFlaky: boolean
): ParsedFailure[] {
  const results = test.results || [];
  if (results.length === 0) return [];

  const failures = results.filter(r => r.status === 'failed');
  const finalResult = results[results.length - 1];

  if (finalResult.status === 'failed') {
    return [toFailure(spec, finalResult, results.length, false)];
  }

  if (includeFlaky && failures.length > 0) {
    return [toFailure(spec, failures[0], results.length, true)];
  }

  return [];
}

function visitSuite(
  suite: PlaywrightSuite,
  includeFlaky: boolean,
  failures: ParsedFailure[]
): void {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      failures.push(...parseTestResults(spec, test, includeFlaky));
    }
  }

  for (const nestedSuite of suite.suites || []) {
    visitSuite(nestedSuite, includeFlaky, failures);
  }
}

export function parsePlaywrightReport(
  report: PlaywrightReport,
  options: AnalysisOptions = {}
): ParsedFailure[] {
  const failures: ParsedFailure[] = [];
  const includeFlaky = Boolean(options.includeFlaky);

  for (const suite of report.suites || []) {
    visitSuite(suite, includeFlaky, failures);
  }

  return failures;
}
