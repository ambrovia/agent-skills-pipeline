# Work groups — pipeline rework

Date: 2026-08-10. Status: agreed grouping of surviving ideas, maintainer-steered
(see `solution-axes.md` for the axes and steering record, `token-levers-and-trend-mapping.md`
for evidence). This is the memory of what remains after steering — not yet an implementation
plan; open decisions at the bottom must be resolved first. Attack order (no-brainer →
experimental, by implementation phase) lives in `roadmap.md`.

## Group 0 — Measurement (runs alongside everything)

- Before/after comparison on real runs via codeburn/session-lab as part of the plugin's own
  change process. Baseline exists: ~916:1 typical input:output, fork-tax shares (53–83% of
  input in top runs), round counts, poll counts.
- No fixture evals with repeated human input (bias); no pure agent self-evals (unrealistic).

## Group 1 — Context mechanics (foundation, biggest lever)

1. **Empty-context spawn + active context injection** — fresh agents start empty with a guided
   reading list / injected brief instead of inheriting the parent conversation. Invest in the
   injection strategy rather than passive files. Cache-aware design: stable prefixes, injection
   ordered for cache hits (cached tokens change pricing a lot).
2. **Host capability tracking** — a setup/update skill that records what each host offers
   (empty spawn? wake events? hooks? compaction control?), so skills pick the cheapest
   available mechanic instead of the lowest common denominator.
3. **Sequential-vs-parallel decision rule** — explicit and cost-aware: parallel only for
   independent leaves with owned writes; sequential when context continuity saves moves. A
   single agent wins only when it needs fewer moves overall.
4. **Pipeline-state snapshot tool** — one tool call (MCP server or host tool) returning the
   WP's current state: phase, verdicts, open items, artifact pointers, next action. Replaces
   the 20–40 file reads an agent currently needs to get up to speed; target is 1 call + at most
   1–2 targeted reads. Serves cold spawns (item 1), retry rounds, and human gates alike.
5. **Artifact layout challenge** — explicitly question the `.pipeline/` file structure: the
   sprawl of many small files is what forces the read tax in the first place. Layout follows
   agent access patterns (snapshot-first, read-on-disagreement), not human document
   conventions. The snapshot tool (item 4) may make most of the sprawl irrelevant; decide with
   session-lab file-read evidence.

Order rationale: everything else rides on how agents start and what they carry; the fork tax
and the read tax are the biggest measured terms.

## Group 2 — Adaptive shape (the rigidity fix)

Adaptivity keys on two orthogonal axes — work size (orchestration complexity) and decision
complexity (ceremony complexity) — mapped against five archetypal journeys in `journeys.md`.

6. **Progressive planning depth** — start simple; planning effort grows superlinearly with
   size/ambiguity; more levels of planning artifacts as complexity grows; explicit anti-run-off
   gates between levels (agents have the tendency to just run off).
7. **Refinement scaling for large WPs** — the bigger the WP, the more happens during
   refinement: decision-ticket maps, fog-of-war, frontier clearing before build machinery starts.
8. **Program design** — one of the planning levels: shape-of-code (call stacks, file-tree diffs,
   signatures) decided before build. Open: new skill vs extension of architecture.
9. **Tracer-bullet slices** (candidate, not yet committed) — execution of large work as
   vertical slices, each reviewed per slice; rounds stay local to a slice.
10. **Probe — hypothesis-driven development** (from journeys gap G1) — a skill or phase, not a
    lane: hypothesis → cheapest experiment → verdict, producing decision records rather than
    code. Great teams get from the uncertain into the certain deliberately; that movement is the
    capability to encode. Budget-gated; exit when the decision is taken; POC promotion is an
    explicit decision, never drift.
11. **Procedure design** (from journeys gap G3) — the repeatable counterpart of program design:
    purpose, reference implementation (first successful application), per-unit steps, per-unit
    acceptance criteria, exception rules (when to escalate instead of apply). Becomes the
    injection payload for empty-context repetition armies (item 1); repetition conformance is
    mechanically checkable even where one-shot design is not.
12. **Journey navigation as a matrix, not labels** (from journeys gap G2) — adaptivity is not a
    classification into five (or N) journey labels up front; it is a matrix/graph of decisions
    taken along the way, because how complex or hard something gets is often not knowable
    upfront. Position shifts as evidence arrives; transitions are decisions, not detections.

## Group 3 — Adaptive care (judgement/iteration economics)

Care lanes and iteration effort vary by journey (see `journeys.md`): LGTM-lane for bug-swarms and
refactor repetitions, heavy scrutiny for architectural decisions, an exploratory lane for POCs.

13. **Care lanes** — review/iteration effort keyed to ambiguity, scope, and exposure:
    LGTM-lane for peripheral work, heavy scrutiny for core/high-exposure changes. Replaces fixed
    iteration/review limits.
14. **Delta-based iteration** — rounds and phase re-entries read what changed since X, never the
    full briefing again. The `.pipeline` handoff files (the existing handoff substrate) gain
    delta tracking.
15. **Typed verdicts extension** — add the carry-forward middle class: soft objections surface
    at the final gate and spawn no round; orchestrator may not upgrade non-blockers to blockers.
16. **Budget gate (feasibility-gated)** — park-and-escalate on runaway spend, if harnesses
    expose token usage to a system part. Investigate feasibility per host first.
17. **Loop continuity (durable agents within iterations)** — intended design: one builder and
    one reviewer persist across the rounds of a single loop; observed reality: every round
    re-spawns both sides, and one WP can rack up 20+ individual agents. Rule: freshness at
    phase boundaries, continuity within loops. Where a host cannot keep agents alive, round
    N+1 starts from round N's delta (item 14), not a cold reconstitution. Mechanical cap on
    agents per loop; count tracked in session-lab.

## Group 4 — Governance & setup

18. **Verify-in-build hooks as a setup concern** — repo-specific long-running checks wired via
    host hooks where supported (agents keep polling long scripts today); also the home of
    proportionality hooks.
19. **Human-gate rebalance** — keep humans at contract/escalation gates (the original
    agent-pipeline idea), but tighten what has been delegated since quality suffered; gates get
    plain-language briefs so approval costs seconds, not reading sessions.
20. **Pre-spawn check runs** (hook category, kin to item 18) — the mechanical checks a spawned
    agent needs (lint, typecheck, tests, build) run *before* it spawns; results are injected
    into its starting context. A reviewer judges results instead of calling lint itself.
    Removes redundant per-agent check runs, guarantees verdicts rest on identical fresh
    evidence, and pairs with item 4 (results become part of the state snapshot).

## Dropped / deferred

- One-warm-thread topology — rejected: long threads suffer context rot; freshness is a feature,
  inheritance is the defect.
- Two-axis one-round review — unsure, deferred.
- Self-authoring rules automation — keep the current manual compound process; automation not
  worth it yet.
- Inverted model economics — already how the pipeline works.
- Model routing configuration — model differentiation not easy to configure on the fly; deferred.
- Churn metric as a shipped skill — internal design practice instead, not plugin surface.

## Open decisions (before this becomes an implementation plan)

1. Program-design placement: new skill vs extension of `architecture`.
2. Discrete planning levels vs continuous dial — and what the anti-run-off mechanism concretely
   is (gates/triggers between levels).
3. Budget-gate feasibility: which harnesses expose token usage to a system part.
4. Empty-context spawn support per host: Claude subagents already start empty; codex fork mode
   configurable (verify minimal/no-fork behavior); opencode/others to check.
5. **Skill architecture for the Group 2 additions**: probe, procedure design, program design,
   journey navigation — which are individual skills, which are phases inside existing skills,
   which are artifact formats only? How do they fall together (one planning family vs separate
   tools)? Unresolved by design — to be figured out during implementation planning.
6. Journey navigation scope: own work package or folded into the existing Group 2 items
   (progressive planning depth / refinement scaling)? Open.
7. Snapshot tool vehicle: MCP server vs host tool vs generated script; and whether `.pipeline`
   state stays file-backed with the snapshot as a view, or the layout itself changes (item 5).
