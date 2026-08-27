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

Keep going until every targeted WP is `done`, `blocked`, or parked awaiting a human. Never end a turn
without a tool call unless that terminal state is reached. Never stop after planning — critique, build,
review, and ship still owe work.

## Authority and state

`plan.md` owns required outcomes, ACs, tier, scope, and intent. `requirements.md`, approved design, and
`architecture.md` constrain their phase within that scope. Tests and findings are evidence. New outcomes
require a maintainer-approved plan amendment or another WP.

Each WP lives under `.pipeline/work/<id>/`; its track registry/dependency graph lives in
`.pipeline/<track>.md`. Repository-specific behavior comes from `pipeline.config.yml` — `verify`,
`vcs`, `paths`, `designSystem`, `engineering.tier`, optional `worktree` lifecycle settings, and the
`rules` slots, whose files live under `.pipeline/rules/` and are read-only to every pipeline phase.
Written state must let a cold agent resume without session memory. Never read or mutate another WP's
folder except its declared coordination dependency.

Phase artifacts inside the WP folder: `requirements.md` (`/refine`), `design/approved.md` (`/design`),
`architecture.md` plus `feasibility.md` (`/architecture`), `review.md` (findings, AC table, and verdict
from `/review`, persisted by the orchestrator because the reviewer is read-only), `retro.jsonl`
(`/retro`), and `progress.json` recording phase, status, session starts, completed evaluation attempts,
artifacts, approvals, verdicts, each round's `since` pointer — the commit or artifact hash it started
from — and spawned-agent counts per loop. Artifact writes advance the delta pointer; rounds and
re-entries read what changed since it, never the full briefing again. `/ship` consolidates the folder
before the PR.

Exact and derived WP IDs remain inside `.pipeline/**`. Derive worktree, branch, commit, and PR names from
the domain title. Before reading the WP, enter or create the correct isolated worktree using the project's
configured workflow, cut from the current remote default branch rather than a local checkout that may be
stale — a stale base hides registered work and reintroduces reverted code. Confirm the repository and
worktree before writing. Run configured bootstrap only when the worktree is new or stale, and never reuse
a development server from another checkout. Run configured contamination and cleanup checks before
commit or removal; never invent cleanup commands. Preserve an unrelated dirty tree and stop if safe
isolation or required bootstrap is impossible.

`/work-planning` is maintainer-only. If the strategic frame, plan, ACs, tier, or dependencies are missing
or contradictory, record a precise blocked state and park.

## Roles

- The planner produces requirements, design, and architecture.
- The reviewer is a fresh read-only evaluator and never repairs its own findings.
- The builder writes tests, code, docs, and blocking fixes.
- The orchestrator assigns phases, persists state, summarizes gates, enforces transitions, and decides
  how work is dispatched to subagents.

## Spawn and scheduling

Spawn each persona as a **subagent in the host tool** (Claude Code agents, Cursor/Codex/Gemini/Copilot
subagents, or the host's equivalent). Do not mode-switch the orchestrator into planner, reviewer, or
builder work. Continuity lives in `.pipeline/` state — a cold spawn reconstitutes from the WP artifacts
and produces the same result.

Every spawn carries a brief and nothing else: WP id, phase, role, the exact artifact reading list, the
output contract, and — for retries — only the blocking findings plus what changed since. No conversation
history, no re-narration of prior rounds. Order the brief stable content first, per-round content last,
so prefix caches hit. Run the bundled snapshot resolved from the plugin install path
(`node <plugin-root>/scripts/pipeline-snapshot.mjs <id>`) at run start and before every dispatch and
inject its digest; re-entry after parking starts from the digest, not a folder scan. Where mechanics
differ by host, pick the cheapest the host supports per `<plugin-root>/docs/host-capabilities.md`;
record a missing capability as a gap rather than downgrading every host to it.

Session reuse is an optimization only. Freshness belongs at phase boundaries, continuity within loops:
where the host keeps warm sessions, reuse a persona across its phases and keep the same builder across
its retry rounds and the same reviewer across its evaluations of one loop; where it does not, re-spawn,
and the next round starts from the previous round's delta rather than a cold reconstitution. Never gate
a phase on reuse. Count spawned agents per loop in `progress.json` — the budget is two, one builder and
one reviewer; record every host-forced respawn beyond it with reason. Every assignment names the
artifact to read and the output to write. Do not leak the expected verdict or prior diagnosis into a
fresh review.

**The orchestrator owns runtime shape.** Before each phase (and before each build wave), decide:

- **sequential vs parallel** — run one subagent at a time, or fan out independent units together;
- **how many subagents** — usually one planner or one reviewer per phase; for build, one builder by
  default, more only when architecture names independently owned leaves whose parallel rationale still
  holds;
- **wave boundaries** — start dependants only after their dependency receipts are accepted.

Prefer sequential when ownership overlaps, contracts are unsettled, isolation is unavailable, or the
extra fan-out would not shorten the critical path. Prefer parallel only for truly independent leaves
with explicit write ownership and bootstrapped isolation. Architecture proposes split boundaries;
the orchestrator chooses the live schedule and may collapse a planned parallel split back to sequential
when reality no longer supports it.

## Lifecycle

Each skill's frontmatter `phase` names the section it belongs to; `phase: 0` runs before a pipeline run.

### 1. Preflight

Resolve target WPs and dependency order. Confirm registry entries, valid plan sections, stable strategic
frame, tier, `pipeline.config.yml` with the rule files its slots name actually present, isolated
bootstrapped worktree, and clean ownership boundary. Skip a WP already done. A blocked dependency blocks
descendants without attempting their phases.

### 2. Requirement clarification when needed

Run `/refine` only when the plan's pre-build trigger exists or a load-bearing requirement remains
ambiguous.

When refinement materially interprets value, scope, or a load-bearing noun, summarize the plan diff and
requirements in plain language for maintainer approval. Park as `awaiting-human-review` if approval is
unavailable. Skip this extra gate when no refinement artifact or material requirement choice exists.

### 3. Concept and architecture

Run `/design` only for a UI decision not already determined by an approved pattern and only when a design
system is configured. Run `/architecture` for the technical decisions needed by the WP; a trivial change
may produce a correspondingly small plan.

Use a fresh `/architecture-critique` reviewer when architecture exists. Retry only blocking findings,
with the same three-attempt discipline, completing each loop before the concept gate.
Non-blocking defects and notes are retained for visibility but are not assigned automatically.

The concept gate is mandatory: no build starts until the maintainer approves the design and architecture
together. Summarize the product/UX choices, contracts, trade-offs, end-to-end evidence plan, and open
blockers in plain language; do not present rubric scores. For UI, render the reviewed design so the
maintainer reviews the surface rather than prose. Park as `awaiting-human-review` when approval is
unavailable; do not revise or re-critique the presented artifacts while parked or after approval. Never
auto-approve, and never treat "routine" or "backend-only" as a skip reason.

A later revision returns to the gate only when it materially changes the approved concept — user-visible
surface, public contract, dependency, or an approved trade-off. A confined amendment re-runs its critique
and returns to build.

### 4. Build

Assign `/write-tests` where automated red evidence is appropriate, then `/write-code`. Where a new
automated test would be disproportionate, other reliable evidence stands in only if `architecture.md` or
`{{rules.testing}}` names it. The build must produce the end-to-end evidence named in `architecture.md`.
Run `/write-docs` only for an explicit docs deliverable or authoritative docs made false by the change.

Default to one builder subagent. When `architecture.md` names multiple leaves, decide sequential vs
parallel and the subagent count for that wave — do not fan out by habit. Each parallel leaf gets an
isolated bootstrapped worktree, explicit owned writes, start commit, dependency receipts, and focused
verification. No leaf writes shared surfaces without ownership. Without per-writer isolation, run the
same leaves sequentially. Integrate complete leaves in dependency order; never integrate partial work.
If an upstream amendment invalidates descendants, mark and replay them rather than reusing stale
receipts. Verify real cross-leaf seams.

Resume an interrupted builder from its last task commit — assess the working tree and continue rather
than restarting the phase. Where the host supports skill-load hooks, mechanical check results arrive
injected at skill load (`hooks/skill-load-inject`); where it does not, run the checks once before a
retry round and inject the results into the brief. On repository/plan contradiction, return to the
owning phase. Do not let the builder redesign or let the orchestrator create scope.

### 5. Implementation review

Where the host supports skill-load hooks, check results (`checks.preSpawn` or `{{verify}}`) and the WP
diff arrive injected at skill load; where it does not, run the checks once before spawning the reviewer
and inject the results with the snapshot digest. The reviewer judges injected results instead of
re-running them. Before review, choose its runtime shape as deliberately as a build wave: one
reviewer, sequential reviewers, or parallel reviewers. Default to one fresh reviewer over the complete
integrated diff because one reviewer can follow behavior across seams. Split only when distinct risk
areas justify independent attention. Split reviewers work independently; finish with one reviewer
assessing the complete integrated change and combined findings.

`DONE` requires every AC to pass and no blocking finding. Send only blocking findings to the builder,
then run focused verification and fresh review. Non-blocking findings never enter retry, and the
orchestrator may not upgrade them to blocking — a new concern needs a new evaluation with new evidence.
Count completed evaluations, not sessions or interrupted runs.
Each retry must use a changed strategy. After three unsuccessful evaluations the orchestrator adjudicates:
keep building with a changed strategy, or return to `/architecture` (and `/design` when the surface is
implicated) with the findings as evidence, re-run its critique, and rebuild. Each adjudication resets the
evaluation count. Adjudicate at most twice, then park as `awaiting-human-review` with the standing
findings, both adjudications, and the decision needed.

After `DONE`, summarize delivered outcomes, AC evidence, material trade-offs, and non-blocking
limitations — including carried-forward defects and follow-ups from earlier rounds — for final human
approval. Park until approved; never auto-approve the built result.

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
