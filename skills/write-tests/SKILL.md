---
name: write-tests
description: "Create proportionate failing evidence for approved acceptance criteria before implementation when behavior is regressible and an automated test is appropriate. Use in the build phase; do not let tests create requirements."
phase: 7
persona: pipeline-builder
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Write tests

Read approved artifacts and configured testing rules. Map every AC to the cheapest reliable evidence.
Prefer existing test lanes and focused behavioral assertions. Add an automated red test before code when
the behavior is regressible and the repository can express it proportionately; use permitted static or
manual evidence for declarative/visual behavior where appropriate.

Tests prove approved requirements and applicable invariants. They may not add outcomes, freeze incidental
implementation, or require unrelated infrastructure. Preserve protected assertions and existing test
meaning. For a compound AC, cover its material conditions without mechanically forcing one file or one
test per AC.

Confirm new behavioral tests fail for the intended missing behavior rather than setup noise. Record the
AC-to-evidence map and any evidence limitation. Stop on a plan contradiction or when required evidence
cannot be produced without new scope.

## Target

$ARGUMENTS
