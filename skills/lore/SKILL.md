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
or gets lost in old PRs. `@lore` annotations keep the current knowledge at the relevant code site;
Git retains its history.

---

## Mode: Capture (`/lore <file paths>`)

Read the specified files and identify decisions worth documenting:

1. **Read each file** and look for:
   - Non-obvious constraints (why something can't be simpler)
   - Cross-cutting decisions (this choice affects files elsewhere)
   - Workarounds (temporary solutions with known limitations)
   - Performance tradeoffs (chose speed over readability, or vice versa)
   - Architecture boundary enforcement (why this import/dependency exists or is forbidden)

2. **Search the repository for `@lore-id`.** Update or remove only an exact ID with one match.
   Similar topics/tags are not identity; ask whether to update or create.

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
- **Update:** `/lore update <id> <paths>` requires one exact match. Replace it; keep no superseded prose.
- **Move:** add at the new authoritative location and remove the old annotation in the same change. Keep the ID.
- **Remove:** `/lore remove <id>` requires one exact match. Delete the complete annotation.
- **Duplicate:** report every `file:line` and reconcile to one annotation before continuing.
- **Legacy:** assign an ID only when identity is unambiguous; otherwise ask.

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

Check repository-global `@lore-id` uniqueness. Index only current annotations.

---

## Integration with the pipeline

- **Retro** scans changed files for `@lore` annotations during observation gathering — lore
  captured during implementation feeds the retro log.
- **Compound** may propose new lore annotations when a recurring pattern points to an undocumented
  constraint.
- **Review** checks that cross-cutting decisions made during a work package have corresponding
  `@lore` or doc entries.

## Done when

- **Capture/update/remove:** the ID has one current annotation, or none after removal.
- **Scan:** all findings reported with file:line and suggested kind; user-approved annotations
  added.
- **Index:** a complete table of all `@lore` comments in the codebase, grouped by tags.

## Target

$ARGUMENTS
