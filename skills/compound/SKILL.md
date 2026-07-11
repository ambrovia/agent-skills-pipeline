---
name: compound
description: "Self-improvement loop: review the retro log, identify recurring patterns (3+ occurrences), and propose skill/process changes. Run after multiple work packages complete or on demand."
argument-hint: "[optional: 'review' or 'status']"
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Compound — turn repeated observations into process fixes

The immune system, not the nervous system. Responds to patterns, not individual events.

**Why:** A single friction noted once is noise. The same friction noted three times is a process
bug. Without a mechanism to surface these patterns and propose targeted fixes, the retro log is
write-only and the same mistakes recur indefinitely. Compound closes the loop: retro observes,
compound mines, the coordinator applies.

## When this runs

After multiple work packages have completed (enough retro data to surface patterns), or on demand
to check the current state of recurring frictions. Not part of the per-work-package phase loop —
compound operates across work packages.

## What it produces

- A structured review with confirmed patterns, emerging patterns, resolved patterns, and
  escalations.
- Proposals for surgical skill/process changes (never applied directly — proposed for approval).
- An updated `.pipeline/compound-candidates.md` tracker.

## How to work

Read many independent files in parallel batches — candidate tracker, retro log, skill files. Only
go sequential when one file's contents tell you what to read next.

### 0. Read the candidate tracker FIRST

Before reading the retro log, read `.pipeline/compound-candidates.md`. This is the durable memory
of which patterns are already CONFIRMED, EMERGING, RESOLVED, or RECURRED. **Never propose a
duplicate of an existing candidate** — extend the existing row's recurrence count instead. New
candidates only for frictions with no matching row.

If the tracker doesn't exist yet, create it with an empty table and proceed.

### 1. Read the retro log

Read every `.pipeline/work/*/retro.jsonl` file (one per work package). Parse every entry across all
files. Group observations by tags. Map each observation against the candidate tracker from step 0
before counting recurrences.

### 2. Identify patterns

A pattern is an observation that appears in **3 or more retros** (from different work packages or
sessions). Below 3, it could be a one-off. At 3+, it's systemic.

For each potential pattern:
- **Count occurrences.** How many retro entries share this tag/theme?
- **Check severity distribution.** Is it always low? Escalating? Mixed?
- **Check recency.** Are the observations recent, or from early runs that might already be fixed?
- **Check for contradictions.** Does another entry say this was working fine?

### 3. Classify each pattern

- **CONFIRMED (3+ occurrences, consistent severity)** — Real, recurring issue. Propose a specific
  fix.
- **EMERGING (2 occurrences)** — Watch this. Note it but don't act yet.
- **RESOLVED (was confirmed, but recent entries show improvement)** — A past fix is working. Record
  that it's resolved.
- **CONTRADICTED (mixed signals)** — Observations disagree. Flag for human review.

### 4. For each CONFIRMED pattern — propose a change

Write a specific, surgical proposal:

```
PATTERN: [tag/theme]
OCCURRENCES: [count] across work packages [list]
EVIDENCE: [quote 2-3 specific retro entries]
ROOT CAUSE: [why this keeps happening]
PROPOSED FIX:
  Target: [skill file path or process doc]
  Change: [exact text to add/modify/remove]
  Expected impact: [what this prevents]
RISK: [what could go wrong with this change]
```

**You do NOT apply the change yourself.** You propose it. The coordinator decides.

### 5. Output the review

```
## Compound Review — [date]

### Retro entries analyzed: [count]
### Work packages covered: [list]

### CONFIRMED PATTERNS (ready to act)
[proposals]

### EMERGING PATTERNS (watching)
[2-occurrence patterns with notes]

### RESOLVED PATTERNS
[past issues that are no longer appearing]

### ESCALATIONS
[anything that needs immediate human attention]

### RECOMMENDATION
[Should the coordinator apply the proposed changes? Any that need human approval first?]
```

### 6. Update the candidate tracker

After producing the review, update `.pipeline/compound-candidates.md`:
- Add a row for every NEW CONFIRMED candidate (one observation that just crossed the 3-occurrence
  threshold).
- Update the `Recurrence` column for any existing row that picked up new occurrences.
- Transition rows to `RESOLVED` when recent retros stop flagging the pattern AND the proposed fix
  has landed.
- Transition `RESOLVED` rows to `RECURRED` if the friction reappears after a fix; note which fix
  didn't stick.
- Never delete rows — history is the audit trail.

## Rules

- Don't apply changes to skills or process directly. Propose. Others apply.
- Don't act on single observations. The threshold is 3 occurrences.
- Changes are surgical — one fix per pattern.
- If the retro log says something works well, protect it from being changed.
- Don't optimize resolved patterns further.

## The compounding mechanism

```
Agent finishes work
    → /retro appends observations to work/<id>/retro.jsonl
    → observations accumulate across work packages
    → /compound runs periodically
    → identifies patterns at 3+ occurrences
    → proposes targeted skill/process changes
    → coordinator applies approved changes
    → next agent benefits from improved skills
    → /retro observes if the fix worked
    → cycle continues
```

## Done when

- Every `.pipeline/work/*/retro.jsonl` file has been read and parsed.
- Patterns are classified as CONFIRMED / EMERGING / RESOLVED / CONTRADICTED.
- Each CONFIRMED pattern has a surgical proposal with evidence, root cause, target, and risk.
- `.pipeline/compound-candidates.md` is updated (no duplicates, recurrence counts current).
- The review is output in the structured format above.

## Target

$ARGUMENTS
