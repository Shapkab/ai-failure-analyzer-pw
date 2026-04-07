# AI Failure Analyzer (Playwright)

Built a failure analysis system that clusters test errors across runs to identify instability patterns and reduce noise in test results.

Focused on modeling system behavior rather than analyzing individual failures, enabling faster root cause identification in systems with asynchronous interactions and dependencies.

## Problem

Playwright reports often contain repeated, noisy failure signals:
- nested suite structures hide the true failing surface area;
- retries can blur the line between flaky and terminal failures;
- teams spend time triaging symptoms instead of identifying failure patterns.

## Approach

The system combines deterministic analysis with optional AI guidance:
- parse Playwright JSON recursively and normalize failure messages;
- cluster by stable error signatures to group related failures;
- classify retry-recovered failures as flaky when requested;
- optionally generate short, actionable AI summaries with strict timeout/retry guardrails.

## System Design

### High-level flow
1. Client sends report to `POST /api/reports/playwright`.
2. API validates payload and enforces API key + rate limit.
3. Parser extracts failures from nested suites and test attempts.
4. Domain layer normalizes and clusters failures.
5. AI layer summarizes each cluster (or skips/disables with explicit status).
6. API returns cluster list with metadata and summary status.

### Repository structure
```
.
├── src/
│   ├── app/               # Express app, routes, middleware
│   ├── config/            # Environment validation and runtime config
│   ├── domain/            # Core analysis logic and domain types
│   ├── infrastructure/    # External integrations (OpenAI, parsers)
│   ├── tests/             # Unit tests (parser, middleware, orchestration, provider)
│   └── types/             # Shared type augmentations
├── docs/                  # Architecture and roadmap documentation
├── .github/workflows/     # CI pipeline
├── package.json
└── README.md
```

## Outcome

Current implementation provides:
- deterministic failure extraction and clustering;
- explicit flaky-vs-terminal behavior;
- secured analysis endpoint (`x-api-key`) with rate limiting;
- resilient AI summarization (`summaryStatus` + retries + timeout);
- test coverage for parser, orchestrator, middleware, and validation paths.

## Next Improvements

- persist cluster signatures across runs for trend analysis and regression detection;
- move rate limit storage from in-memory to Redis for horizontal scale;
- add API integration tests with a real HTTP harness in CI;
- add structured metrics export (latency, summary success rate, cluster volume);
- add RBAC/service account model for multi-team usage.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## API

`POST /api/reports/playwright`

Required header:
`x-api-key: <ANALYZER_API_KEY>`

Request body:

```json
{
  "suites": [{}],
  "options": {
    "includeFlaky": false,
    "summarizeWithAi": true,
    "maxConcurrentSummaries": 3
  }
}
```

Notes:
- `suites` is required and must be non-empty.
- Nested suites are parsed recursively.
- By default, only terminal failures are reported.
- Set `includeFlaky: true` to include retry-recovered failures.
- Each returned cluster includes `summaryStatus`.

## Testing

```bash
npm test
```
