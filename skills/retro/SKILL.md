---
name: retro
description: "Record concrete successes and friction after a work package, session, or pipeline run. Observe from artifacts and trajectories without fixing, assigning work, or changing process."
phase: 6
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Retro

Read available progress state, plan/coordination artifacts, VCS history, verification/review output,
lore, and session trajectories. Append terse JSONL observations to `.pipeline/work/<id>/retro.jsonl` —
one log per work package, never a shared file, so parallel runs append without conflicting.

Each entry records date, scope/WP where permitted, source, kind (`success` or `friction`), concrete
observation, evidence, and optional related known pattern. One observation per line. Record what worked
so later cleanup does not remove it.

Close each work package with one `cost` entry: phases run, critique and review rounds, retry attempts,
and how much of the effort went to rework or infrastructure rather than the outcome. Whether a run was
proportionate is only visible in aggregate, and `/compound` cannot see it otherwise.

Check `.pipeline/compound-candidates.md` before writing a new free-text observation: reuse the matching
candidate's identifier when the same behavior recurs, and only write free text for friction with no
matching row. If no tracker exists, append free text — `/compound` clusters it later.

Observe only. Do not diagnose beyond evidence, fix code or prompts, assign follow-up work, inflate one
event into a pattern, or duplicate an existing observation without new evidence.

Retro is the final mutable pipeline observation phase and must complete before ship runs.

## Target

$ARGUMENTS
