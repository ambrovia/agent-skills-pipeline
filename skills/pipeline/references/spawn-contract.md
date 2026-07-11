# Per-phase dispatch script

How the orchestrator drives each persona. Spawn each persona as a subagent in your host tool
(Claude Code agents, or Cursor/Codex/Gemini/Copilot subagents). Continuity lives in `.pipeline/`
state — the per-track coordination file (`.pipeline/<track>.md`), the plan of record
(`.pipeline/work/<id>/plan.md`) plus the per-phase docs (`requirements.md`, `design/`,
`architecture.md`, `feasibility.md`), and progress (`.pipeline/work/<id>/progress.json`) — so every phase
works whether the persona is the same warm session or a cold re-spawn.

**Where the host supports session reuse** (warm sessions, agent teams, message-an-existing-agent),
give each persona a stable handle (`pipeline-planner-<id>`, `pipeline-reviewer-<id>`, `pipeline-builder-<id>`) and reuse the
live session for follow-ups to save context/cache-creation cost. **Where it doesn't**, re-spawn
each phase and let the persona read its inputs from `.pipeline/`. Never gate a phase on reuse.

Update `currentStep` in `.pipeline/work/<id>/progress.json` before each persona dispatch.

**Ordering:** requirement → human approval → design (if UI) → human design approval → architecture
(with feasibility probes) → agent critiques → build.

---

## Phase 1a — pipeline-planner (refine)

Spawn the **pipeline-planner** (`{{models.design}}`).

- Run `refine` when the WP goal is unclear or it introduces/reshapes a noun. It writes
  `.pipeline/work/<id>/requirements.md`.
- When refine is skipped, ensure `.pipeline/work/<id>/requirements.md`
  exists (consolidate from the plan's `## Work package` section + `{{paths.docs}}`) so the human
  gate has an artifact to review.

## Phase 2a — pipeline-reviewer + pipeline-planner (refine critique)

Spawn the **pipeline-reviewer** (`{{models.review}}`).

- Run `refine-critique` when refine ran. Skip when refine did not run and requirements were
  consolidated unchanged from locked docs.
- CRITICAL/WARNING → pipeline-planner revises `.pipeline/work/<id>/requirements.md`
  → re-critique (**max 3 rounds**).

## Phase 2.5a — human-concept-review (requirements) — MANDATORY

- Run `human-concept-review` **pass: requirements**. Founder approves
  `.pipeline/work/<id>/requirements.md`.
- Interactive → planner revises to approval; set `approvals.requirements` in
  `.pipeline/work/<id>/progress.json`.
- Autonomous → **park** (`awaiting-human-concept-review`, `currentStep: human-concept-review-requirements`).
- **Do not dispatch design or architecture until this pass completes.**

## Phase 1b — pipeline-planner (design)

Spawn the **pipeline-planner** (`{{models.design}}`).

- Run `design`: classify routine vs. novel, generate variants. **Skip if no UI surface or
  `designSystem` is null.** Consumes the **approved** `.pipeline/work/<id>/requirements.md`;
  artifacts go under `.pipeline/work/<id>/design/` (incl. `approved.md`).
- Routine UI gets 1 variant plus a "did we consider X / Y / Z?" check; novel UI gets up to 3.

## Phase 2.5b — human-concept-review (design) — MANDATORY when UI

- Run `human-concept-review` **pass: design**. Founder reviews rendered variant + guide draft.
- Launches component viewer (idempotent). Autonomous → park (`human-concept-review-design`).
- **Skip only when Phase 1b design was skipped.**

## Phase 1c — pipeline-planner (architecture)

Spawn the **pipeline-planner** (`{{models.design}}`).

- Run `architecture`: interrogate the spec, run **feasibility probes** (web research + mini POCs
  under `.pipeline/work/<id>/probes/`), and **write** `.pipeline/work/<id>/architecture.md` +
  `.pipeline/work/<id>/feasibility.md` (raw evidence under `.pipeline/work/<id>/probes/`). Consumes
  `.pipeline/work/<id>/plan.md` + the approved `.pipeline/work/<id>/requirements.md` +
  `.pipeline/work/<id>/design/approved.md` (when UI).

Keep the pipeline-planner warm for Phase 2b's critique fixes if the host supports it.

## Phase 2b — pipeline-reviewer + pipeline-planner (critique loop)

Spawn the **pipeline-reviewer** (`{{models.review}}`) — a *different* agent reading the pipeline-planner's output
cold.

- Run `design-critique` (score variants). **Skip if no UI surface / no design system.**
- Run `architecture-critique` (score the plan — includes feasibility probe audit).

If the critique has CRITICAL or WARNING findings:

1. Send the findings to the **pipeline-planner**, who revises the plan/design to address each one.
2. Send the revised plan back to the **pipeline-reviewer** to re-critique.
3. Repeat until the score clears the bar **or 3 rounds are reached**.

The pipeline-planner keeps `.pipeline/work/<id>/architecture.md` current through the critique loop.

## Phase 3 — pipeline-builder (TDD)

Before coding, **sync the base**: pull the latest mainline and merge it in, resolving conflicts
now rather than letting a stale base accumulate drift.

Spawn the **pipeline-builder** (`{{models.build}}`).

- Run `write-tests`: read `.pipeline/work/<id>/architecture.md` + `.pipeline/work/<id>/plan.md` ACs, write failing tests for **all** acceptance criteria. Do
  **not** write implementation code here — requirement definition must not be contaminated by
  implementation thinking.
- Send `write-code`: read `.pipeline/work/<id>/architecture.md` + failing tests, write the minimum code to pass. If the
  implementation changes behavior documented under `{{paths.docs}}`, update those doc sections in
  the same change (doc sync). Run `{{verify}}` — must pass before handing off. (For tight inner
  loops, a fast typecheck if the project defines one; the full `{{verify}}` is the gate.) If the
  pipeline-builder hits a plan-vs-reality conflict, it raises a **BLOCKER** rather than redesigning in flight.
- **Doc check** (after `write-code`): the pipeline-builder answers "Does this WP change what the user sees,
  reads, or does?" If **YES** (new feature, changed behavior, new primitive, new API surface),
  apply `write-docs` to write/update user-facing docs under `{{paths.docs}}`. If **NO**, record a
  one-line justification (e.g. `docs: no user-facing changes (<reason>)`). Skipping without
  justification is a review finding.

## Phase 4 — review

The pipeline-reviewer reads `.pipeline/work/<id>/plan.md` ACs + `.pipeline/work/<id>/architecture.md` and the live diff,
and checks one against the other.

- Run `review`: positive lenses (architecture, design, security) + negative lenses (adversarial,
  simplification, slop) + AC-completeness audit. The design lens is skipped silently if no UI files.
  It **writes** its findings, AC table, and verdict to `.pipeline/work/<id>/review.md` and records
  the verdict + finding counts to `.pipeline/work/<id>/progress.json`.
- If docs were written/updated in Phase 3, the pipeline-reviewer also scores them against the `write-docs`
  rubric. If the doc check was NO, the pipeline-reviewer verifies the skip justification is reasonable and
  flags user-facing changes that lack docs.
- Emits **DONE | NOT DONE** with an AC table + findings.

If **NOT DONE**: send the findings to the **pipeline-builder**, who applies them, re-runs `{{verify}}`, and
hands back for re-review. **Max 3 attempts.** If **DONE**: proceed to Phase 5.

## Phase 5 — retro

Launch a fresh, ephemeral agent (low capability is fine) with `retro`. It appends observations to
`.pipeline/work/<id>/retro.jsonl` with the cost signals the analysis/compounding step reads. **Must complete
before ship** so the retro output is in the verified tree.

## Ship (after retro — not a tracked phase)

Before dispatching ship, update `.pipeline/work/<id>/progress.json`: `status: "done"`,
`currentStep: "shipped"`, `completedAt` = now. This must land before the ship push.

Send `ship <id>` to the **pipeline-builder**. The `ship` skill: syncs the mainline, runs `{{verify}}`,
opens/readies the PR via `{{vcs}}`, and **waits for CI green**. If CI is red, the pipeline-builder fixes
and re-ships (**max 3 attempts**). Ship is not done until CI is green.
