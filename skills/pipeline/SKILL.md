---
name: pipeline
description: "Orchestrate one or more already-approved work packages end to end through applicable planning, independent critique, implementation, review, human approval, retro, and a CI-green PR. Never creates scope."
persona: orchestrator
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Pipeline

Drive approved WPs through a fixed lifecycle while running only phases whose triggers exist. The
orchestrator coordinates producers, reviewers, state, and human gates; it does not plan, implement, or
review their work itself.

## Authority and state

`plan.md` owns required outcomes, ACs, tier, scope, and intent. `requirements.md`, approved design, and
`architecture.md` constrain their phase within that scope. Tests and findings are evidence. New outcomes
require a maintainer-approved plan amendment or another WP.

Each WP lives under `.pipeline/work/<id>/`; its track registry/dependency graph lives in
`.pipeline/<track>.md`. Repository-specific behaviour comes from `pipeline.config.yml` — `verify`,
`vcs`, `paths`, `designSystem`, `engineering.tier`, and the `rules` slots. Written state must let a cold
agent resume without session memory. Never read or mutate another WP's folder except its declared
coordination dependency.

Phase artifacts inside the WP folder: `requirements.md` (`/refine`), `design/approved.md` (`/design`),
`architecture.md` plus `feasibility.md` (`/architecture`), `review.md` (findings, AC table, and verdict
from `/review`, persisted by the orchestrator because the reviewer is read-only), `retro.jsonl`
(`/retro`), and `progress.json` recording phase, status, attempts, artifacts, approvals, and verdicts.
`/ship` consolidates the folder before the PR.

Exact and derived WP IDs remain inside `.pipeline/**`. Derive worktree, branch, commit, and PR names from
the domain title. Before reading the WP, enter or create the correct isolated worktree using the project's
configured workflow. Bootstrap a new or long-idle worktree — install, environment, build — before any
build or verification runs there; a missing bootstrap produces false failures and stale artifacts, and a
bootstrap that cannot run is a blocked state. Preserve an unrelated dirty tree and stop if safe isolation
is impossible.

`/work-planning` is maintainer-only. If the strategic frame, plan, ACs, tier, or dependencies are missing
or contradictory, record a precise blocked state and park.

## Roles

- The planner produces requirements, design, and architecture.
- The reviewer is a fresh read-only evaluator and never repairs its own findings.
- The builder writes tests, code, docs, and blocking fixes.
- The orchestrator assigns phases, persists state, summarizes gates, and enforces transitions.

Reusing a session is an optimization only. Every assignment names the artifact to read and output to
write. Do not leak the expected verdict or prior diagnosis into a fresh review.

## Lifecycle

Each skill's frontmatter `phase` names the section it belongs to; `phase: 0` runs before a pipeline run.

### 1. Preflight

Resolve target WPs and dependency order. Confirm registry entries, valid plan sections, stable strategic
frame, tier, `pipeline.config.yml`, isolated bootstrapped worktree, and clean ownership boundary. Skip a
WP already done. A blocked dependency blocks descendants without attempting their phases.

### 2. Requirement clarification when needed

Run `/refine` only when the plan's pre-build trigger exists or a load-bearing requirement remains
ambiguous. If it runs, send `requirements.md` to a fresh `/refine-critique` reviewer.

Only `BLOCKING` findings return to the planner. Each retry states the failed authority, evidence, and a
changed strategy; cap at three attempts, then block. Scores, warnings, and suggestions never trigger a
retry.

When refinement materially interprets value, scope, or a load-bearing noun, summarize the plan diff and
requirements in plain language for maintainer approval. Park as `awaiting-human-review` if approval is
unavailable. Skip this extra gate when no refinement artifact or material requirement choice exists.

### 3. Concept and architecture

Run `/design` only for a UI decision not already determined by an approved pattern and only when a design
system is configured. Run `/architecture` for the technical decisions needed by the WP; a trivial change
may produce a correspondingly small plan.

Use fresh `/design-critique` and `/architecture-critique` reviewers for artifacts that exist. Retry only
blocking findings, with the same three-attempt discipline. Non-blocking defects and notes are retained
for visibility but are not assigned automatically.

The concept gate is mandatory: no build starts until the maintainer approves the design and architecture
together. Summarize the product/UX choices, contracts, trade-offs, end-to-end evidence plan, and open
blockers in plain language; do not present rubric scores. For UI, render the approved design so the
maintainer reviews the surface rather than prose. Park as `awaiting-human-review` when approval is
unavailable; never auto-approve, and never treat "routine" or "backend-only" as a skip reason.

### 4. Build

Assign `/write-tests` where automated red evidence is appropriate, then `/write-code`; use other reliable
evidence permitted by `{{rules.testing}}` when a new automated test is disproportionate. The build must
produce the end-to-end evidence named in `architecture.md`. Run `/write-docs` only for an explicit docs
deliverable or authoritative docs made false by the change.

Default to one builder task. Split only at real dependency or safe parallel boundaries from
`architecture.md`. Each parallel leaf gets an isolated bootstrapped worktree, explicit owned writes, start commit,
dependency receipts, and focused verification. No leaf writes shared surfaces without ownership. Integrate
complete leaves in dependency order; never integrate partial work. If an upstream amendment invalidates
descendants, mark and replay them rather than reusing stale receipts. Verify real cross-leaf seams.

On repository/plan contradiction, return to the owning phase. Do not let the builder redesign or let the
orchestrator create scope.

### 5. Implementation review

Run `/review` as a fresh read-only reviewer over the complete integrated diff. `DONE` requires every AC
to pass and no blocking finding. Send only blocking findings to the builder, then run focused verification
and fresh review. Cap identical lifecycle retries at three changed strategies before blocking.

After `DONE`, summarize delivered outcomes, AC evidence, material trade-offs, and non-blocking limitations
for final human approval. Park until approved; never auto-approve the built result.

### 6. Retro and ship

Run `/retro` after final approval. Retro is the final mutable observation phase. Then run `/ship`, which
commits all intended state, verifies from a clean tree, opens/updates the PR, and waits for required CI.
Any later mutation explicitly re-enters ship and repeats final verification. Stop at a CI-green
merge-ready PR; a human merges.

## Failure and completion

Use precise states such as `blocked`, `awaiting-human-review`, `not-done`, and `done`, with evidence and
the smallest action needed to resume. Lack of a human is a parked state, not approval and not failure.

Always return a concise outcome summary: completed/skipped/blocked WPs, delivered behavior, verification,
PR/CI state, and decisions needed. Do not create cleanup work from non-blocking observations.

After several completed WPs, `/compound` may analyze accumulated retros. It proposes changes for human
approval and never mutates pipeline policy automatically.

## Target

$ARGUMENTS
