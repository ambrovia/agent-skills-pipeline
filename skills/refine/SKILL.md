---
name: refine
description: "Clarify an approved work package whose value, success conditions, scope boundary, or load-bearing noun remains unresolved. Skip when the plan is already clear. Produces requirements.md without adding scope."
phase: 2
persona: pipeline-planner
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Refine

Sharpen an approved WP before design or architecture. `plan.md` remains authoritative; refinement may
explain its ACs but may not add outcomes.

## Inputs and applicability

Read `plan.md`, the track's strategic frame, the project truth under `{{paths.docs}}` it cites, and
current behavior. Run only when
the goal, impact, success boundary, out-of-scope line, or a load-bearing WP-specific noun is unresolved.
Otherwise record that refinement is unnecessary and stop.

## Produce `requirements.md`

Write a concise durable artifact containing:

- the user/system value and intended impact;
- what success means, mapped to every plan AC;
- explicit scope and non-goals;
- current behavior and the genuine delta;
- any load-bearing noun: meaning, lifecycle, boundaries, and rejected interpretations;
- a guide draft only when documentation is an explicit deliverable or needed to clarify intended use.

Label any newly discovered outcome as a **proposed plan amendment**. Do not incorporate it as approved
scope until the maintainer changes `plan.md`.

Use `DOC-CLASS: new | update | none` as routing metadata, with one reason. It does not itself require a
documentation rewrite.

## Done

The artifact is understandable without session memory, aligns with every AC and non-goal, and leaves no
load-bearing product ambiguity. Do not design UI, choose architecture, write tests/code, or formally
critique your own output.

## Target

$ARGUMENTS
