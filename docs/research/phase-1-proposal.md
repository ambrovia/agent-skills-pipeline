# Phase 1 proposal — concrete changes to skills, agents, hooks

Date: 2026-08-10. Status: **proposal, awaiting maintainer approval.** Implements the Phase 1
no-brainers from `roadmap.md` (ideas 1, 2, 4, 14, 15, 17, 18, 20) against the current tree.
Organized by build cluster; each item names the exact files that change and what changes in them.

Design stance: file-backed `.pipeline/` state stays; the snapshot is a view over it (open
decision 7 resolved for Phase 1 — the layout challenge, idea 5, stays in Phase 4). Every change
is host-neutral or degrades gracefully where a host lacks the capability (idea 2's inventory
decides which mechanic to use, never the lowest common denominator).

## Cluster A — Spawn discipline (ideas 1 + 2)

### A1. Spawn-brief contract (idea 1: empty-context spawn + active injection)

**`skills/pipeline/SKILL.md`** — §"Spawn and scheduling" gains a spawn-brief protocol:

- Every persona spawn gets a brief and nothing else: WP id, phase, role, the exact artifact
  reading list (paths, not prose), the output contract, and — for retries — the delta pointer.
  No conversation history, no re-narration of prior rounds, no pasted findings beyond the ones
  the spawned agent must act on.
- Briefs are ordered for prefix-cache hits: stable content first (persona, role rules, reading
  list), per-round content last (delta, retry findings).
- The orchestrator never mode-switches and never "summarizes the session so far" into a spawn —
  the brief + `.pipeline/` state is the whole inheritance.

**`personas/pipeline-{builder,planner,reviewer}.md`** (regenerated into `agents/`,
`agents-cursor/`, `.opencode/agents/` via `scripts/generate-agents.mjs`) — each persona gains
one paragraph: you start empty by design; your context is the brief plus the reading list; do
not reconstruct or ask for history that is not in the artifacts.

### A2. Host capability inventory, minimal (idea 2)

**New `docs/host-capabilities.md`** — a checked-in matrix: claude / codex / cursor / gemini /
copilot / opencode × {empty spawn, warm-session reuse, hook events, spawn-time context
injection, token-usage exposure}. Seeded from evidence already in tree (Claude subagents start
empty; Codex SessionStart stdout is broken per the `@lore` in `hooks/session-start.sh`; codex
fork mode configurable).

**`skills/pipeline/SKILL.md`** — one rule: where mechanics differ by host, pick the cheapest
mechanic the host supports per the inventory; record a missing capability as a gap, don't
downgrade all hosts to it.

**`skills/setup/SKILL.md`** — setup confirms/updates the inventory for the hosts the repo
actually uses (this is the Phase 1 seed of the full idea 2, which lands in Phase 2).

## Cluster B — Cheap state access (ideas 4 + 14 + 17)

### B1. Pipeline-state snapshot tool (idea 4)

**New `scripts/pipeline-snapshot.mjs`** — dependency-free node script, host-neutral (every host
can run it via shell). Given a WP id (or auto-discovering the single active WP under
`.pipeline/work/`), it reads `progress.json`, `plan.md`, `review.md` verdicts, and artifact
presence, and prints one compact digest:

- WP title, tier, phase, status;
- verdicts per completed evaluation (phase, attempt, verdict);
- open blocking items and parked states;
- artifact pointers (path + one-line role) — pointers, not contents;
- delta pointer (last task commit / last state mutation);
- next action.

Target stays as defined in `work-groups.md`: 1 call + at most 1–2 targeted reads to be up to
speed. Shipped via `package.json` `files`.

**`skills/pipeline/SKILL.md`** — the orchestrator runs the snapshot at run start and before
every dispatch, and injects the digest into the spawn brief (A1). Phase re-entry after parking
starts from the snapshot, not a folder scan.

**Phase skills (`refine`, `architecture`, `review`, `ship`, …)** — one shared line each: start
from the injected snapshot digest; open only the artifacts you must read to do your phase or
that the digest flags as disputed. No preventive full-folder reads.

**New `tests/pipeline-snapshot.test.mjs`** — fixture `.pipeline/work/<id>/` tree; asserts digest
content, auto-discovery, and behavior with missing artifacts.

### B2. Delta-based iteration (idea 14)

**`progress.json` schema** (documented in `skills/pipeline/SKILL.md` §"Authority and state")
gains delta tracking:

- every phase/round entry records `since` — the commit sha or artifact hash the round started
  from;
- every artifact write advances the WP's delta pointer.

**`skills/pipeline/SKILL.md`** — retry and re-entry rule: rounds and phase re-entries read what
changed since `since`, never the full briefing again. A retry brief carries only the blocking
findings plus the delta.

**`skills/review/SKILL.md`** — on a retry evaluation the reviewer reads the previous `review.md`
plus the diff since it, rather than re-deriving the whole change from scratch; unchanged PASS
entries carry over with a re-check only where the delta touches them.

### B3. Loop continuity (idea 17)

**`skills/pipeline/SKILL.md`** — §"Spawn and scheduling" codifies the rule:

- **Freshness at phase boundaries, continuity within loops.** Within one review loop, reuse the
  same builder session across its retry rounds and the same reviewer across its evaluations,
  where the host keeps warm sessions. Freshness applies *between* phases, not between rounds.
- Where the host cannot keep an agent alive, round N+1 starts from round N's delta (B2) — not a
  cold reconstitution of the whole loop.
- **Mechanical cap:** `progress.json` counts spawned agents per loop (builder-side,
  reviewer-side). Budget is 2 per loop; every host-forced respawn beyond it is recorded with
  reason. session-lab extracts agents-per-loop as exit evidence.

## Cluster C — Mechanical floor (ideas 18 + 20 + 15)

### C1. Anti-polling + verify-in-build hooks (idea 18)

**`skills/write-code/SKILL.md`** and **builder persona** — explicit anti-polling rule: run
`{{verify}}` (or a focused check) once and wait for it to finish; never re-invoke a command to
poll its status, never sleep-loop. (The fleet's 34,002 polling calls are the evidence.)

**`pipeline.config.example.yml`** — new optional `hooks:` section: repos wire long-running
checks into host hook events where the host supports them (e.g. focused tests after a task
commit), with a worked example and a note that absent host support the skill-level anti-polling
rule is the fallback. Phase 1 ships the config slot + example + skill text, not new hook
scripts — hook event surfaces differ too much across hosts to ship one script blindly.

### C2. Pre-spawn check runs (idea 20)

**`skills/pipeline/SKILL.md`** — before spawning a reviewer (and before a builder retry round),
the orchestrator runs the mechanical checks once (`{{verify}}`, or a configured subset),
captures the results, and injects them into the spawn brief alongside the snapshot digest.

**`skills/review/SKILL.md`** and **reviewer persona** — the reviewer judges the injected check
results as evidence; it re-runs a check only when disputing the injected evidence, and says so
in the finding. A reviewer calling lint itself when fresh results were injected is a defect,
not thoroughness.

**`pipeline.config.example.yml`** — optional `checks.preSpawn` command, defaulting to
`{{verify}}` when absent, so repos can point pre-spawn at a faster subset (lint+typecheck) than
the full ship gate.

### C3. Typed verdicts extension (idea 15)

**`skills/review/SKILL.md`** and **reviewer persona** — the three categories stay, with
hardened carry-forward semantics:

- only `BLOCKING` enters retry;
- `NON-BLOCKING DEFECT` and `FOLLOW-UP / NOTE` are carried forward verbatim to the final
  human-approval summary; they never spawn a round, now or later.

**`skills/pipeline/SKILL.md`** §5 — the orchestrator may not upgrade a non-blocking finding to
blocking; if it believes a non-blocker is actually blocking, that is a new evaluation with new
evidence, not a relabel. The final approval summary (post-`DONE`) includes the carried-forward
list so soft objections surface at the gate instead of in silent churn.

## Surface summary

| Surface | Files | Changes |
|---|---|---|
| Skills | `skills/pipeline/SKILL.md` | spawn-brief contract, snapshot usage, delta rule, loop continuity + agent cap, pre-spawn checks, no-upgrade rule |
| Skills | `skills/review/SKILL.md` | delta-based retry evaluation, judge injected evidence, carry-forward semantics |
| Skills | `skills/write-code/SKILL.md` | anti-polling rule |
| Skills | `skills/setup/SKILL.md` | host inventory confirmation |
| Skills | `refine`, `architecture`, `design`, `ship`, critique skills | snapshot-first reading line |
| Personas/agents | `personas/*.md` → regenerated `agents/`, `agents-cursor/`, `.opencode/agents/` | empty-start paragraph (all three), delta-resume + injected-evidence rules (builder, reviewer) |
| Hooks | `pipeline.config.example.yml` (+ docs) | `hooks:` slot, `checks.preSpawn`; no new hook scripts in Phase 1 |
| Scripts | new `scripts/pipeline-snapshot.mjs` | snapshot digest tool; added to `package.json` `files` |
| Docs | new `docs/host-capabilities.md` | capability inventory (idea 2 minimal) |
| Tests | new `tests/pipeline-snapshot.test.mjs` | snapshot behavior; existing suite stays green |

## Out of scope for Phase 1

- `.pipeline/` layout changes (idea 5, Phase 4) — snapshot is a view over the current layout.
- New hook scripts — config slot + skill rules first; scripts land where session-lab shows a
  host supports the event.
- Full host-capability skill (idea 2 full scope, Phase 2) — Phase 1 ships the inventory doc only.

## Exit evidence (per roadmap)

Measured by session-lab on 2–3 pilot WPs, before/after: fork-tax share, reads-to-get-up-to-speed,
agents-per-loop, poll counts, rounds spawned by non-blocking findings.
