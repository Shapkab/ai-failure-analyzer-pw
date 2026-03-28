import { parsePlaywrightReport } from '../../infrastructure/parsers/playwright-json.parser';
import { normalizeError } from './failure-normalization.service';
import { clusterFailures } from './failure-clustering.service';
import { summarizeCluster } from '../../infrastructure/llm/openai.provider';

export async function runAnalysis(report: any) {
  const failures = parsePlaywrightReport(report);

  const normalized = failures.map(f => ({
    ...f,
    normalizedError: normalizeError(f.error)
  }));

  const clusters = clusterFailures(normalized);

  const result = [];
  for (const cluster of clusters) {
    const summary = await summarizeCluster(cluster);
    result.push({ ...cluster, summary });
  }

  return result;
}
