# Architecture

## Context

This service ingests Playwright JSON reports and returns clustered failure analysis for triage and stability work.

## Design Principles

- Deterministic core logic first (parser + normalization + clustering).
- AI as optional augmentation, not source of truth.
- Explicit operational controls (auth, rate limit, timeout/retry).
- Typed boundaries between app, domain, and infrastructure.

## Runtime Components

### API layer (`src/app`)

- `routes/reports.routes.ts`:
  - validates report payload;
  - enforces API key and rate limits;
  - orchestrates analysis call and emits structured logs.
- `middleware/*`:
  - request ID context;
  - API key auth;
  - in-memory rate limiting.

### Domain layer (`src/domain`)

- `failure-normalization.service.ts`: normalizes noisy error strings.
- `failure-clustering.service.ts`: groups failures by normalized signature.
- `analysis-orchestrator.service.ts`: ties parser + normalization + clustering + summarization.
- `types/analysis.types.ts`: canonical contracts used across layers.

### Infrastructure layer (`src/infrastructure`)

- `parsers/playwright-json.parser.ts`: recursive extraction of terminal and flaky failures.
- `llm/openai.provider.ts`: guarded summarization with timeout, retry, and status reporting.

## Request Sequence

1. Request enters `/api/reports/playwright`.
2. Middleware adds `requestId`, validates API key, applies rate limit.
3. Payload is validated (`zod`).
4. Report is parsed into failures.
5. Failures are normalized and clustered.
6. Optional AI summaries run with bounded concurrency and guardrails.
7. API returns clusters including `summary` and `summaryStatus`.

## Failure Modes and Behavior

- Invalid payload -> `400`.
- Missing/invalid API key -> `401` (or `503` if auth key not configured).
- Rate limit exceeded -> `429` with `retry-after`.
- AI timeout/error -> cluster returns fallback summary with explicit `summaryStatus`.

## Scalability Notes

- Current rate limiter is process-local in-memory.
- For multi-instance deployments, move limiter and stateful controls to Redis.
- Persisted cluster history is not yet implemented.
