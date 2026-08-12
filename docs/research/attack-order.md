# Attack order — confidence-based implementation phases

Date: 2026-08-10. Status: proposal — tier placements await maintainer confirmation.

The thematic groups (`work-groups.md`) stay as the memory of ideas. This document orders the
attack on a spectrum from **no-brainer to experimental**: ship the clear wins first; each
phase's measurement (Group 0, session-lab before/after) buys the right to the next phase.

## Phase 1 — No-brainers (measured waste, obvious fix, low risk)

| # | Idea | Why it's a no-brainer |
|---|---|---|
| 1 | Empty-context spawn + active injection | Fork tax is the biggest measured term (53–83% of input in top runs) |
| 4 | Pipeline-state snapshot tool | 20–40 reads → 1 call; felt on every run |
| 14 | Delta-based iteration | Full-brief re-reads measured (260× re-read in L1) |
| 15 | Typed verdicts extension | Retro-proven waste: soft findings spawning rounds, orchestrator upgrades |
| 17 | Loop continuity | Agents-per-loop is 2 by design, observed 20+ |
| 18 | Verify-in-build hooks | 34,002 polling calls measured fleet-wide |
| 20 | Pre-spawn check runs | A reviewer calling lint itself is pure duplication |

Enabler pulled forward: **2 (host capability tracking, minimal inventory)** — items 1, 17, 18,
20 all depend on what each host offers (empty spawn, persistence, hooks); recording that once
is cheap and prevents lowest-common-denominator design.

Natural clusters inside Phase 1:
- **Cheap state access**: 4 + 14 + 17 (+ 20's injected results) — one theme, one build.
- **Mechanical floor**: 18 + 20 + 15 — checks and verdicts run/ruled mechanically.
- **Spawn discipline**: 1 + 2 — how agents start and what they carry.

Exit evidence: fork-tax share, reads-to-get-up-to-speed, agents-per-loop, poll counts, rounds
spawned by non-blocking findings — all must move on 2–3 pilot WPs.

## Phase 2 — Clear value, design open (direction proven, mechanism needs design)

| # | Idea | What's open |
|---|---|---|
| 3 | Sequential-vs-parallel rule | The decidable rule itself |
| 6 | Progressive planning depth | Levels vs dial; anti-run-off gates |
| 8 | Program design | Placement: new skill vs architecture extension |
| 13 | Care lanes | Lane assignment mechanism |
| 16 | Budget gate | Per-host feasibility investigation first |
| 19 | Human-gate rebalance | Which delegations to tighten |

(2 lands here with its full scope if only the minimal inventory was pulled into Phase 1.)

## Phase 3 — Promising, needs piloting (evidence suggests, unproven in the pipeline)

| # | Idea | Evidence base |
|---|---|---|
| 7 | Refinement scaling for large WPs | AU20/AU26 fog-of-war post-mortems |
| 9 | Tracer-bullet slices | Candidate idea, not yet committed |
| 10 | Probe (hypothesis-driven) | Strong value case (uncertain → certain), new to the pipeline |
| 11 | Procedure design | J4 shape ran badly in AU26/AU28; new artifact type |

## Phase 4 — Experimental (could reshape, could fizzle)

| # | Idea | Character |
|---|---|---|
| 5 | Artifact layout challenge | Investigation first; may invalidate itself. Cheap to test with session-lab file-read evidence — could move up |
| 12 | Journey navigation matrix | Most conceptual; depends on how much journey-keying Phases 2–3 already deliver |

## Relation to the earlier wave plan

`implementation-plan-aug-2026.md` (Waves 1–4) is re-sorted, not discarded: Wave 1 splits
(15 → Phase 1, 8 → Phase 2); Wave 2's spawn discipline and Wave 3's briefs fold into Phase 1's
cheap-state-access cluster; Wave 4's eval harness is Group 0 and runs throughout.

## Placements least certain (flagged for maintainer)

- **13 care lanes** — could argue Phase 1 (the 2.3× over-engineering retro is hard evidence).
- **10 probe** — maintainer enthusiasm argues for earlier; kept in Phase 3 because it is new machinery.
- **5 artifact layout** — cheap investigation could move it ahead of expensive builds.
