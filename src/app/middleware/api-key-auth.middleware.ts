import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';

export function requireApiKey(req: Request, res: Response, next: NextFunction): Response | void {
  if (!env.ANALYZER_API_KEY) {
    return res.status(503).json({ error: 'API key auth is not configured' });
  }

  const apiKey = req.header('x-api-key');
  if (!apiKey || apiKey !== env.ANALYZER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
