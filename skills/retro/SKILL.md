---
name: retro
description: "Record concrete successes and friction after a work package, session, or pipeline run. Observe from artifacts and trajectories without fixing, assigning work, or changing process."
phase: 10
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Retro

Read available progress state, plan/coordination artifacts, VCS history, verification/review output,
lore, and session trajectories. Append terse JSONL observations to the configured retro log.

Each entry records date, scope/WP where permitted, source, kind (`success` or `friction`), concrete
observation, evidence, and optional related known pattern. One observation per line. Record what worked
so later cleanup does not remove it.

Observe only. Do not diagnose beyond evidence, fix code or prompts, assign follow-up work, inflate one
event into a pattern, or duplicate an existing observation without new evidence. Reuse known-friction
identifiers when the same behavior recurs.

Retro is the final mutable pipeline observation phase and must complete before ship's final attestation.

## Target

$ARGUMENTS
