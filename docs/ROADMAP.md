# Roadmap

## Near-term

- Add persisted run history and signature trend tracking.
- Add integration tests for HTTP route behavior in CI.
- Add structured metrics (request duration, cluster counts, summary statuses).

## Mid-term

- Replace in-memory rate limiter with Redis-backed limiter.
- Add API key rotation strategy and key-scoped quotas.
- Add dead-letter/report archival for malformed payloads.

## Long-term

- Multi-run failure lineage and regression scoring.
- Team ownership mapping for clusters.
- Human-in-the-loop feedback loop for summary quality tuning.
