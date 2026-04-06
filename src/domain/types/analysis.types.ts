export interface PlaywrightError {
  message?: string;
}

export interface PlaywrightTestResult {
  status?: string;
  retry?: number;
  error?: PlaywrightError;
}

export interface PlaywrightTestCase {
  results?: PlaywrightTestResult[];
}

export interface PlaywrightSpec {
  title?: string;
  file?: string;
  tests?: PlaywrightTestCase[];
}

export interface PlaywrightSuite {
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

export interface PlaywrightReport {
  suites?: PlaywrightSuite[];
}

export interface AnalysisOptions {
  includeFlaky?: boolean;
  summarizeWithAi?: boolean;
  maxConcurrentSummaries?: number;
}

export type SummaryStatus =
  | 'success'
  | 'disabled'
  | 'skipped'
  | 'no_content'
  | 'failed_timeout'
  | 'failed_error';

export interface ParsedFailure {
  title: string;
  file: string;
  error: string;
  attempts: number;
  isFlaky: boolean;
}

export interface NormalizedFailure extends ParsedFailure {
  normalizedError: string;
}

export interface FailureCluster {
  signature: string;
  count: number;
  failedCount: number;
  flakyCount: number;
  tests: NormalizedFailure[];
}

export interface FailureClusterWithSummary extends FailureCluster {
  summary: string;
  summaryStatus: SummaryStatus;
}

export interface ClusterSummaryResult {
  summary: string;
  summaryStatus: SummaryStatus;
  attempts: number;
}
