---
name: architecture-critique
description: "Read-only critique of architecture.md before implementation. Checks plan alignment, necessary contracts, feasibility, proportionality, task ownership, and verification. Reports blockers without scoring or rewriting."
phase: 3
persona: pipeline-reviewer
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Architecture critique

Read the approved plan, requirements, design when applicable, architecture, feasibility evidence, and
configured project rules. Compare load-bearing claims with the repository and current official sources
where necessary.

Check that the plan:

- traces obligations to ACs or approved constraints without adding outcomes;
- defines necessary public/cross-cutting contracts and real dependency/ownership boundaries;
- reconciles with existing code and approved design;
- addresses plausible changed failure, data, security, and migration risks at the stated tier;
- uses focused feasibility evidence for genuinely unknown load-bearing assumptions;
- provides reliable, proportionate verification, including named end-to-end evidence that would show the
  change working through its real consuming path;
- leaves reversible local choices to the builder and defaults to the simplest workable task tree.

Block only when implementation would require product or structural invention, an approved requirement
is unaddressed, a claimed contract is infeasible, a binding rule is violated, no end-to-end evidence is
named, the plan builds beyond the approved scope, or a concrete material risk lacks a plan. Do not block
on absent optional sections, alternative preferences, speculative scale, or enterprise controls without
authority.

Report operational severity, evidence, authority, and what works. Verdict is `PASS` with no blockers.
Never score or rewrite the plan.

## Target

$ARGUMENTS
