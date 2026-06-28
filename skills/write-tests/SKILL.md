---
name: write-tests
description: "Write failing tests for every acceptance criterion of a work package BEFORE writing implementation (TDD red phase). Use in phase 3 when a builder picks up a work package and must encode the requirement as executable proof. Trigger: a work package is planned and ready to build."
phase: 3
persona: builder
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Write Tests — define the requirement before the implementation

**Why:** Tests written before code define the requirement, not the implementation.
They catch when the wrong thing gets built. Tests written after code just confirm
what exists — they encode bugs as expected behavior.

## Project rules

This repo can steer this skill through `pipeline.config rules`. Before you act, read any of these declared slots that apply and treat them as **binding** — where a project rule conflicts with this skill's generic guidance, the project rule wins. A slot the repo left null is simply absent: skip it, never block on it.

- **`{{rules.testing}}`** — what counts as a test in this repo, test layout, and the real-vs-mock / fixture / lane policy. Follow it exactly.

## When this runs

Phase 3 (build), as the first thing a builder does on a work package — before any
implementation code. The work package must already be planned with explicit
acceptance criteria.

Read the plan for the target work package: check the work package entry under
`.pipeline/work-packages/` and the acceptance criteria recorded there. Track
progress in `.pipeline/progress/<id>.json`.

## When this does NOT apply

- A work package with no behavioral surface (pure docs/config). State that
  explicitly in the work package and skip — don't write hollow tests.
- The E2E / component-test layers below assume a UI. If the work package is
  backend/library/infra (no design system configured, `pipeline.config`
  `designSystem: null`), skip those layers and cover the equivalent boundaries
  (public API, CLI, module entry points) instead.

## What it produces

Failing tests that prove each acceptance criterion, committed before any
implementation. The suite must compile and lint cleanly under `{{verify}}` and
then **fail** at runtime (red phase). No implementation code.

## Steps

1. **Read the acceptance criteria.** For each criterion, write a test that proves
   it. One criterion with no test is a gap; one test with no criterion is scope creep.

2. **Cover every relevant layer.** A work package should produce tests across the
   layers that apply to its type (see `references/test-layers.md` for the full
   breakdown). In general:
   - **Unit tests** — every pure function, service, state machine, calculation,
     validation, and event handler. Every UI action handler / callback. Full
     coverage of new code.
   - **Integration tests** — every API route / module boundary, exercised against
     real collaborators (real router, middleware, in-memory or test database) via
     the project's shared test fixtures. Mock only nondeterministic externals
     (e.g. LLM calls, network, clock). Cover happy path, auth-rejected,
     not-found, and bad-input cases.
   - **Component tests** — every UI component: action handlers, event handlers,
     state transitions, edge/error states. *Only when a design system is
     configured (`pipeline.config` `designSystem` is set); otherwise skip.*
   - **End-to-end tests** — the top few user actions on each surface the work
     package touches, driven through the real UI/entry point down to the data
     layer, with only nondeterministic externals mocked. These are the merge
     guard: they prove primary actions survive integration.

3. **Use the project's shared fixtures, not bespoke setup.** Import the project's
   test fixtures rather than constructing databases/apps/buses by hand in each
   test file. If the project provides automatic per-test teardown (e.g. a pooled
   test database that truncates between tests), rely on it instead of manual
   `beforeEach`/`afterEach` for data setup — reserve those hooks for non-data
   concerns (e.g. stubbing env vars). Discover the actual fixture entry points by
   reading existing tests under `{{paths.tests}}`; don't assume names.

4. **Run `{{verify}}`** to confirm the tests compile and lint cleanly. If the
   project enforces structural coverage (a check that fails when a route or
   surface has no test), satisfy it — the linter enforces that tests *exist*; you
   make them *meaningful*.

5. **Run the suite and confirm the new tests fail** (red phase). A test that
   passes before implementation is testing the wrong thing — fix it. Do NOT write
   implementation code in this step.

## Don't rationalize skipping this

| Rationalization | Reality |
| --- | --- |
| "Too simple to need tests" | Simple work packages have the highest regression rate — nobody is watching them. |
| "I'll add tests after" | Tests after code confirm the implementation, not the requirement. They encode whatever was built, bugs included. |
| "The plan already describes what to build" | The plan describes intent; tests encode it as executable proof. Prose can't go red. |
| "I'll just write the obvious passing test" | A test that's green before any code exists is asserting nothing. Watch it fail first. |

## Done when

- Every acceptance criterion has at least one test that proves it.
- The relevant test layers for the work package's type are covered.
- `{{verify}}` passes for compile + lint; any structural-coverage check is green.
- The new tests **fail** at runtime, and no implementation code has been written.
