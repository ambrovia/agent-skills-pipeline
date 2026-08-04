---
name: write-code
description: "Implement an approved work package or its assigned technical leaf with the smallest clear solution that satisfies its evidence and contracts. Use after requirements are approved and verification targets are known."
phase: 4
persona: pipeline-builder
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Write code

Read the assigned plan, approved design/architecture, AC-to-evidence map, the applicable
`pipeline.config.yml` rule slots (`{{rules.code}}`, `{{rules.architecture}}`, `{{rules.design-system}}`,
`{{rules.frontend}}`, `{{rules.security}}` — skip undeclared slots), and relevant existing code.
Implement only the approved outcome and blocking retry findings.

Use the simplest repository-native solution. Reuse existing abstractions; add one only when the current
change needs it. Preserve compatibility, migrations, security boundaries, UI behavior, and ownership
explicitly required by the plan or applicable project rules. Make local reversible choices without
returning to architecture.

Run focused checks after meaningful edits. Do not weaken tests, edit outside owned paths, perform adjacent
cleanup, add speculative capability, or redesign around a plan contradiction. Raise a blocker with
evidence when new scope or a changed structural decision is required.

Finish only when required evidence is green — including `{{verify}}` and the end-to-end evidence named in
`architecture.md` — change-caused regressions are fixed, and the diff contains no unrelated work or WP-ID
leakage. Report pre-existing failures separately.

## Target

$ARGUMENTS
