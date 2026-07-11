---
name: refine
description: "Clarify a work package's goal before design and architecture: the user value it delivers, the impact it should have, what success looks like, and what's out of scope; then draft the user/dev guide that tells that story. Pin any new domain noun it introduces as a later step. Run as the first pre-build act on any work package whose goal isn't yet sharp."
phase: 1
persona: pipeline-planner
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Refine — sharpen the goal

First pre-build act in the pipeline: **refine → human approval → design → human design approval → architecture**. It clarifies the **goal** — the user value the work delivers, the product impact it should have, and what success looks like — and bounds the scope, so design and architecture build toward a sharp target. A fuzzy goal is the most expensive thing to get wrong: it ripples through every design variant and every architecture contract. Sharpen the goal first; the founder locks it in `/human-concept-review` Pass 1 before agents proceed.

**Per-work-package only.** Inherit the track's *strategic frame* (boundary, primitive, shared nouns — set in `/work-planning` + `{{paths.docs}}`) as fixed input; never contradict it. Sharpen this one work package's requirement.

**Skip when:** the goal is already sharp — value, success, and scope are unambiguous — and the work introduces no new or reshaped noun. Read the relevant `{{paths.docs}}` sections first; if they leave nothing open, skip.

This skill is design-system-agnostic and applies to any work-package type. It runs even when `pipeline.config` sets `designSystem: null`.

## When this runs

Phase 1, the first pre-build act for a work package whose goal is unclear or that introduces / reshapes a primitive / domain concept / load-bearing noun. Before `/design`, `/architecture`, `/write-tests`, `/write-code`.

## What it produces

- **`.pipeline/work/<id>/requirements.md`** — refine's own document, the **primary artifact** for `/human-concept-review` Pass 1. It carries the `DOC-CLASS` line (informational), the sharpened goal, the guide draft, and an **AC alignment table** mapping each acceptance criterion to how the requirement covers it. It **references `plan.md`** (the WP spec) and **updates `plan.md` only if the overall plan changes** (scope, ACs, intent) — otherwise `plan.md` stays as `/work-planning` seeded it. `/design` and `/architecture` read `requirements.md` as fixed input **after** founder approval. Because it is a discrete file (and any plan change is a diff on `plan.md`), the reviewer sees exactly what refine changed against the seed.
- A ground-truth doc under `{{paths.docs}}` when the requirement reshapes an existing layer — the **specific** file, never a generic folder dump.

## Required reading (do this first)

1. The seed sections of `.pipeline/work/<id>/plan.md` — the `## Work package` and `## Acceptance criteria` that `/work-planning` wrote — what it asks for and why. Refine must not weaken them; a contradiction is **CRITICAL**.
2. Existing canonical-shapes / contract docs under `{{paths.docs}}` — does the noun already have a contract?
3. List `{{paths.docs}}` to identify relevant topic folders, then read each topic's index and drill into the specific files that match the noun.

**Output a "Required reading" note** inside `requirements.md`, listing the specific doc files downstream agents (`/design`, `/architecture`, `/pipeline`) must read for this work package.

If the spec contradicts an existing requirements / concept doc, that is **CRITICAL**. Surface it; never silently re-define.

## Phase 0 — Sharpen the goal

Settle the goal in your own words, then confirm it with the maintainer:

- **Value & audience** — what value this delivers, and to whom. The one question always worth asking a reachable maintainer; a misread goal is far cheaper to correct here than after the build.
- **Success** — what a user or the system can observably do once this ships that they couldn't before.
- **Scope** — what the work deliberately leaves out; the exclusions bound it as much as the inclusions.

Ask only the few questions that would change the goal or its scope; lead with your read, and if an answer moves the scope, settle the goal before anything downstream.

## Phase 1 — Plan backwards

State the goal as the user/dev guide that would explain the feature once it shipped — what a user can now do or see, or how a developer uses the capability. Working back from that end state pressure-tests the goal: if the guide is hard to write, the goal isn't sharp yet. Keep this draft — `/human-concept-review` Pass 1 is where the founder approves it; `/write-docs` later reconciles it into `{{paths.docs}}` against what actually shipped.

## Phase 2 — Write requirements.md

Write (or revise) **`.pipeline/work/<id>/requirements.md`** — the per-work-package requirement `/human-concept-review` reviews before any design or architecture. Leave the seeded `plan.md` (`## Work package`, `## Acceptance criteria`) intact; update `plan.md` only if this refine changes the overall plan (scope, ACs, intent):

1. **Sharpened goal** — value, success, scope (with real non-goals).
2. **Guide draft** from Phase 1.
3. **AC alignment table** — one row per acceptance criterion in `## Acceptance criteria`: the AC text, how the requirement covers it, and any gap flag.
4. **Required reading** — specific doc files downstream agents must read.
5. **`DOC-CLASS` line** (informational metadata — does not gate human review):

```
DOC-CLASS: significant|minor|none
```

`significant` = a new user/dev-guide page or a large rewrite. `minor` = small additions. `none` = no reader-visible doc change expected. Human concept review **always** runs regardless of class.

When the work reshapes an existing layer, update the specific `{{paths.docs}}` ground-truth file too.

## Phase 3 — Clarify any nouns (only if the work introduces one)

If the work introduces or reshapes a load-bearing noun, pin it — lightly. For each, settle just enough that design and architecture don't drift on what it means:

- A one-sentence definition of what it is.
- What it is explicitly **not**, where it could be confused with an adjacent term — so the name stays unique (`grep` `{{paths.docs}}` for collisions).
- Any hard rule it must honor — an invariant that, if broken downstream, breaks the noun.

Stop there: a distinct, unambiguous noun, not a data model. No cardinality / lifecycle / composition matrices, no alias tables.

## Done when

- `.pipeline/work/<id>/requirements.md` exists with the `DOC-CLASS` line, the sharpened goal (value, success, scope), a guide draft, an AC alignment table, and — if the work introduced a noun — its definition + hard rules.
- The relevant `{{paths.docs}}` ground truth is updated when the work reshapes a layer.
- A "Required reading" section names the specific docs downstream agents must read.
- No spec/doc contradiction is left silent.
- The requirement is ready for `/refine-critique` then `/human-concept-review` Pass 1 — no design or architecture work may start until the founder approves.

## What this skill does NOT do

- It does not design, define an architecture, or write tests or code. That's `/design`, `/architecture`, `/write-tests`, `/write-code`.
- It does not settle the track's strategic frame (`/work-planning` does).

## Anti-patterns

- Jumping to nouns or design before the goal is sharp.
- A goal with no stated value, success condition, or non-goals.
- Skipping the value question when a maintainer is reachable.
- Turning noun-pinning into a taxonomy — define, disambiguate, note hard rules, stop.
- Re-litigating the requirement in `/design` or `/architecture`.

## Target

$ARGUMENTS
