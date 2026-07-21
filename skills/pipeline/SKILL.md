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

## First: get into the right worktree — before you read the work package

Resolve the worktree **before reading the WP**: an existing worktree or `origin/main` may hold newer WP state, so reading from a stale base silently redoes or discards work. Each run: `git fetch origin`, reuse the target's worktree if it exists (bring it up to date on `origin/main`), else create one off `origin/main`. Never run on the main checkout or a dirty base.

```bash
git fetch origin
# reuse the target's worktree if it exists, else create one off origin/main
git worktree list | grep -q "pipeline-<target>" \
  && cd "$(git worktree list | awk '/pipeline-<target>/{print $1; exit}')" \
  || { git worktree add ../<repo>.worktrees/pipeline-<target> -b pipeline/<target> origin/main \
       && cd ../<repo>.worktrees/pipeline-<target>; }
```

**Bootstrap the worktree before any build or verify.** A fresh (or long-idle) worktree doesn't inherit installed deps, virtualenvs, or build artifacts from the main checkout. After `cd`, run the project's usual install / env / build bootstrap so `{{verify}}` and the tooling can actually run. Skipping this produces a false failure (or a stale bundle from the wrong tree). If the bootstrap itself can't run (missing secrets/toolchain), mark the WP `blocked` with that reason.

## State contract — non-negotiable

**Everything for a work package lives in one folder: `.pipeline/work/<id>/`.** One folder per work
package, co-located. You own exactly `.pipeline/work/<id>/` for **each ID in the target, and no others.**

```
.pipeline/
├── <track>.md                 # per-track coordination (see below) — read-only reference
└── work/
    └── <id>/
        ├── plan.md            # /work-planning — the WP spec + ACs (the plan of record)
        ├── requirements.md    # /refine — sharpened goal, success, scope, guide draft
        ├── design/            # /design — brief, variants, comparison, synthesis, approved.md (UI only)
        ├── feasibility.md     # /architecture — feasibility findings + verdicts for the reviewer (only when something was load-bearing/new/unknown)
        ├── architecture.md    # /architecture — the technical plan (builder's executable target)
        ├── review.md          # /review — verdict, findings, AC table
        ├── retro.jsonl        # /retro — appended observations + cost signals
        └── progress.json      # run state: status, currentStep, critique scores
```

### `plan.md` — the plan of record; each phase writes its own document

`plan.md` is the work package's **spec** — seeded by `/work-planning` (the outcome, acceptance
criteria, validation scenarios) and the durable plan of record. Each later phase writes **its own
document** rather than folding into `plan.md`:

- `/refine` → `requirements.md` (sharpened goal, success, scope, guide draft)
- `/design` → `design/` (brief, variants, `approved.md`) — UI only
- `/architecture` → `architecture.md` (+ `feasibility.md` when a feasibility check was warranted)

Each phase **references `plan.md`** and **updates `plan.md` only if the overall plan changes**
(scope, acceptance criteria, intent). All downstream personas read these files; none may depend on a
warm producer session.

### Run state, approvals, scores

`progress.json` is the run-state file (not a document): `status`, `currentStep`, the founder
approvals (`approvals.requirements`, `approvals.concept`, `approvals.final`), and critique scores. Read it to resume
(skip if `status: done`; resume `in_progress` from `currentStep`); write it after **every**
status/step change. **NEVER** read or write another WP's folder.

### Per-track coordination — `.pipeline/<track>.md`

Cross-work-package coordination lives in a **per-track** file at `.pipeline/<track>.md` (one per
work track, e.g. `.pipeline/L.md`), not one global manifest. It holds that track's work-package
registry (id, title, type, complexity, status), the track's dependency graph, and any cross-track
references. A WP's track is its id prefix (`L30` → `.pipeline/L.md`). These files
are your **read-only** reference for spec pointers and the dependency graph.

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
| 1 | **pipeline-planner** | `{{models.design}}` | `refine` (if needed) | Write `requirements.md` — sharpen the goal, success, scope, guide draft; update `plan.md` only if scope/ACs shift. Runs when the goal is unclear or the WP introduces/reshapes a noun; otherwise confirm the seeded plan is sharp enough for human review. |
| 2 | **pipeline-reviewer** + **pipeline-planner** | `{{models.review}}` | `refine-critique` (if `refine` ran) → pipeline-planner revision loop | Score `requirements.md` before any human or design work — judge whether refine sharpened in the right direction against `plan.md`. CRITICAL/WARNING → planner revises `requirements.md` (**max 3 rounds**). |
| 3 | **orchestrator** (+ pipeline-planner for revisions) | — | Human requirement review — a gate, not a skill | **Mandatory — never skipped, never auto-approved.** Orchestrator posts the requirement summary in chat (see *Human review gates*). Founder approves `requirements.md` (value, success, scope, guide draft, AC alignment) against `plan.md`. Interactive → pipeline-planner revises to approval, sets `approvals.requirements` in `progress.json`. Autonomous / no founder → **park** (`status: awaiting-human-review`). No design or architecture may start until this lands. |
| 4 | **pipeline-planner** | `{{models.design}}` | `design` (if UI) → `architecture` | Design variant exploration (UI only) **then** the technical plan, produced together. Consumes the **approved** `requirements.md`. Design artifacts go under `.pipeline/work/<id>/design/`; then `architecture.md` (+ `feasibility.md` when warranted) with a **feasibility check** on the load-bearing / new / unknown parts only (web research + tiny manual POCs). The design is a **peer input** to architecture here — not yet human-approved; both are approved together at the Phase 6 concept gate. Update `plan.md` only if the plan changes. **Skip design if no UI / no design system.** |
| 5 | **pipeline-reviewer** + **pipeline-planner** | `{{models.review}}` | `design-critique` (if design ran) → `architecture-critique` → pipeline-planner revision loop | Independent evaluation of design + `architecture.md`. CRITICAL/WARNING findings → pipeline-planner revises, pipeline-reviewer re-critiques (**max 3 rounds**). |
| 6 | **orchestrator** (+ pipeline-planner for revisions) | — | Human concept review — a gate, not a skill | **Mandatory — never skipped, never auto-approved.** Orchestrator posts the concept summary. Founder reviews design + `architecture.md` together — for UI, the rendered variant via the `design` viewer (design owns it) + annotations. Interactive → pipeline-planner revises to approval, sets `approvals.concept` in `progress.json`. Autonomous / no founder → **park**. No build may start until this lands. |
| 7 | **pipeline-builder** | `{{models.build}}` | `write-tests` → `write-code` → doc check | TDD red then green. Doc check: if user-facing changes exist, apply `write-docs`; else justify the skip. Must pass `{{verify}}` before handing off. |
| 8 | **pipeline-reviewer** + **pipeline-builder** | `{{models.review}}` | `review` (+ `write-docs` rubric if docs changed) | Reviewer checks code against the approved `architecture.md` + `plan.md` ACs in `.pipeline/work/<id>/` (warm Phase 5 session reused if the host supports it), writes `review.md`. Positive + negative lenses + AC-completeness audit. Builder applies fixes. **Verdict DONE required** before proceeding. |
| 9 | fresh agent | low | `retro` | Fresh-context retro with cost signals. Appends to `.pipeline/work/<id>/retro.jsonl`. **Runs before ship.** |
| 10 | **orchestrator** (+ pipeline-builder for fixes) | — | Human final review — a gate, not a skill | **Mandatory — never skipped, never auto-approved.** Orchestrator posts the built-vs-planned summary. Founder confirms the built result against the requirement + architecture before ship. Interactive → approve, or send fixes back to build (Phase 7); sets `approvals.final` in `progress.json`. Autonomous / no founder → **park**. |
| ship | **pipeline-builder** | `{{models.build}}` | `ship` | Land the change: pass `{{verify}}`, open/ready the PR, wait for CI green. Not a tracked phase — the merge is proof of completion. |

**Producer / evaluator separation is the whole point.** The **pipeline-planner** produces; a *different*
agent, the **pipeline-reviewer**, evaluates. In Phase 8 the pipeline-reviewer checks the code against the approved
`architecture.md` (+ `plan.md` ACs) in `.pipeline/work/<id>/` — the same contract it critiqued in Phase 5. If the host keeps
the pipeline-reviewer's Phase 5 session warm, it already holds those decisions and saves a re-read; if not,
it reconstitutes them from the plan artifact. Same audit either way. The pipeline-reviewer's AC-completeness
audit reads a *live* change against the spec — never the pipeline-builder's notes about the change.

### Human review gates — the orchestrator summarizes, the human approves

The three human gates (Phases 3, 6, 10) are **not a skill** — a human review does no work of its own. It is the orchestrator **telling the human, in chat, what has been done, where it lives, and how to speak about it**, then the human approving or sending it back. No artifact, no bundled tool — chat prose only. Post a short, jargon-free summary, a few sentences each — an orientation, not a re-derivation:

- **Requirements & user value** — what the WP must deliver and who is better off.
- **What's being built, how it works, tech stack** — the mechanism in plain words, and where the artifacts live (`requirements.md`, `design/`, `architecture.md`).
- **Built vs planned** *(Phase 10)* — what actually shipped against the plan, with deltas called out.

Then run the gate:

- **Interactive (founder present)** → the founder responds; the relevant producer revises — pipeline-planner for `requirements.md` (Phase 3) / design + `architecture.md` (Phase 6), pipeline-builder for fixes back through build (Phase 10) — loop until the founder approves; set `approvals.requirements` / `approvals.concept` / `approvals.final` in `progress.json`. For a UI concept gate, the founder reviews the rendered variant via the **`design` viewer** (design owns the render + annotation loop).
- **Autonomous (no founder)** → **park**: `status: awaiting-human-review`, `currentStep: human-review-requirements` / `-concept` / `-final`. Never auto-approve; sibling work packages may proceed.

### Spawn discipline (tool-agnostic)

Spawn each persona as a **subagent in your host tool** — Claude Code agents, or
Cursor/Codex/Gemini/Copilot subagents. Continuity travels through `.pipeline/` state (the WP spec,
the plan artifact, progress), not through a live session — so a fresh pipeline-planner, pipeline-reviewer, or pipeline-builder
spawned at any phase reconstitutes from those files and produces the same result.

**Session reuse is an optimization, not a requirement.** Where the host supports it (warm sessions,
agent teams, message-an-existing-agent), keep the three personas alive across phases — the pipeline-reviewer
in Phase 8 reusing its Phase 5 session, the pipeline-builder carrying Phase 7 into Phase 8 fix-apply and
ship — to save context/cache-creation cost. Where it doesn't (no durable sessions, or subagents
that start cold with no parent context), re-spawn each phase; the plan artifact makes that correct,
just not free. Never gate the pipeline on session reuse being available. The retro agent is always
ephemeral.

### Loop rules

#### Failure-aware retry contract

Do not spend a retry until the failed cycle has been classified. Record the classification in the
handoff/chat context (no new state file):

- **Cause:** `transient` (provider/process interruption), `environment` (dependency, credential,
  service, or toolchain), `implementation` (code is wrong but the plan is sound), `plan-conflict`
  (a plan assumption is false), or `semantic-tool-failure` (the tool completed but its result is
  unusable).
- **Recurrence:** `new`, `exact-repeat` (same scoped failure and strategy), or `oscillation`
  (the run is alternating between already-failed states).

A retry is one complete diagnose/change/verify cycle for the same scoped failure, not each tool
call. Before retrying, state the evidence and why the next strategy is materially different.
`exact-repeat` and `oscillation` must change strategy; never replay the same action. Environment
failures get one safe repair attempt, otherwise block. A `plan-conflict` emits the existing builder
`BLOCKER` with the false assumption and evidence; this pipeline does not redesign it in flight.
Every scoped failure cycle retains a hard cap of **3 attempts**, regardless of cause, including
transient failures.

- **Refine critique loop (Phase 2):** if findings are CRITICAL/WARNING, send them to the pipeline-planner,
  who revises `requirements.md` and the pipeline-reviewer re-critiques. Repeat until the score clears the
  bar or **3 rounds** are reached. If it never clears: mark `blocked` with reason
  `concept-or-spec-misalignment` (the requirement may need another `/refine` pass, or the
  strategic frame may need upstream `/work-planning` work).
- **Human review gates (Phases 3, 6 & 10):** never skip, never auto-approve. These are orchestrator-run
  gates, not a skill (see *Human review gates*). Autonomous runs **park** — they do not proceed past the
  requirement gate (Phase 3), the concept gate (Phase 6, design + architecture), or the final review gate
  (Phase 10) without founder approval. On resume, the orchestrator re-posts the summary and continues from
  the parked `currentStep`.
- **Critique loop (Phase 5):** if findings are CRITICAL/WARNING, send them to the pipeline-planner,
  who revises and the pipeline-reviewer re-critiques. Repeat until the score clears the bar or **3 rounds**
  are reached. If it never clears after the cap: mark `blocked` with reason `concept-or-spec-misalignment`.
- **Review loop (Phase 8):** if the verdict is NOT DONE, send findings to the pipeline-builder, who
  classifies the failure, fixes with a materially different strategy, and re-runs `{{verify}}`;
  then re-review. **Max 3 attempts for the same scoped failure.**
- **Builder BLOCKER:** if the pipeline-builder hits a plan-vs-reality conflict, it raises a BLOCKER
  with the false assumption and evidence rather than redesigning in flight. Stop the affected build;
  planner re-entry is outside this retry contract. **Max 3 blocked cycles per WP.**
- **CI red after ship push:** pipeline-builder classifies the failure, fixes locally, and re-ships.
  **Max 3 attempts for the same scoped failure.**
- At the hard cap, mark the WP `blocked` with the relevant reason and move on.

### Long-running mechanical commands — start, overlap, join

Do not make the model poll a long command. Choose exactly one execution branch:

1. **Managed command:** start it with the host's recoverable process/session handle, freeze its
   command, cwd, and input files, do only independent work, then await that handle once at the
   dependency boundary.
2. **Managed subagent:** delegate the command plus frozen inputs to a worker when the host reliably
   reports completion; continue independent work and join the worker once.
3. **Foreground:** when neither managed mechanism exists, wait normally.

Never use bare shell detachment (`nohup`, trailing `&`) or repeated status polling. Do not mutate a
background job's inputs while it runs. A result that gates the next step, review, verify, or ship
must be joined and its exit status read before proceeding. Host support is an optimization: Codex
and some Claude surfaces expose managed sessions/subagents; other hosts may correctly fall back to
foreground execution.

### Ship runs AFTER retro and the final review

Land the change only after the retro (Phase 9) and the human final review (Phase 10) so the retro
output is part of the verified tree and the founder has signed off. Ship's **first step** writes
`.pipeline/work/<id>/progress.json` with `status: "done"`, `currentStep: "shipped"`, `completedAt`
set **and commits it**, so the PR itself shows the pipeline as done. The `ship` skill then owns the
full land sequence (sync base → `{{verify}}` → open/ready the PR via `{{vcs}}` → wait for CI green).
**Ship is the single gate: the WP is not done until ship confirms CI green.**

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
or `parked: awaiting human review`. For a batch, a one-line lead ("3 of 4 shipped; X
blocked on …; Y parked for human review") then the per-WP blocks. Do **not** report phase
numbers, persona names, critique scores, or review-round counts. Keep it scannable.

## Done when

- Every WP in the target has `status: done` (shipped, CI green) **or** `status: blocked` with a
  reason — and its `.pipeline/work/<id>/progress.json` reflects that.
- The final outcome summary has been emitted for the batch.
- You never touched a progress file outside your target.

## Discipline & skip rules

- **Never stop after planning.** Planning is only phases 1–6 of 10. It isn't done until the pipeline-builder makes
  it real and the pipeline-reviewer approves.
- **Never skip a human review gate.** Every work package parks for founder approval on requirements (Phase 3),
  on the design + architecture concept (Phase 6), and on the built result (Phase 10). "Routine" or
  "backend-only" is not a skip reason.
- After each WP, check elapsed time; if a session budget is exceeded (e.g. > 45 min), save
  progress and exit. If context degrades (compaction), finish the current WP and exit.
- **Skip design + design-critique** when: the WP has no UI surface (pure backend, schema, infra,
  concept-only), **or** `pipeline.config designSystem` is `null` — then design does not apply and the
  Phase 6 concept gate reviews architecture alone. Verify by reading the AC
  list: if no AC mentions a page, component, layout, route, or visible state, skip them. When in
  doubt and a design system exists, run `design` with `routine` classification — one variant is
  cheap and the brief doubles as documentation.

Watch the anti-rationalizations ("the plan is done, I can stop" / "this story is simple, skip the
review" / "the pipeline-reviewer is redundant, tests passed" / "the retro is navel-gazing") and hold
the **ordering rationale**: the pipeline-reviewer critiques (never the producer), and ship runs after
retro so the retro output is part of the verified tree. Read this before you talk yourself out of a
phase.

## After the pipeline: compound

The pipeline drives individual work packages. `/compound` operates *across* work packages — it
mines `.pipeline/work/*/retro.jsonl` for recurring patterns (3+ occurrences) and proposes surgical
fixes to skills or process. It is not part of the per-WP phase loop. Run it periodically after
several work packages have shipped, or on demand when friction feels systemic.
