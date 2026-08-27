---
name: program-design
description: "Interview the maintainer about how the program should work, and write it into the plan in plain words. Use when the approach is not obvious. Produces the how-it-works half of the plan — no contracts, types, or schemas."
phase: 2
persona: orchestrator
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Program design

Work out with the maintainer how the thing actually works — what happens, in what order, and why it
is done that way rather than another way. Like `/refine`, this is a conversation you conduct
yourself, not work you hand to an agent.

Its output is the second half of `plan.md`: an explanation someone could read once and understand.

## Why this exists separately

Architecture answers a different question and answers it in a different language. Contracts, types,
schemas and flows are a technical *interpretation* of a decision — useful once the decision is made,
and unreadable as a way of making it. Plans written in that vocabulary cannot be reviewed by the
person whose judgement matters most.

So: plain words first. If a sentence here could not be said out loud to someone who knows the domain
but not the codebase, it belongs in `/architecture`, not in this plan.

## When it runs

Ambiguity decides, not size. An obvious solution needs no program design however large the work is; a
non-obvious approach needs it however small. If the maintainer already knows how it should work, take
that answer and stop.

## How to interview

**Ask in rounds**, numbered, each with a recommendation, over the questions whose prerequisites are
settled.

**Facts are your job.** How the current system works, what already exists, what a change would touch
— find out, dispatch a subagent to read widely where it is a lot, and bring back the answer. Ask the
maintainer only what needs their judgement.

**When ambiguity is high, go and reduce it.** Dispatch planner subagents to design or to work through
the technical shape, and bring what they find back into the conversation so the uncertainty can be
talked down. If what comes back is not good, the problem is usually the plan or the brief you gave
them — fix that and try again rather than accepting a bad answer.

**Their taste is only what they tell you here.** As in `/refine`: when the approach question is
unanswered for this item, ask. Never import it from another item, another conversation, or a standing
rule written for a different question.

**Stop at confirmation.** Reflect back how you understood it and get agreement — and do not treat
that agreement as permission to start building. Knowing how the thing should work is the most
tempting possible moment to start making it.

## What to write

Into the `## How it works` section of `.pipeline/work/<id>/plan.md`, in plain language. Write only
that section — `/refine` owns `## What we need`, and either interview may run without the other. The
whole plan is budgeted at 50–100 lines, so this is roughly half of that; this half sprawls most
easily, because explaining how something works invites explaining everything about it.

- how the program works — the path through it, in the order things happen;
- why it works that way, and what was rejected;
- where it touches what already exists;
- what is deliberately left simple, and what would have to change for that to stop being enough.

No call stacks, no signatures, no schemas, no file trees. Those are architecture's job, and only when
scope and complexity make them necessary.

## Boundaries

Do not write code, tests, or contracts. Do not expand scope — an approach that requires new outcomes
is a proposed amendment for the maintainer, or a new item.

## Target

$ARGUMENTS
