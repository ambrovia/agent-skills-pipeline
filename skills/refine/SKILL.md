---
name: refine
description: "Interview the maintainer about what they need, and write it into the plan in their words. Use when an item's value, boundary, or a load-bearing noun is not already settled. Skip when the seed is already clear enough to build from."
phase: 2
persona: orchestrator
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Refine

Find out what the maintainer actually wants, and record it well enough that you can represent them
later when they are not in the room. This is a conversation, not a handoff — you conduct it yourself
and you do not spawn an agent to have it for you.

Its output is the user-needs half of `plan.md`, in the maintainer's own language.

## When it runs

Ambiguity decides. Run when the goal, the boundary, the beneficiary, or a load-bearing noun is
unresolved. Skip when the seed already answers those — a bugfix in an established context needs no
interview, and running one anyway is the ceremony this pipeline is trying to stop charging for.

Read the seed in `.pipeline/work/<id>/plan.md`, the track's strategic frame, the project truth under
`{{paths.docs}}` it cites, and enough current behavior to ask informed questions.

## How to interview

**Ask in rounds.** Each round asks every open question whose prerequisites are settled — not one
question at a time, and not a wall of everything. Number them and give each a recommended answer, so
agreeing is cheap and disagreeing is specific.

**Facts are your job; decisions are theirs.** If the codebase, the docs, or the tracker can answer a
question, go find out — dispatch a subagent to read widely and report back rather than spending the
maintainer's attention or your own context on it. Only ask what genuinely requires their judgement.

**Their taste is only what they tell you here.** When you need to know how they want something and
this item's plan does not say, ask. Do not infer it from another item's plan, another conversation,
or a standing rule that was written for a different question. Taste differs by topic and changes over
time; an answer carried in from elsewhere is your own taste wearing a citation.

`{{rules.taste}}` holds the standing conventions this repository already agreed. Read it, and follow
it — but it is not a lookup table for questions the maintainer has not been asked. Stretching a
convention to cover a new question is the same substitution by another route.

**Stop at confirmation.** End the interview by reflecting back what you understood and getting
agreement. Do not treat agreement as permission to start building.

## What to write

Into the `## What we need` section of `.pipeline/work/<id>/plan.md`, in plain language the maintainer
would recognise as their own. Write only that section — `/program-design` owns `## How it works`, and
either interview may run without the other.

- what they need and why it matters, and who it is for;
- what success looks like, concretely enough to tell later whether it happened;
- the boundary — what is explicitly not in this item;
- any load-bearing noun: what it means here, and which readings were rejected;
- their answers on how things should be done, wherever they gave one.

The whole plan is budgeted at 50–100 lines, so this is roughly half of that. Length is not
thoroughness — a plan nobody reads cannot represent anyone.

## Boundaries

Record a newly discovered outcome as a **proposed amendment** and let the maintainer decide; do not
absorb it into scope. Work that is genuinely separate is written down as a proposed item for them to
register — you do not create items, and this one does not grow to swallow them.

Do not design the UI, choose an architecture, or write tests or code here.

## Target

$ARGUMENTS
