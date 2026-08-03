---
name: review
description: "Read-only review of implemented code against an approved work package or explicit changed-file scope. Verifies ACs, applicable constraints/rules, regressions, and plausible changed risks. Produces operational findings and a verdict; never edits code."
phase: 8
persona: pipeline-reviewer
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Review

Review the implementation deeply without expanding it.

## Read first

Read `plan.md`, approved requirements/design/architecture when present, applicable configured rules,
the complete diff, every affected execution path, and relevant tests. For integrated builds, use task
trees and receipts to locate work; verify claims from diffs and execution rather than receipt prose.

## Evaluate

For every plan AC record `PASS` or `FAIL` with the cheapest reliable evidence available. Prove every
material condition of compound ACs. Existing automated tests, focused execution, inspection of
declarative behavior, rendered evidence, or a documented manual check may qualify under project policy.
Do not demand a new harness merely because stronger proof is imaginable.

Inspect:

- conformance to approved architecture and design within plan scope;
- meaningful tests and preservation of protected behavior;
- concrete regressions and wiring/integration failures;
- plausible changed security, data-integrity, concurrency, and failure risks;
- unnecessary complexity or unrelated edits introduced by this change;
- affected authoritative documentation made false;
- exact or derived WP-ID leakage outside `.pipeline/**`.

## Findings and verdict

Every finding must cite location, evidence, impact, and the governing AC, approved constraint, applicable
rule, regression, or change-caused risk.

- **BLOCKING:** failed AC or material violation; enters retry.
- **NON-BLOCKING DEFECT:** concrete issue safe to defer; never changes verdict.
- **FOLLOW-UP / NOTE:** outside current scope; never assigned automatically.

Return `DONE` only when all ACs pass and no blocking finding remains; otherwise `NOT DONE`. Send only
blocking findings to the builder. Report positive evidence too. Never edit code or turn optional
hardening, polish, adjacent cleanup, or personal preference into a finding.

## Target

$ARGUMENTS
