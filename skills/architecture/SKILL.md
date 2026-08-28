---
name: architecture
description: "Restate an agreed plan in technical terms — contracts, types, schemas, dependency order — for a builder. Use only where scope and complexity make those definitions necessary. Never decides how the program works; that is the plan's job."
persona: pipeline-planner
applies-to: [frontend, backend, application, framework, infra]
user-invocable: false
---

# Architecture

Write `.pipeline/work/<id>/architecture.md` as the durable technical handoff. `plan.md` owns what is
wanted and how the program works; approved design constrains the surface. Architecture must not create
scope.

**Run only where the definitions are genuinely necessary** — where scope and complexity mean a builder
cannot proceed without contracts, types, schemas, or an explicit dependency order. Most items do not
need this.

This is the *technical interpretation* of a plan that already exists: the same thing the plan says in
plain words, in the vocabulary a builder needs. If you find yourself deciding how the program works,
stop — that decision belongs in the plan, with the maintainer.

Keep it navigable — a builder must be able to find the contract they need.

## Understand and verify

Start from the injected state when present, then read `plan.md`, approved design when present, the
`pipeline.config.yml` rule slots that apply (`{{rules.architecture}}`,
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

## Write `architecture.md`

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
cross-leaf seam. Do not specify parallelism or agent counts here; those are chosen at runtime.

For migrations, renames, shared files, protected tests, or concurrency, state the concrete invariant and
name the affected sites — source, fixtures, tests — with the step each one needs. Do not add a mechanism,
abstraction, rollback layer, observability, compatibility shim, or failure-handling path without an AC,
configured rule, or plausible change-caused risk — tier sets rigor, not ambition.

## Done

`architecture.md` is implementable without product or structural invention, stays proportionate to the tier,
names reliable verification, and traces every obligation to an approved authority. Update `plan.md` only
through an approved amendment.

## Target

$ARGUMENTS
