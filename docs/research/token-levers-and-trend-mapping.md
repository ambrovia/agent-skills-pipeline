# Token burn findings & leverage ideas

Date: 2026-08-10. Status: ideas, maintainer discussion.
Evidence base: `tools/session-lab/` fleet scan — 1,928 codex rollout threads + 19,673 Claude Code
sessions (~/hyperidle, ~/Development/nimmly, Jun–Aug 2026), cross-checked with codeburn and the
.pipeline retro logs. Regenerate: `tools/session-lab/report.html`.

## The framing number

Typical pipeline runs (after excluding the five gigantic AU refactoring programs AU19/20/21/26/28)
process **~916 context tokens for every 1 token of output**. 77% of all productive session-trees
exceed 1000:1; zero of 761 trees are below 10:1. ~99.9% of tokens are re-processing context that
was already paid for. The cost engine is repetition, not generation. Excluding the refactor programs
removes volume (31% of codex input), not the pattern (ratio moves 926:1 → 916:1).

## Lever 1 — Fewer, cheaper threads (attack the fork tax)

The single biggest term. Every phase/critique/review round spawns a fresh thread; the host
implements spawn as "fork the entire parent conversation" (100–170k tokens); every inference in the
child re-pays it.

Evidence:
- Threads that made ≤5 tool calls consumed **53–83% of all input** in the top runs
  (L1: 146 of 209 threads = 19.0B of 28.1B input; AU20: single-tool-call threads burning 0.3B+ each).
- Claude mirror: 16,980 subagent sessions of 1–10 messages, ~98k prefix each = 1.66B cache-read
  tokens for 16.5M output.
- 18,906 codex subagent spawns fleet-wide.

Ideas:
- Compact profile = one agent, zero forks (small work never enters multi-thread machinery).
- Spawn is a cost decision, not a default: encode "stay in the current thread unless the reason to
  fork outweighs re-paying the context" (Pocock's phase-boundary tree: Continue → clear → handoff →
  subagent, in cost order).
- Where hosts allow, spawn with minimal/no conversation fork; pass a handoff brief (see Lever 4)
  instead of inherited history.
- Longer-lived persona threads across their phases instead of fresh fork per phase.

## Lever 2 — Fewer rounds (front-load structure decisions)

The multiplier on Lever 1. Every critique/review/fix round is a fresh fork over a grown context.

Evidence:
- L1: 5 consecutive architecture-critique rounds before build; 12 fix→review pairs after first DONE;
  the post-review spiral (spawns 54–103) consumed more orchestrator tokens than everything before it.
- AU20: plan→review→rewrite→rereview→revision→finalize chains per subsystem; critique threads with
  _r2/_r3 suffixes.
- Retro records: avoidable rounds from orchestrator over-tightening non-blockers; stale-index reviews.
- L1 churned +138k/−45k lines to ship +1,933 (~70:1) — structure was re-decided during coding;
  founder interventions ("identify where this overengineering came from") each triggered new waves.

Ideas:
- Program-design artifact between architecture and build: call-stack trees, file-tree diffs
  (NEW/MODIFIED), types/signatures for key functions — decisions made before code, when changing
  your mind is cheap (Dex T3). Builder cites it; reviewer checks conformance instead of re-deriving
  structure.
- Hard round caps + changed-strategy requirement per retry (exists in prose today; make mechanical).
- Typed verdicts: ok / soft_objection / hard_veto / escalation — non-blocking findings surface at
  the final gate instead of spawning rounds (T9).
- Scope/ambition governance at plan time (C12: over-scoping is the dominant recent nimmly failure).

## Lever 3 — Kill polling

Evidence:
- 34,002 wait/wait_agent/list_agents calls fleet-wide; orchestrators average ~75–81% of their tool
  calls polling; each poll is a full-context model inference (~110–142k tokens/call).
- Orchestrator threads produce almost nothing themselves (median <1M output tokens per run).

Ideas:
- Never instruct busy-wait loops; batch checks or continue useful work while subagents run.
- Event-driven wake where the host supports it (hooks/triggers; managed-agent wake semantics, T5).
- Compact profile removes the orchestrator entirely — the biggest polling elimination is not
  having an orchestrator.

## Lever 4 — Smaller context per thread

Evidence:
- architecture.md re-read 260× fleet-wide (codeburn); 20 retros record re-spawn re-read cost.
- Compaction churn: 3,934 compactions in the AU20 tree, 680 in L1, up to 34 in one thread —
  contexts overflow, get summarized, then get re-read.

Ideas:
- Phase handoff briefs: each phase writes a small structured artifact (decisions, paths, open
  items, pointers); the next phase reads the brief, full artifacts only on disagreement.
- Lean artifacts: architecture docs with a line budget; pointers instead of inlined content.
- Externalized state over inherited context (T5 direction): what a phase needs lives in
  `.pipeline/work/<id>/`, not in the forked conversation.

## What the analysis says is NOT a primary problem

- Skill prompt size (always-loaded bytes): real but marginal next to fork tax — hygiene, not rescue.
- Model verbosity: output tokens are tiny; generation is not the cost.
- Shell noise (grep/head/echo churn): visible, small.
- The gigantic AU refactorings: excluded; they add volume but not the 916:1 pattern.

---

# Comparison with the trend research (PR #34)

Mapping of our measured findings onto `docs/research/agentic-trends-aug-2026.md` (T1–T10, Options
A–F, Pocock case study). Two lists: trends that directly address our measured problems, and trends
worth adopting for quality/token efficiency generally.

## Trends that map onto our measured problems

| Our finding | Trend / option | What it contributes |
|---|---|---|
| Fork tax (Lever 1) | **T4 planner/worker economics** | Cursor's swarm worked because of *context efficiency, not parallelism* ("planner never implements, worker never plans"); $1,339 vs $10,565 for equal quality. Our data is the same lesson from the other side: forks are the cost. Steal: strict role separation + small worker contexts, not fork-everything. |
| Fork tax (Lever 1) | **Pocock phase-boundary tree** | Continue → /clear → /handoff → subagent in cost order; every move turns a primary source into a lossy secondary one — "pay lossiness only when staying costs more." This is the spawn decision rule we lack: today spawn is the default; it should be the last affordable option. |
| Fork tax (Lever 1) | **Option A (loop profiles)** | Compact/standard/frontier profiles: compact = single agent = zero forks for the majority of work chunks. Directly implements Lever 1 + the flexibility goal. |
| Round multiplication (Lever 2) | **T3 / Option B (program design)** ★ | "Every one of them is a decision you'd otherwise be making implicitly during code review — at the most expensive possible time to change your mind." Our L1 timeline is the literal proof: post-build rounds consumed more than all planning+build. Research rated B "highest leverage per effort"; our measurement now says why. |
| Round multiplication (Lever 2) | **T9 typed verdicts + governor** | soft_objection vs hard_veto stops non-blocking findings from spawning rounds — retros show exactly this failure ("NON-BLOCKER the orchestrator tightened became a real BLOCKER"). Governor rule (only the approval gate changes goals) prevents mid-run scope drift rounds. |
| Round multiplication (Lever 2) | **T2 quality ceiling + HANDBOOK.md (T6)** | Rounds won't shrink via prose discipline; HANDBOOK.md shows long policy docs don't bind (best model 36%). Round caps and conformance checks must be short, mechanical, checkable. |
| Polling (Lever 3) | **T5 managed agents** | Event-driven wake (`wake(sessionId)`, hooks, triggers) is the lab-endorsed alternative to busy-wait. Host-portable version: instructions that forbid wait-loops and prefer batched status checks. |
| Context per thread (Lever 4) | **T5 + Cursor Field Guide + Pocock CONTEXT.md** | State externalized from the window: append-only log / field guide / CONTEXT.md under a line budget, injected and curated. Our handoff briefs are the same principle in pipeline form. Also Anthropic "move work out of context into executed code." |
| Over-engineering (Lever 2 root cause) | **Pocock wayfinder** | For efforts too big for one session: a map of decision tickets with fog-of-war, "plan, don't do", hands off to spec — it doesn't build. Directly relevant to the AU21-style multi-increment monsters and to C12 over-scoping: large efforts get decomposed into decisions before any build machinery starts. |

## Trends worth adopting beyond our four levers

| Trend | Why it helps quality / token efficiency |
|---|---|
| **T4 capability-class routing** (Cursor Router: −68% cost at equal satisfaction) | Tokens follow dollars: frontier model for planning/review judgment, cheap model for executing explicit plans, routed per task assessment. Our personas pin capability statically; routing per WP assessment is the token-efficiency complement of profiles. |
| **T7 verification renaissance** (Option F) | We cannot yet answer "did a change make the pipeline better?" with data. Fixture WPs + cost-per-package + rework-rate as first-class metrics; mutation-tested ACs (tests must fail pre-patch) raise AC quality. session-lab is already a prototype of the cost side. |
| **Pocock two-axis review** (Standards + Spec, never reranked) | Quality: decorrelated lenses catch what one pass misses *without adding rounds* — cheaper than more review rounds, which our data shows are the multiplier. |
| **Pocock design-it-twice / deep-module vocabulary** | Quality of structure decisions: parallel radically-different designs compared on depth/locality/seam placement — attacks "one-off code, no SDLC in mind" at design time, where it is cheap. |
| **T8 evidence-based gates** | Humans rubber-stamping miss ~1 in 3 (measured). Gates on verify output + verdict evidence instead of human attention: better quality control at lower human token cost. |
| **Meta-lesson: harness assumptions rot** | Every one of our mechanics (spawn-per-phase, critique loops, polling-style supervision) is a bet on model/host behavior. Each needs an observable trigger and a removal path — otherwise today's fixes become next generation's dead weight. |

## Trends we should NOT take (confirmed by the data)

- **More parallelism / graph runtimes (T9 mechanics, Option E)**: our problem is not throughput;
  parallel leaves would multiply the fork tax. Topology changes only inside frontier profile.
- **Standing role agents (T1, Yegge offices)**: out of scope; per-WP lifecycle stays.
- **Event-log infrastructure for its own sake (Option C full build)**: handoff briefs (Lever 4)
  capture most of the value; the full append-only substrate can wait until profiles exist.
- **Skill-prompt leanness as a headline project (T10)**: demoted to hygiene by the fork-tax finding.

## Resulting priority (research × measurement)

1. **Program design + round caps + typed verdicts** (Lever 2; research B + T9) — attacks the
   multiplier and the quality problem at once; both literatures agree this is highest leverage.
2. **Loop profiles with compact mode** (Lever 1+3; research A) — removes fork tax and polling for
   the majority of work chunks.
3. **Handoff briefs / lean artifacts** (Lever 4; research T5-lite) — shrinks what every remaining
   fork inherits.
4. **Capability routing + eval harness** (T4 + F) — dollar-side efficiency and the measurement
   loop that proves 1–3 worked.
