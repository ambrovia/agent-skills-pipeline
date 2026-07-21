---
name: lore
description: "Capture and surface the current state of tribal knowledge — architectural decisions, constraints, workarounds, and gotchas that don't belong in code comments but are too important to forget. Modes: capture/update/remove, scan, index."
argument-hint: "[file paths, 'update <lore-id> <paths>', 'remove <lore-id>', 'scan', or 'index']"
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Lore — capture and manage tribal knowledge

Decisions, constraints, and gotchas that don't belong in code comments but are too important to
forget. Lore is for **cross-cutting impact**: decisions that affect multiple files, future
developers, or require context that isn't obvious from the code alone.

**Why:** Codebases accumulate implicit knowledge — why a dependency is pinned, why a simpler
approach was rejected, why two modules can't be merged. This knowledge lives in people's heads
or gets lost in old PRs. `@lore` annotations keep this knowledge at the code site where it
matters. They are the **current materialized state**, not an append-only history: replace or move
an active annotation when the knowledge changes. Git retains the history.

---

## Mode: Capture (`/lore <file paths>`)

Read the specified files and identify decisions worth documenting:

1. **Read each file** and look for:
   - Non-obvious constraints (why something can't be simpler)
   - Cross-cutting decisions (this choice affects files elsewhere)
   - Workarounds (temporary solutions with known limitations)
   - Performance tradeoffs (chose speed over readability, or vice versa)
   - Architecture boundary enforcement (why this import/dependency exists or is forbidden)

2. **Search the entire repository for existing `@lore-id` values.** Update or remove automatically
   only when the user supplied an exact ID with exactly one match. Topic/tag similarity is not
   identity: when capture appears related to legacy or existing lore but no exact ID was supplied,
   show the candidate and ask whether to update it or create a new ID.

3. **Add `@lore` comments** at the relevant code location with these fields:
   - `@lore-id` — stable descriptive kebab-case identity, unique across the repository
   - Date (so readers know when this was true)
   - `@tags` (for searchability)
   - `@kind` (one of the kinds below)
   - Concise explanation (under 6 lines, link to architecture docs for details)

### Lore Kinds
- **`decision`** — A choice was made between alternatives. Document what was chosen and why.
- **`constraint`** — Something that can't be changed without understanding the ripple effects.
- **`workaround`** — A temporary solution. Document what the real fix would be.
- **`gotcha`** — Something that will surprise future developers.
- **`tradeoff`** — An explicit tradeoff with known costs.

### Rules for `@lore` comments
- `@lore-id` is repository-global and follows the knowledge across file moves.
- Exactly one active annotation may exist for an ID.
- Only for cross-cutting impact. If it only affects the current function, use a regular comment.
- Include a date so readers know when this was true.
- Include `@tags` for searchability.
- Keep it under 6 lines. Link to architecture docs for details.
- Never add lore for obvious things. If the code is clear, silence is better.

### Create, update, move, remove

- **Create:** confirm the proposed ID has zero repository matches, then add one annotation.
- **Update (`/lore update <id> <paths>`):** require the explicit exact ID and exactly one match, then replace its fields and
  explanation in place. Do not retain superseded prose beside it.
- **Move:** add the updated annotation at the new authoritative code location and remove the old
  annotation in the same change. Keep the ID unchanged.
- **Remove (`/lore remove <id>`):** require the explicit exact ID; when the knowledge is no longer true, require exactly one match
  and delete the complete annotation. Do not leave an obsolete history comment.
- **Duplicate:** if an ID has multiple matches, stop normal capture/update for it, report every
  `file:line`, and reconcile to one current annotation before continuing.
- **Legacy annotation without an ID:** assign an ID on update only when its identity is
  unambiguous. If multiple annotations might represent the same knowledge, ask rather than guess.

---

## Mode: Scan (`/lore scan`)

Scan the codebase for decisions that should have lore but don't:

1. Look for patterns that suggest undocumented decisions: TODO/FIXME/HACK/WORKAROUND comments
   without `@lore`, lint-ignore / type-ignore directives without explanation, unusual patterns
   that differ from the rest of the codebase.

2. Read files around each finding. Determine if a `@lore` comment is warranted.

3. Report findings with file:line, the pattern found, and suggested lore kind.

4. Ask the user which ones to document, then add `@lore` comments.

---

## Mode: Index (`/lore index`)

Find all existing `@lore` comments across the codebase. Produce a table with file, line, kind,
tags, and summary. Group by tags for a knowledge map of the codebase.

First check repository-global `@lore-id` uniqueness. Duplicate IDs are errors. The index describes
only current active state, never reconstructed historical versions.

---

## Integration with the pipeline

- **Retro** scans changed files for `@lore` annotations during observation gathering — lore
  captured during implementation feeds the retro log.
- **Compound** may propose new lore annotations when a recurring pattern points to an undocumented
  constraint.
- **Review** checks that cross-cutting decisions made during a work package have corresponding
  `@lore` or doc entries.

## Done when

- **Capture/update/remove:** the affected repository-global ID has exactly one current annotation
  (create/update/move) or zero annotations (remove); superseded source prose is gone.
- **Scan:** all findings reported with file:line and suggested kind; user-approved annotations
  added.
- **Index:** a complete table of all `@lore` comments in the codebase, grouped by tags.

## Target

$ARGUMENTS
