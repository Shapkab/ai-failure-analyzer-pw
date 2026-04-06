import assert from 'node:assert/strict';
import test from 'node:test';
import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { requireApiKey } from '../app/middleware/api-key-auth.middleware';

function createMockResponse() {
  const state = {
    statusCode: 200,
    payload: null as unknown
  };

  const res = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.payload = payload;
      return this;
    }
  } as unknown as Response;

  return { res, state };
}

test('requireApiKey returns 401 when header is missing', () => {
  env.ANALYZER_API_KEY = 'test-api-key';

  const req = {
    header(name: string) {
      if (name === 'x-api-key') return undefined;
      return undefined;
    }
  } as unknown as Request;

  const { res, state } = createMockResponse();
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };

  requireApiKey(req, res, next);

  assert.equal(nextCalled, false);
  assert.equal(state.statusCode, 401);
  assert.deepEqual(state.payload, { error: 'Unauthorized' });
});

test('requireApiKey calls next for valid api key', () => {
  env.ANALYZER_API_KEY = 'test-api-key';

  const req = {
    header(name: string) {
      if (name === 'x-api-key') return 'test-api-key';
      return undefined;
    }
  } as unknown as Request;

  const { res } = createMockResponse();
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };

  requireApiKey(req, res, next);
  assert.equal(nextCalled, true);
});
