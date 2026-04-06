import { Router } from 'express';
import { z } from 'zod';
import { runAnalysis } from '../../domain/services/analysis-orchestrator.service';
import type { AnalysisOptions, FailureClusterWithSummary, SummaryStatus } from '../../domain/types/analysis.types';
import { requireApiKey } from '../middleware/api-key-auth.middleware';
import { rateLimitReports } from '../middleware/rate-limit.middleware';

export const reportsRouter = Router();

const testResultSchema = z.object({
  status: z.string().optional(),
  retry: z.number().int().nonnegative().optional(),
  error: z
    .object({
      message: z.string().optional()
    })
    .optional()
});

const testCaseSchema = z.object({
  results: z.array(testResultSchema).optional()
});

const specSchema = z.object({
  title: z.string().optional(),
  file: z.string().optional(),
  tests: z.array(testCaseSchema).optional()
});

type SuiteShape = {
  specs?: z.infer<typeof specSchema>[];
  suites?: SuiteShape[];
};

const suiteSchema: z.ZodType<SuiteShape> = z.lazy(() =>
  z.object({
    specs: z.array(specSchema).optional(),
    suites: z.array(suiteSchema).optional()
  })
);

const optionsSchema = z
  .object({
    includeFlaky: z.boolean().optional(),
    summarizeWithAi: z.boolean().optional(),
    maxConcurrentSummaries: z.number().int().min(1).max(8).optional()
  })
  .optional();

const reportRequestSchema = z
  .object({
    suites: z.array(suiteSchema).min(1, 'At least one suite is required'),
    options: optionsSchema
  })
  .strict();

export function validateReportPayload(payload: unknown) {
  return reportRequestSchema.safeParse(payload);
}

function countSummaryStatuses(clusters: FailureClusterWithSummary[]): Record<SummaryStatus, number> {
  const summaryCounts: Record<SummaryStatus, number> = {
    success: 0,
    disabled: 0,
    skipped: 0,
    no_content: 0,
    failed_timeout: 0,
    failed_error: 0
  };

  for (const cluster of clusters) {
    summaryCounts[cluster.summaryStatus] += 1;
  }

  return summaryCounts;
}

reportsRouter.post('/playwright', requireApiKey, rateLimitReports, async (req, res) => {
  const startedAt = Date.now();
  const requestId = req.requestId || 'unknown-request-id';
  const parsedBody = validateReportPayload(req.body);
  if (!parsedBody.success) {
    console.warn(
      JSON.stringify({
        event: 'playwright_analysis_rejected',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: 400,
        durationMs: Date.now() - startedAt
      })
    );

    return res.status(400).json({
      error: 'Invalid Playwright report payload',
      issues: parsedBody.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  try {
    const options: AnalysisOptions = parsedBody.data.options ?? {};
    const result = await runAnalysis(parsedBody.data, options);
    const summaryCounts = countSummaryStatuses(result);

    console.info(
      JSON.stringify({
        event: 'playwright_analysis_completed',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: 200,
        durationMs: Date.now() - startedAt,
        clustersCount: result.length,
        summaryCounts
      })
    );

    res.json({ clusters: result });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'playwright_analysis_failed',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: 500,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    );

    res.status(500).json({ error: 'Analysis failed' });
  }
});
