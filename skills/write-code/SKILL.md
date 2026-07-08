---
name: write-code
description: "Write the minimum code to make all failing tests pass (TDD green phase). Use when a work package has red tests in place and needs implementation against a clear target, before review. Triggers on a build/implement task for a planned work package."
phase: 3
persona: pipeline-builder
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Write Code — implement to green, nothing more

## When this runs

The work package has failing tests in place from the red phase. Implementation
now has a clear, executable target: make the red tests green, and nothing more.

**Why this discipline matters:** with failing tests already in place,
implementation has a concrete target. Writing the minimum code to pass keeps the
codebase lean and prevents scope creep. Every line of code exists because a test
demands it.

## Project rules

Follow any `pipeline.config rules` slot below as binding (it overrides this skill on conflict); skip undeclared slots.

- **`{{rules.code}}`** — language / type / style conventions the implementation must follow.
- **`{{rules.frontend}}`** — client / UI conventions (if this touches UI).
- **`{{rules.design-system}}`** — tokens + reuse-before-build: adopt or extend existing components, don't fork them.
- **`{{rules.testing}}`** — conventions for any tests you touch in the green phase.

## What it produces

- Implementation in `{{paths.source}}` that turns the red tests green.
- Updated docs in `{{paths.docs}}` when behavior you changed is documented there.
- A clean `{{verify}}` run — the full gate passes before anything reaches a pipeline-reviewer.

## Steps

1. **Read the target.** Read the approved plan for the work package
   (`.pipeline/plans/<id>.md`, plus the manifest entry under
   `.pipeline/work-packages/` and `progress/<id>.json`). Read the
   existing failing tests — they are the spec.

2. **Implement in dependency order.** Work task by task. Write the *minimum* code
   to make the failing tests pass. After each logical unit, run the relevant
   tests (a focused subset is fine here).

3. **Render UI states (if a design system is configured).** For UI components,
   create the component's story/example fixture rendering its key states, per the
   conventions of `{{designSystem.path}}`. If no design system is configured
   (`pipeline.config designSystem: null`), skip this step — it does not apply.

4. **Verify before you ship.** Once all targeted tests are green, run the
   project's verify command, `{{verify}}`, to confirm the full gate passes
   (types, lint, tests). **Verify must pass before pushing.** No broken code
   reaches reviewers — verification is the pipeline-builder's responsibility, not the
   pipeline-reviewer's. (A fast typecheck mid-flight is fine if the project defines one,
   but it does not replace the full gate.)

5. **Run the regression sweep.** Run the affected tests. If pre-existing tests
   break because of your changes, you own the fix — see Regression ownership below.

6. **Rename sweep.** When your changes rename, remove, or replace a symbol (field,
   type, token, status value, route), grep the full codebase for the old name
   before pushing. Zero matches required (excluding test assertions that verify
   the old name is gone).

7. **Doc sync.** If your implementation changes behavior documented in
   `{{paths.docs}}` (API shapes, state machines, UI layouts, lifecycles, data
   models, decision records), update the relevant doc section in the same commit.
   Docs are part of the deliverable, not a follow-up task. The pipeline-reviewer will flag
   stale docs as CRITICAL.

8. **Open the change.** With the gate green, push and open a PR (or draft PR) via
   `{{vcs}}` and wait for CI to pass.

## Core rules

**Never weaken a test to make it pass.** If a test reveals a design flaw, fix the
implementation, not the test.

**Regression ownership.** If pre-existing tests break because of your changes, you
own the fix. "Outside scope" is not a valid excuse for tests you broke.

**Don't rationalize shortcuts:**

| Rationalization | Reality |
| --- | --- |
| "The test is wrong." | Prove it's wrong before changing it. Most of the time, the implementation is wrong. |
| "I'll add this extra feature while I'm here." | Scope creep is the #1 cause of work-package failure. Build exactly what was asked. |
| "I can skip this task, it's covered by the next one." | Each task exists because it was independently testable. Skipping creates gaps. |

## Done when

- All red tests for the work package are green.
- `{{verify}}` passes the full gate (types, lint, tests).
- The rename sweep returns zero stale matches.
- Docs touched by changed behavior are updated in the same commit.
- The change is opened for review via `{{vcs}}` and CI is green.
