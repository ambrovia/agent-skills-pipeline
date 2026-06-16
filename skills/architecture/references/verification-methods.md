# Verification methods — criterion type → exact verification

Every acceptance criterion must name a concrete, observable verification. "Write a
test" is not specific enough; say exactly what the test does and what it asserts.
Where a criterion is about type safety or whole-change correctness, the verification
is the project's verify command, `{{verify}}` (or a fast typecheck, if the project
defines one, for incremental checks).

| Criterion type | Verification methods |
|---------------|---------------------|
| Schema exists | Migration runs without error; schema introspection shows the expected tables/columns/constraints |
| API endpoint | Integration test hits the endpoint, asserts status code + response shape |
| Type safety | `{{verify}}` passes with zero errors; exported types are importable from other modules |
| Data integrity | Test inserts violating data (orphan FK, duplicate unique), asserts rejection |
| CRUD operations | Test creates, reads, updates, deletes a row; asserts each operation's result |
| Config/setup | File exists with expected content; importing it doesn't error |
| Seed data | Seed script runs; query confirms ≥1 row per table |
| UI component | End-to-end test navigates to the page, asserts visible elements + interactions. (Skipped when no design system / UI surface is configured.) |
| Error handling | Test triggers the error path (bad input, missing resource), asserts error response |
| Performance | Benchmark test runs N operations in < X ms |
| Coverage | Coverage report shows 100% of new files (if the project measures coverage) |
| Dual-driver/compat | Same test suite runs against each supported backend/driver the project targets |
