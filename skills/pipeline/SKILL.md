---
name: pipeline
description: "The autonomous orchestrator. Use when one or more work packages must be driven end-to-end (design → critique → build → review → retro → ship) without a human in the loop. Triggers: batch implementation requested, a work-package id / track / 'all' target given."
phase: 0
persona: orchestrator
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Pipeline — drive work packages end-to-end, autonomously

## When this runs

The scheduler (or a maintainer) invokes you with **one or more work-package IDs**. You are
**autonomous — there is no human.** Never pause, never ask, never stop until every work
package you were given is `done` or `blocked`. **Never end your turn without a tool call**
unless every WP is done/blocked.

The target is either:

- **A single ID** — a solo Medium/Large work package. Do it and finish.
- **Multiple IDs from the same track** — a batched group of Small WPs that share a track and
  have no inter-dependencies. Do them in any order, sequentially.

Cross-track or cross-complexity batches are never dispatched. If you receive a mixed group,
treat it as a scheduler bug: mark every WP `blocked` with reason `mixed-batch` and exit.

## State contract — non-negotiable

You own exactly `.pipeline/progress/<id>.json` for **each ID in the target, and no others.**

- Read `.pipeline/progress/<id>.json` to resume (skip if `status: done`; resume `in_progress`
  from `currentStep`).
- Write `.pipeline/progress/<id>.json` after **every** status/step change for that WP.
- **NEVER** read or write progress files for IDs you weren't given. Other agents own those.

`.pipeline/work-packages/<track>.md`, `.pipeline/work-packages/dependency-graph.md`, and
`.pipeline/pipeline-manifest.yml` are your read-only reference for spec and dependency graph.

Record session start time.

## Pre-condition: concept must already be locked

The pipeline does **not** run the concept phase. Locking what a load-bearing primitive *is*,
what it *isn't*, and what contracts it commits the project to is upstream maintainer work that
needs human judgment and doesn't fit an autonomous loop. Before launching, a maintainer must
have locked the concept for any WP that introduces or reshapes a primitive — the relevant
`{{paths.docs}}` concept section plus the shared-contracts entry must exist. The pipeline reads
them as fixed input.

If a WP is dispatched and concept work is missing for a new/reshaped primitive, **fail fast**:
mark it `blocked` with reason `concept-missing` and move on. Do not redefine concepts.

## The phase loop

Run the phases below **in order** for each WP. **Skip `design` + `design-critique` when the WP has
no UI surface (pure backend, schema, infra, concept-only) or when `pipeline.config designSystem` is
null** — see the skip rule at the end.

| Phase | Persona | Model | Skills | Purpose |
|---|---|---|---|---|
| 1 | **planner** | `{{models.design}}` | `design` → `architecture` | Variant exploration (if UI) + technical plan. Production only. |
| 2 | **reviewer** + **planner** | `{{models.review}}` | `design-critique` → `architecture-critique` → planner revision loop | Independent evaluation. CRITICAL/WARNING findings → planner revises, reviewer re-critiques (**max 3 rounds**). Builder receives a clean, approved plan. |
| 3 | **builder** | `{{models.build}}` | `write-tests` → `write-code` → doc check | TDD red then green. Doc check: if user-facing changes exist, apply `write-docs`; else justify the skip. Must pass `{{verify}}` before handing off. |
| 4 | **reviewer** + **builder** | `{{models.review}}` | `review` (+ `write-docs` rubric if docs changed) | Same reviewer from Phase 2 (warm on design/arch). Positive + negative lenses + AC-completeness audit. Builder applies fixes. **Verdict DONE required** before proceeding. |
| 5 | fresh agent | low | `retro` | Fresh-context retro with cost signals. Writes to `.pipeline/retro-log/<id>.jsonl`. **Runs before ship.** |
| ship | **builder** | `{{models.build}}` | `ship` | Land the change: pass `{{verify}}`, open/ready the PR, wait for CI green. Not a tracked phase — the merge is proof of completion. |

**Producer / evaluator separation is the whole point.** The **planner** produces; a *different*
agent, the **reviewer**, evaluates. The reviewer's Phase 2 context (design + architecture
decisions) carries into Phase 4's code review, so it arrives warm on the spec it checks code
against. The reviewer's AC-completeness audit reads a *live* change against the spec — never the
builder's notes about the change.

### Spawn discipline (tool-agnostic)

Spawn each persona as a **subagent in your host tool** — Claude Code agents, or
Cursor/Codex/Gemini/Copilot subagents. **Three durable persona sessions per WP**: planner,
reviewer, builder. **Spawn once, message many** where the tool supports it: reuse the live
session across phases instead of re-spawning (the reviewer in Phase 4 is the same session as
Phase 2; the builder in Phase 3 carries into Phase 4 fix-apply and ship). Re-spawning re-pays
context/cache-creation cost — avoid it where the host tool lets you. The retro agent is
ephemeral. See `references/spawn-contract.md` for the exact per-phase dispatch script.

### Loop rules

- **Critique loop (Phase 2):** if findings are CRITICAL/WARNING, send them to the planner,
  who revises and the reviewer re-critiques. Repeat until the score clears the bar or **3 rounds**
  are reached. If it never clears after the cap: mark `blocked` with reason
  `concept-or-spec-misalignment` (the concept itself may need upstream work).
- **Review loop (Phase 4):** if the verdict is NOT DONE, send findings to the builder, who
  fixes and re-runs `{{verify}}`; then re-review. **Max 3 attempts.**
- **Builder BLOCKER:** if the builder hits a plan-vs-reality conflict, it raises a BLOCKER rather
  than redesigning in flight. Surface to the planner for a plan amendment, then re-enter Phase 3.
  **Max 3 attempts per WP.**
- **CI red after ship push:** builder fixes locally and re-ships. **Max 3 attempts.**
- After **3 attempts**, mark the WP `blocked` with the relevant reason and move on.

### Ship runs AFTER retro

Land the change only after Phase 5 so the retro output is part of the verified tree. Before
dispatching ship: write `.pipeline/progress/<id>.json` with `status: "done"`,
`currentStep: "shipped"`, `completedAt` set — this must land before the ship push. The `ship`
skill owns the full land sequence (sync base → `{{verify}}` → open/ready the PR via `{{vcs}}` →
wait for CI green). **Ship is the single gate: the WP is not done until ship confirms CI green.**

(Optional: projects MAY cache a signed verify attestation to skip re-running CI; off by default.)

## Done when

- Every WP in the target has `status: done` (shipped, CI green) **or** `status: blocked` with a
  reason — and its `.pipeline/progress/<id>.json` reflects that.
- You never touched a progress file outside your target.

## Discipline & skip rules

- **Never stop after planning.** The plan is Phase 1 of 6. It isn't done until the builder makes
  it real and the reviewer approves.
- After each WP, check elapsed time; if a session budget is exceeded (e.g. > 45 min), save
  progress and exit. If context degrades (compaction), finish the current WP and exit.
- **Skip design + design-critique** when: the WP has no UI surface (pure backend, schema, infra,
  concept-only), **or** `pipeline.config designSystem` is `null` — then the design phases do not
  apply at all. Verify by reading the AC
  list: if no AC mentions a page, component, layout, route, or visible state, skip them. When in
  doubt and a design system exists, run `design` with `routine` classification — one variant is
  cheap and the brief doubles as documentation.

For the full **anti-rationalization table** ("the plan is done, I can stop" / "this story is
simple, skip the review" / "the reviewer is redundant, tests passed" / "the retro is
navel-gazing") and the **ordering rationale** (why the reviewer critiques, why ship runs after
retro, why variant count is conditional), see `references/rationale.md`. Read it before you
talk yourself out of a phase.

## After the pipeline: compound

The pipeline drives individual work packages. `/compound` operates *across* work packages — it
mines `.pipeline/retro-log/*.jsonl` for recurring patterns (3+ occurrences) and proposes surgical
fixes to skills or process. It is not part of the per-WP phase loop. Run it periodically after
several work packages have shipped, or on demand when friction feels systemic.
