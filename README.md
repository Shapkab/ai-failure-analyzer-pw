# Playwright AI Failure Analyzer

Focused on deterministic, maintainable, and CI-safe failure analysis for Playwright runs.

## Run
npm install
cp .env.example .env
npm run dev

## API
POST `/api/reports/playwright`

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
- Nested suites are parsed recursively.
- By default, only terminal failures are reported (retries that eventually pass are ignored).
- Set `includeFlaky: true` to include retry-recovered failures as flaky signals.
- Requests are authenticated with API key and rate-limited.
- AI summaries use timeout/retry guardrails and return per-cluster `summaryStatus`.

## Test
npm test
