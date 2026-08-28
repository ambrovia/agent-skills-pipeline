# Phase 2 proposal — the rigidity fix

Date: 2026-08-27. Status: **proposal, awaiting maintainer approval.** Implements Phase 2 of
`roadmap.md` (ideas 2, 3, 6, 8, 13, 16, 19, 21, 22) against the tree after Phase 1 (#38).
Reached by maintainer interview rather than desk design, because four of `work-groups.md`'s
open decisions live in this phase; the steering record is the appendix.

## Framing

Phase 1's exit measurement never ran, and the reason is the finding: **the pipeline has grown so
rigid it currently hurts more than it helps**, so no real work goes through it and no pilot data
exists. Measurement cannot gate Phase 2 — Phase 2 is what makes the pipeline usable enough to
measure. Session-lab before/after gates Phase 3 instead.

The deeper diagnosis is the same in both directions the pipeline has failed. It was built as a
dark factory: full autonomy, with the models that produce also being the models that challenge.
Work was built that nobody needed, and work that was never built went live. More gates is not
the fix — the concept gate was already mandatory when both happened. The fix is that **the plan
belongs to the human**, and the agent stops exactly where it would otherwise have to supply its
own taste.

## The design

Five rules carry the phase.

1. **The plan is the human's.** One artifact, 50–100 lines, plain language, written *with* the
   maintainer out of a deep understanding of what they want and what their taste for it is. It
   holds the user needs and how the program works. Today's `/work-planning`-authored `plan.md`
   goes.
2. **Two interviews, either or neither.** `/refine` interviews on user needs; `/program-design`
   interviews on how the program works. Both are orchestrator-conducted discussions, not
   handoffs. Separate skills so a change with clear needs and a non-obvious approach runs only
   the second, and a trivial change runs neither.
3. **Structure and gates are negotiated per item and written into the plan.** Not defined by the
   plugin. Plan the whole shape when it is already clear; otherwise plan the next few steps — but
   **always at least as far as the next gate**. The agent is never running with no gate ahead of
   it. That is the anti-run-off mechanism, and it is agile rather than waterfall.
4. **Unattended running is decided per item, not by phase.** Where the plan already records the
   maintainer's answer to what should happen, the agent runs freely. Where it does not, a gate
   belongs — and the dials, not the agent's own assessment, decide where those gaps are likely.
   Such points can occur several times in a run or not at all.
5. **Four dials, three of them per item.** Complexity decides orchestration, ambiguity decides
   ceremony, exposure decides scrutiny — all three set by human and agent together, defaulting to
   the shallow end and re-questioned at every step. `engineering.tier` stays global in config and
   decides how good the code must be. Taste moments fall out of the three per-item dials rather
   than being estimated separately.

### The dials

**One global dial**, set in config and rarely touched:

| dial | the question | governs |
|---|---|---|
| `engineering.tier` | how mature is the product? | how good the **code** must be — reliability, tests, error handling, security |

**Three per-item dials**, estimated with the maintainer at the start and re-questioned at every step:

| dial | the question | governs |
|---|---|---|
| **complexity** | how big is the work? bugfix → feature → suite → product | **orchestration** — how the work is broken down, how many agents run, how waves and slices are staged |
| **ambiguity** | how clear is the topic? established context → new context with little knowledge → not even knowing what we want | **ceremony** — how much interview, whether design and architecture rounds run at all, whether planner agents are dispatched to reduce uncertainty |
| **exposure** | how far does this reach? internal detail → user-facing surface → public contract | **scrutiny** — how independent review must be, how deep it goes, whether critique runs at all |

The three are orthogonal, and `journeys.md` already showed why collapsing them fails: a list of 100
bugs is high complexity with near-zero ambiguity, and an architectural governance linter is low
complexity with high ambiguity. A pipeline keyed on size alone drowns the bug list in ceremony and
waves the linter through without the decisions it lives or dies by. Phase 2's earlier drafts merged
them into a single "working complexity" dial and reproduced exactly that error.

### Taste is content; the dials are scheduling

**Taste is what the maintainer answers in the interview** — how this kind of thing should be done,
how it should be designed, what they want and specifically do not want. It is recorded in the plan,
and it is what the orchestrator represents later in the run when the maintainer is not in the room.

**The dials decide scheduling** — how much ceremony, how many review points, how much orchestration.
Nothing judges taste in order to decide those. An earlier draft had the agent asking itself "is this
a taste moment"; that is the judgement an agent is worst at, and its self-serving direction is
obvious — an agent that wants to finish sees no taste moments anywhere. That judgement is gone.
**Gates are placed from the dials; taste is what fills them.**

The three heuristics that looked like a definition of taste were really descriptions of the dials:

| heuristic | dial |
|---|---|
| the bigger the change, the more likely it needs an answer | complexity |
| the wider the gap between what the plan says and what is actually in the docs and the code | ambiguity, discovered at runtime |
| the closer to the end user | exposure |

Taste then exists at two levels, and they serve different purposes:

- **Standing rules** (Cluster D) — short, concise durable conventions, like every other rule slot.
  Maintained mostly through `/retro` and `/compound`: retro observes where the agent's choice
  diverged from what the maintainer wanted, compound proposes an amendment, the maintainer approves
  it. Never written by a run on its own.
- **Per-item taste** — the maintainer's answers in *this* work package's interview, recorded in
  its plan. This is the live channel, and it is where most taste lives.

**Standing rules are not a lookup table for per-item questions.** If the agent needs to know the
maintainer's taste on something and this work package's plan does not answer it, it asks — it does
not go looking through other work packages, other plans, or past conversations, and it does not
stretch a standing convention to cover a question the maintainer has not been asked. Taste differs
from topic to topic and changes over time; an inferred answer is the agent supplying its own taste
with a citation. Where an answer can be enforced mechanically it should be, so the interview only spends
the maintainer's attention on what cannot be.

## Cluster A — The plan and the interviews (ideas 6, 8, 19, 22)

**`skills/refine/SKILL.md`** — stops spawning a planner to write `requirements.md`. Becomes the
user-needs interview, conducted by the orchestrator: rounds over the open questions, facts are
the agent's job (dispatch a subagent), decisions are the maintainer's, ends at confirmation. Its
output is the user-needs half of the plan.

**New `skills/program-design/SKILL.md`** — the same interview discipline applied to how the
program works: plain words, no contracts, no schemas, no technically-tied vocabulary. This is the
step `/architecture` currently fails at. It is *not* an artifact type; its output is the second
half of the plan.

**The plan.** One persistent, human-editable artifact, edited in place rather than appended to,
with a fixed skeleton and a 50–100 line budget. It reuses the freed name `plan.md`. Sections: user
needs, how the program works, how we work on this item (the negotiated structure and gates), and
**Confusions** — where execution found the plan unclear. Confusions is the per-item record of under-specification; it feeds
`/retro` and is the instrument that makes packages smaller and better defined over time.

**Scope containment.** Out-of-scope work discovered during execution becomes a new item with its
own acceptance criteria and a link back — never growth of the current one.

**`skills/work-planning/SKILL.md`** — keeps the registry and the dependency graph; stops writing
a plan. Contributes minimal starting instructions to get the interview going, and nothing that
pre-empts it.

## Cluster B — Ceremony audit (idea 21)

Every skill is audited for file-shape formalism. What survives is an idea of which documents
*could* exist and where they go — the ceiling of ceremony, not a requirement. What replaces the
templates is **thoughts, questions and ideas worth exploring**: what an agent could or should
consider, none of it always relevant.

Deleted: **`skills/refine-critique/`**, **`skills/design-critique/`**.

**`skills/architecture-critique/`** survives — it checks architecture against the plan, and it
carries the AI-slop and keep-it-simple critiques. Requested rather than looped, delta-scoped on
re-request, no attempt cap.

**`skills/lore/`** gets a refresh rather than a rewrite: only non-obvious things are described,
and descriptions stay concise and short.

Budgets, per idea 22, justified by human readability rather than tokens — a 1000-line document
does not get read, a 50-line one in plain language might:

| artifact | budget |
|---|---|
| the plan | 50–100 lines — the one artifact that must stay readable |
| design | short; it records a decision, not a specification |
| architecture | uncapped — a detailed technical interpretation of the plan, written only where scope and complexity make those definitions necessary |
| concept | none — thrown out as a document |

## Cluster C — Adaptive gates, critique, review (ideas 3, 13, 19)

**`skills/pipeline/SKILL.md`** is rewritten around the five rules. Specifically:

- **Roles.** The orchestrator conducts the interviews, so that later in the run it can represent
  the maintainer's thinking. The planner stops being a phase owner and becomes a subagent spawned
  **to keep the orchestrator's context clean** — it reads widely and returns a result. Subagents
  exist for context hygiene, not role separation.
- **Gates.** Removed as fixed lifecycle features; negotiated per item and recorded in the plan.
  The mandatory concept gate goes with them.
- **Critique is requested, not scheduled.** Re-critique only after a scope-bearing change;
  otherwise more critiques along the way, each seeing only the delta. Numbered retry loops and
  three-attempt caps are deleted — the observed failure is a fresh reviewer inside a loop finding
  new things, burning tokens instead of converging. Something small is simply not critiqued.
- **Review scales.**

  | change | review |
  |---|---|
  | tiny | none |
  | small | the orchestrator reviews it |
  | real | a fresh reviewer |
  | big | reviewed in phases |

  The table keys on complexity and exposure together. The orchestrator reviewing its own item's
  small changes gives up independence deliberately: independence stops mattering when exposure is
  low.
- **Fan-out.** Parallel only when the units share one topic and context — the same thing done
  many times. The cost of heterogeneous fan-out is not collision but context switching: four
  topics returning at random make the orchestrator chaotic, and it works best either focused or
  offloading completely.
- **Revocation.** When the plan changes while work is in flight, what happens is decided in
  discussion, scaled to the scope of the change — anywhere from killing the worker and the work
  to adjusting a little code. No automatic rule, and never a full reset that discards the work
  products.

## Cluster D — Taste as a rule (idea 19)

**`pipeline.config.yml`** gains a `taste` rule slot pointing at a maintainer-owned file under
`.pipeline/rules/`. It holds short, concise standing conventions and behaves like every other rule
slot: committed, read-only to every pipeline phase, never written by a run.

Its maintenance path is `/retro` → `/compound` → maintainer. **`skills/retro/SKILL.md`** records
where the agent's choice diverged from what the maintainer wanted, drawing on the plan's Confusions.
**`skills/compound/SKILL.md`** turns repeated divergence into a proposed amendment — which is what
compound already does for every other rule, proposing and never applying.
**`skills/setup/SKILL.md`** seeds the slot with the maintainer's approval.

A convention becomes standing because the maintainer approves it, never because a run inferred it.

## Cluster E — Hosts and the budget gate (ideas 2, 16)

**`docs/host-capabilities.md`** narrows to claude and codex, which decide where there is doubt;
speculative capability probing for the rest is not built. **Idea 16 (budget gate)** is resolved
as investigated and not feasible — token-usage exposure is unverified on every host and nothing
has changed since Phase 1. Recorded, no code.

## Cluster F — Context construction (idea 1, carried forward)

The snapshot is not a state viewer. It is **automated context construction for a fresh spawn** —
the mechanism that makes an empty-context agent cheap to start. That is worth keeping and worth
improving; what it cannot keep is a fixed idea of what context exists, now that structure is
negotiated per item.

**Structure becomes data, not code.** `progress.json` carries the item's artifact registry — what
exists, where it lives, what each thing is for — and `scripts/pipeline-snapshot.mjs` enumerates
from that registry instead of its hardcoded eight-entry list. The script stays deterministic and
free, and still handles any per-item shape, because the shape arrives as input. An agent doing
context construction was considered and rejected: it spends a spawn to save a spawn's reads,
which is the fork tax Phase 1 exists to remove.

**The value is in the hook, not the script.** A script nobody invokes does little; the power is the
context arriving automatically when an agent starts. So the injection hook is not optional machinery
to be dropped — it is where the whole mechanism pays off. Which hook, and whether it works, was
settled by testing rather than by reading.

**Injection moves from skill load to subagent spawn.** Tested on 2026-08-27 against Claude Code
2.1.247 and Codex 0.150.1 — a marker injected from a hook, the model asked whether it saw it, each
with a negative control (`docs/host-capabilities.md`).

- **`SubagentStart` works on both hosts and is subagent-scoped.** On claude the subagent saw the
  marker and the parent did not; on codex the same, matched on `agent_type`. This is the mechanism.
- **It is also the right moment.** The snapshot exists to make a fresh spawn cheap, and spawn is when
  the context should arrive. Skill load was always a proxy for it.
- **Skill-load injection cannot be the primary path.** Codex has no skill lifecycle event at all —
  SKILL.md is rendered statically from disk. It does work on claude (`PostToolUse` matcher `Skill`
  fires, tested), so it stays available as a claude-only supplement.
- **Plugin-distributed hooks work.** Tested on claude via `--plugin-dir` with the plugin's own
  `hooks/hooks.json`, for both `SessionStart` and `SubagentStart`. No separate user-level install
  step is needed.

**Three prior findings were wrong and are reversed.** Codex `SessionStart` stdout dropping was fixed
in `rust-v0.146.0` (openai/codex#35194); claude's `Skill` matcher does fire
(anthropics/claude-code#43630 does not reproduce); plugin `SessionStart` context does surface
(#16538 does not reproduce). Two of the three came from issue trackers that predated current
behavior — one closed as inactive rather than fixed. Test the host, do not read about it.

**A hard budget falls out.** Codex truncates injected context at 1,000 tokens and spills past 2,500.
The snapshot must emit pointers, not contents — Phase 1's stated intent, now with a number. Four
script rules follow from the codex source and are harmless on claude, so they apply everywhere:
always `exit 0`; never start stdout with `{` or `[` unless it is valid hook output; consume stdin;
stay inside the budget.

## Surface summary

| surface | change |
|---|---|
| `skills/pipeline/` | rewritten: interview-led, planned gates, taste moments, fan-out rule, scaled review, no loops or caps, revocation by discussion |
| `skills/refine/` | becomes the user-needs interview |
| `skills/program-design/` | **new** — the how-it-works interview |
| `skills/work-planning/` | keeps registry and graph; stops writing a plan |
| `skills/design/`, `skills/architecture/` | optional rounds, complexity-gated; architecture reframed as the technical interpretation of the plan |
| `skills/review/` | scaled by exposure |
| `skills/retro/`, `skills/compound/`, `skills/setup/` | taste recording, amendment, seeding |
| `skills/architecture-critique/` | survives; checks architecture against the plan plus slop/simplicity; requested, delta-scoped, no cap |
| `skills/lore/` | refreshed — non-obvious only, concise and short |
| `skills/write-tests/`, `write-code/`, `write-docs/`, `ship/` | ceremony audit only |
| `skills/refine-critique/`, `skills/design-critique/` | **deleted** |
| `personas/` → generated agents | planner becomes a context-lifting subagent; orchestrator gains interviewing and small-change review |
| `pipeline.config.example.yml` | `+ rules.taste` |
| `scripts/pipeline-snapshot.mjs`, `progress.json` | registry-driven instead of hardcoded; `progress.json` keeps strong structure and gains the artifact registry |
| `hooks/skill-load-inject.mjs` | retargeted to `SubagentStart` — the only injection point available on both hosts; skill-load stays a claude-only supplement |
| `docs/host-capabilities.md` | narrowed to claude + codex |

## Commit slicing

One PR into `rework/agent-skills`, ordered so each commit stands alone:

1. delete `/refine-critique` and `/design-critique`; trim `/work-planning` to registry + interview seed
2. `/refine` as the user-needs interview
3. new `/program-design` skill
4. the plan: skeleton, budget, Confusions, scope containment
5. `/pipeline` rewrite — dials, planned gates, taste moments, unattended rule, revocation
6. fan-out rule; critique on request with delta scope; review scaling
7. taste — config slot, `/setup`, `/retro`, `/compound`
8. ceremony audit across the remaining skills, with budgets
9. `progress.json` artifact registry; snapshot enumerates from it; injection retargeted to `SubagentStart`
10. host scope narrowed; idea 16 resolution recorded

## Out of scope

- **Idea 5** (artifact layout challenge) stays in Phase 4.
- **Ideas 7, 9, 10, 11** (refinement scaling, tracer bullets, probe, procedure design) stay in
  Phase 3; the interview shape here is a prerequisite for all four.
- **Idea 12** (journey navigation) — the per-item negotiated structure delivers most of what it
  asked for; re-assess after this lands.
- **Stall detection and distinct terminal exit reasons** (from the Symphony read) — deferred; both
  want a runtime this plugin does not have, and stalls are not currently a problem.
- **The build skills** are not changed beyond the audit. Tests already focus on what matters and
  write-code already does not decide; they are execution skills, and this phase's whole direction
  is that what reaches them gets smaller and better defined.

## Open items

1. ~~**The `progress.json` artifact-registry schema.**~~ Resolved in commit 7: `progress.json.artifacts`
   maps path to role (`{"notes/approach.md": "the approach"}`), with array forms accepted and the
   conventional names kept as a fallback for items that never recorded one. No schema beyond that —
   the registry says where things are, not what they must contain.

## Exit evidence

Not measurement, this time — usability. The phase succeeds if real work goes through the pipeline
again. Session-lab before/after resumes as the gate on Phase 3, once there are runs to measure.

## Appendix — steering record

Maintainer rulings from the interview that produced this proposal, in the order given.

- Phase 1 was never measured because the pipeline is too rigid to use; that is the finding, not a
  gap in the process.
- Full phase in one PR, in slices that can be reviewed and understood.
- Agents lose iterations making files conform to the pipeline's own standards. Document shape does
  not matter; skills should prescribe thoughts, questions and ideas worth exploring.
- `engineering.tier` stays and means product maturity. The new dial is how complex the working
  needs to be. *(Later refined: that is two dials, not one — see below.)*
- The plugin was a dark factory and failed both ways because the same models that build also
  challenge. Not a fixed gate — points where the human pushes back, better early than late.
- Human review *is* the push-back; the characteristic intervention is requesting simplification.
- Review points scale like everything else: some work needs many, some needs one at the end.
- The dial is set by human and agent together, estimated at the start, re-questioned at every
  step. Start simple and expand as we notice.
- Program design is what architecture fails at: plain-words explanation of how the program works,
  before any technical vocabulary. Architectures today are extremely hard to read and review.
- Parallel fan-out hurts because the orchestrator gets context-switched by unrelated topics
  returning at random; it works only when the fan-out is the same thing many times.
- Budgets exist for human readability. Agents write endless documents regardless of structure.
- Structure is not killed — it is designed per item by human and agent together.
- Critique survives; loops and loop numbering do not. Re-critique only on scope-bearing change,
  always delta-only.
- The plan is owned by the human, not by a skill. The old plan goes.
- The orchestrator runs the interview so it can later represent the maintainer's thinking; the
  planner becomes a subagent for context hygiene.
- Unattended is decided by taste, not by phase.
- How we act is part of the plan.
- `/refine-critique` and `/design-critique` are deleted.
- `/work-planning` keeps its job minus plan authoring.
- Taste is defined somewhere explicit and improved via retros.
- `progress.json` keeps strong structure; only the markdown loosens.
- Independence does not matter when exposure is small. Small means no critique at all.
- Gates are defined by human and agent during planning, at least as far as the next gate.
- The build skills are fine.
- Program design is its own skill; both it and refine are interview style.
- Revocation is a discussion scaled to the plan change, not a mechanism.
- Stall detection deferred — not an issue these days.
- `/architecture-critique` survives: architecture against the plan, plus the AI-slop and
  keep-it-simple critiques.
- The plan reuses the name `plan.md`.
- A machine-checked structure for the working agreement is overkill; prose in the plan is enough,
  and the existing checks are of doubtful value anyway.
- `/lore` needs refreshing — non-obvious things only, concise and short.
- The snapshot is automated context construction for fresh spawns; it has value, but must handle
  the adaptable and progressive structure. Script or agent is open; a hook is the most powerful
  answer if it works well.
- Verify, improve and fix the snapshot script and `progress.json`, adapted to what Phase 2 builds.
- These should work as hooks — scripts without hooks are not that valuable.
- Three dials, not two: tier (product maturity), complexity (bugfix / feature / suite / product),
  and ambiguity (established context, versus a new context with little knowledge, versus not even
  knowing what we want).
- Exposure is a fourth dial. That makes three per-item dials — complexity, ambiguity, exposure —
  which map one-to-one onto the three taste heuristics; `engineering.tier` is global rather than
  per work package.
- Taste is the maintainer's answers in the interview — how things are to be done and designed. It is
  not judged by an agent. How many reviews or how much ceremony a run gets comes from the dials, so
  there is no random judging of taste anywhere.
- The standing taste file is short, concise rules, not harvested questions and answers — maintained
  mostly through `/retro` and `/compound`, with the maintainer approving. Interview-style taste is
  per work package, because taste differs by topic and changes over time. If it is unanswered for
  *this* item, the agent asks again rather than checking other conversations.
