# Solution axes for the pipeline rework

Date: 2026-08-10. Status: reference document — the design space for improving flexibility, token
efficiency, and program quality, plus maintainer steering on each axis. Evidence base:
`token-levers-and-trend-mapping.md` (session-lab forensics) and `agentic-trends-aug-2026.md`
(trend research). Solutions are positioned as points in this space; the maintainer steers the
directions, plans derive from the steering.

## The axes

**A1 — Topology: one agent ←→ orchestra**
Today: full orchestra (orchestrator + planner/builder/reviewer spawns) for everything. Evidence
says the orchestra is the cost (fork tax + polling are ~70%+ of burn), but reviewer *freshness*
is what catches C1/C9 defects. The open question isn't "how many agents" but **which roles
actually require a fresh thread** — reviewers plausibly do; planner→builder continuity may not.

**A2 — Context strategy: inherited ←→ externalized**
Today: spawn inherits everything (codex fork) + artifacts on disk. Spectrum: full fork → minimal
fork + brief → cold start from brief → stay in-thread ("Continue" as default, Pocock's cost
order). Evidence: ≤5-call threads eat 53–83% of input; architecture.md re-read 260×. Both ends
cost something — inheritance re-pays, cold-start re-reads.

**A3 — Decision timing: decide during code ←→ decide before build ←→ decide before planning**
Today: structure decisions leak into build and review (L1 rounds 54–103, 70:1 churn). Options:
program-design artifact (before build), decision-ticket maps for big efforts (before planning,
wayfinder-style), design-it-twice for structural choices. Later decisions = rounds = the
multiplier.

**A4 — Proportionality: uniform lifecycle ←→ sized profiles ←→ continuous adaptation**
Today: uniform lifecycle, phase-skipping only. Z8's 2.3× and C12 say size must become
first-class. The axis question: discrete profiles (simple, auditable) vs. per-WP dial (flexible,
fuzzy) vs. mid-run adaptation (powerful, risky).

**A5 — Unit of work: monolithic WP ←→ vertical slices ←→ decision tickets**
Today: one WP = one pipeline run, however big (L1: 4.9 days, 104 spawns; AU21: 15 increments in
one session). Alternative: the WP is a *map*, execution happens in tracer-bullet slices sized to
one fresh context, each demoable and reviewed at 100–200 lines. This changes where rounds happen:
local to a slice, never global.

**A6 — Governance binding: prose discipline ←→ mechanical rules ←→ host enforcement**
Today: mostly prose + the `verify` gate. HANDBOOK says prose doesn't bind; C9 (skip-to-green ×9)
proves it. Spectrum: short checkable rules in skills → bundled check scripts → host hooks
(Claude/Gemini have them) → evidence-only gates. Also: human-attention gates vs evidence gates
(humans miss 1 in 3).

**A7 — Model economics: uniform frontier ←→ static personas ←→ routed per task**
Today: static persona capability. Dollars axis (not tokens): frontier judgment where ambiguity is
high, cheap execution of explicit plans (Cursor: −68% cost). Depends on A3 — cheap execution only
works when the plan is explicit.

## Idea catalog positioned on the axes

| # | Idea | Axes | What it attacks |
|---|---|---|---|
| 1 | Minimal-fork topology: one warm production thread per WP, cold forks only for reviewers | A1, A2 | fork tax without losing independent review |
| 2 | Tracer-bullet WPs: execution as vertical slices, each a compact one-context unit, reviewed per slice | A5, A4 | round locality, 70:1 churn, one-off code |
| 3 | Decision-ticket front for L-sized work: map of decision tickets, fog-of-war explicit, no build until frontier clears | A3, A5 | multi-increment monsters, C12 over-scoping |
| 4 | Token/round budget as a mechanical gate: plan declares a budget; breach = park-and-escalate | A6, A4 | death spirals (L1's founder-as-circuit-breaker) |
| 5 | Narrowing review rounds: round N+1 reviews only the delta of round N's fixes | A1, A6 | round cost growth |
| 6 | Two-axis one-round review: Standards + Spec lenses parallel, findings never merged | A6, A7 | round count, review blind spots |
| 7 | Program design as script-checkable contract: file-tree diff + signatures machine-readable, conformance by script | A3, A6 | makes pre-build decisions bind mechanically |
| 8 | Verify-in-build via host hooks: mechanical checks fire during build, review sees fewer defects | A6 | rounds, stranded-verify (C7) |
| 9 | Host-capability negotiation: skills pick the cheapest mechanic the host offers, with fallbacks | A1, A2, A7 | host divergence as feature, not caveat |
| 10 | Gate compression: fewer gates for small work; auto-generated plain-language gate briefs | A4, A6 | human time, rigidity |
| 11 | Self-authoring rules loop: confirmed retro/compound patterns graduate into short skill rules via approval | A6 | quality patterns the system already diagnosed |
| 12 | Escalation-only humans: humans see escalations and contract gates, everything below evidence-gated | A6, A4 | approval fatigue, gate count |
| 13 | Inverted economics: strong models review, fast models build — conditional on program-design existing | A7, A3 | dollars without quality regression |
| 14 | Slice-level churn metric in ship: churn-vs-shipped reported per WP | A5, A6 | makes 70:1 visible every run |

---

## Maintainer steering (2026-08-10)

### Positions on the axes

**A1 — reframed.** The orchestra is not what catches the cost. A single main agent doing the same
amount of work is *more* expensive — its context grows sequentially; a single agent wins only when
it needs fewer moves overall (then sequential is the better strategy). The real miss: **we don't
spawn players with empty context** — empty-context spawn + targeted injection is more efficient
even with more iterations. Also forgotten: **cached vs non-cached tokens change pricing a lot** —
designing for high cache-hit rates is itself a lever. Core of A1: **smart selection of parallel
vs sequential execution, and fresh agent vs context-full agent.** This is where Cursor's swarm
principles sit; overlaps Pocock's handoff doctrine.

**A2** — related to A1, agreed.

**A3 — reframed.** This is something we got wrong. Good teams don't always plan the same way: they
**plan progressively harder as things get bigger**, and planning effort grows significantly with
each level. Learn from how good software teams make agile decisions.

**A4** — related to A3; agreed: get rid of the rigid pipeline.

**A5** — probably right: as planning complexity grows we need **more levels of planning
artifacts**.

**A6** — direction accepted, mechanism open: codify some checks; architectural governance matters;
consider **proportionality hooks**, possibly other hook types.

**A7 — reframed.** Not primarily model economics but **judgement/iteration economics**: instead of
fixed iteration/review limits, **the level of care depends on ambiguity and scope** — like good
engineering teams: side/non-core changes waved through as LGTM, core changes and large-exposure
work get heavy scrutiny. Model economics still matter (where to use which model power), but model
differentiation is not easy to configure on the fly.

### Verdicts on the idea catalog

| # | Verdict |
|---|---|
| 1 | Rejected as stated — very long threads suffer **context rot**; forking costs more but rots less. One gigantic main thread is always an issue. |
| 2 | Interesting. |
| 3 | Yes — needed; the bigger the WP, the more should happen during refinement. |
| 4 | Interesting; unclear whether any harness exposes token usage to a system part — but interesting. |
| 5 | Yes — review must be adaptive (per A7); what's possible depends on harness capabilities; exciting. |
| 6 | Unsure. |
| 7 | Program design: liked. Script-checkable part: value unclear. |
| 8 | Needs explanation (see open questions). |
| 9 | Needs explanation (see open questions). |
| 10 | Unsure — question: can the harness/agent call compact on itself? |
| 11 | Needs explanation (see open questions). |
| 12 | That has always been the idea of agent-pipeline — but currently we handed off too much and it led to poor quality. Rebalance, don't extend autonomy. |
| 13 | Already how the pipeline works. |
| 14 | Worth doing as part of agent-skills design practice, not as a general skill shipped in the plugin. |

### On the original four levers

1. **Program design** — definitely good; open where to put it (new skill vs included in existing).
   Typed verdicts: partially exist already (GO/NO-GO-style verdicts); mechanical round caps exist.
   Ambition-vs-tier = part of the adaptive nature.
2. **Profiles** — open question: discrete profiles chosen up front vs **agile approach: start
   simple and add complexity as necessary**. Both have pros/cons; unsure whether the agile
   approach works with agents as well as with humans — **agents have the tendency to just run
   off** (needs countermeasures).
3. **Handoff** — the `.pipeline` files are exactly the handoff idea already. What's missing is
   **deltas**: iterations should only look at what changed since X, not re-read the full briefing.
4. **Measurement** — the gold standard. 1–3 evaluation tasks runnable repeatedly; but repeated
   human input gets biased, and pure agent self-work is not a realistic benchmark. Better:
   **compare codeburn/optimize-style metrics before and after plugin changes** — measurement as
   part of the plugin's own change process.

### Directions the maintainer adds (missing from the catalog)

- **D1 — Sequential-vs-parallel decision rule** (from A1): explicit thinking about when to go
  sequential vs not.
- **D2 — Empty-context spawn + guided reading list / active context injection** (from A1):
  introduce more fresh agents carrying less context, with a guided reading list or direct context
  injection — improves caching and cuts fork tax. For a fork, **invest more in the context
  injection strategy instead of just putting stuff on files that get passively re-read — inject
  actively**.
- **D3 — Adaptive iteration limits and review effort** (from A7): care level keyed to ambiguity
  and scope, not fixed caps.

## Emerging synthesis (from steering, 2026-08-10)

The steering reshapes the plan's center of gravity:

1. **Fork tax fix ≠ fewer forks.** It is **empty-context spawn + active, cache-aware context
   injection** (D2) plus a **sequential-vs-parallel decision rule** (D1). Freshness is a feature
   (against context rot); inheritance is the defect.
2. **Rigidity fix = progressive planning depth, not (only) discrete profiles** (A3/A4 unified):
   planning levels that grow superlinearly with WP size, agile-style — with explicit
   anti-run-off countermeasures for agents (gates/triggers between levels).
3. **Round fix = adaptive care** (D3): iteration and review effort scale with ambiguity, scope,
   and exposure — LGTM lane to heavy-scrutiny lane — instead of fixed caps; delta-based iteration
   (leverage 3 reframed) so rounds read what changed, not everything.
4. **Quality fix = earlier, deeper structure decisions** (A3) with more levels of planning
   artifacts as complexity grows (A5).
5. **Measurement = before/after on real runs** via codeburn/session-lab-style metrics as part of
   the plugin change process, not fixture self-evals with biased human input.
