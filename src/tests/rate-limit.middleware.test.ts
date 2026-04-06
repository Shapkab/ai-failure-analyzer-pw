import assert from 'node:assert/strict';
import test from 'node:test';
import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { rateLimitReports } from '../app/middleware/rate-limit.middleware';

function createMockResponse() {
  const state = {
    statusCode: 200,
    payload: null as unknown,
    headers: {} as Record<string, string>
  };

  const res = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.payload = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      state.headers[name.toLowerCase()] = value;
      return this;
    }
  } as unknown as Response;

  return { res, state };
}

function createRequest(clientKey: string): Request {
  return {
    header(name: string) {
      if (name === 'x-api-key') return clientKey;
      return undefined;
    },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' }
  } as unknown as Request;
}

test('rateLimitReports returns 429 after request threshold is exceeded', () => {
  env.RATE_LIMIT_WINDOW_MS = 60_000;
  env.RATE_LIMIT_MAX_REQUESTS = 2;

  const clientKey = `rate-limit-test-${Date.now()}`;
  const req = createRequest(clientKey);
  const nextCalls = { count: 0 };
  const next: NextFunction = () => {
    nextCalls.count += 1;
  };

  const first = createMockResponse();
  rateLimitReports(req, first.res, next);

  const second = createMockResponse();
  rateLimitReports(req, second.res, next);

  const third = createMockResponse();
  rateLimitReports(req, third.res, next);

  assert.equal(nextCalls.count, 2);
  assert.equal(third.state.statusCode, 429);
  assert.deepEqual(third.state.payload, { error: 'Too many requests' });
  assert.ok(third.state.headers['retry-after']);
});
