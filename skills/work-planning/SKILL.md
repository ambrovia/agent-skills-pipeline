---
name: work-planning
description: "Register a work item under a track and seed its interview. Maintainer-only. Use when a maintainer asks to add, split, or reshape a work item. Does not write the plan — the plan is written with the maintainer during refinement."
persona: any
applies-to: [frontend, backend, application, framework, infra]
argument-hint: "[track-letter] [short-title] (e.g. 'L mobile-collapse')"
user-invocable: true
---

# Work planning

Register the smallest independently valuable item the pipeline can execute, and leave it ready for
the interview that writes its plan. Establish that the work is worth doing and where it sits in the
track; decide nothing about how it will be done.

## Authority boundary

Only a maintainer may invoke this skill. `/pipeline` and pipeline-spawned agents must never create or
expand item scope. During a run, missing or unstable scope is a blocker requiring maintainer input,
not permission to invoke `/work-planning`.

This skill does not write the plan's content. It creates `plan.md` with its headings and a seed under
the first; `/refine` and `/program-design` fill it with the maintainer. Leave enough for the interview
to start from and nothing that pre-empts it.

## Before registering

Confirm the pipeline is configured before registering work against it: `pipeline.config.yml` exists
with `verify`, `paths`, `vcs` and `engineering.tier` set, and every rule slot it declares points at a
file that is present. An omitted or null slot is a valid answer — skills skip absent slots. Offer
`/setup` when the config is missing, when a declared slot points at nothing, or when this work plainly
turns on a convention the repository has never written down.

Read the relevant track file, `pipeline.config.yml`, the project documentation under `{{paths.docs}}`,
and enough source to understand the existing capability. Ask only questions whose answers would
change whether this item should exist or where it sits. Offer an evidence-based read for the
maintainer to confirm or correct.

Confirm:

1. **Value:** Name who benefits, what improves, and the concrete cost of not doing the work. Do not
   register work justified only by completeness, imitation, or "nice to have".
2. **Existing behavior:** Identify what already exists and isolate the genuine missing delta. Do not
   rebuild an existing capability. Use focused exploration when the answer is not readily visible.
3. **Stable frame:** The track's shared strategic boundary or load-bearing primitive is established in
   configured project documentation. If it is missing or contested, stop for maintainer resolution.
4. **Dependencies:** Keep only dependencies that make this item impossible to implement or verify
   before the dependency is done. Related work is not automatically a dependency.
5. **Identity:** Use a valid track and a unique item ID. Exact and derived IDs must remain inside
   `.pipeline/**`, including in VCS and PR metadata.

Do not register research, exploration, or findings as the deliverable. Investigate enough to scope
the observable change, then register the work that acts on it.

## Estimate the dials

The three per-item dials start here and are re-questioned throughout the run. Estimate them with the
maintainer, default to the shallow end, and record them as provisional.

| dial | ask | shallow ← → deep |
|---|---|---|
| complexity | how big is the work? | bugfix · feature · suite · product |
| ambiguity | how clear is the topic? | established context · new context, little knowledge · we do not yet know what we want |
| exposure | how far does it reach? | internal detail · user-facing surface · public contract |

`engineering.tier` comes from `pipeline.config.yml` and applies to every item in the repository.

## Seed the plan

Create `.pipeline/work/<id>/plan.md` with the five headings the run will fill, and write the seed
under the first:

```markdown
# <ID> — <Title>

## What we need

**Why this exists.** <Who benefits, what improves, the cost of not doing it.>

**What exists today.** <Relevant current capability.>

**Missing delta.** <The specific gap this item closes.>

**Depends on.** <Item IDs with one-sentence blocker reasons, or None.>

**Dials (provisional).** complexity: … · ambiguity: … · exposure: …

## How it works

## How we work on this

## Confusions

## Proposed items
```

The four headings after the seed stay empty; refinement, program design and the run fill them. Write
no acceptance criteria and no plan for which phases will run. Keep the seed short.

## Register

1. Write the seed to `.pipeline/work/<id>/plan.md`.
2. Add the item to `.pipeline/<track>.md` with type, dependencies, and `planned` status, and add
   dependency-graph edges. If the maintainer is deliberately creating a new track, create its
   standard coordination file first.
3. Commit the seed and coordination update together with `plan: register work item — <title>`. Never
   include the item ID in commit metadata.

Then return control to the maintainer. Do not invoke refinement, program design, or the pipeline
unless separately requested.

## Stop without registering when

- The beneficiary or missing delta is not credible.
- The strategic frame needs a maintainer decision.
- The proposed deliverable is investigation rather than an observable change.
- The item duplicates existing behavior, creates a dependency cycle, or cannot be made independently
  coherent without reshaping scope.

State what is unresolved and the smallest decision needed to continue. Do not invent the answer to
make registration succeed.

## Target

$ARGUMENTS
