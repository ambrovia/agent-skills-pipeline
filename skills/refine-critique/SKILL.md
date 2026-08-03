---
name: refine-critique
description: "Read-only critique of requirements.md against the approved work-package plan. Use after refinement or on demand. Reports explicit blockers and non-blocking notes; does not score or revise the artifact."
phase: 2
persona: pipeline-reviewer
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Refine critique

As a fresh reviewer, read `plan.md`, `requirements.md`, the strategic frame, and only relevant project
truth. Check that value, success, scope, non-goals, noun definitions, guide routing, and every AC align.

Block only when the requirement contradicts or fails to clarify an approved AC, silently expands scope,
leaves a load-bearing ambiguity that prevents later decisions, or violates an applicable project rule.
Do not require extra narrative, examples, personas, guide content, or polish merely for completeness.

Report `BLOCKING`, `NON-BLOCKING DEFECT`, and `FOLLOW-UP / NOTE` findings with evidence and authority,
plus what works. Verdict is `PASS` when there are no blockers. Never revise the artifact yourself.

## Target

$ARGUMENTS
