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

The planner writes the approved plan for each WP to `.pipeline/plans/<id>.md` (concept + design
spec + architecture + acceptance criteria, as left after the Phase 2 critique loop). It is the
durable producer→consumer handoff: the builder and reviewer read it instead of relying on a warm
producer session.

Record session start time.

## Pre-condition: the strategic frame must already be locked

The pipeline runs `/refine` (Phase 1) to sharpen a WP's *per-work-package* requirement, but it
does **not** settle a track's **strategic frame** — what the whole track is about, its
load-bearing primitive / boundary, what each primitive *is*, *isn't*, and what contracts it
commits the project to. That is upstream maintainer work, done in `/work-planning`'s
strategic-framing questionnaire and landed in `{{paths.docs}}` ground truth. It needs human
judgment and doesn't fit an autonomous loop. Before launching, the strategic frame for any track
that introduces or reshapes a primitive must exist in `{{paths.docs}}`. The pipeline (and
`/refine`) read it as fixed input.

If a WP reaches the pipeline and the strategic frame is missing for a new/reshaped primitive it
depends on, **fail fast**: mark it `blocked` with reason `concept-missing` and move on. Do not
invent the strategic frame autonomously. (Sharpening the *per-work-package* requirement is fine —
that's exactly what Phase 1's `/refine` does.)

## The phase loop

Run the phases below **in order** for each WP. **Skip `design` + `design-critique` when the WP has
no UI surface (pure backend, schema, infra, concept-only) or when `pipeline.config designSystem` is
null** — see the skip rule at the end.

| Phase | Persona | Model | Skills | Purpose |
|---|---|---|---|---|
| 1 | **planner** | `{{models.design}}` | `refine` (if needed) → `design` → `architecture` | Requirement (value + noun shape + guide draft) + variant exploration (if UI) + technical plan. Production only. `refine` runs only when the WP's goal is unclear or it introduces/reshapes a noun; skip when the requirement is already sharp in `{{paths.docs}}`. |
| 2 | **reviewer** + **planner** | `{{models.review}}` | `refine-critique` (if `refine` ran) → `design-critique` → `architecture-critique` → planner revision loop | Independent evaluation. CRITICAL/WARNING findings → planner revises, reviewer re-critiques (**max 3 rounds**). Builder receives a clean, approved plan. |
| 2.5 | **planner** (or orchestrator park) | conditional | `human-concept-review` | **Stakes-gated, conditional.** Runs only when `DESIGN-CLASS == novel` OR `DOC-CLASS == significant` (a novel design or a significant guide rewrite). Interactive + founder present → the `human-concept-review` skill **launches the component viewer itself** (idempotent: reuse if already on `:5173`, copy + `npm install` only if missing, background `npm run dev`), the founder reviews the rendered variant + guide draft, planner revises to approval. Autonomous / no founder → the orchestrator **parks** (`status: awaiting-human-concept-review`) and does **not** stand up the viewer; siblings proceed. On resume, the founder runs `/human-concept-review`, which owns the launch. Otherwise → skipped silently. |
| 3 | **builder** | `{{models.build}}` | `write-tests` → `write-code` → doc check | TDD red then green. Doc check: if user-facing changes exist, apply `write-docs`; else justify the skip. Must pass `{{verify}}` before handing off. |
| 4 | **reviewer** + **builder** | `{{models.review}}` | `review` (+ `write-docs` rubric if docs changed) | Reviewer checks code against the approved plan in `.pipeline/plans/<id>.md` (warm Phase 2 session reused if the host supports it). Positive + negative lenses + AC-completeness audit. Builder applies fixes. **Verdict DONE required** before proceeding. |
| 5 | fresh agent | low | `retro` | Fresh-context retro with cost signals. Writes to `.pipeline/retro-log/<id>.jsonl`. **Runs before ship.** |
| ship | **builder** | `{{models.build}}` | `ship` | Land the change: pass `{{verify}}`, open/ready the PR, wait for CI green. Not a tracked phase — the merge is proof of completion. |

**Producer / evaluator separation is the whole point.** The **planner** produces; a *different*
agent, the **reviewer**, evaluates. In Phase 4 the reviewer checks the code against the approved
plan in `.pipeline/plans/<id>.md` — the same contract it critiqued in Phase 2. If the host keeps
the reviewer's Phase 2 session warm, it already holds those decisions and saves a re-read; if not,
it reconstitutes them from the plan artifact. Same audit either way. The reviewer's AC-completeness
audit reads a *live* change against the spec — never the builder's notes about the change.

### Spawn discipline (tool-agnostic)

Spawn each persona as a **subagent in your host tool** — Claude Code agents, or
Cursor/Codex/Gemini/Copilot subagents. Continuity travels through `.pipeline/` state (the WP spec,
the plan artifact, progress), not through a live session — so a fresh planner, reviewer, or builder
spawned at any phase reconstitutes from those files and produces the same result.

**Session reuse is an optimization, not a requirement.** Where the host supports it (warm sessions,
agent teams, message-an-existing-agent), keep the three personas alive across phases — the reviewer
in Phase 4 reusing its Phase 2 session, the builder carrying Phase 3 into Phase 4 fix-apply and
ship — to save context/cache-creation cost. Where it doesn't (no durable sessions, or subagents
that start cold with no parent context), re-spawn each phase; the plan artifact makes that correct,
just not free. Never gate the pipeline on session reuse being available. The retro agent is always
ephemeral. See `references/spawn-contract.md` for the exact per-phase dispatch script.

### Loop rules

- **Critique loop (Phase 2):** if findings are CRITICAL/WARNING, send them to the planner,
  who revises and the reviewer re-critiques. Repeat until the score clears the bar or **3 rounds**
  are reached. If it never clears after the cap: mark `blocked` with reason
  `concept-or-spec-misalignment` (the requirement may need another `/refine` pass, or the
  strategic frame may need upstream `/work-planning` work).
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

## Final outcome summary (always-on)

The **last step of every run**. After ship (CI green), write ONE outcome summary per work
package — what was *actually* built versus what was intended, how it really works, what value it
delivers, and what's still missing. This is the run's accountability artifact, chat prose only —
no new committed file. Lead with **what was built and what they can now do**; the pipeline
mechanics are not the story. Per WP, four terse beats (one to two lines each, sourced, no
fabrication):

- **Goal vs actually built** — what the WP set out to deliver (from the requirement / ACs) versus
  what shipped. Name any scope that moved.
- **How it works now vs architecture** — the as-built behavior in plain words, and where it
  diverged from the `/architecture` plan (if it did).
- **User value** — what a user/dev can now do or see that they couldn't before, in plain words
  (not the WP ID/title verbatim).
- **Gaps** — what's deliberately deferred, unproven, or still missing against the goal. "none" is
  a reviewable claim, not filler.

Close each WP with **Status** — `PR #N · CI green · ready to merge`, or `blocked: <plain reason>`,
or `parked: awaiting human concept review`. For a batch, a one-line lead ("3 of 4 shipped; X
blocked on …; Y parked for concept review") then the per-WP blocks. Do **not** report phase
numbers, persona names, critique scores, or review-round counts. Keep it scannable.

## Done when

- Every WP in the target has `status: done` (shipped, CI green) **or** `status: blocked` with a
  reason — and its `.pipeline/progress/<id>.json` reflects that.
- The final outcome summary has been emitted for the batch.
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
