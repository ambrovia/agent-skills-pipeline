---
name: compound
description: "Review accumulated retros, identify recurring evidence-backed process patterns, and propose surgical skill or workflow changes for human approval. Never applies changes automatically."
argument-hint: "[optional: 'review' or 'status']"
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Compound

Read the candidate tracker at `.pipeline/compound-candidates.md` before reading the cross-item archive `.pipeline/retro.jsonl` (shipped items) and every
`.pipeline/work/*/retro.jsonl` still present (in flight). A pattern spanning both is one pattern. Create the tracker empty if it does not exist. Group
observations only when they describe the same behavioral mechanism. Three independent occurrences qualify a pattern for consideration; they do not prove the
diagnosis.

Classify patterns as emerging, confirmed, contradicted, or resolved. For each confirmed pattern report:

- occurrences and evidence;
- likely mechanism and competing explanation;
- behavior worth preserving;
- one smallest proposed process/skill change;
- expected benefit, regression risk, and how to validate it.

Recurring `divergence` observations propose an amendment to the `taste` rule slot rather than a skill
change; quote the corrections it would have prevented. Never propose one from a single correction.

Propose; never apply. Do not delete history, convert anecdotes into mandates, or bundle unrelated
changes. Update tracker state and retain contradiction
and resolution evidence. Human approval is required before any policy mutation.

## Target

$ARGUMENTS
