---
name: concept
description: "Pre-implementation concept-locking pass: answer 'what IS this thing?' before any design or architecture. Run as the entry point on any work package that introduces or reshapes a primitive, a domain concept, or a load-bearing noun in the system."
phase: 1
persona: planner
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Concept — lock the meaning of the load-bearing nouns

Upstream of `/design` and `/architecture`. Answers **"what IS this thing?"** — the layer where a container is distinguished from an element, a snapshot from an output, a commitment from a task, a measured cost from an elapsed duration. Concepts are the part that is *expensive to change*; they ripple through every downstream variant in design and every contract in architecture. Get them right, then let design and architecture explore freely within them.

**Skip when:** the concept is already locked in `{{paths.docs}}` and the work package doesn't reshape it. Read the relevant doc sections first; if they answer Phase 1 without contradiction, skip.

This skill is design-system-agnostic and applies to any work-package type. It runs even when `pipeline.config` sets `designSystem: null`.

## When this runs

Phase 1, entry point for a work package that introduces or reshapes a primitive / domain concept / load-bearing noun. Before `/design`, `/architecture`, `/write-tests`, `/write-code`.

## What it produces

- `.pipeline/work-packages/<id>/concept.md` — the per-work-package concept-locking output (**always**). This is what `/architecture` reads as a fixed input.
- A ground-truth doc under `{{paths.docs}}` when the concept fits an existing layer (create or update the **specific** file — never a generic folder dump).
- An update to the matching canonical-shapes / contract doc under `{{paths.docs}}` so downstream work packages reference it without re-inventing.

## Required reading (do this first)

1. The work package in `.pipeline/work-packages/<id>.md` (or `.pipeline/work-packages/<id>/`) — separate the central nouns from the incidental ones.
2. Existing canonical-shapes / contract docs under `{{paths.docs}}` — does the noun already have a contract?
3. List `{{paths.docs}}` to identify relevant topic folders, then read each topic's index and drill into the specific files that match the noun.

**Output a "Required reading" section** in your concept doc, listing the specific doc files downstream agents (`/architecture`, `/pipeline`) must read for this work package.

If the spec contradicts an existing concept doc, that is **CRITICAL**. Surface it; never silently re-define.

## Phase 0 — Identify the thing

Name the noun(s) the spec keeps using. Often there is one central noun and 2-3 satellite nouns. List them with one-line working definitions in your own words, then check each against the specific docs you identified in Required reading and against any canonical-shapes contracts under `{{paths.docs}}`.

Classify each noun:

- **New primitive** — not in the system yet; this work package introduces it.
- **Reshaped concept** — exists, but the work package changes what it means or what it commits to (e.g. redefining "cost" as measured token usage rather than elapsed time).
- **Stable concept** — exists and the work package uses it as-is. No concept work needed.

Only **New + Reshaped** nouns enter the rest of this skill. Stable nouns are inputs.

## Phase 1 — Probe the essence

For each New / Reshaped noun, walk the decision tree. Pick only the probes that are actually unsettled — skip the ones where the spec or existing docs already pin the answer. For each remaining probe, propose your read with the evidence you have, then ask the human (or, in autonomous mode, the reviewer running on {{models.review}}) to confirm, override, or dig deeper. Issue all probes for one noun in a single parallel batch — independent probes don't need separate round-trips, and the cost adds up across seven essentials × N nouns.

**Few, important questions.** Three sharp probes force a real decision; ten low-stakes ones get answered with shrugs while the load-bearing assumption stays silent and surfaces years later as a load-bearing bug. The bar to ask is: *"will the answer change the concept doc?"* If no, don't ask.

The seven essential probes (adapt; don't ask all of them — pick what's actually unsettled):

1. **Identity.** "What IS a `<noun>` in one sentence — what kind of thing is it (container? event? snapshot? relationship? capability?)? My read: …"
2. **Essential properties.** "What properties must every `<noun>` have for it to be a `<noun>` at all (vs accidental properties some have)? My read: …"
3. **Rejection list.** "What is a `<noun>` *not*? What adjacent thing is tempting to fold in but is actually a different concept? My read: `<noun>` is not X because Y."
4. **Composition.** "What other concepts does a `<noun>` carry, host, or attach to? My read: a `<noun>` attaches to {hosts}, carries {payload}, is referenced by {references}."
5. **Lifecycle.** "What states does a `<noun>` move through, and what causes each transition? My read: …"
6. **Authority.** "Who owns / produces / mutates a `<noun>`? Where does the source of truth live? My read: …"
7. **Vocabulary collision.** "Does `<noun>` clash with an existing term in any specific doc under `{{paths.docs}}` (including canonical-shapes contracts)? Is it used inconsistently inside this same work package? My read: …"

Stop probing when the concept is sharp, not when you run out of questions. Three to seven branches is typical for a new primitive; one or two for a reshape.

If a maintainer is reachable, surface each probe one at a time (never batch a human). In autonomous mode, propose your answer in the concept doc and let `/architecture`'s in-session spec-alignment scoring catch it later if you got it wrong.

## Phase 2 — Probe the rejection list

The list of what a concept ISN'T is as load-bearing as what it IS. Explicit rejections (the features and behaviours the system deliberately does *not* have) aren't taste — they're concept-level decisions about what the system is not.

For each New / Reshaped noun, write down at least three things it is NOT:

- Adjacent concepts it could be confused with → why they're different.
- Tempting extensions → why they don't belong in this concept.
- Existing patterns seen elsewhere → why we're rejecting them here.

Each rejection carries a reason. "We don't do X because Y" — **Y is the load-bearing part.**

## Phase 3 — Lock the vocabulary

Pick one canonical term per concept. List the aliases that are *not* allowed:

- Other terms used in the same work package for the same thing (collapse to one).
- Terms from prior systems / existing code that mean something different (rename or rescope).
- Translations, if the system is multilingual — mark which language is authoritative.

Format inline in the concept doc:

```md
| Term | Definition | Aliases not to use |
|---|---|---|
| **&lt;noun&gt;** | One-sentence definition — what kind of thing it is. | alias-a, alias-b |
| **&lt;satellite-noun&gt;** | Element inside a &lt;noun&gt;; one-sentence definition. | alias-c, alias-d |
```

If the project later adopts a `/domain-glossary` skill, this table becomes one of its inputs.

## Phase 4 — Probe the contracts

Concepts commit the system to contracts. Make them explicit, one line each:

- **Cardinality contracts.** Does every `<noun>` attach to exactly one host? Many? Zero or one? Choose and write it.
- **Closure contracts.** Is the type vocabulary closed (adding a variant requires a concept-doc update first) or open (callers extend freely)?
- **Mutability contracts.** Once created, what's immutable? What can change? Who can change it?
- **Identity contracts.** What gives a `<noun>` its identity — opaque ID, content hash, deterministic key?
- **Hard rules.** Anything that, if violated downstream, means the implementation has broken the concept. State it as an invariant (e.g. "the on-disk format stays the canonical source; derived views are never persisted").

The planner later turns these into types, schemas, and guards in `/architecture`. Concept work commits to the *shape*, not the implementation.

## Phase 5 — Write the per-work-package concept doc and update ground truth

The output is a concept doc, not a chat summary. Write to:

- `.pipeline/work-packages/<id>/concept.md` — the per-work-package concept-locking output (**always**). The fixed input `/architecture` reads.
- A specific ground-truth file under `{{paths.docs}}` if the concept fits an existing layer. Update or create the **specific** file — do not write to a generic folder.
- An update to the matching canonical-shapes (or sibling contract) doc under `{{paths.docs}}` so downstream work packages reference it without re-inventing.

Doc structure (adapt sections that aren't relevant; don't pad):

```md
## <Noun> primitive

**Definition.** One sentence — what kind of thing it is.

**Essential properties.** Bullet list. What every <noun> has.

**What it is not.** Bullet list. The rejection list with reasons.

**Composition.** What it attaches to, carries, is referenced by.

**Lifecycle.** States and transitions, if any.

**Authority.** Who owns / produces / mutates.

**Vocabulary.** Term table (canonical + aliases not to use).

**Contracts.** Cardinality, closure, mutability, identity, hard rules.

**Rationale.** The maintainer reframe or design tension that drove this shape
(one paragraph). Future agents need to know WHY, not just WHAT, so they don't
re-litigate.
```

## Phase 6 — Challenge the concept (in-session self-critique)

Switch to adversarial thinking. Challenge your own concept — NOT the downstream design or plan:

- Is the rejection list a real list of distinct things, or three flavours of one thing?
- Does the canonical term collide with an existing term in the codebase or in any specific doc under `{{paths.docs}}`? (`grep` to verify.)
- Are the contracts complete, or do they hand-wave on cardinality / closure / mutability / identity?
- Is the rationale concrete (cites a maintainer reframe, a constraint, a prior bug) or generic ("for clarity")?
- Did the concept-doc update touch the right files? Are there other concept docs that need to mention this change?

Address critical issues. Max 1 round.

The concept is now **locked**. Downstream skills take it as a fixed input — they explore *inside* the concept, never reshape it.

## Done when

- `.pipeline/work-packages/<id>/concept.md` exists with definition, essential properties, rejection list, composition, lifecycle, authority, vocabulary table, contracts, and rationale.
- The relevant ground-truth and canonical-shapes docs under `{{paths.docs}}` are created or updated (when applicable).
- A "Required reading" section names the specific docs downstream agents must read.
- Phase 6 self-critique ran and critical issues are addressed.
- No spec/doc contradiction is left silent.

## What this skill does NOT do

It does not design, define an architecture, or write tests or code. That's `/design`, `/architecture`, `/write-tests`, `/write-code`.

## Anti-patterns

- Skipping to design before defining the concept.
- Concept by code (the type is one expression of the concept, not the concept).
- Empty rejection list.
- Vibes-only definitions.
- Re-litigating the concept in `/design` or `/architecture`.
- Padding the probe list — ask only what's unsettled, then issue the survivors as one batch, not seven separate round-trips.

## Target

$ARGUMENTS
