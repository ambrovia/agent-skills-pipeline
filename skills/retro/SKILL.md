---
name: retro
description: "Record concrete successes and friction after an item, session, or pipeline run. Observe from artifacts and trajectories without fixing, assigning work, or changing process."
phase: 6
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Retro

Read available progress state, plan/coordination artifacts, VCS history, verification/review output,
lore, and session trajectories. Append terse JSONL observations to `.pipeline/work/<id>/retro.jsonl` —
one log per item, never a shared file, so parallel runs append without conflicting. At ship the log
is appended to the cross-item archive `.pipeline/retro.jsonl` and the item's copy is deleted with the
rest of its working material — write every observation as though the item folder will not exist.

Each entry records date, scope/item where permitted, source, kind (`success`, `friction`, or
`divergence`), concrete observation, evidence, and optional related known pattern. One observation per
line. Record what worked so later cleanup does not remove it.

A `divergence` entry records a place where what the agent chose was not what the maintainer wanted —
read them out of the plan's `## Confusions` section, the gate discussions, and anything the maintainer
asked to be changed or simplified. Record the choice, what they wanted instead, and where the plan was
silent. These are the raw material for the `taste` rule slot: a divergence that keeps recurring is a
standing convention nobody has written down yet. Record it as an observation — do not write the rule
yourself, and do not treat one maintainer correction as a convention.

Close each item with one `cost` entry: what ran, how many critiques and reviews, how much was
re-done, and how much of the effort went to rework or infrastructure rather than the outcome. Whether a run was
proportionate is only visible in aggregate, and `/compound` cannot see it otherwise.

Check `.pipeline/compound-candidates.md` before writing a new free-text observation: reuse the matching
candidate's identifier when the same behavior recurs, and only write free text for friction with no
matching row. If no tracker exists, append free text — `/compound` clusters it later.

Observe only. Do not diagnose beyond evidence, fix code or prompts, assign follow-up work, inflate one
event into a pattern, or duplicate an existing observation without new evidence.

Retro is the final mutable pipeline observation phase and must complete before ship runs.

## Target

$ARGUMENTS
