# Per-phase dispatch script

How the orchestrator drives each persona. Spawn each persona as a subagent in your host tool
(Claude Code agents, or Cursor/Codex/Gemini/Copilot subagents). **Spawn once, message many**
where supported: give each a stable handle (`planner-<id>`, `reviewer-<id>`, `builder-<id>`),
then reuse the live session for every follow-up message instead of re-spawning. Re-spawning
re-pays context/cache-creation cost; avoid it where the host tool lets you reuse a session.

Update `currentStep` in `.pipeline/progress/<id>.json` before each persona dispatch.

---

## Phase 1 — planner (production)

Spawn the **planner** (`{{models.design}}`).

- Run `design`: classify routine vs. novel, generate variants. **Skip if no UI surface or
  `designSystem` is null.** Routine UI (existing component family, known layout) gets 1 variant
  plus a "did we consider X / Y / Z?" check; genuinely novel UI gets up to 3. New load-bearing
  primitives are always novel.
- Run `architecture`: interrogate the spec, draft the technical plan.

Do **not** let the planner exit — it may be needed in Phase 2 to apply critique fixes.

## Phase 2 — reviewer + planner (critique loop)

Spawn the **reviewer** (`{{models.review}}`) — a *different* agent reading the planner's output
cold. This is true producer/evaluator separation, not a mode switch on one agent.

- Run `design-critique` (score variants against the rubric). **Skip if no UI surface / no design
  system.**
- Run `architecture-critique` (score the plan against the rubric).

If the critique has CRITICAL or WARNING findings:

1. Send the findings to the **planner**, who revises the plan/design to address each one.
2. Send the revised plan back to the **reviewer** to re-critique.
3. Repeat until the score clears the bar **or 3 rounds are reached**.

The builder receives a single clean, approved plan — not a plan plus a separate critique doc.
Do **not** let the reviewer exit — it is reused in Phase 4.

## Phase 3 — builder (TDD)

Before coding, **sync the base**: pull the latest mainline and merge it in, resolving conflicts
now rather than letting a stale base accumulate drift.

Spawn the **builder** (`{{models.build}}`).

- Run `write-tests`: read the plan, write failing tests for **all** acceptance criteria. Do
  **not** write implementation code here — requirement definition must not be contaminated by
  implementation thinking.
- Send `write-code`: read the plan + failing tests, write the minimum code to pass. If the
  implementation changes behavior documented under `{{paths.docs}}`, update those doc sections in
  the same change (doc sync). Run `{{verify}}` — must pass before handing off. (For tight inner
  loops, a fast typecheck if the project defines one; the full `{{verify}}` is the gate.) If the
  builder hits a plan-vs-reality conflict, it raises a **BLOCKER** rather than redesigning in flight.
- **Doc check** (after `write-code`): the builder answers "Does this WP change what the user sees,
  reads, or does?" If **YES** (new feature, changed behavior, new primitive, new API surface),
  apply `write-docs` to write/update user-facing docs under `{{paths.docs}}`. If **NO**, record a
  one-line justification (e.g. `docs: no user-facing changes (<reason>)`). Skipping without
  justification is a review finding.

## Phase 4 — review

Reuse the **reviewer** session from Phase 2 (warm on design/architecture context).

- Run `review`: positive lenses (architecture, design, security) + negative lenses (adversarial,
  simplification, slop) + AC-completeness audit. The design lens is skipped silently if no UI files.
- If docs were written/updated in Phase 3, the reviewer also scores them against the `write-docs`
  rubric. If the doc check was NO, the reviewer verifies the skip justification is reasonable and
  flags user-facing changes that lack docs.
- Emits **DONE | NOT DONE** with an AC table + findings.

If **NOT DONE**: send the findings to the **builder**, who applies them, re-runs `{{verify}}`, and
hands back for re-review. **Max 3 attempts.** If **DONE**: proceed to Phase 5.

## Phase 5 — retro

Launch a fresh, ephemeral agent (low capability is fine) with `retro`. It writes the retro under
the WP's progress area with the cost signals the analysis/compounding step reads. **Must complete
before ship** so the retro output is in the verified tree.

## Ship (after retro — not a tracked phase)

Before dispatching ship, update `.pipeline/progress/<id>.json`: `status: "done"`,
`currentStep: "shipped"`, `completedAt` = now. This must land before the ship push.

Send `ship <id>` to the **builder**. The `ship` skill: syncs the mainline, runs `{{verify}}`,
opens/readies the PR via `{{vcs}}`, and **waits for CI green**. If CI is red, the builder fixes
and re-ships (**max 3 attempts**). Ship is not done until CI is green.
