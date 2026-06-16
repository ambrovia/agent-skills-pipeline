# Test layers (full breakdown)

Loaded on demand from `write-tests`. Maps the four classic layers onto a
tool-agnostic project. Adapt the file-naming / framework specifics to whatever the
project under `{{paths.tests}}` already uses — discover conventions by reading
existing tests, don't impose new ones.

## 1. Unit tests

- Cover every service, utility, state machine, calculation, validation, and event
  handler introduced or changed by the work package.
- For UI work packages: every component action handler and callback prop, tested
  in isolation.
- Goal: full coverage of new code's branches and edge cases.

## 2. Integration tests (route / boundary)

- Every API route or public module boundary the work package adds or touches.
- Exercise against **real** collaborators: the real router, real middleware, a
  real (test) database — wired through the project's shared test fixtures.
- Mock only nondeterministic externals: LLM/model calls, third-party network,
  clock, randomness.
- Required cases per boundary:
  - happy path
  - rejected when unauthenticated / unauthorized
  - not-found for a missing resource
  - bad-input / validation failure
- Use the fixture-injecting test entry point the project provides so each test
  receives wired collaborators (e.g. `{ db, app }`). Reading existing integration
  tests tells you the exact import and which test function injects fixtures —
  some projects only inject through a specific wrapper, not the bare test fn.

## 3. Component tests (UI only)

- Applies only when a design system is configured (`pipeline.config`
  `designSystem` is set, with `{{designSystem.path}}` / `{{designSystem.tokens}}`).
  If `designSystem: null`, skip this layer entirely.
- Every component: action handlers, event handlers, state transitions, edge
  states, error states.
- If the project has a visual catalog/storybook surface for the design system,
  add the corresponding visual entries so components can be eyeballed there too.

## 4. End-to-end tests

- The top few (≈3) user actions on each surface the work package touches.
- Drive through the real UI / real entry point, down through the API to the data
  layer; mock only nondeterministic externals.
- Navigate the way a user would (through the app's own navigation), not by jumping
  straight to a deep link/URL — the navigation path is part of what you're
  proving.
- These are the merge guard: they prove the primary actions still work after
  everything is integrated.

## Fixtures and teardown

- Prefer the project's shared fixtures over constructing databases, apps, or event
  buses by hand in each file.
- If the project provides automatic per-test isolation (e.g. a pooled test DB that
  truncates between tests), rely on it. Don't add manual `beforeEach`/`afterEach`
  for data setup.
- Reserve setup/teardown hooks for non-data concerns (stubbing env vars, fake
  timers, etc.).

## Verify integration

- Run `{{verify}}` to confirm tests compile and lint, then run the suite.
- If the project enforces structural coverage (a check that fails when a route or
  surface has no associated test), that check gates this phase: the linter
  guarantees tests *exist*; the builder guarantees they're *meaningful* and start
  red.
