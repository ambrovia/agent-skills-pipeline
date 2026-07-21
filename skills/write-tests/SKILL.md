---
name: write-tests
description: "Write failing tests for every acceptance criterion of a work package BEFORE writing implementation (TDD red phase). Use in phase 7 when a pipeline-builder picks up a work package and must encode the requirement as executable proof. Trigger: a work package is planned and ready to build."
phase: 7
persona: pipeline-builder
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Write Tests — define the requirement before the implementation (TDD red)

**Why:** Tests written before code define the requirement, not the implementation.
They catch when the wrong thing gets built. Tests written after code just confirm
what exists — they encode bugs as expected behavior.

## Project rules

Follow the project's `testing` rule as binding — it, not this skill, fixes the test
kinds, layers, fixtures, and mock policy:

- **`{{rules.testing}}`** — which kinds/layers to cover, the fixture pattern, what
  may be mocked. If undeclared: prove each criterion's observable behavior through
  the public interface, mocking only nondeterministic externals.

## When this runs

Phase 7 (build), the first thing a pipeline-builder does on a work package — before any
implementation code. The work package must already be planned with explicit
acceptance criteria. Read the technical plan (`.pipeline/work/<id>/architecture.md`)
for the tasks and ACs, and the spec (`.pipeline/work/<id>/plan.md`) for the concrete
acceptance criteria (they live in its `## Acceptance criteria` section) plus its
`## Work package` section as context; track progress in
`.pipeline/work/<id>/progress.json`. The plan names *what* must be proven; **you**
choose the concrete test files and discover any call sites the combined-seam
proofs require — the architecture is not an exhaustive path list.

When the orchestrator assigns one `technicalTaskDag` leaf, scope this act to that leaf's acceptance criteria, pointer context, owned surfaces, and focused verify command. Do not read unrelated leaf context or change another leaf's owned surface. When behavior crosses leaves, the DAG's final integration leaf owns the combined-seam test; isolated leaf tests do not replace it.

## When this does NOT apply

- A work package with no behavioral surface (pure docs/config). State that
  explicitly in the work package and skip — don't write hollow tests.

## What it produces

Failing tests that prove each acceptance criterion, committed before any
implementation. The suite must compile and lint cleanly under `{{verify}}` and
then **fail** at runtime (red phase). No implementation code.

## Steps

1. **One test per criterion.** For each acceptance criterion, write a test that
   proves it. One criterion with no test is a gap; one test with no criterion is
   scope creep.

2. **Test the requirement, not the implementation.** Assert on observable
   behavior / outcomes through the public interface — not internal structure. A
   test coupled to implementation detail re-breaks on every refactor and proves
   nothing about the requirement.

3. **Test units *and* the combined whole.** Also write at least one test on the
   **integrated consuming seam** (wire to callers / next stage) so green can't
   mean "pieces work alone, flow is broken." Prefer existing integration / E2E
   lanes from `{{rules.testing}}`; don't invent a parallel harness.

4. **Follow the project's testing rule for the *how*.** Which kinds/layers to
   write, the fixture/setup pattern, and what may be mocked come from
   `{{rules.testing}}` and the existing tests under `{{paths.tests}}` (read them;
   don't invent setup). This skill prescribes no test taxonomy — but the
   isolation-plus-combined bar above always applies.

5. **Run `{{verify}}`** to confirm the tests compile and lint cleanly. If the
   project enforces structural coverage (a check that fails when a surface has no
   test), satisfy it — the linter enforces that tests *exist*; you make them
   *meaningful*.

6. **Confirm the new tests fail** (red phase), each for the right reason. A test
   that passes before implementation is asserting nothing — fix it. Do NOT write
   implementation code in this step.

## Don't rationalize skipping this

| Rationalization | Reality |
| --- | --- |
| "Too simple to need tests" | Simple work packages have the highest regression rate — nobody is watching them. |
| "I'll add tests after" | Tests after code confirm the implementation, not the requirement. They encode whatever was built, bugs included. |
| "The plan already describes what to build" | The plan describes intent; tests encode it as executable proof. Prose can't go red. |
| "I'll just write the obvious passing test" | A test that's green before any code exists is asserting nothing. Watch it fail first. |
| "Unit tests for each piece are enough" | Green-in-isolation with a broken wired path is the classic false green. Prove the combined seam too. |

## Done when

- Every acceptance criterion has at least one test that proves it.
- At least one test exercises the integrated / combined path (not units alone).
- The tests follow the project's `testing` rule (kinds, layout, fixtures, mock policy).
- `{{verify}}` passes for compile + lint; any structural-coverage check is green.
- The new tests **fail** at runtime, and no implementation code has been written.
