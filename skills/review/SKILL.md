---
name: review
description: "Read-only review of implemented code against an agreed plan or explicit changed-file scope. Verifies ACs, applicable constraints/rules, regressions, and plausible changed risks. Produces operational findings and a verdict; never edits code."
persona: pipeline-reviewer
applies-to: [frontend, backend, application, framework, infra]
user-invocable: false
---

# Review

Review the implementation without expanding it.

**Depth is assigned, not chosen.** The plan's `## How we work on this` names the review depth for
this item, and the brief repeats it. Match it: do not widen a narrow review into a full audit, and do
not shorten a phased one because the code looks fine. If no depth is named, ask before reviewing.

## Read first

Start from the injected state snapshot when present; it orients the read, and the artifacts it points
to are opened where the review needs them. Read `plan.md`, approved design and architecture when
present, the `pipeline.config.yml` rule slots that apply to the change (`{{rules.code}}`,
`{{rules.testing}}`, `{{rules.architecture}}`, `{{rules.design-system}}`, `{{rules.frontend}}`,
`{{rules.visual}}`, `{{rules.security}}`, `{{rules.docs}}` — skip undeclared slots), the complete
diff, every affected execution path, and relevant
tests. For integrated builds, use task trees and receipts to locate work; verify claims from diffs and
execution rather than receipt prose. On a retry evaluation, read the previous `review.md` plus the diff
since it; carry over unchanged `PASS` entries except where the delta touches them.

## Evaluate

For every plan AC record `PASS` or `FAIL` with the cheapest reliable evidence available. Prove every
material condition of compound ACs. Existing automated tests, focused execution, inspection of
declarative behavior, rendered evidence, or a documented manual check may qualify under project policy.
Do not demand a new harness merely because stronger proof is imaginable.

Confirm the end-to-end evidence named in `architecture.md` was actually produced and shows the change
working through its real consuming path — an integration or E2E test, a recorded manual run, or rendered
output, whichever that plan named. Where no plan named one, confirm the change is proven through its real
consuming path by whatever evidence the repository already supports. Units passing in isolation while the
wired path is broken is the classic false green; a plausible argument that it works is not evidence. If
that evidence is missing or does not demonstrate the path, that blocks.

Mechanical check results injected at skill load or with the brief are evidence: judge them, and re-run
only when disputing them — then say so in the finding.

Inspect:

- conformance to approved architecture and design within plan scope;
- tests that can fail for a reason someone would care about, no more of them than that needs, and
  preservation of protected behavior;
- concrete regressions and wiring/integration failures;
- plausible changed security, data-integrity, concurrency, and failure risks;
- work delivered beyond approved scope — unrequested capability, speculative abstraction, unnecessary
  complexity, or unrelated edits introduced by this change;
- affected authoritative documentation made false;
- exact or derived item-ID leakage outside `.pipeline/**`.

## Findings and verdict

Every finding must cite location, evidence, impact, and the governing AC, approved constraint, applicable
rule, regression, or change-caused risk.

- **BLOCKING:** failed AC, missing end-to-end evidence, material violation, or material scope excess;
  enters retry.
- **NON-BLOCKING DEFECT:** concrete issue safe to defer; never changes verdict; carries forward to the
  final maintainer gate; never sent back for rework.
- **FOLLOW-UP / NOTE:** outside current scope; carried forward to the final gate, never sent back for
  rework.

Scope excess is a violated scope boundary, not a preference: a capability, abstraction, configuration
surface, or subsystem nobody asked for blocks and comes out. Judge it by what the change adds, not by
style — local verbosity is a non-blocking defect.

Return `DONE` only when all ACs pass and no blocking finding remains; otherwise `NOT DONE`. Write the
findings, AC table, and verdict to `.pipeline/work/<id>/review.md` when that folder exists; otherwise
return them to whoever asked. Send only blocking findings to the builder. Report positive evidence
too. Never edit code or turn optional hardening, polish, adjacent cleanup, or personal preference into a
finding.

## Target

$ARGUMENTS
