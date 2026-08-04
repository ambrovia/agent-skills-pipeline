---
name: architecture-critique
description: "Read-only critique of architecture.md before implementation. Checks plan alignment, necessary contracts, feasibility, proportionality, task ownership, and verification. Reports blockers without scoring or rewriting."
phase: 3
persona: pipeline-reviewer
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Architecture critique

Review as a fresh evaluator. Read the approved plan, requirements, design when applicable, architecture,
feasibility evidence, and the `pipeline.config.yml` rule slots `/architecture` works under
(`{{rules.architecture}}`, `{{rules.code}}`, `{{rules.testing}}`, `{{rules.security}}` — skip undeclared
slots). Fact-audit every load-bearing claim about existing code or precedent: independently locate it and
cite `file:line` (or mark `UNVERIFIED`). Do the same against current official sources for external claims.

Check that the plan:

- traces obligations to ACs or approved constraints without adding outcomes;
- defines necessary public/cross-cutting contracts and real dependency/ownership boundaries;
- reconciles with existing code and approved design, and derives the real consumers of any renamed,
  moved, or removed symbol instead of repeating the spec's list;
- addresses plausible changed failure, data, and migration risks at the stated tier, and reasons about
  security from the surfaces the change actually reaches rather than deferring to an absent rule;
- uses focused feasibility evidence for genuinely unknown load-bearing assumptions, including a live
  probe (or `UNVERIFIED`) when a premise depends on deployed or runtime state;
- provides reliable, proportionate verification, including named end-to-end evidence that would show the
  change working through its real consuming path;
- leaves reversible local choices to the builder and defaults to the simplest workable task tree —
  no mechanism beyond what the ACs, applicable rules, and named change-caused risks require.

Block only when implementation would require product or structural invention, an approved requirement
is unaddressed, a claimed contract is infeasible, a binding rule is violated, a load-bearing factual
claim is false or `UNVERIFIED`, no end-to-end evidence is named, the plan builds beyond the approved
scope or introduces unrequired mechanism at the stated tier, or a concrete material risk lacks a plan.
Do not block on absent optional sections, alternative preferences, or speculative scale already excluded.

Use `BLOCKING`, `NON-BLOCKING DEFECT`, and `FOLLOW-UP / NOTE`; cite evidence and authority and report what
works. Verdict is `PASS` with no blockers. Never score or rewrite the plan.

## Target

$ARGUMENTS
