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
returning to architecture, and record a non-obvious one as `@lore` where it lives rather than leaving the
next reader to rediscover it.

Commit at each completed task boundary. An interrupted session then resumes from the last commit instead
of stranding work in a dirty tree.

Use focused checks while building; do not run `{{verify}}` after every edit. Run it when the integrated
implementation is ready, and rerun it only after later changes invalidate the result. Run each check
once and wait for it; never re-invoke a command to poll its status. Mechanical check results injected
with a retry brief are evidence — act on them rather than re-running them. Add tests only for
approved behavior where they can catch a meaningful regression. Do not weaken tests, edit outside owned
paths, perform adjacent cleanup, add speculative capability, or redesign around a plan contradiction.
Raise a blocker with evidence when new scope or a changed structural decision is required.

Finish only when required evidence is green — including `{{verify}}` and the end-to-end evidence named in
`architecture.md` — change-caused regressions are fixed, and the diff contains no unrelated work or WP-ID
leakage. Report pre-existing failures separately.

## Target

$ARGUMENTS
