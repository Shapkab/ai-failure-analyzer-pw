import type { FailureCluster, NormalizedFailure } from '../types/analysis.types';

export function clusterFailures(failures: NormalizedFailure[]): FailureCluster[] {
  const map = new Map<string, NormalizedFailure[]>();

  for (const failure of failures) {
    const key = failure.normalizedError || 'unknown error';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(failure);
  }

  return Array.from(map.entries()).map(([signature, tests]) => {
    const flakyCount = tests.filter(test => test.isFlaky).length;
    const failedCount = tests.length - flakyCount;

    return {
      signature,
      count: tests.length,
      failedCount,
      flakyCount,
      tests
    };
  });
}
