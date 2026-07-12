# Per-phase dispatch script

How the orchestrator drives each persona. Spawn each persona as a subagent in your host tool
(Claude Code agents, or Cursor/Codex/Gemini/Copilot subagents). Continuity lives in `.pipeline/`
state — the per-track coordination file (`.pipeline/<track>.md`), the plan of record
(`.pipeline/work/<id>/plan.md`) plus the per-phase docs (`requirements.md`, `design/`,
`architecture.md`), and progress (`.pipeline/work/<id>/progress.json`) — so every phase
works whether the persona is the same warm session or a cold re-spawn.

**Where the host supports session reuse** (warm sessions, agent teams, message-an-existing-agent),
give each persona a stable handle (`pipeline-planner-<id>`, `pipeline-reviewer-<id>`, `pipeline-builder-<id>`) and reuse the
live session for follow-ups to save context/cache-creation cost. **Where it doesn't**, re-spawn
each phase and let the persona read its inputs from `.pipeline/`. Never gate a phase on reuse.

Update `currentStep` in `.pipeline/work/<id>/progress.json` before each persona dispatch.

---

## Phase 1 — pipeline-planner (production)

Spawn the **pipeline-planner** (`{{models.design}}`).

- Run `refine` when the WP goal is unclear or it introduces/reshapes a noun — it writes
  `.pipeline/work/<id>/requirements.md`. When refine is skipped, ensure that file exists
  (consolidate from the plan's `## Work package` section + `{{paths.docs}}`) so downstream phases
  have a requirement to read.
- Run `design`: classify routine vs. novel, generate variants. **Skip if no UI surface or
  `designSystem` is null.** Consumes `.pipeline/work/<id>/requirements.md`; artifacts go under
  `.pipeline/work/<id>/design/` (incl. `approved.md`). Routine UI (existing component family, known
  layout) gets 1 variant plus a "did we consider X / Y / Z?" check; genuinely novel UI gets up to 3.
  New load-bearing primitives are always novel.
- Run `architecture`: interrogate the spec and **write** `.pipeline/work/<id>/architecture.md`.
  Consumes `.pipeline/work/<id>/plan.md` + `.pipeline/work/<id>/requirements.md` +
  `.pipeline/work/<id>/design/approved.md` (when UI).

Keep the pipeline-planner warm for Phase 2's critique fixes if the host supports it; otherwise it re-enters
Phase 2 by reading the WP spec and the current docs from `.pipeline/work/<id>/`.

## Phase 2 — pipeline-reviewer + pipeline-planner (critique loop)

Spawn the **pipeline-reviewer** (`{{models.review}}`) — a *different* agent reading the pipeline-planner's output
cold. This is true producer/evaluator separation, not a mode switch on one agent.

- Run `refine-critique` when refine ran (score the goal + guide draft against the rubric).
- Run `design-critique` (score variants against the rubric). **Skip if no UI surface / no design
  system.**
- Run `architecture-critique` (score the plan against the rubric).

If the critique has CRITICAL or WARNING findings:

1. Send the findings to the **pipeline-planner**, who revises the plan/design to address each one.
2. Send the revised plan back to the **pipeline-reviewer** to re-critique.
3. Repeat until the score clears the bar **or 3 rounds are reached**.

The pipeline-planner keeps `.pipeline/work/<id>/architecture.md` current through the critique loop; when
the critique clears, the pipeline-builder receives a single clean, approved plan. Keep the
pipeline-reviewer warm for Phase 4 if the host supports it; otherwise it re-reviews cold against
`.pipeline/work/<id>/`.

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
