---
name: architecture
description: "Produce the technical plan for a work package — types, schemas, APIs, file paths, ordered tasks. Interrogate the spec, reconcile it against the codebase, then draft. Run AFTER /refine (when needed) and AFTER /design (when the work package has UI)."
phase: 1
persona: pipeline-planner
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Architecture — the technical plan for a work package

**Why:** A clear plan prevents wasted implementation time. Without architectural planning, the pipeline-builder builds the wrong thing, misses edge cases, or invents abstractions the system doesn't need. The pipeline-reviewer catches errors before they become expensive rework.

**Fixed inputs (do NOT re-litigate):**
- Requirements doc from `/refine` — includes which docs were read and the relevant canonical contracts under `{{paths.docs}}`.
- Approved design from `/design` (UI work packages), at the path the design step wrote it (e.g. `.pipeline/progress/<id>` or alongside the work package). If no design system is configured (pipeline.config `designSystem: null`), there is no design input and this clause does not apply.

**Doc discovery:** Read the "Required reading" from `/refine` output if available. Otherwise list `{{paths.docs}}` to identify relevant topic folders. **Output a "Required reading" section in the plan** listing the specific doc files the engineer must read before implementing. This is the natural filter — downstream skills read only what the plan prescribes.

If the spec contradicts an existing requirements doc, stop — that's a `/refine` gap.

## Project rules

Follow any `pipeline.config rules` slot below as binding (it overrides this skill on conflict); skip undeclared slots.

- **`{{rules.architecture}}`** — architecture invariants & conventions the plan must follow.
- **`{{rules.code}}`** — language / type / style conventions that shape the types and contracts you specify.

## Phase 0 — Interrogate the understanding

Before producing acceptance criteria, walk the decision tree. Pick only the questions that are actually unsettled — the ones where the spec, the work-package file, or existing code don't give you a confident answer. Skip what's already pinned. For each remaining question, propose your recommended answer with the evidence you have, then ask the human (or the pipeline-reviewer in autonomous mode) to confirm, override, or dig deeper. Issue all of these probes in one parallel batch — independent questions don't need separate round-trips.

**Few, important questions.** Three sharp probes force a real decision; ten low-stakes ones are noise that get answered with shrugs while the load-bearing assumption stays silent. The bar to ask is: "will the answer change the plan?" If no, don't ask.

Sample interrogation lines (adapt to the work package):
- "What's the smallest version of this that's still useful? My read: X. Confirm or correct?"
- "What's the failure mode if Y is wrong? My read: A. Confirm?"
- "What's actually being asked vs adjacent and tempting to also build? My read: in-scope = X, out = Y."
- "Is any domain term in this spec used inconsistently? My read: term Z is used for two distinct concepts."
- "Does the spec contradict an existing doc? My read: a canonical-shapes doc under `{{paths.docs}}` says X, this work package says Y."
- "What changes if the user's mental model about W is wrong?"

Stop interrogating when the path is clear, not when you run out of questions. Three to seven branches is typical. If the work package already pins a decision, don't re-litigate it — confirm and move on.

## Phase 1 — Plan reconciliation (spec ⇆ reality)

Before locking the plan, reconcile the spec against the actual codebase. Spec/codebase drift discovered at write-tests time is too late — catch it here.

For every named symbol the spec references — table, route, component, file, constant, env var — verify it exists with the expected shape. The lookups are independent: collect the full symbol list first, then issue all the greps and reads in one parallel batch (one tool-call round, not one per symbol). Specifically:
1. `grep` every symbol in the codebase. Does it exist? With what shape?
2. For UI-touching ACs, read the current rendered output (or the existing component) to verify columns / labels / states.
3. For API-touching ACs, read the existing route handler / interface / schema to verify the contract.

Produce a `Plan reconciliation:` block in the plan listing every spec assumption that disagreed with reality and how the plan handles each. If the spec assumes a table, route, or column that doesn't exist, the plan must include the migration / scaffolding step.

## Phase 2 — Acceptance criteria + tasks

Read the work package under `.pipeline/work-packages/`. Read existing code in the affected areas of `{{paths.source}}` and the relevant doc sections identified in doc discovery above.

If the work package has a UI surface and `/design` produced an approved spec, read it. The visual contract, component vocabulary, and interaction states are inputs — do not re-litigate them. (Skipped when no design system is configured.)

Produce:
1. **Acceptance criteria** — each with a specific verification method (see `references/verification-methods.md`).
2. **Ordered task list** — what to do, which files, which test proves it, dependencies between tasks.
3. **Type signatures / schemas / endpoints** — the contracts the implementation must match.
4. **Risks or ambiguities.**
5. **Route checklist** (if applicable) — when the spec enumerates a route list (e.g., "guard mounts on /sessions, /tasks, /admin"), the plan MUST include a `route-checklist:` block listing every route + every file the guard/middleware must cover. Step `/architecture-review` then greps the implementation against that checklist before signing off. Lesson: a plan that enumerated all routes but whose implementation applied the guard to only one route shipped a hole — the checklist makes the gap visible at review.
6. **Security & abuse cases** — required block. Default checklist: rate-limit on every state-changing endpoint, input-trust boundary for any agent-authored field, secret-handling for any new credential surface, path-traversal for any path input, SSRF for any outbound URL. Plan is not green until each is either marked applicable+addressed or explicitly N/A with reason.
7. **Protected tests** — `protectedTests: string[]` listing test files (under `{{paths.tests}}`) whose assertions must not change. The definition-of-done audit checks the protected set with `{{vcs}}`-tracked diffs (e.g. `git diff --name-only`).
8. **Migrations** — when the change renames, removes, or moves an existing symbol (route, test id, table column, function name, file path), enumerate every call site that needs updating. List affected source files, fixtures, unit tests, and end-to-end specs by name with the migration step for each (`delete | reroute | rename`). The migration is part of the plan, not a follow-up.
9. **Shared files** — `sharedFiles: string[]` listing infrastructure files this work package modifies that other concurrent work packages may also touch (schema definitions, shared types, the router, app entrypoint, seed files). Used by the pipeline to detect overlap and schedule merge order when work packages run in parallel.

**Every acceptance criterion MUST have a concrete verification method.** "Write a test" is not specific enough. Say exactly what the test does and what it asserts. The verification-method rubric — criterion type → exact verification — is in `references/verification-methods.md`. Where a criterion is "type safety" or "the whole change is green," the verification is the project's verify command, `{{verify}}` (or a fast typecheck, if the project defines one, for incremental checks).

## Phase 3 — Design-it-twice (for non-trivial decisions)

When a sub-decision in the plan is non-trivial — a schema with multiple plausible shapes, an API where versioning matters, a primitive (a load-bearing noun) that several work packages will consume — sketch **two** alternative shapes and pick. The reverse cost of getting it wrong is the budget for this phase.

For each alternative: 1-paragraph shape, 1 trade-off, 1 reason to reject. The synthesis often combines insights from both. Inspired by *A Philosophy of Software Design* — "design it twice" — and the discipline of designing reusable primitives once, well.

Skip when the decision is forced (existing pattern, single sane shape, low blast radius). Don't theatre-design where one obvious answer exists.

## Done when

- A plan exists with: Required reading, Plan reconciliation block, acceptance criteria (each with a concrete verification method), ordered task list, contracts, risks, and the required blocks (route checklist where applicable, security & abuse, protected tests, migrations, shared files).
- The plan is saved to `.pipeline/plans/<id>.md` — the durable producer→consumer handoff that the pipeline-builder and pipeline-reviewer read. Write it there even when a warm pipeline-planner session would otherwise carry it; downstream personas must not depend on that session existing.
