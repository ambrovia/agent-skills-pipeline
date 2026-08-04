---
name: architecture
description: "Produce the technical plan for an approved work package. Use when implementation needs contracts, cross-cutting decisions, feasibility evidence, ownership, or ordered tasks. Define necessary decisions without transcribing local implementation."
phase: 3
persona: pipeline-planner
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Architecture

Write `.pipeline/work/<id>/architecture.md` as the durable technical handoff. `plan.md` owns outcomes;
approved requirements and design constrain the in-scope solution. Architecture must not create scope.

## Understand and verify

Read the approved artifacts, the `pipeline.config.yml` rule slots that apply (`{{rules.architecture}}`,
`{{rules.code}}`, `{{rules.testing}}`, `{{rules.security}}` — skip undeclared slots), relevant source,
current repository structure, and any `@lore` on the surfaces this change touches. Ask only questions that
change a costly or cross-cutting decision.

Run a focused feasibility probe only when a load-bearing assumption is new, unknown, or contradicted by
available evidence. When the premise depends on deployed or live state (bucket contents, running jobs,
live rows, remote config, external behavior), probe that live surface — a repo read is not enough; if
unreachable, mark it `UNVERIFIED`. Put reproducible question, method, result, and verdict in
`feasibility.md`; keep scratch work under `probes/`. A probe reduces uncertainty and does not become a
deliverable.

Reconcile the requested outcome with reality. Verify that every symbol the plan or spec names — table,
route, component, constant, export — exists in the shape assumed, and record each disagreement with how
the plan handles it. Where the change renames, moves, or removes an existing symbol, derive its consumers
from the repository rather than from the list the spec supplied; specs undercount this, and the plan is
where the real number has to appear. If reconciliation requires a new outcome or contradicts the plan,
propose a plan amendment and stop. If it invalidates approved design, return an explicit design-change
proposal.

## Write the plan

Include what a cold builder needs:

- AC-to-implementation obligation mapping;
- existing behavior being reused and the actual change boundary;
- public/cross-layer contracts, data flow, persistence or migration semantics where applicable;
- plausible changed failure behavior appropriate to the tier;
- security reasoned from the surfaces this change actually reaches — a state-changing endpoint, untrusted
  input, a credential, a path, an outbound request, an agent-authored field. For each, reason from current
  best practice for that kind of surface, state the abuse case and how the plan closes it, and say plainly
  which surfaces this change does not touch. `{{rules.security}}` carries the project's threat model and
  governs where it is configured; its absence is not permission to skip the reasoning;
- load-bearing files/modules and dependency order;
- verification approach using existing lanes where adequate, including the one piece of end-to-end
  evidence that will show the change working through its real consuming path in production conditions —
  an integration or E2E test, a scripted run, or a specific manual check with its expected observation.
  Name the cheapest form that would actually catch a broken wire; do not mandate a new harness when an
  existing lane or a recorded manual check suffices;
- documentation made false by the change;
- technical tasks with ownership only where coordination needs it.

Lock irreversible, public, cross-cutting, compatibility-sensitive, or expensive choices. Leave naming
inside a local function, helper layout, and other reversible details to the builder. Prefer one technical
task. Split only at a real dependency or safe parallel boundary; add an integration task only for a real
cross-leaf seam. The orchestrator decides at runtime whether those leaves run sequential or parallel and
how many builder subagents to spawn.

For migrations, renames, shared files, protected tests, or concurrency, state the concrete invariant and
name the affected sites — source, fixtures, tests — with the step each one needs. Do not add a mechanism,
abstraction, rollback layer, observability, compatibility shim, or failure-handling path without an AC,
configured rule, or plausible change-caused risk — tier sets rigor, not ambition.

## Done

The plan is implementable without product or structural invention, remains proportionate to the tier,
names reliable verification, and traces every obligation to an approved authority. Update `plan.md` only
through an approved amendment.

## Target

$ARGUMENTS
