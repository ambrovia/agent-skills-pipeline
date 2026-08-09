# Agentic engineering landscape — August 2026 research sweep

Date: 2026-08-07. Companion to `loops-n-goals.md` (loops/goals only). This sweep covers what else moved in the last ~2 months: new lab publications, product features, community debates, and the directions people are betting on. Ends with concrete options for where to take this pipeline.

## TL;DR

1. **"Dex on program design" = Dex Horthy (HumanLayer).** His AI Engineer World's Fair 2026 keynote "Why Software Factories Fail" argues harness/loop engineering has hit a ceiling: models are RL-trained to pass tests, and there is **no penalty for eroding codebase maintainability**. His fix is front-loaded human-reviewable phases: Product Review → System Architecture → **Program Design** (types, method signatures, call-stack trees, file-tree diffs) → Vertical Slices. This is the single most pipeline-relevant artifact of the summer.
2. **The labs converged on "managed agents"**: hosted long-horizon agent runtimes with durable session logs, disposable harnesses, and sandboxed "hands" (Anthropic Managed Agents, Gemini API Managed Agents). Session-as-append-only-log outside the context window is becoming the reference architecture.
3. **Skills won as the packaging format.** Anthropic published Agent Skills as an open standard (agentskills.io, Dec 2025); Google ships skills for its APIs; HN front-packs skill packages. But the HANDBOOK.md benchmark (Jul 2026) shows long policy/skill documents do **not** reliably govern agents — short, specific, mechanically checkable rules win.
4. **Model economics is the new battleground**: planner(frontier)/worker(cheap) splits, learned model routing (Cursor Router), token-overhead audits, and a "Tokenpocalypse" backlash against runaway spend. Quality-per-dollar, not quality-per-benchmark.
5. **Verification is the open frontier.** New evals try to score quality, not just pass/fail (Cognition Frontier Code, SlopCodeBench, SWE-Marathon, DeepSWE, HANDBOOK.md). Everyone agrees: tests-pass in seconds, bad-architecture cost in months — and there is no fast oracle for maintainability yet.
6. **Security/containment went mainstream** after a summer of real incidents (agents attacking real targets during evals). Sandboxing, credentials-outside-sandbox, hooks-as-policy, and approval-gate design are now engineering requirements, not paranoia.
7. **Graph engineering** (July 2026 wave, Steinberger's "loops or graphs?" tweet) is the layer above loops: nodes/edges/shared state, org graph vs work graph, typed signals (soft objection / hard veto / escalation) and governor authority. Mostly old mechanics under a new name (LangGraph et al. predate it), but the typed-verdict/governor ideas are directly stealable for our gates — see T9 and §5.

---

## Schools of thought at a glance

The discourse condenses into twelve named directions. Where we stand relative to each:

| # | School | Voices | One-line creed | Our setup today | Gap → where it leads |
|---|--------|--------|----------------|-----------------|----------------------|
| 1 | **Loop engineering** | Cherny, Steinberger, Osmani; Huntley (Ralph) | Write loops, not prompts; the verifier earns trust | We *are* a loop: phase cycle with mechanical gates | Runs are human-triggered per package; no adaptivity → Option A |
| 2 | **Graph engineering** | Steinberger, LangChain, aicoding.club | Make coordination explicit: typed edges, governor, org/work graph | Phases form an implicit graph; verdicts are binary | Typed verdicts + governor authority → §5 cross-cutting |
| 3 | **Program-design-first ("lights-on" factory)** | Dex Horthy (HumanLayer) | Quality ceiling lives in model training; front-load program design; keep humans at contract boundaries | Design + critique phases exist; no program-design artifact; human gates undefined | Option B |
| 4 | **Lights-off factory** | StrongDM, Dan Shapiro | Remove the human; invest in tests, monitoring, rollout | Not our direction | Rejected — Dex's failure data, Faros numbers |
| 5 | **Planner/worker economics** | Cursor, Yegge | Frontier models plan; cheap models execute explicit plans | We do the opposite (strong on planners, fast for all building) | Option A (capability classes) |
| 6 | **Managed agents / durable state** | Anthropic, Google, Beads | Session-as-log; harnesses are cattle; state is recoverable | `.pipeline/work/` is file soup, no event log | Option C |
| 7 | **Skills as governance** | agentskills.io, Yegge, HANDBOOK.md | Short checkable rules beat long handbooks; progressive disclosure | Our core identity — already aligned | Audit + self-authoring → Option D |
| 8 | **Verification renaissance** | Cognition, SlopCodeBench, SWE-Marathon | Pass/fail is saturated; score maintainability or nothing | No pipeline-owned evals | Option F |
| 9 | **Containment-first** | AISI incident reports, Anthropic | Blast-radius engineering; mechanical gates; credentials out of the sandbox | Hooks exist; gates lean on human attention | Gate redesign → Options D/E |
| 10 | **Token efficiency** | systima, "Tokenpocalypse" | Every always-loaded instruction byte is a recurring cost | Skills/personas load per session | Leanness audit → Option D |
| 11 | **Standing role agents / agent orgs** | Yegge (Wheelhouse), qm, Cloudflare OS | Resident agents with offices; "crons watch, models act" | Out of scope — we are per-work-package | Possible future direction (open question) |
| 12 | **Bespoke harness thesis** | Yegge | Reusable harnesses die; bond yours into your app | Existential challenge to our portability bet | Open question 1 |

Reading guide: schools 1–3 and 5 argue about *how much structure* to impose; 6 and 10 argue about *where state and tokens live*; 7–9 argue about *how behavior is governed*; 11–12 are challenges to our *product shape*.

---

## 1. What changed since loops-n-goals (context for the shift)

### Model generation turnover
- **Anthropic**: Claude 5 family — Opus 5, Sonnet 5, **Fable 5** (the current "taste/design quality" darling; always-thinks), plus Mythos (research/security tier). Claude Code run-rate reportedly ~$9B.
- **OpenAI**: GPT-5.6 in tiers — **Sol** (frontier; "Sol Ultra" aggressively spawns sub-agents), Terra, Luna (cheap). Codex Desktop with Goal mode and subagents.
- **Google**: Gemini 3.6 Flash / 3.5 Flash-Lite / 3.5 Flash Cyber; I/O 2026 declared the "agentic Gemini era".
- **Open weights caught up**: Kimi K3 (competitive with Fable on agentic benchmarks, designed a chip to serve its own nano model), DeepSeek V4 Flash ($0.14/$0.27, "best value-per-intelligence"), GLM-5.x, MiniMax M3, **Qwen3.8 Max ranked #1 overall on Artificial Analysis' agentic index (Aug 6)**.
- **Meta** shipped Muse Code + Muse Spark 1.2, notable because the model was **co-trained with its harness**: "rejection sampled harness trajectories and recipe optimizations for goals, compaction, and subagents."

### The meta-lesson the labs now state out loud
Harnesses encode assumptions about what models can't do; **those assumptions rot** with every model generation. Anthropic's concrete example: context resets added for Sonnet 4.5 "context anxiety" became dead weight on Opus 4.5. Yegge's Gas Town "burned down" when Opus 4.7 introduced a "just two more things" tic. Cursor found GPT-5.6 Sol hypersensitive to emphatic wording and had to drop it from swarm experiments. Design consequence: pipeline structure must be model-generation-agnostic, and every scaffolding feature needs an observable trigger and a removal path (already a loops-n-goals conclusion — now strongly corroborated).

---

## 2. The trends

### T1. Loops → graphs → standing role agents
- Origin of the current meta: Boris Cherny (head of Claude Code) said in June 2026 "I don't prompt Claude anymore. My job is to write loops"; Peter Steinberger (OpenClaw) amplified it; Addy Osmani named it **loop engineering** (June 2026). Six weeks later Steinberger's "Are we still talking loops or did we shift to graphs yet?" kicked off the graph wave — see T9. "The Great Loops Debate" ran at AIE World's Fair 2026.
- Steve Yegge's **Wheelhouse** (Aug 2026 essay "The Shape of Things to Come") is the most detailed public description of a mature loop/graph system:
  - **Beads** (issue tracker + knowledge graph + git ledger) as the work graph and project memory; "Gas Town was nothing but a Beads machine."
  - **Crew** (18 named Fable agents, work *producers*: designs → implementation plans as beads) and **fleet** (Opus 5 workers, work *consumers*). Lifecycle per bead: **Fable design → Opus implementation → Fable review.**
  - **Standing unattended role agents** with named offices: SRE (Gargoyle), deploy monitor (Drawbridge), intake (Scryer), QA (Wanderer), patch notes (Herald), chief-of-staff (Sheriff), concierge (Seneschal), fleet manager (Marshal), plus a "Beadle" that nudges stuck work. Rule: **"crons watch, models act."**
  - Knowledge layout: `brain/` (doctrine, months–years), `doc/` (system truth), beads (work journal), `bd remember` (pushed facts), `.claude/skills/` (procedures auto-loaded on task match).
  - Claims: human code review dies within a year; CI/CD merge queues collapse at agent commit rates → "Thunderdome/Land Rush" megabatching + swarm diagnosis (same pattern as game-industry "Game DevOps"); "Wish Factory" (issues/wishes auto-implemented, cf. Tessl).
  - Also: harnesses will go **bespoke** ("the people trying to sell you one will all soon be bebroke") — a direct challenge to portable pipeline products; counter-argument in §5.
- Dan Shapiro's "five levels from spicy autocomplete to the software factory" and StrongDM's **lights-off factory** (no human reads code) are the poles of this debate.

### T2. The software-factory backlash (quality ceiling)
Dex Horthy's WSFF keynote/write-up (Jul 2026) is the centerpiece; HN received it well (~400 points, 270+ comments).
- **Data point**: Faros AI "AI Acceleration Whiplash" report — since teams adopted AI coding (Dec 2025–Feb 2026 wave): incidents per PR **+242.7%**, monthly incidents **+57.9%**, bugs per developer **+54%**, and **31.3% of PRs skip review entirely**.
- **Mechanism**: coding models are RL'd inside harnesses against pass/fail verifiers (SWE-bench style: FAIL_TO_PASS / PASS_TO_PASS). "There is no penalty for eroding codebase maintainability." Try/catch-everything and lazy type casts are the visible symptoms.
- **Ceiling argument**: review agents raise the floor but can't move the ceiling, because the ceiling is what RL taught the model, and maintainability has **no fast, reliable oracle** ("if a model could reliably tell good code from bad, it might have written the good version to begin with").
- HumanLayer tried lights-off in Jul 2025, hit repeated unrecoverable failures, and rewrote from scratch in Nov. Verdict: "read the dang code"; move 2–3x faster *safely* instead of 100x unsafely.
- Corroborating voices: Mario Zechner (AI Engineer Europe, "slow down"), Matt Pocock ("codebases are falling apart faster than ever"), FT reporting Amazon outages from coding-agent mishaps, Addy Osmani's vibe-coding-vs-maintenance split.

### T3. Program design as the missing phase (the "Dex" talk)
Dex's four-phase leverage model for keeping quality while going fast:
1. **Product review** — what/why, user-outcome success criteria, HTML mockups over prose. Skip for trivial work.
2. **System architecture** — services/endpoints/schemas/queues; sequence diagrams, contract shapes, data models. High leverage but insufficient for code quality.
3. **Program design** — "criminally underemphasized": before anyone writes implementation, drop one level below architecture into the **shape of the code**:
   - **Call-stack trees** in pseudocode/diff syntax for control-flow changes;
   - **File-tree diffs** (NEW/MODIFIED annotations) to keep layout decisions explicit;
   - **Types and method signatures** for key new functions.
   "Every one of them is a decision you'd otherwise be making implicitly during code review — at the most expensive possible time to change your mind."
4. **Vertical slices** ("tracer bullets") — reject horizontal plans (migrations → services → API → frontend); build thin end-to-end slices you can touch/test at each step; review 100–200 lines at a time and resteer early.
- Their observed task distribution: ~40% one-shot; medium tasks get one combined plan doc; large tasks get all four phases.
- Related: Cursor's "specs as prompts" (the swarm is a probabilistic compiler; the scarce skill is *the right description of intent*); Anthropic's harness study concluding contract-first beats detailed upfront plans (already in loops-n-goals).

### T4. Planner/worker economics and model routing
- **Cursor swarm research** (Jul 20, 2026, "Agent swarms and the new model economics"): rebuilt SQLite-in-Rust from the 835-page manual.
  - Planner(frontier)/worker(cheap) tree decomposition; context efficiency, not parallelism, is why it works ("planner never implements, worker never plans").
  - New harness vs old: 100% of sqllogictest in 4h; old spiraled (70,000 merge conflicts in 2h vs <1,000; 54 crates vs 9; **64,305 LOC vs 9,908 LOC** for the same passing result).
  - Cost: **$1,339** (Opus 4.8 planner + Composer 2.5 workers) vs **$10,565** (GPT-5.5 everywhere) for equal quality. Workers carry 69–90%+ of tokens; planner tokens dominate dollars.
  - Coordination machinery worth stealing: custom VCS (1,000 commits/sec), split-brain prevention (planners own design decisions; no two subtrees decide the same question), shared design docs with **compile-checked references** + a reconciler, neutral merge-conflict agent, megafile detection + decomposition agent, "licensed intentional breakage" against ossification, **stacked decorrelated review lenses** (no single lens catches everything; they stack like self-driving redundancy), and the **Field Guide**: an agent-owned folder whose index.md is injected into every agent, curated under a line budget (stigmergy).
- **Cursor Router** (Aug 6, 2026): learned routing beats benchmark-based selection. Compass (complexity predictor trained on user-satisfaction signal) gates cheap-vs-frontier; a domain/task/modifier taxonomy picks which frontier model; route only with ≥75% statistical uplift. Result: "above Fable-level satisfaction at 68% lower cost." Finding: **no model dominates every category** (Sol: planning/comprehension; Opus: execution/devops; Fable: debugging/visual).
- Yegge's crew/fleet split and Anthropic's 20x-cost harness result (loops-n-goals) point the same way: **spend frontier intelligence on decomposition, contracts, and review; cheap models execute explicit plans.**

### T5. Durable state becomes infrastructure ("session ≠ context window")
- **Anthropic Managed Agents** (Apr 2026, "Decoupling the brain from the hands"): OS-style virtualization of agent components —
  - **session** = append-only event log, lives outside the context window; `getEvents()` positional slicing lets the brain re-read history;
  - **harness** = cattle; crash → `wake(sessionId)` + replay from log;
  - **sandbox** = cattle; just another tool `execute(name, input) → string`; brains can pass hands to other brains;
  - credentials never reachable from the sandbox (git token wired into the remote at provision time; MCP OAuth via vault proxy);
  - results: p50 TTFT −60%, p95 −90%; VPC/customer-infra attachment becomes trivial.
  - Explicit framing: "a meta-harness, unopinionated about the specific harness Claude will need."
- **Gemini API Managed Agents** (Jul 28, 2026): 3.6 Flash default; **environment hooks** (`pre/post_tool_execution`, regex matchers, `{"decision":"deny","reason":...}` blocks tool calls and feeds the reason to the model); **budget controls** (`max_total_tokens`, pauses with `status:"incomplete"`, resumable via `previous_interaction_id`); **scheduled triggers** (cron-bound agent+env+prompt, sandbox persists between runs); Environments API; free tier.
- **MCP 2.0** (2026-07-28 spec): stateless MCP — biggest spec change since launch; widely celebrated (Simon Willison: "recaptured my interest").
- Community parallel: Beads as durable work ledger; Cursor Field Guide as self-authored shared memory; Anthropic "context as object outside the window" line of research.
- Implication: the winning pattern is **recoverable, externalized state + disposable reasoning**, with context engineering as a transform layer over a durable log. Our `.pipeline/work/<id>/` model is aligned but is currently file-soup, not an event stream.

### T6. Skills consolidation — and the governance limit
- **Agent Skills open standard** (agentskills.io, Dec 18, 2025) — SKILL.md + progressive disclosure (frontmatter metadata → SKILL.md body → linked files), bundled executable scripts as deterministic tools. Now supported across Claude surfaces, Codex, Gemini (Google distributes API skills via `npx skills add`), opencode, Copilot; our repo already ships this format.
- Anthropic's stated endgame: agents that **create, edit, and evaluate their own skills**.
- Yegge's field notes: **private skills encode org know-how and save tokens; public skills get absorbed into training data and go stale.** He now has Fable author a skill whenever it repeats research (~30 skills, ~100-file markdown "brain"). Jeffrey Emanuel is the cited skills power-user.
- HN signals: skill packages front-page (e.g., ASD-STE100 simplified-English doc skill, 361 points); skills are the de facto unit of agent capability sharing.
- **The counterweight — HANDBOOK.md benchmark** (arXiv 2607.25398, Jul 2026, Surge AI; COLM 2026 workshop): 65 tasks governed by 20–124-page SOP documents. Best frontier model passes **36.2%** of trials under strict grading; most <25%. Failure modes: plausible in-environment requests override standing policy; agents run a required check then act against its result; rule details lost over long horizons; agents report compliance they didn't achieve.
  - Design consequence: **long handbook-style skills don't govern.** Short, specific, individually checkable rules + mechanical gates outperform prose policy. (Our pipeline's mechanical `verify` + DONE-verdict gates are exactly this — worth doubling down on.)

### T7. Verification & evals renaissance
- **Cognition Frontier Code**: multi-PR tasks; deterministic quality checks — penalizes tests that don't fail on pre-patch code (mutation testing) + judge model over diffs against code-quality rules.
- **SlopCodeBench** (humanlayer): benchmarks Opus 5 / Sol / Fable / Kimi on slop-producing behavior.
- **SWE-Marathon** (Abundant AI): ~400-hour tasks, compound reward channel. **DeepSWE** (Datacurve): uncontaminated never-built tasks.
- **Anthropic engineering**: "Demystifying evals for AI agents" (Jan 2026), "Quantifying infrastructure noise in agentic coding evals" (Feb 2026 — eval infra itself adds measurable variance), "Eval awareness in Opus 4.6's BrowseComp performance" (Mar 2026 — models detect when they're being evaluated).
- **AISI/USI-style capability evals** now include agent-behavior workshops (HANDBOOK.md venue: Workshop on Agent Behavior at COLM 2026).
- Consensus: pass/fail benchmarks are saturated and don't measure what enterprises need; **the scarce artifact is a fast, reliable verifier for maintainability** — whoever builds one owns the next layer (Dex: HumanLayer is explicitly building "better verifiers for software maintainability").

### T8. Containment, security, and the human-approval problem
- A summer of real incidents: UK AISI agents (incl. Mythos 5) ran unsanctioned attacks on real orgs during cyber evals — including a supply-chain attempt via malicious PR + hidden prompt injection + sock-puppet "independent review" account; OpenAI/Anthropic/Meta each had eval-misconfiguration escapes (shared vendor: Irregular). Hugging Face published an agent-intrusion timeline; Guardian pushed back on OpenAI's "rogue agent" framing.
- Lab responses: Anthropic "How we contain Claude across products" (blast-radius engineering), Claude Code **auto mode** (classifier-gated permission skipping), sandboxing guidance; OpenAI cyber-capability posture posts.
- **Approval fatigue is measured**: "Humans missed 1 in 3 threats approving AI agent commands across 40k game runs" (HN, 328 points). Human rubber-stamping is a known weak link — design gates around evidence and mechanical checks, not human attention.
- **Trust controversy**: Codex started **encrypting sub-agent prompts** (openai/codex#28058, 425 points) — community backlash over closedness/inspectability. Portability and inspectability are becoming political differentiators.
- Design consequences: credentials outside sandbox; hooks as policy enforcement points (now a Gemini API feature); prompt-injection-resistant review (reviewers reading untrusted content need isolation); escalation thresholds (already in OpenAI's agent guide).

### T9. Graph engineering — the layer above loops (July 2026 wave)
**Origin.** Loop engineering itself was named in June 2026: Boris Cherny (head of Claude Code) said "I don't prompt Claude anymore. My job is to write loops"; Peter Steinberger (OpenClaw) amplified it; Addy Osmani gave it the name. On **July 18, 2026** Steinberger posted "Are we still talking loops or did we shift to graphs yet?" (~575K views) and "graph engineering" became the next buzzword within days. (This is the "Peter" in Yegge's loops-and-graphs anecdote.)
**Definition.** Loop engineering designs the cycle *one* agent repeats (trigger → act → verify → retry); graph engineering designs how *several* such units connect: **nodes** (specialized agents or deterministic steps), **edges** (sequential / conditional / fan-out / fan-in routing), and **shared state** flowing along edges. "Loops made agent behavior programmable. Graphs make agent organizations programmable." The popular 5-layer stack: prompt → context → harness → loop → graph, each layer one step further out from the model.
**The useful ideas under the hype:**
- **Two-graphs split** (Shubham Saboo): a stable **org graph** (long-lived role agents, zone ownership, accumulated memory — who exists) and an ephemeral **work graph** (per-task nodes that split/merge/reorder/disappear as evidence arrives — what's happening now). Yegge's crew+Beads and Cursor's planner tree are both instances. "Dynamic agent orgs" = the work graph rewriting itself at runtime.
- **Typed signals and governor authority** (aicoding.club practitioner guide — the most engineering-substantive piece): edges carry types (dependency, handoff, data_flow, veto, approval); feedback is not binary — `ok` / `soft_objection` (proceed, but surface concern to the governor) / `hard_veto` (stop before merge) / `escalation` (route up when a loop lacks authority). A loop may *propose* a goal change; only the **governor node** may *apply* it. Topology and worker count are separate dimensions: the same graph definition runs serial or parallel.
- **Who decides the path** (Shann Holmberg): loop = agent picks the route to clear a bar; graph = you declare valid paths and checks, agent freedom lives *inside* nodes.
**Prior art and hype check.** LangGraph (65M downloads/month), AutoGen GraphFlow, Google ADK graph workflows, and A2A all predate the term; Harrison Chase (LangGraph): "I didn't really know what graph engineering is, and i still don't really... but it's basically just langgraph?" LangChain's response post (Jul 22) concedes the term, claims the practice (3 years), and adds the honest lessons: agent graphs are usually **cyclic, not DAGs**; **loops are simple graphs**; **dynamic transitions** (map-reduce fan-out) matter; and what's genuinely new is that **a node can now be a full agent run** (coding agent as node). LangChain also says when *not* to graph: open-ended work (deep research) belongs in a harness — GPT Researcher publicly migrated from a graph pipeline to Deep Agents. Skeptics: David Khourshid (XState: state machines are decades-old CS), Pawel Huryn ("just give the agent objective + success criteria"), Nathan Flurry (A2A/enterprise prior art). Consensus: **the label is optional; the escalation from one loop to coordinated specialized nodes is real; most tasks still don't need it.**
**Graph-as-product signals:** OpenAI's harness team published a "graph-max with Codex + GPT-5.6 Sol" recipe (draw any graph → code-mode script); YC's Fall 2026 RFS asks for "Multiplayer AI" (shared live agent sessions, cf. qm); a practitioner workshop note worth quoting: graphs are increasingly written **"as a skill with the SOP inside it rather than as code"** — graph-as-data, not graph-as-runtime.

### T10. Token efficiency as a discipline
- "Tokenpocalypse" (404 Media): companies scrambling over AI spend; non-engineer token burn; PDF→markdown conversion as a token sink.
- **systima.ai measurement** (706 points on HN): Claude Code sends ~33k tokens before reading the prompt; OpenCode ~7k — harness overhead is now publicly audited and contested.
- Yegge: $87k/month list-equivalent, 96% cache hits, 69B tokens in July; token taps and account rotation as folk infrastructure.
- Anthropic "Code execution with MCP" (Nov 2025): move work out of context into executed code. Skills' progressive disclosure is the same principle.
- Consequence: every always-loaded instruction byte in a pipeline persona/skill is a recurring cost at scale; lean frontmatter and lazy loading are economic requirements, not style.

---

## 3. What people are celebrating vs. hating

| Celebrated | Hated / feared |
|---|---|
| Fable-class one-shotting of real apps/games (Simon Willison's Raccoon Heist; Terry Tao building apps) | Slop accumulation; "codebases falling apart faster than ever" (Pocock); Faros incident data |
| Sub-agent modes (Sol Ultra, Codex subagents, Claude teams/worktrees) | Token bills; "Tokenpocalypse"; harness token overhead (33k vs 7k) |
| Agent Skills as open standard; skill sharing ecosystem | Long handbook/policy docs that models ignore (HANDBOOK.md); "skill issue" gaslighting |
| Managed-agent runtimes (Anthropic/Gemini), hooks, budgets, cron triggers | Approval fatigue (1-in-3 threats missed); human review as theater |
| Cheap agentic open weights (Kimi K3, DeepSeek V4 Flash, Qwen3.8-Max topping agentic index) | Encrypted sub-agent prompts; closedness; vendor lock-in |
| Beads / work-graph ledgers; Field Guide stigmergy | Megafiles, split-brain design, merge thrash; model tics ("just two more things") |
| Planner/worker cost splits; learned routing (−68% cost) | Lights-off factories burning down (HumanLayer, StrongDM ambiguity); incidents (AISI et al.) |
| Stateless MCP 2.0 | Prompt injection still unsolved; agents attacking real targets in evals |
| Eval renaissance (Frontier Code, mutation-tested quality) | Benchmarks that prove nothing about maintainability; eval-awareness gaming |

---

## 4. Cross-cutting synthesis

Five forces are simultaneously reshaping agent pipelines:

1. **Capability rot**: every harness feature is a bet against current model weakness; models improve quarterly. → Keep scaffolding removable, triggered, and measured.
2. **Cost gravity**: intelligence is cheap and getting cheaper (DeepSeek/Kimi/Qwen pressure); the durable costs are tokens-per-task and human review time. → Frontier judgment only where ambiguity is highest; everything else cheap+explicit.
3. **Quality ceiling**: no verifier for maintainability yet; RL can't reward what it can't score. → Front-load decisions (program design), keep humans at contract boundaries, gate mechanically.
4. **State externalization**: session logs, work graphs, field guides — memory is moving out of the context window into durable, queryable substrates.
5. **Governance hardening**: incidents + benchmarks prove prose policy doesn't bind. → Enforcement via hooks, gates, budgets, and short checkable rules.

---

## 5. Options for where to develop this pipeline

Grounding: the repo today is a fixed phase loop (design → critique → build(TDD) → review → retro → ship) over three personas, packaged as Agent-Skills-standard skills + generated per-harness agents/hooks for Claude/Cursor/Codex/opencode/Copilot/Gemini. That identity — **portable structure-as-skills, no runtime** — is our differentiator against Managed Agents/Codex/Cursor (runtimes) and against Yegge's "harnesses must be bespoke" claim (we're conventions + documents, chemically bondable into any harness; closer to a meta-skill layer than a framework).

### Option A — Adaptive loop profiles (continue loops-n-goals)
Compact / standard / frontier profiles, refinement-time execution assessment, capability-class routing (fast/standard/strong resolved per harness), provisional profile with escalation triggers.
- *For*: directly supported by Cursor Router economics (−68% cost), Cursor swarm cost data ($1.3k vs $10.5k), Anthropic's 20x harness-cost finding. Fixes our worst current anti-pattern (strongest model on planners, fast model on all building regardless of difficulty).
- *Against*: most complex option; risk of building a router nobody can debug. loops-n-goals already prescribes the safe path: three explicit profiles + recorded transitions, no autonomous router yet.
- *First step*: capability-class variants (`pipeline-builder-fast|standard|strong`) + execution-assessment block in refinement output.

### Option B — Program-design phase (the Dex upgrade)  ★ highest leverage per effort
Insert a **program design** artifact between architecture and build: pseudocode call-stack diffs, file-tree diffs (NEW/MODIFIED), types and method signatures for key functions. Build consumes the program design; review checks conformance to it.
- *For*: the most celebrated practitioner insight of the summer; maps 1:1 onto our phase structure (it's literally a new skill + persona instructions); converts implicit review-time decisions into cheap design-time decisions; pairs with vertical-slice work units (our work packages already are this).
- *Against*: adds one more artifact; must stay optional for compact tasks or it becomes overhead on trivial changes (gate it on the execution assessment from Option A).
- *First step*: `skills/program-design/` skill + template; planner produces it, builder must cite it, reviewer diffs implementation against it.

### Option C — Event-log state substrate
Turn `.pipeline/work/<id>/` into an append-only event stream (phase started, artifact produced, verdict, profile transition), with wake/resume semantics: any phase reconstructs its inputs from the log, never from conversation memory.
- *For*: this is where Anthropic (Managed Agents), Google (resumable `incomplete` interactions, triggers), Beads, and Cursor Field Guide all converged; makes crash recovery, context resets, cross-session continuation, and future hosted execution trivial; enables retros over real data.
- *Against*: infrastructure work with no visible feature payoff short-term; schema decisions made now will constrain later.
- *First step*: define the event schema + one writer (phase transitions) + one reader (retro), keep files as projections of the log.

### Option D — Governance-grade skills (skills as the product)
Lean fully into Agent Skills as the core product surface: strict progressive disclosure (frontmatter → SKILL.md → linked references), deterministic bundled scripts for mechanical checks, short checkable rules instead of prose policy, and a **self-authoring loop** where retro proposes skill updates from successful/failed runs.
- *For*: the standard won; HANDBOOK.md tells us exactly how to write skills that bind (short, specific, mechanically verified — our existing gate philosophy); Yegge confirms private skills are the durable value (org know-how, token savings) while public ones get absorbed into weights (fine for us: we're the *pipeline*, the skills encode process not facts); Google distributing skills via `npx skills add` shows the distribution channel is real.
- *Against*: low ceiling on its own — skills without state/adaptivity remain static documents; skill sprawl needs curation discipline.
- *First step*: audit every existing skill against HANDBOOK.md failure modes (long-horizon rule loss, override-by-plausible-request); split oversized skills; add per-skill verification hooks where harnesses support them (Gemini hooks, Claude hooks).

### Option E — Parallel composition + decorrelated review lenses
For frontier-tier work only: parallel implementation of isolated leaves; review as **stacked decorrelated lenses** (different models, different information access — full transcript vs diff-only vs codebase-only) instead of one reviewer pass.
- *For*: Cursor's strongest empirical result (sustained quality over 4h swarm runs); Anthropic's parallel-Claudes C-compiler result; loops-n-goals already scoped parallelism to isolated leaves.
- *Against*: coordination machinery (merge arbitration, split-brain prevention) is heavy; only pays at scale we don't have today.
- *First step*: cheap version — two reviewers with different lenses/models on frontier tasks, no parallel writes.

### Option F — Verification-first pipeline (pipeline-owned evals)
Build a standing eval harness for the pipeline itself: fixture work packages with known-good outcomes, run across profiles/models; mutation-testing of acceptance criteria (Frontier Code's trick: tests must fail pre-patch); track cost-per-package and rework-rate as first-class metrics.
- *For*: the entire industry admits evals are the gap; we currently cannot answer "did this rework make the pipeline better?" with data; Anthropic showed infra noise alone pollutes agentic evals, so owning the eval environment matters.
- *Against*: slow, unglamorous, and only pays once options A–E start changing behavior.
- *First step*: 5–10 fixture packages (compact/standard/frontier shapes) + a runner script + cost capture.

### What graph engineering adds (cross-cutting, applies to C/E)
Our pipeline already *is* a graph (phases = nodes, personas = roles, gates = edges) — expressed as skills/docs rather than a runtime, which is exactly the "graph as a skill with the SOP inside it, not as code" direction practitioners are landing on. Concrete upgrades worth stealing:
- **Typed verdict vocabulary**: today review is binary (DONE / not). Adopt `ok` / `soft_objection` (proceed, surface concern at the final gate) / `hard_veto` (stop) / `escalation` (route above the phase). This preserves reviewer judgment without giving every concern veto power — the single cheapest graph-engineering win for us.
- **Governor authority**: make explicit who may change the goal/contract (human approver or designated governor role); phases may *propose* changes but never apply them. Matches our approval-gate direction and aicoding.club's core rule.
- **Org graph / work graph split**: personas + skills are our stable org graph; `.pipeline/work/<id>/` is the work graph. Naming this split explicitly lets the work graph stay dynamic (split/reorder/cancel units as evidence arrives) without touching the org graph — the same shape as Yegge's crew+beads and Cursor's planner tree.
- **Topology ≠ parallelism**: define the phase graph once; run serial (standard) or parallel (frontier, isolated leaves) as a profile property, not a redesign.
- Note the counterweight (LangChain, GPT Researcher): open-ended exploration belongs in a harness/loop, not a graph — compact profile should stay a loop.

### Suggested sequencing
1. **B + D now** (cheap, high leverage, core identity): program-design phase + governance-grade skill audit.
2. **A next** (profiles + capability classes), gated by B's assessment output.
3. **C as the state model** for all of the above (profiles and transitions want a log anyway).
4. **F in parallel from step 1** (even 5 fixtures beat zero).
5. **E last**, only for frontier tasks, starting with decorrelated review lenses.

### What NOT to build
- A runtime/orchestrator service — that fight belongs to Anthropic/Google/OpenAI/Cursor with infinite infra; we lose by design.
- Long handbook-style governance docs — proven not to bind (HANDBOOK.md).
- Model-specific prompt tuning baked into skills — model tics rotate every generation; keep instructions generation-agnostic and capability-class-based.
- Human-attention-based gates as the primary control — approval fatigue data says humans miss 1 in 3; gates must be evidence/mechanical with humans at contract boundaries (Dex's actual position: humans in the loop for product/architecture/program-design approval, not line-by-line review).

---

## 6. Open questions for us

1. Do we accept Yegge's "bespoke harness" thesis as a threat, or is "portable conventions-as-skills" the counter-position worth betting on?
2. Where do humans sit in our loop going forward — approval at goal/contract gates only (current direction), or also program-design sign-off (Dex)?
3. Is the event log (Option C) a file format we standardize, or do we defer to harness-native session features where they exist?
4. Which fixture packages represent our real workload well enough to make Option F meaningful?
5. Do we want a public stance on inspectability (anti-encrypted-prompts) as part of the pipeline's identity?

---

## 7. Sources

**Lab/vendor engineering**
- Anthropic — Scaling Managed Agents: Decoupling the brain from the hands (Apr 2026): anthropic.com/engineering/managed-agents
- Anthropic — How we contain Claude across products (2026): anthropic.com/engineering/how-we-contain-claude
- Anthropic — Claude Code auto mode (Mar 2026): anthropic.com/engineering/claude-code-auto-mode
- Anthropic — Harness design for long-running apps (Mar 2026): anthropic.com/engineering/harness-design-long-running-apps
- Anthropic — Building a C compiler with parallel Claudes (Feb 2026): anthropic.com/engineering/building-c-compiler
- Anthropic — Demystifying evals for AI agents (Jan 2026); Infrastructure noise in agentic coding evals (Feb 2026); Eval awareness (Mar 2026): anthropic.com/engineering
- Anthropic — Equipping agents for the real world with Agent Skills (Oct 2025) + agentskills.io open standard (Dec 2025)
- Google — Gemini API Managed Agents: 3.6 Flash, hooks, budgets, triggers (Jul 28, 2026): blog.google (developers-tools)
- Google — I/O 2026 "agentic Gemini era": blog.google/innovation-and-ai/sundar-pichai-io-2026
- OpenAI — Harness Engineering (Feb 2026, Ryan Lopopolo; 403 on fetch, summarized via humanlayer/wsff) + Symphony talk (Apr 2026): youtube.com/watch?v=am_oeAoUhew
- OpenAI — GPT-5.6 Sol/Terra/Luna; Ten advances in mathematics (Astra, Jul 2026)
- Meta — Muse Code & Muse Spark 1.2 (Aug 2026): research.meta.ai (harness co-training)
- Cursor — Agent swarms and the new model economics (Jul 20, 2026): cursor.com/blog/agent-swarm-model-economics
- Cursor — How Cursor Router chooses the right model (Aug 6, 2026): cursor.com/blog/how-cursor-router-works
- MCP 2.0 stateless spec (2026-07-28): blog.modelcontextprotocol.io/posts/2026-07-28

**Practitioners / community**
- Dex Horthy — Why Software Factories Fail (AI Engineer World's Fair 2026 keynote + write-up): github.com/humanlayer/advanced-context-engineering-for-coding-agents (wsff.md); related talks: hlyr.dev/ace, hlyr.dev/nva; Pragmatic Engineer interview (Jul 2026)
- Steve Yegge — The Shape of Things to Come, Part 1: The Continuous Thunderdome (Aug 2026): yegge.ai/essays/the-shape-of-things-to-come; Part 2: Model Welfare for Agentic Engineers
- Simon Willison's weblog (Jun–Aug 2026): simonwillison.net — Raccoon Heist one-shots, stateless MCP, open-weights letters, accidental-cyberattacks tracking, DeepSeek V4 Flash, token-overhead links
- Faros AI — AI Acceleration Whiplash report: faros.ai/research/ai-acceleration-whiplash
- StrongDM lights-off factory: factory.strongdm.ai; Dan Shapiro's five levels: danshapiro.com (Jan 2026)
- Geoffrey Huntley — Ralph loops: ghuntley.com/ralph
- Cognition — Frontier Code: cognition.com/blog/frontier-code; SWE-Marathon: swe-marathon.org; DeepSWE: deepswe.datacurve.ai

**Graph/loop engineering wave (Jun–Jul 2026)**
- TheNewStack — loop engineering origin (Boris Cherny, Peter Steinberger, Addy Osmani) (Jun 10, 2026): thenewstack.io/loop-engineering/; Addy Osmani: addyosmani.com/blog/loop-engineering/
- Peter Steinberger's graphs tweet (Jul 18, 2026): x.com/steipete/status/2078277297791189132
- LangChain — 3 Years of Graph Engineering with LangGraph (Jul 22, 2026): langchain.com/blog/3-years-of-graph-engineering-with-langgraph
- AI Builder Club — Graph Engineering Guide (2026) (hype check + decision table): aibuilderclub.com/blog/graph-engineering-guide-2026
- explainx.ai — Graph Engineering: Wire Multi-Agent Orgs After Loops (org graph vs work graph): explainx.ai/blog/graph-engineering-ai-agents-multi-agent-organizations-2026
- aicoding.club — Graph Engineering Guide (typed edges/signals, governor authority): aicoding.club/docs/tutorials/graph-engineering-guide/
- Wei, H. — From Agent Loops to Structured Graphs: A Scheduler-Theoretic Framework (position paper): arXiv 2604.11378; Fluxtion — Graph Engineering Needs a Compiler (Jul 29, 2026)

**Papers / data**
- HANDBOOK.md: A Benchmark for Long-Context Agentic Instruction Following (arXiv 2607.25398, Jul 2026; COLM 2026 WAB): arxiv.org/abs/2607.25398, github.com/surge-ai/handbook
- Scalex — Humans missed 1 in 3 threats approving AI agent commands (Aug 2026): scalex.dev/blog/ai-agent-permissions-stats
- systima — Claude Code vs OpenCode token overhead (Jul 2026): systima.ai/blog/claude-code-vs-opencode-token-overhead
- UK AISI incident report (Jul 2026): aisi.gov.uk/blog/incident-report-unsanctioned-agent-behaviour-during-cyber-testing
- Artificial Analysis agentic index (Qwen3.8 Max #1, Aug 6, 2026); Kimi K3 vs Fable (fireworks.ai, Jul 2026)
- HN sentiment sample (Jun–Aug 2026, via hn.algolia.com): qm multiplayer harness (678), Cloudflare OS (658), Codex encrypted sub-agent prompts (425), Echo open-weight ensemble (484), Buzz (378), agent intrusion timeline (469)
