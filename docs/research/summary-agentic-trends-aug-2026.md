# Research summary: Agentic engineering trends, August 2026

Scope: what moved in agentic engineering since our loops-and-goals research (see `loops-n-goals.md`), and what it implies for reworking this pipeline. Deep version with all evidence: `agentic-trends-aug-2026.md` in this folder. Method: lab engineering blogs, practitioner essays, benchmarks, and Hacker News/X discourse, June–August 2026.

## Executive findings

1. **Harness assumptions rot.** Labs now state openly that scaffolding encodes model weaknesses that go stale each generation (context resets added for Sonnet 4.5 became dead weight on Opus 4.5 [1]; Yegge's Gas Town broke on Opus 4.7 model tics [9]). Every pipeline feature needs an observable trigger and a removal path.
2. **The quality ceiling is real.** Coding models are RL-trained against pass/fail verifiers with no penalty for eroding maintainability; there is no fast oracle for design quality yet [8]. Data: incidents per PR +242.7%, bugs/dev +54%, 31% of PRs skip review since the AI-coding wave [11]. Practitioner answer: front-load decisions and keep humans at contract boundaries, not line-by-line review [8].
3. **"Program design" is the celebrated missing phase** (Dex Horthy, AI Engineer World's Fair 2026): before implementation, produce the shape of the code — call-stack trees, file-tree diffs, types and method signatures — then build vertical slices [8]. Cursor independently converges: "the unit of work becomes the spec" [6].
4. **Planner/worker economics dominate.** Frontier model plans, cheap models execute: equal quality for $1,339 vs $10,565 in Cursor's SQLite swarm [6]; learned routing beats benchmark-based model selection (Fable-level satisfaction at −68% cost) [7]. Our static mapping (strong planners, fast builders) is the inverse of this.
5. **Durable, externalized state is the reference architecture.** Anthropic's Managed Agents: session = append-only event log outside the context window, harness and sandbox are disposable cattle [1]; Gemini API ships hooks, token budgets, resumable runs, cron triggers [5]; Beads work-graphs and Cursor's Field Guide converge the same way [9][6].
6. **Skills won as the packaging standard** (agentskills.io, adopted across Claude/Codex/Gemini/opencode) [3] — but long policy documents do not reliably govern agents: best model passes only 36% of handbook-governed trials; short, specific, mechanically checked rules win [10].
7. **Graph engineering** is the July 2026 wave above loop engineering [16][17]. Mechanics are old (LangGraph et al. [12]), but three ideas are worth stealing: org graph vs work graph [14], typed signals (`soft_objection` / `hard_veto` / `escalation`) with a governor who alone may change the goal [15], and topology independent of serial/parallel execution [15]. Counterweight: open-ended work belongs in a loop/harness, not a graph [12].
8. **Security and token efficiency became engineering requirements.** A summer of agent incidents (incl. AISI's supply-chain PR attempt) pushed containment, credentials-outside-sandbox, and mechanical gates [20][4]; humans rubber-stamping approvals miss ~1 in 3 threats [19]. Harness token overhead is publicly audited (Claude Code 33k vs OpenCode 7k pre-prompt tokens) [18].
9. **The strongest public "skills-as-process" artifact is Matt Pocock's suite** [26]: small composable skills explicitly against process-owning frameworks (GSD/BMAD/Spec-Kit). Standout ideas: grilling (frontier-round interviews; facts = agent's job, decisions = human's), wayfinder (decision-ticket maps with fog-of-war for oversized efforts), two-axis decorrelated code review (Standards + Spec, never reranked), deep-module design vocabulary with design-it-twice, blocking-edge tracer-bullet tickets, and a writing-for-agents discipline (no-op test: delete any instruction line that wouldn't change agent behavior). Validates our skills bet; challenges us to stay composable discipline rather than a framework that "owns the process."

## Schools of thought, vs. our setup

| School | Creed | Us today | Gap |
|---|---|---|---|
| Loop engineering [16] | Write loops, not prompts; verifiers earn trust | We are a loop with mechanical gates | Human-triggered, non-adaptive |
| Graph engineering [12][15] | Typed edges, governor, org/work graphs | Implicit graph; binary verdicts | Typed verdicts + governor |
| Program-design-first [8] | Front-load shape-of-code decisions; humans at contracts | Design+critique exist | No program-design artifact |
| Lights-off factory (StrongDM) | Remove the human | Not us | Rejected — failure data [8][11] |
| Planner/worker economics [6][7] | Frontier plans, cheap executes | Inverted | Capability classes |
| Managed agents / durable state [1][5] | Session-as-log, disposable harness | File-based state | Event log |
| Skills as governance [3][10] | Short checkable rules, progressive disclosure | Our core identity | Audit + self-authoring |
| Verification renaissance [23] | Score maintainability, not just pass/fail | No pipeline-owned evals | Eval harness |
| Containment-first [4][20] | Blast radius, mechanical gates | Gates lean on human attention | Evidence-based gates |
| Token efficiency [18] | Always-loaded bytes cost forever | Per-session skill loading | Leanness audit |
| Standing role agents [9] | Resident agents; crons watch, models act | Out of scope | Future direction |
| Bespoke harness thesis [9] | Reusable harnesses die | Our portability bet | Open strategic question |

## What people celebrate vs. hate

- **Celebrated:** Fable-class one-shotting; sub-agent modes; Agent Skills standard; managed-agent runtimes (hooks, budgets, triggers); cheap agentic open weights (Kimi K3, DeepSeek V4 Flash, Qwen3.8-Max topping the agentic index); stateless MCP 2.0 [22]; planner/worker cost splits.
- **Hated:** slop accumulation and maintainability decay [8][11]; token bills ("Tokenpocalypse") and harness overhead [18]; long handbook docs models ignore [10]; approval fatigue [19]; encrypted sub-agent prompts (closedness); model tics breaking harnesses [9]; benchmarks that prove nothing about quality [8].

## Possible improvement features

1. **Adaptive loop profiles** — compact / standard / frontier selected per work package from an evidence-backed execution assessment; transitions recorded, never locked.
2. **Program-design artifacts** — call stacks, file-tree diffs, types/signatures produced between architecture and build; reviewer checks conformance.
3. **Typed verdicts + governor** — `ok` / `soft_objection` / `hard_veto` / `escalation`; only the approval gate changes goals/contracts.
4. **Capability-class routing** — `fast|standard|strong` resolved per harness instead of persona-fixed models; builder variants generated.
5. **Recoverable runs** — append-only event log per work package; any phase resumes from the log, never conversation memory.
6. **Governance-grade skills** — short checkable rules, progressive disclosure, deterministic check scripts, token-budget audit; retro proposes skill updates.
7. **Pipeline-owned evals** — fixture work packages, mutation-tested acceptance criteria, cost-per-package and rework-rate metrics.
8. **Evidence-based gates** — ship requires verify output + verdict evidence; hooks as policy enforcement; no credentials in agent context.
9. **Decorrelated review lenses** (frontier only) — two reviewers with different models/information access instead of one pass.

## Work packages

1. **WP: Program-design phase.** Outcome: new `program-design` skill sits between architecture and build; planner emits call-stack/file-tree/signature artifact; builder must cite it; reviewer diffs implementation against it. Acceptance: skill loads on standard/frontier runs; fixture package produces the artifact; review verdict references conformance.
2. **WP: Typed verdict vocabulary.** Outcome: review/critique verdicts use `ok|soft_objection|hard_veto|escalation` with documented routing; goal/contract changes only via approval gate. Acceptance: soft objections surface at the final gate without blocking; hard veto blocks ship; escalation reaches the approver; fixture tests cover all four.
3. **WP: Execution assessment + capability classes.** Outcome: refine emits machine-readable assessment (difficulty, uncertainty, changeShape, verification, risks) with evidence; personas route `fast|standard|strong`; generator emits builder variants per harness. Acceptance: assessment schema documented; variants generated for all supported hosts; routing decision recorded per run.
4. **WP: Loop profiles with recorded transitions.** Outcome: compact/standard/frontier profiles chosen from the assessment; explicit escalation/de-escalation triggers; transitions logged with reasons. Acceptance: fixture tests prove compact collapse and frontier escalation; progress file records every transition.
5. **WP: Event-log state.** Outcome: `.pipeline/work/<id>/` gains an append-only event log; phases reconstruct inputs from it; retro reads it. Acceptance: a killed run resumes from the log alone; retro summarizes from events without transcripts.
6. **WP: Skills governance audit.** Outcome: every skill audited against HANDBOOK.md failure modes [10] and the writing-for-agents no-op test [26]; oversized skills split; references lazy-loaded; always-loaded token count measured before/after. Acceptance: no SKILL.md exceeds the agreed line budget; measured token overhead drops; gates remain mechanical.
7. **WP: Pipeline eval harness.** Outcome: 5–10 fixture work packages (compact/standard/frontier shapes) with known-good outcomes; runner captures pass/fail, cost, rework. Acceptance: runner compares two profiles on the fixture set and produces a metrics report.
8. **WP: Evidence-based gates.** Outcome: ship gate requires verify output + verdict evidence, not human prose; hooks enforce policy where the host supports them; credentials never enter agent context. Acceptance: gate fails closed without evidence on every supported host; documented per host.

Suggested order: 1 + 6 first (cheap, core identity), then 3 → 4, with 5 as the shared state model, 7 alongside from the start, 2 folded into 1's review path, 8 as hardening, 9 deferred to frontier tasks.

## Measured priorities (session-lab forensics, 2026-08-10)

The work packages above were research-derived. A fleet forensic scan (tools/session-lab: 1,928 codex
rollout threads + 19,673 Claude Code sessions from ~/hyperidle and ~/Development/nimmly, Jun–Aug
2026, cross-checked with codeburn and the .pipeline retro logs) has since measured where tokens
actually go. Full evidence: `docs/research/token-levers-and-trend-mapping.md` and
`tools/session-lab/report.html`.

Headline: typical runs (after excluding the five gigantic AU refactoring programs AU19/20/21/26/28)
process **~916 context tokens per 1 token of output**; 77% of productive session-trees exceed
1000:1, none of 761 is below 10:1. The cost engine is context re-processing, not generation.
Measured burn ranking:

1. **Fork tax** — spawn = fork the full parent conversation (100–170k tokens), re-paid on every
   inference. Threads making ≤5 tool calls consumed 53–83% of input in the top runs.
2. **Round multiplication** — every critique/review/fix round is a fresh fork over a grown context
   (L1: 12 fix→review pairs after first DONE consumed more than all planning+build).
3. **Polling** — 34,002 wait-style calls fleet-wide; orchestrators spend ~75–81% of tool calls
   polling, each poll a full-context inference.
4. **Context size per thread** — artifact re-reads (architecture.md 260×), compaction churn
   (3,934 compactions in one run).

Demoted by measurement: skill-prompt leanness (WP 6) from headline to hygiene; event-log substrate
(WP 5) to handoff-briefs-lite; parallelism (WP 9 direction) rejected as it multiplies the fork tax.

Revised plan, in priority order:

1. **Program design + round caps + typed verdicts** (extends WP 1, folds in WP 2) — attacks round
   multiplication and the program-quality problem together; research (T3/T9) and measurement agree
   this is highest leverage. Includes scope/ambition governance at plan time (C12 over-scoping).
2. **Loop profiles with compact mode** (WP 4, informed by WP 3) — compact = one agent, zero forks,
   no polling orchestrator; standard/frontier keep the machinery. Removes the fork tax for the
   majority of work chunks. Spawn becomes a cost decision (Pocock phase-boundary tree), not default.
3. **Handoff briefs / lean artifacts** (WP 5, reduced scope) — small structured phase handoffs
   instead of full-context inheritance; line-budgeted artifacts; pointers over inlined content.
4. **Capability routing + eval harness** (WP 3 routing half + WP 7) — frontier judgment / cheap
   execution per assessment; fixture WPs with cost-per-package and rework-rate so 1–3 can be proven
   with data. session-lab is the prototype of the cost side.
5. **Skills governance audit** (WP 6) — retained as hygiene under the no-op test, no longer a
   headline item.
6. **Evidence-based gates** (WP 8) — unchanged, scheduled as hardening.

## Sources

1. Anthropic — Scaling Managed Agents: Decoupling the brain from the hands (Apr 2026). anthropic.com/engineering/managed-agents
2. Anthropic — Harness design for long-running application development (Mar 2026). anthropic.com/engineering/harness-design-long-running-apps
3. Anthropic — Equipping agents for the real world with Agent Skills (Oct 2025); agentskills.io open standard (Dec 2025). anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
4. Anthropic — How we contain Claude across products (2026). anthropic.com/engineering/how-we-contain-claude
5. Google — Gemini API Managed Agents: 3.6 Flash, hooks, budgets, triggers (Jul 28, 2026). blog.google, developers-tools
6. Cursor — Agent swarms and the new model economics (Jul 20, 2026). cursor.com/blog/agent-swarm-model-economics
7. Cursor — How Cursor Router chooses the right model for the task (Aug 6, 2026). cursor.com/blog/how-cursor-router-works
8. Dex Horthy (HumanLayer) — Why Software Factories Fail, AI Engineer World's Fair 2026 keynote + write-up. github.com/humanlayer/advanced-context-engineering-for-coding-agents (wsff.md)
9. Steve Yegge — The Shape of Things to Come, Part 1: The Continuous Thunderdome (Aug 2026). yegge.ai/essays/the-shape-of-things-to-come
10. Panavas et al. — HANDBOOK.md: A Benchmark for Long-Context Agentic Instruction Following (arXiv 2607.25398, Jul 2026). arxiv.org/abs/2607.25398
11. Faros AI — AI Acceleration Whiplash report (2026). faros.ai/research/ai-acceleration-whiplash
12. LangChain — 3 Years of Graph Engineering with LangGraph (Jul 22, 2026). langchain.com/blog/3-years-of-graph-engineering-with-langgraph
13. AI Builder Club — Graph Engineering Guide (2026). aibuilderclub.com/blog/graph-engineering-guide-2026
14. explainx.ai — Graph Engineering: Wire Multi-Agent Orgs After Loops (Jul 18, 2026). explainx.ai/blog/graph-engineering-ai-agents-multi-agent-organizations-2026
15. AI Coding Club — Graph Engineering Guide: typed edges/signals, governor authority. aicoding.club/docs/tutorials/graph-engineering-guide/
16. The New Stack — Loop engineering: Boris Cherny, Peter Steinberger, Addy Osmani (Jun 10, 2026). thenewstack.io/loop-engineering/
17. Peter Steinberger — "Are we still talking loops or did we shift to graphs yet?" (Jul 18, 2026). x.com/steipete/status/2078277297791189132
18. systima — Claude Code vs OpenCode token overhead (Jul 2026). systima.ai/blog/claude-code-vs-opencode-token-overhead
19. Scalex — Humans missed 1 in 3 threats approving AI agent commands across 40k game runs (Aug 2026). scalex.dev/blog/ai-agent-permissions-stats
20. UK AISI — Incident report: unsanctioned agent behaviour during cyber testing (Jul 2026). aisi.gov.uk/blog/incident-report-unsanctioned-agent-behaviour-during-cyber-testing
21. Meta — Introducing Muse Code and Muse Spark 1.2 (Aug 2026). research.meta.ai (harness co-training)
22. Model Context Protocol — 2026-07-28 spec (stateless MCP). blog.modelcontextprotocol.io/posts/2026-07-28
23. Cognition — Frontier Code (mutation-tested quality + judge). cognition.com/blog/frontier-code; SWE-Marathon: swe-marathon.org; DeepSWE: deepswe.datacurve.ai
24. Simon Willison's weblog (Jun–Aug 2026) — model releases, incidents, MCP 2.0, token economics. simonwillison.net
25. OpenAI — Harness Engineering (Feb 2026, Ryan Lopopolo) + Symphony talk (Apr 2026). openai.com/index/harness-engineering; youtube.com/watch?v=am_oeAoUhew
26. Matt Pocock — Skills For Real Engineers (repo studied Aug 2026). github.com/mattpocock/skills — wayfinder, grilling, code-review, codebase-design, to-spec, to-tickets, writing-for-agents, ask-matt/PHASE-BOUNDARIES
