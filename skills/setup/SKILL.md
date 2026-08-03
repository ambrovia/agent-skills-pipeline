---
name: setup
description: "Configure evidence-backed, maintainer-approved pipeline rule slots and design-system paths for this repository. Use during installation or when repository conventions change; do not promote generic best practices into binding policy automatically."
argument-hint: "[rule slot to configure, e.g. 'design-system', 'testing', 'security', 'docs', or 'all']"
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Setup

For each requested rule slot, inspect repository configuration, code, tests, docs, CI, and established
patterns. Distinguish:

- an existing invariant supported by evidence;
- a future policy the maintainer may choose;
- conditional guidance or a generic suggestion.

Present evidence, proposed rule text, applicability, blocking force, and trade-offs. Ask the maintainer
to approve or revise it. Write only approved rules and wire only real paths; `null` deliberately means
no repository-specific rule for that slot.

Rules govern how in-scope changes are made. They do not expand work-package outcomes or retroactively
require unrelated infrastructure. Include concrete triggers and skip conditions so consumers know when
a rule applies. Validate configured paths and references after writing.

## Target

$ARGUMENTS
