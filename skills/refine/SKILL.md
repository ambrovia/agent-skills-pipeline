---
name: refine
description: "Clarify a work package's goal before design and architecture: the user value it delivers, the impact it should have, what success looks like, and what's out of scope; then draft the user/dev guide that tells that story. Pin any new domain noun it introduces as a later step. Run as the first pre-build act on any work package whose goal isn't yet sharp."
phase: 1
persona: planner
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Refine — sharpen the goal

First of a work package's three pre-build acts: **refine → design → architecture**. It clarifies the **goal** — the user value the work delivers, the product impact it should have, and what success looks like — and bounds the scope, so design and architecture build toward a sharp target. A fuzzy goal is the most expensive thing to get wrong: it ripples through every design variant and every architecture contract. Sharpen the goal first; pinning the shape of any new domain noun the work introduces is a later step, and only when it introduces one.

**Per-work-package only.** Inherit the track's *strategic frame* (boundary, primitive, shared nouns — set in `/work-planning` + `{{paths.docs}}`) as fixed input; never contradict it. Sharpen this one work package's requirement.

**Skip when:** the goal is already sharp — value, success, and scope are unambiguous — and the work introduces no new or reshaped noun. Read the relevant `{{paths.docs}}` sections first; if they leave nothing open, skip.

This skill is design-system-agnostic and applies to any work-package type. It runs even when `pipeline.config` sets `designSystem: null`.

## When this runs

Phase 1, the first pre-build act for a work package whose goal is unclear or that introduces / reshapes a primitive / domain concept / load-bearing noun. Before `/design`, `/architecture`, `/write-tests`, `/write-code`.

## What it produces

- `.pipeline/work-packages/<id>/requirements.md` — the per-work-package requirement output (**always**). Carries the `DOC-CLASS` line and the guide draft. This is what `/design` and `/architecture` read as a fixed input.
- A ground-truth doc under `{{paths.docs}}` when the requirement reshapes an existing layer — the **specific** file, never a generic folder dump.

## Required reading (do this first)

1. The work package in `.pipeline/work-packages/<id>.md` (or `.pipeline/work-packages/<id>/`) — what it asks for and why.
2. Existing canonical-shapes / contract docs under `{{paths.docs}}` — does the noun already have a contract?
3. List `{{paths.docs}}` to identify relevant topic folders, then read each topic's index and drill into the specific files that match the noun.

**Output a "Required reading" section** in your requirements doc, listing the specific doc files downstream agents (`/design`, `/architecture`, `/pipeline`) must read for this work package.

If the spec contradicts an existing requirements / concept doc, that is **CRITICAL**. Surface it; never silently re-define.

## Phase 0 — Sharpen the goal

Settle the goal in your own words, then confirm it with the maintainer:

- **Value & audience** — what value this delivers, and to whom. The one question always worth asking a reachable maintainer; a misread goal is far cheaper to correct here than after the build.
- **Success** — what a user or the system can observably do once this ships that they couldn't before.
- **Scope** — what the work deliberately leaves out; the exclusions bound it as much as the inclusions.

Ask only the few questions that would change the goal or its scope; lead with your read, and if an answer moves the scope, settle the goal before anything downstream.

**Then, only if the work introduces or reshapes a load-bearing noun, flag it** for Phase 1. If it only reuses nouns already settled in `{{paths.docs}}`, skip Phase 1.

## Phase 1 — Pin any new noun (only if the work introduces one)

Keep this light — refinement is about value, not building a taxonomy. For each new or reshaped noun, settle just enough that design and architecture don't drift:

- A one-sentence definition of what it is.
- What it is explicitly **not**, where it could be confused with an adjacent term — so the name stays unique (`grep` `{{paths.docs}}` for collisions).
- Any hard rule it must honor — an invariant that, if broken downstream, breaks the noun.

Stop there. No cardinality / lifecycle / composition matrices, no alias tables — pin only what keeps the noun distinct and unambiguous.

## Phase 2 — Write requirements.md and emit DOC-CLASS

Write `.pipeline/work-packages/<id>/requirements.md` — the per-work-package requirement `/design` and `/architecture` read: the sharpened goal (value, success, scope), any new noun's definition + hard rules, the guide draft (below), and the DOC-CLASS line. When the work reshapes an existing layer, update the specific `{{paths.docs}}` ground-truth file too.

**Plan backwards — draft the guide.** The clearest way to state a requirement is to write the user/dev documentation that explains what's being built, as if it shipped. Include in `requirements.md` a **Guide draft** section in the user/dev-guide voice (what the user will be able to do or see, or — for a dev-facing capability — how a developer will use it). This draft is the story the requirement tells; `/human-concept-review` reviews it, and `/write-docs` later reconciles it into `{{paths.docs}}` against the as-built reality.

**Emit the `DOC-CLASS` line.** At the top of `requirements.md`, emit one machine-greppable line forecasting how much this work package will rewrite the user/dev guides — the doc half of the human-concept-review gate (the design half is `/design`'s `DESIGN-CLASS`):

```
DOC-CLASS: significant|minor|none
```

`significant` = a new user/dev-guide page or a large rewrite of an existing one (the guide draft above is substantial and new). `minor` = small additions to an existing page. `none` = nothing a reader sees, reads, or does changes. Human concept review runs when **either** `DESIGN-CLASS == novel` OR `DOC-CLASS == significant`.

## Phase 3 — Challenge it (in-session self-critique)

Switch to adversarial thinking. Challenge your own requirement — not the downstream design or plan:

- Is the value concrete (names who benefits and how), or generic?
- Is success observable, or vibes?
- Are the non-goals real exclusions, or filler?
- Is the guide draft something a real user/dev could follow?
- If it introduced a noun: is the definition unambiguous and the term free of collisions?

Address critical issues. Max 1 round. The requirement is now **locked** — `/design` and `/architecture` take it as fixed input and explore *inside* it, never reshape it.

## Done when

- `requirements.md` exists with the `DOC-CLASS` line, the sharpened goal (value, success, scope), a guide draft, and — if the work introduced a noun — its definition + hard rules.
- The relevant `{{paths.docs}}` ground truth is updated when the work reshapes a layer.
- A "Required reading" section names the specific docs downstream agents must read.
- Phase 3 self-critique ran; no spec/doc contradiction is left silent.

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
