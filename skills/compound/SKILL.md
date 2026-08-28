---
name: compound
description: "Review accumulated retros, identify recurring evidence-backed process patterns, and propose surgical skill or workflow changes for human approval. Never applies changes automatically."
argument-hint: "[optional: 'review' or 'status']"
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Compound

Read the candidate tracker at `.pipeline/compound-candidates.md` — the durable memory of prior patterns —
before reading every `.pipeline/work/*/retro.jsonl`. Create the tracker empty if it does not exist. Group
observations only when they describe the same behavioral mechanism. Three independent occurrences qualify
a pattern for consideration; they do not prove the diagnosis or authorize a change.

Classify patterns as emerging, confirmed, contradicted, or resolved. For each confirmed pattern report:

- occurrences and evidence;
- likely mechanism and competing explanation;
- behavior worth preserving;
- one smallest proposed process/skill change;
- expected benefit, regression risk, and how to validate it.

Recurring `divergence` observations are a distinct case: when the same kind of maintainer correction
appears across items, the proposal is an amendment to the `taste` rule slot rather than a skill
change. Quote the corrections it would have prevented. A convention becomes standing because the
maintainer approves it, never because a run inferred it — and never from a single correction, which
is a preference on one item rather than a rule about the repository.

Propose; never apply. Do not delete history, convert anecdotes into mandates, bundle unrelated changes,
or optimize a metric without checking downstream quality. Update tracker state and retain contradiction
and resolution evidence. Human approval is required before any policy mutation.

## Target

$ARGUMENTS
