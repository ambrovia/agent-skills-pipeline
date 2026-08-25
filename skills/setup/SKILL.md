---
name: setup
description: "Configure evidence-backed, maintainer-approved pipeline rule slots and design-system paths for this repository. Use during installation or when repository conventions change; do not promote generic best practices into binding policy automatically."
argument-hint: "[rule slot to configure, e.g. 'design-system', 'testing', 'security', 'docs', or 'all']"
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Setup

Configuration lives in `pipeline.config.yml` at the repository root — `verify`, `vcs`, `paths`,
`designSystem`, `engineering.tier`, optional `worktree` lifecycle settings, optional `checks` and
`hooks` wiring, and the `rules` slots (`code`,
`testing`, `architecture`, `design-system`, `frontend`, `visual`, `aesthetics`, `security`, `docs`), each
pointing at a markdown file of binding project guidance. Start from `pipeline.config.example.yml`.

Write approved rule files to `.pipeline/rules/<slot>.md` and point the slot at that path. The location is
host-neutral, so every tool reads the same rules. Rule files are maintainer-authored and committed; a
pipeline run may not edit them.

On a first run, propose the slots most repositories need rather than only the ones asked for: `code`,
`testing`, and `security` at minimum, plus `design-system` and `frontend` wherever a UI exists. Reason
each one from current best practice for this stack and what the repository already does. Leaving a slot
`null` is a legitimate answer, but it should be a recorded maintainer decision — an empty slot quietly
reduces every later phase to generic judgment on the subject it covers.

For each requested rule slot, inspect repository configuration, code, tests, docs, CI, and established
patterns. Distinguish:

- an existing invariant supported by evidence;
- a future policy the maintainer may choose;
- conditional guidance or a generic suggestion.

For an established repository, also inspect available retros, compound candidates, and lore. For each
recurring lesson, identify whether the generic pipeline already handles it, it should become a repository
rule, or it is no longer applicable. Never promote a historical observation automatically.

Configure worktree bootstrap, cleanup, and forbidden-artifact checks only from commands and hazards the
repository already owns or the maintainer approves. Leave absent lifecycle settings unset; never guess.

Confirm the host capability inventory (`<plugin-root>/docs/host-capabilities.md`) for the hosts the
repository uses, and record newly observed capabilities or gaps there — pipeline mechanics pick the
cheapest mechanic each host supports.

Present evidence, proposed rule text, applicability, blocking force, and trade-offs. Ask the maintainer
to approve or revise it. Write only approved rules and wire only real paths; `null` deliberately means
no repository-specific rule for that slot.

Rules govern how in-scope changes are made. They do not expand work-package outcomes or retroactively
require unrelated infrastructure. Include concrete triggers and skip conditions so consumers know when
a rule applies. Validate configured paths and references after writing.

## Target

$ARGUMENTS
