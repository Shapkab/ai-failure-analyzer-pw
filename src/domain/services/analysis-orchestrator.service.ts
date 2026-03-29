import { parsePlaywrightReport } from '../../infrastructure/parsers/playwright-json.parser';
import { normalizeError } from './failure-normalization.service';
import { clusterFailures } from './failure-clustering.service';
import { summarizeCluster } from '../../infrastructure/llm/openai.provider';
import type {
  AnalysisOptions,
  FailureCluster,
  FailureClusterWithSummary,
  NormalizedFailure,
  PlaywrightReport
} from '../types/analysis.types';

const DEFAULT_SUMMARY_CONCURRENCY = 3;
const MAX_SUMMARY_CONCURRENCY = 8;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) break;

      results[currentIndex] = await mapper(items[currentIndex]);
    }
  });

  await Promise.all(workers);
  return results;
}

function normalizeFailures(report: PlaywrightReport, options: AnalysisOptions): NormalizedFailure[] {
  const failures = parsePlaywrightReport(report, options);
  return failures.map(failure => ({
    ...failure,
    normalizedError: normalizeError(failure.error)
  }));
}

function getSummaryConcurrency(options: AnalysisOptions): number {
  const requested = options.maxConcurrentSummaries ?? DEFAULT_SUMMARY_CONCURRENCY;
  return Math.min(Math.max(requested, 1), MAX_SUMMARY_CONCURRENCY);
}

export async function runAnalysis(
  report: PlaywrightReport,
  options: AnalysisOptions = {}
): Promise<FailureClusterWithSummary[]> {
  const normalizedFailures = normalizeFailures(report, options);
  const clusters = clusterFailures(normalizedFailures);

  if (!options.summarizeWithAi) {
    return clusters.map(cluster => ({ ...cluster, summary: 'AI summary skipped' }));
  }

  const concurrency = getSummaryConcurrency(options);
  return mapWithConcurrency<FailureCluster, FailureClusterWithSummary>(
    clusters,
    concurrency,
    async cluster => ({
      ...cluster,
      summary: await summarizeCluster(cluster)
    })
  );
}
