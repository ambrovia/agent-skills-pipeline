# Implementation plan — introducing the measured priorities into the plugin

Sequencing note (2026-08-10): the wave order below is re-sorted by confidence in
`attack-order.md` (no-brainer → experimental). Wave contents remain valid; their order is
superseded there.

Date: 2026-08-10. Companion to `token-levers-and-trend-mapping.md` (evidence) and the revised
priorities in `summary-agentic-trends-aug-2026.md`. Scope: the agent-skills-pipeline plugin itself
(skills, personas, generated agents, hooks, config schema). Not a pipeline run — this repo ships
skills, so changes land as skill text + generator + config and are proven on pilot repos.

## Delivery vehicle map

Everything we ship is one of these surfaces; each wave below names which it touches:

- `skills/*/SKILL.md` — phase discipline (loaded when invoked)
- `agents/*.md` / `personas/*.md` — persona contracts, `capability` frontmatter
- `scripts/generate-agents.mjs` — per-harness agent emission (Claude/Codex/opencode/Cursor/Copilot/Gemini)
- `pipeline.config.example.yml` — the repo-specific config surface (profiles, rule slots)
- `.pipeline/work/<id>/progress.json` conventions — recorded state (verdicts, counts, transitions)
- `tools/session-lab/` — measurement harness (already built)
- MCP/host tool (proposed) — pipeline-state snapshot (work-groups item 4); new surface, vehicle open

## Governing principles (from the evidence, apply to every change)

1. **Short, mechanical rules beat prose.** HANDBOOK.md: long policy docs don't bind (best model
   36%). Every new behavior lands as a decidable rule + a place it is checked, never as an essay.
2. **Every mechanic gets an observable trigger and a removal path.** Harness assumptions rot per
   model generation. Nothing is always-on: profiles, gates, and artifacts are triggered by
   conditions named in config or plan, and each can be switched off without surgery.
3. **No-op test on every line we add.** If deleting an instruction line wouldn't change agent
   behavior, it stays deleted (Pocock writing-for-agents). Default move is deletion.
4. **Measure before/after with session-lab.** Baseline exists (916:1 typical input:output, 77% of
   trees >1000:1, round counts, fork counts, poll counts). Every wave defines which numbers must
   move and is piloted before it ships as default.
5. **Backward compatibility.** `standard` profile = today's behavior. Repos that upgrade and do
   nothing get no behavior change; new mechanics opt in via config/plan.

## Wave 1 — Round economics: program design + typed verdicts + round caps

Attacks the multiplier (rounds) and the program-quality problem together. Lowest risk: it changes
phase content, not the lifecycle shape.

Changes:
- **New `skills/program-design/`** (planner-facing): produces the shape-of-code artifact between
  architecture and build — call-stack trees for control-flow changes, file-tree diff with
  NEW/MODIFIED annotations, types and method signatures for key new functions. Template short;
  artifact line-budgeted. Trigger: standard/frontier profile AND non-trivial change shape;
  compact skips it by definition.
- **`skills/architecture/`**: ends by naming what program-design must settle (hands off decisions,
  not prose).
- **`skills/write-code/`**: builder must cite the program-design artifact; deviations require a
  recorded reason (one line in the commit/progress, not a phase return).
- **`skills/review/` + the three critique skills**: verdict vocabulary becomes
  `ok | soft_objection | hard_veto | escalation` with routing rules:
  - only `hard_veto` and blocking findings spawn retry rounds;
  - `soft_objection` is carried to the final approval gate, never triggers a round;
  - `escalation` routes to the approver; phases propose goal/contract changes, only the approval
    gate applies them (governor rule);
  - orchestrator may not upgrade a reviewer's non-blocking finding to blocking (retro-proven waste).
- **Round caps, mechanical**: three attempts per loop already exists in prose — make it a counted
  field in `progress.json` (evaluations completed, not sessions), adjudication rules unchanged.
- **Scope/ambition check at plan time** (C12): `work-planning` and `refine` gain one decidable
  question — does the solution's ambition match the engineering tier? Over-ambition is a planning
  defect, not a review-time discovery.
- `agents/pipeline-planner.md` / `pipeline-builder.md` / `pipeline-reviewer.md`: matching short
  contract lines; regenerate harness agents.

Pilot & proof: 2–3 standard nimmly WPs. Metrics: rounds per WP, tokens per round, share of
non-blocking findings that previously caused rounds; review verdicts must reference
program-design conformance.

## Wave 2 — Loop profiles with compact mode

Attacks the fork tax and polling for the majority of work chunks. This is the lifecycle-shape
change — introduced conservatively: maintainer-selected profiles first, assessment-assisted later,
never an autonomous router.

Changes:
- **Config**: `pipeline.config.yml` gains `profiles:` (default `standard`; per-WP override in
  `plan.md` frontmatter). Compact/standard/frontier defined by which phases and gates run:
  - **compact** — one agent, no forks: plan-light (the WP plan itself suffices) → build → verify →
    ship; one human gate (final); no critique phases, no separate orchestrator; review collapses
    into a self-check list + mechanical verify. For: docs, fixes, config, small refactors.
  - **standard** — today's lifecycle, plus Wave 1 mechanics.
  - **frontier** — standard + program-design mandatory + decorrelated review lenses (two reviewers,
    different information access, findings never merged) + parallel isolated leaves allowed.
- **`skills/pipeline/`**: profile selection at preflight with recorded reason; explicit
  escalation/de-escalation triggers (e.g., blast radius grows past plan → escalate with evidence;
  recorded in `progress.json`, never locked). Compact profile removes the orchestrator role
  entirely — the working agent runs the loop itself; this is also the polling fix for compact work.
- **Spawn discipline** (all profiles): spawn is a cost decision, encoded as the phase-boundary
  tree in cost order — continue in-thread → handoff artifact → fresh spawn — with the rule that a
  spawn must name why staying costs more. Targets fork tax and the 16,980 tiny-subagent pattern.
- **Polling rules** (standard/frontier): no busy-wait loops; batched status checks; hosts with
  event/wake semantics use them. Host-specific phrasing kept out of skills — the rule is
  host-agnostic ("never spend turns waiting"), harness agents get the host-specific note.

Pilot & proof: rerun a doc-audit WP (Z8-class) as compact and compare against its 6-phase
historical run (the 2.3× over-engineering retro is the baseline claim to beat). Metrics: threads
per WP, fork count, poll count, total input per WP, gate count.

## Wave 3 — Handoff briefs (cheap reconstitution)

Attacks context size per thread and the re-read tax. Deliberately small: a format convention, not
an event-log substrate.

Changes:
- Every producing phase appends a **handoff brief** section (≤ ~40 lines): decisions made, paths
  touched, open items, pointers to where details live. Consumers (next phase, retry rounds,
  cold spawns) read the brief first and open full artifacts only on disagreement or need.
- Skill read instructions updated accordingly (`pipeline`, `write-code`, `review`, critique
  skills): "read the brief; consult the artifact for the section you need" replaces implicit
  full-artifact re-reads.
- `architecture.md` gains a line budget with overflow pushed into linked reference files
  (progressive disclosure) — direct answer to the 260× re-read and the "architecture too long"
  founder intervention in L1.

Pilot & proof: measure artifact re-reads per WP (session-lab counts file reads by path) and
context-per-call on cold spawns, before/after.

## Wave 4 — Capability routing + eval harness

The dollar-side efficiency and the measurement loop that proves Waves 1–3.

Changes:
- **Capability routing**: personas already declare `capability: fast|high`. Resolve per harness
  and per WP assessment instead of statically: frontier judgment (planning, review) on strong
  models, explicit-plan execution on fast models; assessment block (difficulty, uncertainty,
  change shape, verification surface, blast radius) emitted by refine/planning and recorded in
  `progress.json`. Generator emits capability variants per harness where the host supports choice.
- **Eval harness**: 5–10 fixture WPs shaped like real work (one compact doc-fix, one standard
  feature, one frontier multi-leaf, one trap fixture that tempts over-engineering); runner
  executes them through the pipeline on a probe repo and captures, via session-lab: cost-per-WP,
  input:output ratio, rounds, forks, polls, rework rate, churn-vs-shipped. This becomes the
  standing answer to "did the change make the pipeline better?"

## Sequencing and rollout

1. Wave 1 → pilot → ship as default (low risk, no shape change).
2. Wave 2 → pilot compact on small WPs, standard on one feature WP → profiles opt-in via config;
   compact becomes default recommendation for S-sized WPs once pilot metrics hold.
3. Wave 3 alongside/after Wave 2 (brief format is profile-agnostic).
4. Wave 4 last: routing needs the assessment from Wave 2's pilot experience; eval harness fixtures
   should include one pre-change baseline run so improvements are comparable.

Each wave: version bump, changelog entry, migration note (what changes for installed repos —
nothing without opt-in), pilot report with session-lab numbers attached.

## Risks and mitigations

- **Instruction bloat in `pipeline/SKILL.md`** (already 187 lines): profile tables and spawn-tree
  rules live in linked reference files, SKILL.md keeps only the decidable rules.
- **Host divergence** (codex fork-spawn vs claude Task vs opencode subagents): skills stay
  host-agnostic; host-specific mechanics live in generated agent files and harness notes.
- **Compact mode weakening quality gates**: mechanical `verify` and one human gate are never
  removed; only critique/review machinery is collapsed, and escalation back to standard is a
  recorded transition, not a failure.
- **Assessment misrouting** (work classified compact that turns out frontier): escalation triggers
  with evidence are mandatory; de-escalation is allowed but recorded; early waves keep profile
  selection human.
- **Rot**: each wave's mechanics are listed with their trigger and removal path in the changelog,
  so a future model generation can retire them without archaeology.

## Explicitly not doing

- No runtime/orchestrator service; no graph engine; no event-log substrate (briefs first).
- No autonomous profile router; no model-specific prompt tuning.
- No parallel build waves outside frontier profile.
- Skill-leanness audit is hygiene folded into each wave's no-op pass, not a project.
