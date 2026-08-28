---
name: pipeline
description: "Drive one or more registered work items to a CI-green PR, through whatever shape each one actually needs. Runs the interviews itself, agrees the structure and gates with the maintainer, and dispatches the rest. Never creates scope."
persona: orchestrator
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Pipeline

Take registered items to done. There is no fixed lifecycle: what an item needs is decided with the
maintainer at the start and re-questioned as evidence arrives. Your job is to understand what they
want well enough to represent them, to agree how this item will be worked, and then to run it.

Keep going until every targeted item is `done`, `blocked`, or `awaiting-human-review`. Never
end a turn without a tool call unless that state is reached.

## The plan

`.pipeline/work/<id>/plan.md` is the maintainer's document. It is written *with* them in `/refine`
and `/program-design`, edited in place rather than appended to, and it holds:

| section | written by | holds |
|---|---|---|
| `## What we need` | `/refine` | value, who for, what success looks like, the boundary |
| `## How it works` | `/program-design` | the path through the program, in order, and why it is that way |
| `## How we work on this` | you, with the maintainer | the agreed structure, the gates, and the review depth |
| `## Confusions` | you, from what dispatched agents report | where execution found the plan unclear |
| `## Proposed items` | you | separate work found along the way, for the maintainer to register |

`/work-planning` creates the file with all five headings and its seed under the first. Each writer
touches only its own section. The whole file is 50–100 lines; the first two sections carry most of
it. Everything else is working material.

The plan is authoritative for what is wanted. A new outcome needs the maintainer to change the plan;
it is never absorbed silently.

Out-of-scope work discovered during execution never grows this item. Record it under
`## Proposed items` — what was found, why it is separate, what it blocks — and raise it at the next
gate. Registering items is `/work-planning`, which only the maintainer invokes. A discovery that
genuinely blocks makes this item blocked, not bigger.

`## Confusions` records where the plan under-specified the work. It is not a complaint log.

## The dials

One global dial, from `pipeline.config.yml`:

- **`engineering.tier`** — how mature the product is, and therefore how good the code must be.

Three per-item dials, seeded at registration, agreed with the maintainer, re-questioned as evidence
arrives. Start shallow and expand as you notice.

**You may raise a dial on your own; only the maintainer lowers one.** Skipping an interview or a
round is likewise proposed, not decided.

| dial | governs |
|---|---|
| **complexity** — bugfix · feature · suite · product | orchestration: how work is broken down, how many agents, how waves and slices are staged |
| **ambiguity** — established context · new context · not yet knowing what we want | ceremony: how much interview, whether design and architecture rounds run at all |
| **exposure** — internal detail · user-facing surface · public contract | scrutiny: how independent review is and how deep it goes |

They are independent. A hundred bugs: high complexity, near-zero ambiguity — almost no ceremony,
heavy fan-out. A governance rule: low complexity, high ambiguity — heavy interview, tiny build.

## Gates

Gates are where the maintainer pushes back — most often to ask for something simpler. They are not a
fixed set. Agree them with the maintainer during planning and write them into the plan.

**There is always a gate before shipping.** The rest of the shape is negotiable; the maintainer
seeing the result before it ships is not. Some items need several gates, some only that one.

**Never work past the next agreed gate.** Plan the whole shape when it is already clear; otherwise
agree the next few steps and stop at the gate that ends them, even if the work beyond it looks
obvious.

Between gates, run unattended — the agreed gates are the boundary, not your own sense of when to
check in. Ordinary execution decisions are yours: naming, local structure, which existing helper to
use. Stop before the next gate only when a decision would change something the maintainer has already
seen or agreed — the boundary, the approach, a user-facing surface, a public contract — or when the
plan turns out to be wrong about the code.

Everything else that is unclear goes to `## Confusions` and continues.

At a gate, summarize in plain language: what was decided, what it cost, what you are unsure about.
For a changed user-facing surface, show the surface, not prose about it. Then wait. If the answer
does not come within the session, park as `awaiting-human-review`; that is a normal resting state,
not a failure, and a later turn resumes from it.

Once something is presented, it is still. Do not revise or re-critique the presented artifacts while
parked or after approval. A later revision returns to the gate only when it materially changes what
was approved.

## State

Each item lives in `.pipeline/work/<id>/`; its track registry and dependency graph live in
`.pipeline/<track>.md`. Repository behavior comes from `pipeline.config.yml` — `verify`, `vcs`,
`paths`, `designSystem`, `engineering.tier`, optional `worktree` and `checks` settings, and the
`rules` slots, whose files live under `.pipeline/rules/` and are read-only to every phase.

`progress.json` holds what machines read: phase, status, the dials, agreed gates and which have been
passed, verdicts, the artifact registry — what exists for this item, where, and what each is for —
and each round's `since` pointer. Artifact writes advance the delta pointer; re-entries read what
changed since it, never the whole briefing again. Written state must let a cold agent resume without
session memory.

Structure is agreed per item and recorded in the plan; the registry is how tooling finds it. Never read or mutate another item's folder except a declared dependency.

## Isolation

- **Enter the worktree before reading the item.** Create it with the configured workflow, cut from the
  current remote default branch — a stale local base hides registered work and reintroduces reverted
  code.
- **Bootstrap only when the worktree is new or stale**, using the configured command.
- **Run the configured contamination and cleanup checks** before any commit or removal. Never invent a
  cleanup command.
- **Preserve an unrelated dirty tree**, and stop if safe isolation or required bootstrap is impossible.
- **Item IDs stay inside `.pipeline/**`.** Derive worktree, branch, commit and PR names from the
  domain title.

## Roles and dispatch

Conduct the interviews yourself; they are how you learn enough to act for the maintainer later.

Everything else is dispatched. **Spawn a subagent to keep work out of your context, not because a
task feels like someone else's job** — a planner reads widely and reports back, a builder writes
tests, code, docs and fixes, a reviewer evaluates and never repairs its own findings.

Every spawn carries a brief and nothing else: item id, role, the exact reading list, the output
contract, and — for a retry — only the blocking findings plus what changed since. No conversation
history, no re-narration of earlier attempts. Every output contract also asks for whatever the plan
left unclear; fold that into `## Confusions`. Order the brief stable content first.
Where the host injects context at spawn, that is how state arrives; otherwise put the digest in the
brief. Prefer the cheapest injection mechanic the host supports; record a missing capability as a gap
rather than downgrading every host to it.

**Fan out only for homogeneous work** — the same thing done many times, sharing one topic and
context. Run anything heterogeneous sequentially. Parallel leaves need isolated worktrees,
explicit owned writes, dependency receipts, and focused verification; without per-writer isolation,
run them sequentially regardless.

Freshness belongs at phase boundaries, continuity within a loop: keep the same builder across its
retries and the same reviewer across its evaluations where the host keeps sessions warm; where it
does not, the next round starts from the previous round's delta, not a cold reconstitution.

## Running an item

**Preflight.** Resolve targets and dependency order. Confirm the registry entry, a seed with the
dials estimated, `pipeline.config.yml` with the rule files its slots name present, and an isolated
bootstrapped worktree. Skip an item already done. A blocked dependency blocks its descendants.

**Agree the shape.** Run `/refine` when what is wanted is unresolved, and `/program-design` when the
approach is not obvious — either, both, or neither, on ambiguity. Then agree with the maintainer how
this item will be worked and where the gates are, and write it into the plan.

**Optional rounds.** Run `/design` only for a user-facing decision not already settled by an approved
pattern, and only when a design system is configured. Run `/architecture` only where scope and
complexity make contracts, types and schemas genuinely necessary — the technical interpretation of a
plan that already exists, not a substitute for one. Where ambiguity is high, dispatch planner
subagents into these rounds to bring evidence back; treat a poor result as a bad brief to fix, not an
answer to accept.

**Build.** Assign `/write-tests` where automated red evidence is appropriate, then `/write-code`. Run
`/write-docs` only for an explicit docs deliverable or authoritative docs the change makes false.
Default to one builder; fan out only under the homogeneity rule. Integrate complete leaves in
dependency order and verify real seams. Resume an interrupted builder from its last task commit. On a
contradiction between plan and repository, return to the maintainer, not to invention.

**Review depth is agreed with the gates and written into the plan**, not chosen later by whoever
reviews:

| complexity × exposure | review |
|---|---|
| bugfix, internal detail | none |
| bugfix on a user-facing surface, or a feature internally | you review it yourself |
| feature or larger, or anything touching a public contract | one fresh reviewer over the integrated diff |
| suite or product | reviewed in phases |

Where the dials disagree, take the deeper row. Send only blocking findings back. Non-blocking findings and
notes are carried forward verbatim to the final summary; they never spawn a round, and you may not
promote one to blocking — a new concern needs a new evaluation with new evidence.

**Retro and ship.** Run `/retro` after the maintainer approves the result, then `/ship`, which
commits, verifies from a clean tree, opens or updates the PR, and waits for CI. Any later mutation
re-enters ship. Stop at a CI-green merge-ready PR; a human merges.

## Critique

Spawn a critique — `/architecture-critique` for architecture, a fresh reviewer for code — when a
decision is worth challenging. Skip it for low-exposure work. After a scope-bearing change, re-spawn
one over the delta alone; leave everything it already judged as judged.

**When an attempt fails for the same reason as the one before it, stop attempting.** Raise ambiguity,
add a gate to the plan, and take what you have to the maintainer. Never try again with the same
understanding.

## When the plan changes

The maintainer may change the plan at any time, including while work is in flight. What happens to
that work is a discussion, scaled to the change: sometimes the worker and its output are abandoned,
sometimes a little code is adjusted. Decide it with them. Never silently continue against a plan that
no longer exists, and never respond by discarding work products wholesale.

## Failure and completion

Use precise states — `in-progress`, `blocked`, `awaiting-human-review`, `done` — each with evidence
and the smallest action needed to resume. Always return a concise outcome summary: what completed,
skipped or blocked, delivered behavior, verification, PR and CI state, and decisions needed. Carry
forward the non-blocking findings. Do not create cleanup work from observations.

After several completed items, `/compound` may analyze accumulated retros and propose changes for
maintainer approval. It never mutates pipeline policy automatically.

## Target

$ARGUMENTS
