---
name: refine
description: "Clarify why a work package exists before design and architecture: sharpen the goal — the user value, the product impact, what success looks like, and what's out of scope — then draft the user/dev guide that tells that story. Pin any new domain noun it introduces as a trailing step. Run as the first pre-build act on any work package whose goal or value isn't yet sharp."
phase: 1
persona: planner
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Refine — sharpen the goal

First of a work package's three pre-build acts: **refine → design → architecture**. Refinement clarifies **why this work package exists and what counts as success** — the user value it generates and the product impact it should have — scoped sharply enough that design and architecture can't wander. A fuzzy goal is the most expensive thing to get wrong: it ripples through every design variant and every architecture contract downstream. Sharpen the goal, then let design and architecture explore freely toward it.

Pinning the exact domain nouns the work introduces matters too, but it is **downstream of a sharp goal** — do it once the goal is settled, and only when the work actually introduces or reshapes one.

**Per-work-package only.** Inherit the track's *strategic frame* (boundary, primitive, shared nouns — set in `/work-planning` + `{{paths.docs}}`) as fixed input; never contradict it. Sharpen this one work package's goal.

**Skip when:** the goal is already sharp — the spec's value, success, and scope are unambiguous — and the work introduces no new or reshaped noun. Read the relevant `{{paths.docs}}` sections first; if they leave nothing open, skip.

This skill is design-system-agnostic and applies to any work-package type. It runs even when `pipeline.config` sets `designSystem: null`.

## When this runs

Phase 1, the first pre-build act for a work package whose goal, value, or scope isn't yet sharp (or that introduces / reshapes a load-bearing noun). Before `/design`, `/architecture`, `/write-tests`, `/write-code`.

## What it produces

- `.pipeline/work-packages/<id>/requirements.md` — the per-work-package requirement (**always**): the sharpened goal, the guide draft, and the `DOC-CLASS` line. The fixed input `/design` and `/architecture` read.
- A ground-truth doc under `{{paths.docs}}` when the work reshapes an existing layer — the **specific** file, never a generic folder dump.

## Required reading (do this first)

1. The work package in `.pipeline/work-packages/<id>.md` — what it asks for and why.
2. The track's strategic frame in `{{paths.docs}}` — the value and boundary this WP serves.
3. Any canonical-shapes / contract doc under `{{paths.docs}}` for a noun the work touches.

If the spec contradicts a locked requirement or `{{paths.docs}}`, that is **CRITICAL** — surface it; never silently re-define.

## Phase 1 — Sharpen the goal

The heart of this skill. Settle each below in your own words first, then confirm with the maintainer:

- **Value & audience.** What value does this generate, and for whom? This is the one question always worth asking when a maintainer is reachable — a misread goal is far cheaper to fix here than after build.
- **Success.** What is observably true when this succeeds — what can a user or the system do that they couldn't before?
- **Why now.** The problem or impact it addresses, and the cost of not doing it.
- **Scope & non-goals.** What this deliberately does *not* do. The exclusions are as load-bearing as the inclusions.

**Ask few, sharp questions.** Only ask what would actually change the goal or scope — a handful of decisive questions beat a long checklist answered with shrugs. Lead with your read; if an answer reshapes scope, fix the goal before going further. When the maintainer is reachable, surface one question at a time; in autonomous mode, write your best answer into `requirements.md` and let `/architecture`'s spec-alignment scoring catch a miss.

## Phase 2 — Pin the nouns (only if the work introduces or reshapes one)

Skip this entirely when the work introduces no new domain noun. Otherwise, for each noun the sharpened goal introduces or reshapes, pin what it IS and ISN'T so design and architecture build on solid ground. Cover only the points the spec or `{{paths.docs}}` leaves open:

- **Identity & properties.** What kind of thing is it (container? event? snapshot? relationship? capability?), and what must every instance have to be one at all?
- **Rejection list.** At least three things it is NOT — adjacent concepts, tempting extensions, patterns from elsewhere — each with the reason it's excluded. "We don't do X because Y"; Y is the load-bearing part.
- **Composition & lifecycle.** What it carries, attaches to, or is referenced by; the states it moves through.
- **Authority.** Who owns, produces, and mutates it; where the source of truth lives.
- **Contracts.** Cardinality, closure (open vs closed vocabulary), mutability, identity, and any hard rule that, if broken downstream, means the noun was broken.
- **Vocabulary.** One canonical term; list the aliases not to use, collision-checked against `{{paths.docs}}` (`grep` to verify).

The planner turns these into types, schemas, and guards in `/architecture`; here you commit to the *shape*, not the implementation.

## Phase 3 — Draft the guide and emit DOC-CLASS

**Plan backwards — draft the guide.** The clearest statement of a goal is the user/dev documentation that would explain the shipped result. Add a **Guide draft** section to `requirements.md` in the user/dev-guide voice — what a user can now do or see, or how a developer uses the capability. `/human-concept-review` reviews this draft; `/write-docs` later reconciles it into `{{paths.docs}}` against as-built reality.

**Emit the `DOC-CLASS` line** at the top of `requirements.md` — the doc half of the human-concept-review gate (the design half is `/design`'s `DESIGN-CLASS`):

```
DOC-CLASS: significant|minor|none
```

`significant` = a new user/dev-guide page or a large rewrite. `minor` = small additions to an existing page. `none` = nothing a reader sees, reads, or does changes. Human concept review runs when **either** `DESIGN-CLASS == novel` OR `DOC-CLASS == significant`.

## Phase 4 — Challenge it (in-session self-critique)

Adversarially challenge your own requirement — not the downstream design or plan:

- Is the value concrete (names who benefits and how), or generic?
- Is success observable, or vibes?
- Are the non-goals real exclusions, or filler?
- (If it introduced a noun) is the rejection list distinct things, and do the contracts hand-wave on cardinality / closure / mutability / identity?
- Is the guide draft something a real user/dev could follow?

Address critical issues. Max 1 round. The goal is now **locked** — `/design` and `/architecture` explore *inside* it, never reshape it.

## Done when

- `requirements.md` exists with the `DOC-CLASS` line, the sharpened goal (value, success, scope/non-goals), a guide draft, and — if the work introduced a noun — its shape and contracts.
- The relevant `{{paths.docs}}` ground truth is updated when the work reshapes a layer.
- Phase 4 self-critique ran; no spec/doc contradiction is left silent.

## What this skill does NOT do

- It does not design, architect, or write tests/code. That's `/design`, `/architecture`, `/write-tests`, `/write-code`.
- It does not settle the track's strategic frame (`/work-planning` does).

## Anti-patterns

- Jumping to nouns or design before the goal is sharp.
- A goal with no stated value, success condition, or non-goals.
- Skipping the value question when a maintainer is reachable.
- Empty rejection list on a genuinely new noun.
- Re-litigating the goal in `/design` or `/architecture`.

## Target

$ARGUMENTS
