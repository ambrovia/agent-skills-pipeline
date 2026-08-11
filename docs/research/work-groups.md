# Work groups — pipeline rework

Date: 2026-08-10. Status: agreed grouping of surviving ideas, maintainer-steered
(see `solution-axes.md` for the axes and steering record, `token-levers-and-trend-mapping.md`
for evidence). This is the memory of what remains after steering — not yet an implementation
plan; open decisions at the bottom must be resolved first.

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

Order rationale: everything else rides on how agents start and what they carry; the fork tax is
the biggest measured term.

## Group 2 — Adaptive shape (the rigidity fix)

Adaptivity keys on two orthogonal axes — work size (orchestration complexity) and decision
complexity (ceremony complexity) — mapped against five archetypal journeys in `journeys.md`.

4. **Progressive planning depth** — start simple; planning effort grows superlinearly with
   size/ambiguity; more levels of planning artifacts as complexity grows; explicit anti-run-off
   gates between levels (agents have the tendency to just run off).
5. **Refinement scaling for large WPs** — the bigger the WP, the more happens during
   refinement: decision-ticket maps, fog-of-war, frontier clearing before build machinery starts.
6. **Program design** — one of the planning levels: shape-of-code (call stacks, file-tree diffs,
   signatures) decided before build. Open: new skill vs extension of architecture.
7. **Tracer-bullet slices** (candidate, not yet committed) — execution of large work as
   vertical slices, each reviewed per slice; rounds stay local to a slice.
8. **Probe — hypothesis-driven development** (from journeys gap G1) — a skill or phase, not a
   lane: hypothesis → cheapest experiment → verdict, producing decision records rather than
   code. Great teams get from the uncertain into the certain deliberately; that movement is the
   capability to encode. Budget-gated; exit when the decision is taken; POC promotion is an
   explicit decision, never drift.
9. **Procedure design** (from journeys gap G3) — the repeatable counterpart of program design:
   purpose, reference implementation (first successful application), per-unit steps, per-unit
   acceptance criteria, exception rules (when to escalate instead of apply). Becomes the
   injection payload for empty-context repetition armies (item 1); repetition conformance is
   mechanically checkable even where one-shot design is not.
10. **Journey navigation as a matrix, not labels** (from journeys gap G2) — adaptivity is not a
    classification into five (or N) journey labels up front; it is a matrix/graph of decisions
    taken along the way, because how complex or hard something gets is often not knowable
    upfront. Position shifts as evidence arrives; transitions are decisions, not detections.

## Group 3 — Adaptive care (judgement/iteration economics)

Care lanes and iteration effort vary by journey (see `journeys.md`): LGTM-lane for bug-swarms and
refactor repetitions, heavy scrutiny for architectural decisions, an exploratory lane for POCs.

11. **Care lanes** — review/iteration effort keyed to ambiguity, scope, and exposure:
   LGTM-lane for peripheral work, heavy scrutiny for core/high-exposure changes. Replaces fixed
   iteration/review limits.
12. **Delta-based iteration** — rounds and phase re-entries read what changed since X, never the
    full briefing again. The `.pipeline` handoff files (the existing handoff substrate) gain
    delta tracking.
13. **Typed verdicts extension** — add the carry-forward middle class: soft objections surface
    at the final gate and spawn no round; orchestrator may not upgrade non-blockers to blockers.
14. **Budget gate (feasibility-gated)** — park-and-escalate on runaway spend, if harnesses
    expose token usage to a system part. Investigate feasibility per host first.

## Group 4 — Governance & setup

15. **Verify-in-build hooks as a setup concern** — repo-specific long-running checks wired via
    host hooks where supported (agents keep polling long scripts today); also the home of
    proportionality hooks.
16. **Human-gate rebalance** — keep humans at contract/escalation gates (the original
    agent-pipeline idea), but tighten what has been delegated since quality suffered; gates get
    plain-language briefs so approval costs seconds, not reading sessions.

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
