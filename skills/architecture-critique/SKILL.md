---
name: architecture-critique
description: "Score a technical plan against the 11-dimension architectural rubric BEFORE any code is written. Use in Phase 5 after the pipeline-planner produces a plan, or on demand to audit a plan for a work package. Evaluation act — pipeline-reviewer persona scores the pipeline-planner's plan; distinct from reviewing implemented code."
phase: 5
persona: pipeline-reviewer
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Architecture Critique — score the plan, not the code

**Why:** The agent that wrote the plan cannot objectively evaluate it. Evaluation must be a different agent — the pipeline-reviewer — reading the plan cold. True producer/evaluator separation: different personas, not just different cognitive modes.

This is the **evaluation** counterpart to plan production (the `architecture` act). The pipeline-reviewer persona scores what the pipeline-planner produced. Architecture drafts the plan; this skill scores it. The technical plan lands in `.pipeline/work/<id>/architecture.md`, so the Phase 8 code review reads it there — reusing this critique's warm session if the host supports it, reconstituting from the artifact if not.

This is **not** the code-review act. Code review audits the *implemented code* against the spec, after the fact. This skill audits the *plan* against the spec, before any code is written. They run at different phases and surface different classes of issues — but the same pipeline-reviewer persona runs both, against the technical plan in `.pipeline/work/<id>/architecture.md` (warm context if the host kept the session, read from the artifact if not).

The pipeline-reviewer should run on a fresh high-capability agent ({{models.review}}) so the critique is not anchored by whatever produced the plan.

## Project rules

Follow any `pipeline.config rules` slot below as binding (it overrides this skill on conflict); skip undeclared slots.

- **`{{rules.architecture}}`** — the architecture invariants & conventions to score the plan against.

## When this runs

- **In the pipeline:** Phase 5, after the pipeline-planner completes the `architecture` act. Reviewer session.
- **On explicit invocation for a work package:** full audit of `.pipeline/work/<id>/architecture.md` (+ its `feasibility.md`).
- **Skip condition:** this skill always applies to a work package that has a technical plan. The design-system-specific checks inside it are skipped automatically when no design system is configured (`pipeline.config` `designSystem: null`).

## What it produces

A scored critique (see Output Format) that either ships the plan (score ≥ 7) or sends it back for revision, with specific, plan-section-anchored findings and concrete fixes.

## Required reading

1. The `## Work package` + `## Acceptance criteria` sections of `.pipeline/work/<id>/plan.md`.
2. The locked concept output for the work package (the concept act's output).
3. The plan itself — every section, including its **Required reading** list.
4. The specific authoritative files named in the plan's **Required reading** (these are individual `{{paths.docs}}` files the plan picked, not whole folders).
5. Canonical-shapes / contract docs under `{{paths.docs}}` that define the load-bearing primitives the plan touches.
6. For UI work packages (only when a design system is configured): the approved design output for the work package.

## The critique loop

```
1. Read the plan — and independently re-verify every load-bearing factual claim it makes
   about the codebase (tables, routes, components, precedent shapes) by grep/read, citing
   file:line; treat "verified against code" as a hypothesis, not proof
2. Challenge it adversarially (rigor mismatched to the engineering tier — over- OR
   under-engineering, missing deps, AC gaps, scope creep, missing security/abuse cases,
   missing protected-test list, route-checklist gaps, and implementability holes — any
   task that forces the builder to decide, not just do)
3. Score it (0-10) against the 11 dimensions below
4. List specific findings (CRITICAL / WARNING / SUGGESTION) with plan-section references
5. The pipeline-planner fixes the highest-priority issue IN THE PLAN
6. Re-score
7. Repeat until score >= 7 or 3 rounds reached
```

Score ≥ 7 ships the plan. 5-6 needs work on 2-3 dimensions. ≤ 4 restarts the architecture act.

## Scoring dimensions (0-10 each, averaged)

### 1. Spec alignment

- Does every acceptance criterion in the work package map to a task in the plan?
- Does every plan task trace back to an AC or a forced dependency?
- Are scope-creep tasks present (things not asked for)? They shouldn't be.
- For UI work packages (when a design system is configured), does the plan match the contracts in the approved design output? If the design act was skipped on a UI work package, that's CRITICAL.
- **Smell:** plan has more tasks than the work package has ACs. Plan is missing a verification method for an AC. Plan invents requirements.

### 2. Implementability — executable, not interpretable

The plan's job is to leave the builder *doing*, not *deciding*. Score whether the architecture is actually defined: are the contracts (types/signatures/schemas), the data flow, the states, the file/repo structure, and the tech stack specified — with concrete files named where they're known? Is any real decision deferred to the builder — a data shape, a contract, a library choice, unresolved intent? Contracts must be concrete, not "similar to the existing one". Smell: tasks phrased as goals ("make auth work") instead of defined changes. Treat unresolved builder-facing **decisions** as CRITICAL — but do not demand that every file be named or that every task carry a test; demand that the architecture is **defined**.

Validate the fenced `technicalTaskDag` with the validator next to the architecture skill, then judge what structural validation cannot: one leaf should be the default; every split must reduce context or expose a real dependency; a leaf requiring broad unrelated reading should be reconsidered for a coherent deeper split; `file:`/`path:` ownership must cover every plausible write; pointer context must be a useful starting set without pretending to forbid justified adjacent discovery; and every `parallel: true` independence reason must hold against the actual contracts and repository. Parallel leaves that share mutable state, an unsettled decision, or a consuming/owning relationship are a CRITICAL planning defect. When behavior crosses leaves, require a final integration leaf owning combined wiring/tests. Mechanical leaves must be fully specified and judgment-free.

### 3. Layer integrity

- Does any task in the plan reach past its layer? (Respect the project's declared layering and strict dependency direction.)
- Do layers that should not call models do so anyway?
- Does a presentation/UI layer access the data store directly when it shouldn't?
- Does a task in one module reach into another module's internals (or vice versa)?
- **Smell:** schema or query in the wrong module. Direct data-store access from the UI. Cross-module private-API call.

### 4. API contracts

- Are all routes named with their method, path, request shape, response shape, and status codes?
- Is the request/response body shape a concrete exported type the plan defines, not "looks like the existing endpoint"?
- Are error shapes specified (status code + body)? "Returns an error" is not a contract.
- For closed vocabularies (e.g. a message-type discriminant union), is the union closed and exhaustively type-checked?
- **Smell:** an endpoint with no request body. Vague "returns the entity" with no field list. Open string union where a closed discriminant is required.

### 5. Data model alignment

- Do the schemas match the spec field-by-field, type-by-type? (If the spec says 6 indexes, the plan lists 6.)
- Are foreign keys, unique constraints, NOT NULL, default values, and check constraints all specified?
- For work packages that must run across multiple data backends, does the schema work in each of them? (Watch for backend-specific type mismatches, e.g. JSON column types, auto-increment, integer-width differences.)
- Are migration names forward-only with rollback plans documented?
- **Smell:** column without a type. Missing FK on a relation. Migration without a rollback note. Schema diverges from the spec's field list.

### 6. Naming

- Do names honestly describe what things do?
- Does a function or column name eliminate a paragraph of doc?
- Do new names conflict with existing closed vocabularies (the project's load-bearing nouns)?
- Are domain terms used consistently with the specific authoritative files named in the plan's Required reading and with the contract docs under `{{paths.docs}}`?
- **Smell:** generic names (`Manager`, `Service`, `Handler`, `Helper`, `Util`). Function name lies about side effects. New name shadowing or aliasing an existing primitive.

### 7. Module depth (interface simplicity hides complexity)

From *A Philosophy of Software Design*: deep modules have small interfaces hiding significant complexity. Shallow modules have large interfaces with thin implementations.

- Is the public surface small for the size of the problem solved?
- Are there entry points that exist only for one caller? (Symptom of leaking implementation.)
- Are exports narrow — only what the module's contract requires?
- For a shared primitive, does ONE well-shaped API serve every consumer named in the work package, without each consumer needing a custom wrapper?
- **Smell:** one new function per consumer. Public types that mirror internal data shapes 1:1. Five exports where two would do.

### 8. Failure-mode coverage

- Has every error path been identified?
- For every external call (data store, HTTP, model, queue), is the timeout / retry / failure behaviour specified?
- For every input boundary (user input, agent-authored field, external API response), is the validation rule specified?
- Does the plan's "Security & abuse cases" block address rate-limiting, input-trust, secret-handling, path-traversal, and SSRF — each marked applicable+addressed or N/A with reason?
- Does the plan name the *route checklist* (the route × file matrix) for any guard/middleware enumerated in the spec?
- **Smell:** happy-path-only ACs. "Returns an error" without specifying status. Missing rate-limit on writes. Missing validation at trust boundary. Missing route in route-checklist.

### 9. Tier-fit — simplicity vs. over- AND under-engineering

Score the plan's rigor **against the WP's Engineering tier** (`plan.md`: `prototype | mvp | production | critical`), not against an absolute maximum. Both directions are defects:

- **Over the tier** (the classic over-engineering smell): a feature flag, abstract base class, plugin point, or registry no caller demands today; error handling for cases that can't happen; validation already done at the boundary; a back-compat shim for code with no callers; audit trails / retries / defensive abstractions on a `prototype` or `mvp`.
- **Under the tier**: a `production` / `critical` plan with happy-path-only handling, no observability, thin security, no failure-mode analysis, or no rollback — rigor the tier demands but the plan omits.
- Is the design-it-twice section absent from a non-trivial decision, or theatre-present on a forced one?
- **Smell:** abstraction with one implementation or "future-proof" anything **on a low tier**; missing hardening/observability/security depth **on a high tier**. Three similar tasks compressed into a generic helper before the third repeat. Commented-out scaffolding for "next phase".

### 10. Verifiability

- Does every AC have a concrete verification method (test name, assertion, expected output) — not "write a test"?
- Are the verification methods aligned with what's actually testable in this codebase, and runnable under the project's verify command, {{verify}}? (Unit, e2e, integration against a real backend — use the harnesses the project actually has.)
- Is there a failing-test-first ordering — does the plan name the test before the implementation it proves?
- Is the protected-tests list populated for any test whose contract must not drift?
- **Smell:** AC verifies "the feature works". AC verifies a behaviour that has no harness in the codebase. Test order inverted (implementation listed before its proving test). Empty protected-tests block.

### 11. Feasibility (probes)

Judge feasibility **only for the load-bearing, new, or unknown parts** — a new capability/concept, a larger system, an external API/library, a non-obvious perf or migration claim. Obvious, small, pattern-following work needs no proof; do not demand one.

- For the parts that warranted it, does `feasibility.md` give a verdict and the details a reviewer needs?
- Did web research cite primary sources (official docs, release notes) with URLs — not vague "should work"? Did any POC stay tiny/manual (a sketch, not a full implementation) with captured output?
- Is any *genuinely uncertain* load-bearing assumption left unproven? **That** is the CRITICAL — not a missing probe on something obvious.
- **Smell:** a new / complex / load-bearing capability assumed to work with no research or sketch; a `NO-GO` verdict ignored; probe theatre; **or** over-probing — ceremony proving the obvious. Architecture proceeds without `approvals.requirements` set in `progress.json`.

## Scoring guide

| Score | Meaning | Action |
|-------|---------|--------|
| 9-10 | Exceptional | Ship the plan. The pipeline-planner produced a plan a senior engineer would defend. |
| 7-8 | Good | Minor follow-ups. Acceptable to proceed to test authoring. |
| 5-6 | Mediocre | Needs work on 2-3 dimensions before tests. |
| 3-4 | Poor | Structural issues. Plan is missing core contracts or has scope leaks. Restart the architecture act. |
| 0-2 | Architecture slop | Start over. Plan reads like a list of vibes. Re-interrogate. |

## Output format

```
## Architecture Critique: <work-package-id>

ARCHITECTURE-SCORE: <int>/10  rounds=<n>  score-line: SA:_ IM:_ LI:_ AC:_ DM:_ N:_ MD:_ FMC:_ S:_ V:_ FE:_

### CRITICAL
- [plan §<section>] Description of issue → specific fix to apply

### WARNING
- [plan §<section>] Description of issue → specific fix to apply

### SUGGESTION
- [plan §<section>] Description of issue → specific fix to apply

### What's Working Well
- 1-2 things the plan does right (reinforces good patterns; helps the next pipeline-planner)
```

The retro reads `rounds=<n>` to track plan-quality drift over time. Write the score and rounds to `.pipeline/work/<id>/progress.json` so downstream phases and the retro can read them.

## Common failure modes caught by this skill

These are recurrences the compound-candidates log keeps surfacing — every one is something architecture-critique should catch in the plan, not the code review in the code:

- **Happy-path-only ACs.** Security & abuse cases block missing or thin. Caught by Dimension 8.
- **Spec / codebase drift.** Plan references tables, routes, components that don't exist. Caught by reading the plan-reconciliation section against `grep` reality during scoring.
- **Protected-tests drift.** Plan doesn't enumerate which test contracts are frozen. Caught by Dimension 10.
- **Route-checklist gap.** Plan enumerates a guard but not the route × file matrix the guard must cover. Caught by Dimension 8.
- **Unprobed feasibility.** Plan depends on a *new / load-bearing* external API / library / migration assumption with no research or sketch. Caught by Dimension 11 (obvious, small work is exempt).
- **UI selector drift.** Plan changes UI shape without listing affected e2e specs in protected-tests. Caught by Dimension 10 + cross-referencing the changed component against e2e selectors.

When the plan ships these gaps, this skill blocks; when the plan addresses them, the downstream review/security/definition-of-done acts have less to surface.

## Anti-patterns

- **"Looks complete" scoring.** Score by reading every plan section against its rubric dimension. Don't skim; verify field-by-field.
- **Critiquing in the abstract.** Every finding has a plan-section reference and a concrete fix.
- **Letting design-it-twice be theatre.** If the plan lists two alternatives but the second is straw-manned, that's worse than not having two — flag it.
- **Re-doing the pipeline-planner's job.** This skill scores; it does not rewrite the plan. The pipeline-planner applies the fixes; this skill rescores.

## Done when

- The plan scores ≥ 7 (averaged across the dimensions), or 3 rounds have elapsed.
- No implementability hole remains: every task is executable without a builder-side decision (checked in Dimension 2).
- The critique, score line, and `rounds=<n>` are recorded to `.pipeline/work/<id>/progress.json`.
- Every CRITICAL finding is either fixed in the plan or explicitly accepted with a reason.
