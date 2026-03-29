import { Router } from 'express';
import { z } from 'zod';
import { runAnalysis } from '../../domain/services/analysis-orchestrator.service';
import type { AnalysisOptions } from '../../domain/types/analysis.types';

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
    suites: z.array(suiteSchema).optional(),
    options: optionsSchema
  })
  .passthrough();

reportsRouter.post('/playwright', async (req, res) => {
  const parsedBody = reportRequestSchema.safeParse(req.body);
  if (!parsedBody.success) {
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

    res.json({ clusters: result });
  } catch (error) {
    console.error('Analysis failed', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});
