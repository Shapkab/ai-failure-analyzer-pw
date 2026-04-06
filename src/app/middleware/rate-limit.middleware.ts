import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';

type WindowBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, WindowBucket>();

function getClientKey(req: Request): string {
  return req.header('x-api-key') || req.ip || req.socket.remoteAddress || 'unknown-client';
}

export function rateLimitReports(req: Request, res: Response, next: NextFunction): Response | void {
  const now = Date.now();
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = env.RATE_LIMIT_MAX_REQUESTS;
  const clientKey = getClientKey(req);

  const bucket = buckets.get(clientKey);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(clientKey, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (bucket.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('retry-after', String(Math.max(retryAfterSeconds, 1)));
    return res.status(429).json({ error: 'Too many requests' });
  }

  bucket.count += 1;
  next();
}
