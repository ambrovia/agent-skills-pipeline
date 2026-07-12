---
name: refine-critique
description: "Score a work package's refinement — the sharpened goal + guide draft from /refine — against a rubric BEFORE human concept review and before design/architecture. Reviewer persona: a fresh evaluator, not the pipeline-planner who wrote it."
phase: 2
persona: pipeline-reviewer
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Refine Critique — score the goal before anything is built

The evaluation counterpart to `/refine`. The pipeline-planner who sharpened the goal is the least able to see where it's still fuzzy, so a fresh pipeline-reviewer scores it before design and architecture build on it. This is **not** `/architecture-critique` — that scores the plan; this scores the *goal and its guide draft*, upstream of any plan.

## When this runs

- **In the pipeline:** Phase 2, after `/refine` produced `requirements.md`, before `/design-critique` and `/architecture-critique`. Reviewer session.
- **On explicit invocation:** audit a work package's `.pipeline/work/<id>/requirements.md`.
- **Skip when:** `/refine` did not run for the work package (the goal was already sharp in `{{paths.docs}}`).

## Required reading

1. `.pipeline/work/<id>/plan.md` — the `## Work package` + `## Acceptance criteria` (the seed). AND `.pipeline/work/<id>/requirements.md` (what `/refine` wrote). Diff `requirements.md` (git) to judge whether refine sharpened in the right **direction** against the seed.
2. The sharpened goal, the guide draft, and the `DOC-CLASS` line within `requirements.md`.
3. The track's strategic frame in `{{paths.docs}}` — the value and boundary the goal must serve.

## The critique loop

```
1. Read the requirement; sanity-check its claims against the spec and {{paths.docs}}
2. Score it (0-10) against the dimensions below
3. List findings (CRITICAL / WARNING / SUGGESTION) with the section each refers to
4. The pipeline-planner fixes the highest-priority issue in `requirements.md`
5. Re-score
6. Repeat until score >= 7 or 3 rounds reached
```

Score ≥ 7 unlocks the requirement for `/human-concept-review` Pass 1. ≤ 4 sends it back to `/refine`.

## Scoring dimensions (0-10 each, averaged)

1. **Value** — names a concrete beneficiary and the value they get, not a generic "improve X". Smell: a value line that could be pasted onto any work package.
2. **Success** — "done" is observable (a user or the system can do something it couldn't before), not unfalsifiable. Smell: success no test or demo could confirm.
3. **Scope** — the non-goals are real exclusions that bound the work, not absent or filler. Smell: no out-of-scope on a work package that plainly has edges.
4. **Guide draft** — a real user/dev could follow it; it describes the shipped result, not the mechanism. Smell: a draft that restates the spec instead of telling the reader's story.
5. **AC alignment** — every WP acceptance criterion appears in the AC alignment table with a clear coverage story; no silent scope invention. Smell: AC in the WP spec missing from the table, or requirement rows with no backing AC.
6. **Noun clarity** *(only if the work introduces a noun)* — one unambiguous definition, distinct from adjacent terms, no name collision in `{{paths.docs}}`. Smell: a term that already means something else.
7. **Human-review readiness** — a founder could approve or reject in one pass without asking "but what does success look like?" Smell: success is unfalsifiable, scope has no non-goals, value names no beneficiary.

## Output format

```
## Refine Critique: <work-package-id>

**Score:** <n>/10  ·  **Rounds:** <n>

### CRITICAL
### WARNING
### SUGGESTION
### What's working
```

Write the score and rounds to `.pipeline/work/<id>/progress.json` so the pipeline and retro can read them.

## Target

$ARGUMENTS
