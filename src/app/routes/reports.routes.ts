import { Router } from 'express';
import { runAnalysis } from '../../domain/services/analysis-orchestrator.service';

export const reportsRouter = Router();

reportsRouter.post('/playwright', async (req, res) => {
  try {
    const result = await runAnalysis(req.body);
    res.json({ clusters: result });
  } catch (e) {
    res.status(500).json({ error: 'Analysis failed' });
  }
});
