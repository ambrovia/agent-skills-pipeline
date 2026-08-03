---
name: work-planning
description: "Create and register an outcome-level work-package spec in `.pipeline/`. Maintainer-only. Use when a maintainer asks to add, split, or reshape a work package under a track. Do not use during an active pipeline run or for implementation planning."
phase: 1
persona: any
applies-to: [frontend, backend, application, framework, infra]
argument-hint: "[track-letter] [short-title] (e.g. 'L mobile-collapse')"
user-invocable: true
---

# Work planning

Create the smallest independently valuable work package the pipeline can execute. Define what must
become true and why; leave design and implementation decisions to later phases.

## Authority boundary

Only a maintainer may invoke this skill. `/pipeline` and pipeline-spawned agents must never create or
expand work-package scope. During a pipeline run, missing or unstable scope is a blocker requiring
maintainer input, not permission to invoke `/work-planning`.

The approved `plan.md` owns the work package's required outcomes, acceptance criteria, scope, and
intent. Later artifacts may explain or constrain an in-scope solution, but may not add required
outcomes silently. A new outcome requires an approved plan amendment or a separate work package.

## Before registering

Read the relevant track file, configured project documentation, and enough source to understand the
existing capability. Ask only questions whose answers would materially change the outcome, boundary,
or acceptance criteria. Offer an evidence-based read for the maintainer to confirm or correct.

Confirm:

1. **Value:** Name who benefits, what improves, and the concrete cost of not doing the work. Do not
   register work justified only by completeness, imitation, or “nice to have.”
2. **Existing behavior:** Identify what already exists and isolate the genuine missing delta. Do not
   rebuild an existing capability. Use focused exploration when the answer is not readily visible.
3. **Stable frame:** The track's shared strategic boundary or load-bearing primitive is established in
   configured project documentation. If it is missing or contested, stop for maintainer resolution.
   A WP-specific detail may instead be marked for refinement.
4. **Tier:** Confirm the customer-based engineering tier: `prototype`, `mvp`, `production`, or
   `critical`. Deployment or real data alone does not imply `critical`. Record an explicit reason for
   any WP override of the project or track tier.
5. **Dependencies:** Keep only dependencies that make this WP impossible to implement or verify before
   the dependency is done. Related work is not automatically a dependency.
6. **Identity:** Use a valid track and a unique WP ID. Exact and derived WP IDs must remain inside
   `.pipeline/**`, including in VCS and PR metadata.

Do not register research, exploration, or findings as the deliverable. Perform enough investigation to
scope the observable change, then register the work that acts on it. A code-health WP is valid only when
it names an observable system or engineering outcome and has verifiable ACs.

## Choose a workable size

Size describes scheduling cost, not importance:

| Size | Typical shape | Scheduling default |
|---|---|---|
| `S` | Focused change, normally one subsystem and at most three ACs | May batch with nearby `S` work |
| `M` | One substantial outcome or contract, normally completed in a focused session/day | Run alone |
| `L` | Multi-day or genuinely cross-system outcome | Run alone; consider splitting |

Prefer the smallest package that remains independently observable and valuable. Split when outcomes can
ship independently, when dependencies differ, or when the package cannot be reviewed coherently. Do not
split merely to satisfy a bullet count, and do not call work `S` merely to make it batchable.

## Write the plan

Create `.pipeline/work/<id>/plan.md` with exactly these top-level sections:

```markdown
# <ID> — <Title>

## Work package

**Outcome.** <Who can observe what new result, and why it matters.>

**Why this matters.** <Beneficiary, value, and cost of not doing it.>

**What exists today.** <Relevant current capability; concise for small changes.>

**Missing delta.** <The specific gap this WP closes.>

**Depends on.** <WP IDs with one-sentence blocker reasons, or None.>

**Complexity.** S | M | L

**Engineering tier.** prototype | mvp | production | critical

**Pre-build.** <Refinement/design needed, with a concrete trigger; otherwise Not required.>

**Constraints.** <Approved hard boundaries the solution must honor, or None.>

**Out of scope.** <Plausible adjacent outcomes explicitly excluded.>

## Acceptance criteria

- <Observable condition that must be true.>

## Validation scenarios

- Given <context>, when <action>, then <observable result>.
```

Keep the seed proportional. Small, already-understood changes should have short plans. Add detail only
when it removes a real ambiguity about scope or observable behavior.

### Acceptance criteria

Each AC must be independently decidable as pass or fail and must describe an outcome, not a preferred
implementation. Avoid file paths, types, schemas, libraries, component layouts, migration steps, and
other solution choices unless the maintainer explicitly approves one as a hard compatibility constraint.

Collectively, the ACs define the complete required outcome; prose, examples, scenarios, downstream
artifacts, and tests do not create additional requirements. For compound behavior, make each required
condition visible rather than hiding it behind words such as “complete,” “robust,” or “best practice.”

Validation scenarios clarify representative behavior. Use as many as needed for ambiguity and no more.
Every AC needs reliable evidence downstream, but this skill does not prescribe one new automated test
per AC or a particular evidence format.

### Applicability of later phases

Record a pre-build phase only when its trigger exists:

- **Refinement:** the goal or a load-bearing WP-specific noun is unresolved.
- **Design:** the WP changes a user-facing surface and the design is not already determined by an
  approved existing pattern. A routine extension may need only a light design pass.
- **Neither:** backend, infrastructure, or trivial pattern-following work whose requirements are clear.

Human approval policy belongs to the orchestrator. Do not duplicate a universal gate count here. Record
only WP-specific reasons that a concept decision needs explicit maintainer review.

## Register the work package

1. Create `.pipeline/work/<id>/plan.md`.
2. Add the WP to `.pipeline/<track>.md`, including type, size, dependencies, and `planned` status. Add
   dependency-graph edges. If the maintainer is deliberately creating a new track, create its standard
   coordination file first.
3. Run `{{verify}}` and any cheaper configured coordination check. Fix only failures caused by this
   registration; report unrelated pre-existing failures accurately.
4. Commit the plan and coordination update together with `plan: register work package — <title>`.
   Never include the WP ID in commit metadata.

After registration, return control to the maintainer. Do not invoke refinement, design, architecture,
or the pipeline unless separately requested.

## Stop without registering when

- The outcome, beneficiary, or missing delta is not credible.
- The strategic frame or tier needs a maintainer decision.
- The proposed deliverable is investigation rather than an observable change.
- The ACs cannot be separated from unresolved design or implementation choices.
- The WP duplicates existing behavior, creates a dependency cycle, or cannot be made independently
  coherent without reshaping scope.

State what is unresolved and the smallest decision or investigation needed to continue. Do not invent
the answer to make registration succeed.

## Target

$ARGUMENTS
