# Contributing

## Workflow

1. Create a branch from `main`.
2. Implement focused changes with tests.
3. Run checks locally:
   - `npm run build`
   - `npm test`
4. Open PR with:
   - problem statement;
   - implementation details;
   - test evidence.

## Commit style

Use conventional-style prefixes:
- `feat(...)`
- `fix(...)`
- `test(...)`
- `chore(...)`
- `docs(...)`

## Code expectations

- Keep parsing and clustering deterministic.
- Keep AI behavior optional and explicitly statused.
- Avoid adding unbounded external calls (timeouts/retries required).
- Add/adjust tests for any behavior change.
