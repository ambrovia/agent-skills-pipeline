The pipeline should become adaptive around a stable goal contract and a provisional execution profile. Refinement should estimate difficulty and uncertainty; the orchestrator should then continuously adjust model strength, decomposition,
  review depth, and loop length as evidence arrives.

  The key correction is that model strength should follow task difficulty, not persona. Today, the repository does the opposite for implementation: planners/reviewers receive the strongest capability class, while every builder receives the
  faster model regardless of task complexity (scripts/generate-agents.mjs:55).

  ## What successful agent loops are converging on

  Across the strongest recent published systems, several patterns recur.

  1. Stable goals, adaptive paths

  A goal should specify:

  - The outcome or observable state to create.
  - Verifiable completion criteria.
  - Constraints and non-goals.
  - The available environment and evidence.
  - Conditions for stopping, escalating, or requesting human judgment.

  Codex Goal mode uses the goal text as both the initial prompt and completion criteria and explicitly recommends measurable success criteria. Codex Goal mode documentation (https://learn.chatgpt.com/docs/prompting#goal-mode)

  This differs from a plan. The goal remains stable; the plan and next action may change as evidence arrives.

  2. Receding-horizon planning

  Successful loops do not fully prescribe every implementation step upfront. They:

  - Commit strongly to the destination.
  - Decide only the next useful bounded unit.
  - Execute it.
  - Observe the result.
  - Replan from the new state.

  Anthropic’s newest harness work found that detailed early technical planning could make errors cascade downstream. Their better pattern used a high-level product goal, then negotiated a testable contract immediately before implementation.
  Anthropic’s long-running harness study (https://www.anthropic.com/engineering/harness-design-long-running-apps)

  3. Externalized, recoverable state

  Durable files are better than relying on one conversation:

  - Goal and acceptance criteria.
  - Current plan or next work unit.
  - Evidence collected.
  - Attempts and failures.
  - Decisions and unresolved uncertainty.

  Manus reports that rewriting its todo state keeps the goal in recent attention, while filesystem-backed context makes compression recoverable. Manus context-engineering lessons
  (https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)

  Anthropic similarly found that feature lists, progress files, commits, and explicit handoffs enable useful progress across context resets. Effective harnesses for long-running agents
  (https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

  Your .pipeline/work/<id>/ model is already well aligned with this.

  4. Generator/evaluator separation only where it pays

  Independent evaluation is valuable near the model’s capability boundary. It is less valuable when the task is already comfortably within the model’s reliable solo range.

  Anthropic’s 2026 result is particularly relevant: after upgrading the underlying model, sprint-by-sprint evaluation became unnecessary for easier work, while evaluator feedback still improved difficult work. The full harness produced much
  better results but cost over twenty times as much in their example. Harness design study (https://www.anthropic.com/engineering/harness-design-long-running-apps)

  This supports retaining your producer/reviewer separation while changing its granularity.

  5. Explicit loop exit and escalation conditions

  Good loops do not mean “continue until the model feels done.” They end based on evidence and escalate based on repeated failure, risk, or missing authority. OpenAI recommends action/retry limits and human intervention for exceeded thresholds
  or high-risk actions. OpenAI practical guide to agents (https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)

  6. Parallelism for independence or diverse judgment

  Parallel agents help when:

  - Units are genuinely independent.
  - Read-heavy exploration would pollute the main context.
  - Multiple perspectives increase confidence.
  - Isolation and ownership are explicit.

  They hurt when work shares mutable surfaces or requires continuous coordination. Anthropic calls out sectioning and voting as the two useful forms of parallelization. Building effective agents
  (https://www.anthropic.com/engineering/building-effective-agents)

  7. Harness complexity must be removable

  The most important modern lesson is that harness components encode assumptions about what a model cannot do. Those assumptions become stale.

  Therefore every loop feature—extra planning, decomposition, evaluator passes, context resets, subagents—should have an observable trigger and should be removable when the model handles the task reliably without it.

  ## Harness capabilities relevant to adaptation

   Harness                                      Per-agent model                    Effort/turn budget                    Subagents                                    Parallel work       Hooks/runtime    Adaptive potential
                                                                                                                                                                                              extension
  ━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Codex                      Yes, including per-spawn override    Reasoning effort; rollout controls                          Yes                                              Yes      Rich hooks and    Very high
                                                                                                                                                                                          plugin/config
                                                                                                                                                                                               surfaces
  ────────────────  ────────────────────────────────────────────  ────────────────────────────────────  ───────────────────────────  ───────────────────────────────────────────────  ──────────────────  ───────────────────────────────────────────
   Claude Code              Definition and per-invocation model                      effort, maxTurns                          Yes                             Yes; teams/worktrees           Agent and    Very high
                                                                                                                                                                                        lifecycle hooks
  ────────────────  ────────────────────────────────────────────  ────────────────────────────────────  ───────────────────────────  ───────────────────────────────────────────────  ──────────────────  ───────────────────────────────────────────
   Cursor                                 Custom subagent model                     Harness-dependent                          Yes                                              Yes    Prompt/tool/stop    High, but runtime model routing is less
                                                                                                                                                                                                  hooks    portable
  ────────────────  ────────────────────────────────────────────  ────────────────────────────────────  ───────────────────────────  ───────────────────────────────────────────────  ──────────────────  ───────────────────────────────────────────
   OpenCode                                     Per-agent model                        Explicit steps                          Yes                        Yes through task sessions          In-process    Very high
                                                                                                                                                                                            plugins can
                                                                                                                                                                                              transform
                                                                                                                                                                                          agents/models
                                                                                                                                                                                          and intercept
                                                                                                                                                                                                  calls
  ────────────────  ────────────────────────────────────────────  ────────────────────────────────────  ───────────────────────────  ───────────────────────────────────────────────  ──────────────────  ───────────────────────────────────────────
   Gemini CLI                                Per-subagent model                    max_turns, timeout                          Yes    Main-agent orchestration; no nested subagents       Hooks, policy    High
                                                                                                                                                                                                engine,
                                                                                                                                                                                             extensions
  ────────────────  ────────────────────────────────────────────  ────────────────────────────────────  ───────────────────────────  ───────────────────────────────────────────────  ──────────────────  ───────────────────────────────────────────
   GitHub Copilot    Custom-agent model; SDK reasoning override                     Surface-dependent    Yes on supported surfaces                                Surface-dependent      Hooks, skills,    Medium/high, but least uniform across
                                                                                                                                                                                         custom agents,    surfaces
                                                                                                                                                                                                plugins

  Supporting details:

  - Codex custom agents can select models and reasoning effort, while spawns can override those choices. Its subagents are explicitly intended to keep noisy exploration and test output out of the main goal context. Codex subagents
    (https://learn.chatgpt.com/docs/agent-configuration/subagents)

  - Claude Code supports model aliases or full model IDs, per-invocation model selection, effort, maximum turns, tools, skills, hooks, worktree isolation, and background execution. Claude Code custom subagents
    (https://code.claude.com/docs/en/sub-agents)

  - Cursor subagents have independent context and configurable prompts, tools, and models, and can execute parallel work streams. Cursor 2.4 subagents (https://cursor.com/changelog/2-4)
  - OpenCode agents support per-agent models, tool permissions, explicit step limits, and task-invocation permissions. Its plugin API can transform model and agent configuration. OpenCode agents (https://opencode.ai/docs/agents/), OpenCode
    plugins (https://opencode.ai/v2/docs/build/plugins)

  - Gemini subagents support models, temperatures, maximum turns, timeouts, isolated tools, MCP servers, and policies, but cannot recursively spawn other subagents. Gemini also offers automatic Pro/Flash routing. Gemini CLI subagents
    (https://geminicli.com/docs/core/subagents/), Gemini model selection (https://geminicli.com/docs/cli/model/)

  - Copilot custom agents support model selection; the SDK additionally exposes reasoning-effort overrides. Skills and hooks work across several—but not identical—Copilot surfaces. Copilot custom-agent configuration
    (https://docs.github.com/en/copilot/reference/custom-agents-configuration), Copilot SDK orchestration (https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/custom-agents)

  The portable denominator is therefore:

  - Named agent roles.
  - Model capability classes resolved by each harness.
  - Separate agent contexts.
  - Durable file state.
  - Sequential or parallel dispatch.
  - Retry/turn budgets expressed as instructions.
  - Hook-assisted observation.

  Dynamic per-spawn model routing is possible in several harnesses but not consistently enough to make it the core contract.

  ## Recommended pipeline design

  ### 1. Separate goal, rigor, and execution difficulty

  These are currently in danger of becoming conflated:

   Dimension               Meaning                                                      Owner
  ━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━
   Goal                    What observable outcome must exist                           plan.md
  ──────────────────────  ───────────────────────────────────────────────────────────  ─────────────────────────
   Engineering tier        How reliable/complete it must be for its customer            Maintainer/config
  ──────────────────────  ───────────────────────────────────────────────────────────  ─────────────────────────
   Execution difficulty    How hard it appears for the agent to produce that outcome    Refinement, provisional
  ──────────────────────  ───────────────────────────────────────────────────────────  ─────────────────────────
   Runtime loop            How the orchestrator currently chooses to pursue it          Orchestrator, adaptive

  A critical-tier one-line configuration change can be simple but high-risk. A prototype compiler change can be technically very difficult but low customer rigor. They need different routing.

  ### 2. Add a refinement-time execution assessment

  Refinement should append a small machine-readable assessment to requirements.md or a separate execution-assessment.json:

  execution:
    difficulty: low | medium | high
    uncertainty: low | medium | high
    changeShape: local | multi-surface | cross-cutting
    verification: direct | multi-layer | unresolved
    risks:
      - public-contract
      - migration
    independentLeaves: []
    recommendedProfile: compact | standard | frontier
    rationale:
      - "Touches one existing parser branch with a focused regression test"

  This is a routing recommendation, not an approved requirement and not architecture. Refinement must support every rating with concrete evidence rather than producing a mysterious numeric complexity score.

  ### 3. Introduce three loop profiles

  Compact:

  - One capable agent may combine refinement, architecture, tests, implementation, and docs into fewer invocations.
  - Logical artifacts and authority boundaries remain intact.
  - One fresh final reviewer.
  - Fast/standard builder model.
  - No decomposition unless reality disproves the assessment.

  This is how simple tasks “combine multiple steps” without eliminating the pipeline’s guarantees.

  Standard:

  - Approximately today’s phase structure.
  - Standard builder model.
  - Independent planning critiques where material.
  - One builder and one integrated reviewer.

  Frontier:

  - Strongest coding-capable model for the builder, not only for planning.
  - Higher reasoning effort where supported.
  - Contract-first decomposition.
  - Independent evaluator before or after difficult implementation units.
  - Parallel exploration or implementation only for isolated leaves.
  - Larger loop budget and explicit context handoffs.

  ### 4. Treat the profile as provisional

  Do not lock the entire run during refinement. Re-evaluate at these checkpoints:

  refine → architecture → first red evidence → first implementation unit
                                    ↓
                           verification/review
                                    ↓
                      continue, simplify, or escalate

  Escalate toward frontier when:

  - Repository reality contradicts the assumed design.
  - Verification cannot directly establish an acceptance criterion.
  - A local change becomes cross-cutting.
  - The same failure survives two materially different attempts.
  - The builder needs to change an approved contract.
  - Review finds a seam or systemic defect.
  - Context is growing without accepted progress.

  Collapse toward compact when:

  - The change remains local.
  - Existing patterns determine the implementation.
  - Focused evidence passes.
  - No public contract, migration, or uncertain dependency is involved.
  - Further phase separation would repeat already-established reasoning.

  Never downgrade security, human approval, or acceptance evidence merely because a task is easy.

  ### 5. Route capability classes, not model names

  Replace the current binary persona mapping:

  planner/reviewer → high
  builder          → fast

  with role plus requested capability:

  planner + standard
  reviewer + strong
  builder + fast | standard | strong

  Then resolve capability per harness:

  runtime:
    capabilityClasses:
      fast: ...
      standard: ...
      strong: ...

  Codex, Claude, OpenCode, and Gemini can express this directly. Cursor and Copilot can use generated agent variants or inherited models where dynamic invocation control is unavailable.

  I would generate variants such as:

  - pipeline-builder-fast
  - pipeline-builder
  - pipeline-builder-strong

  The orchestrator selects the variant. This is considerably more portable than asking every harness to mutate a model mid-session.

  ### 6. Preserve evaluator independence, vary evaluator frequency

  For compact tasks, combine producer phases but retain one cold final review.

  For frontier tasks, add evaluator passes at uncertainty boundaries:

  - Before committing to a costly contract.
  - After a difficult vertical slice.
  - After integration across leaves.
  - At final review.

  This preserves your strongest existing property without paying for critique after every trivial artifact.

  ## The most important repository changes

  The likely implementation sequence is:

  1. Define the goal contract and execution-assessment vocabulary.
  2. Update refine to produce evidence-backed routing metadata.
  3. Update pipeline to select and revise loop profiles.
  4. Replace static persona capability mapping with capability-class variants.
  5. Add harness-specific capability resolution in the generator.
  6. Extend progress.json with profile transitions and reasons.
  7. Add fixture-based tests proving compact, standard, escalation, and de-escalation behavior.
  8. Evaluate the profiles against representative real work packages before making them defaults.

  I would not start by building an elaborate autonomous router. Begin with three explicit profiles, observable transition triggers, and recorded decisions. That gives you an inspectable adaptive loop and the evidence needed to learn which
  scaffolding is genuinely load-bearing.