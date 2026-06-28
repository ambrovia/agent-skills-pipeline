---
name: work-planning
description: "Create a new work-package spec — outcome-level only — and register it in the manifest + track index. Maintainer-only. Use when introducing a new work package or breaking a track into work packages. Triggers: 'add a new work package', 'plan a work package', 'register X under Track Y'."
phase: 1
persona: any
applies-to: [frontend, backend, application, framework, infra]
argument-hint: "[track-letter] [short-title] (e.g. 'L mobile-collapse')"
user-invocable: true
---

# Work Planning — define and register a work package

You are creating a new work-package spec. The output is a **specification** the pipeline can consume: what the user / system should observe when this is done — not how to build it.

**Skip when:** this skill applies to any work-package type and any project; there is no design-system gate. It does NOT apply mid-pipeline-run — see below.

---

## Who runs this skill

**Maintainer-only.** This skill is invoked manually by a maintainer (the project owner) when introducing or reshaping a work package.

The pipeline runner (`/pipeline`) and any pipeline-spawned sub-agent must NEVER invoke `/work-planning`. Inventing scope mid-run is forbidden — that is what `blocked: concept-missing` and `blocked: spec-incomplete` exist for. If you are inside a pipeline run and find yourself reaching for this skill, stop and mark the work package `blocked` instead.

---

## What a work package IS (and isn't)

A work package is the **smallest deliverable end-to-end change** that has its own observable outcome and its own acceptance criteria.

**It IS:**
- An outcome statement: what becomes true for the user or the system when this ships.
- A list of acceptance criteria phrased as observable behavior.
- A list of dependencies on other work packages — only when they are real blockers (the work package literally cannot be implemented or verified until the dep is `done`).
- A complexity estimate (S / M / L) that determines how the scheduler dispatches it.

**It is NOT:**
- An implementation plan. No file paths, no type signatures, no chosen libraries, no migration steps. Those belong in `/architecture`'s output, written *after* this work package is registered.
- A design exploration. No component layouts, no spacing decisions, no copy. Those come from `/design` after registration. (If no design system is configured — `pipeline.config designSystem: null` — there is no design step at all.)
- A per-work-package requirement. Value, noun shape, and guide draft are `/refine`'s output at build time. This skill settles only the track's *strategic frame*.
- A research / investigation / exploration deliverable. "Research X," "explore the space," "produce findings" has no observable outcome — and balloons into a composite the moment it has to ship something. Research is an *input* to scoping, not a unit of work: it happens in this skill (the existing-implementation check / an Explore agent) or in `/refine`, and its conclusions shape the ACs. Register the work package that *acts on* the research, not the research itself.
- A backlog item. If it has no AC, it is not a work package.

---

## Strategic-framing questionnaire (run first, before registering anything)

Settle **what this track is about** at a strategic altitude — a few sharp questions, your read
first, the maintainer confirms or redirects. Not per-work-package design; that's `/refine`,
later. Ask only what's unsettled.

1. **Value & frame.** "What is this track fundamentally about — what value does it generate, and what's the one boundary / primitive / load-bearing noun it establishes? My read: …"
2. **Shape of the work.** "What are the work packages this breaks into, roughly?" For each, classify two things up front:
   - **Refinement?** Is the WP's goal still unclear enough that `/refine` should run before build to sharpen it? (Unclear / novel-noun → Yes; obvious extension → No.)
   - **Load-bearing?** Is this a WP where getting the user-facing shape wrong is expensive — a new essential / base / primitive component, a large redesign, or a significant user/dev-guide rewrite? Those forecast **Human concept review = Yes**.
3. **Frame stability.** "Is the frame stable enough that the ACs won't churn, or are there open conceptual questions to resolve first?" If unstable → hold; resolve the open questions here before registering.

The outputs feed the spec: the strategic frame lands in `{{paths.docs}}` ground truth (and the
**What exists today** paragraph), and the per-WP classification lands in the **Refinement** and
**Human concept review** fields.

---

## Pre-flight checks (refuse to proceed if any fails)

1. **Track letter is valid.** Must match an existing `.pipeline/work-packages/<track>.md` or be a deliberate new track (in which case create the track file first with the same scope-rules section other tracks use).
2. **Work-package ID is unique.** Read `.pipeline/pipeline-manifest.yml`; the generated ID (e.g. `L30`) must not collide with any existing entry.
3. **Strategic-frame gate.** The track's **strategic frame** — its load-bearing primitive / boundary and the frame every work package shares — must be defined in `{{paths.docs}}` before registering. Run the strategic-framing questionnaire to settle it; if it's vague or contested, **hold** and resolve the open questions. A per-WP noun needing its own `/refine` does not block registration — flag the **Refinement** gate so the pipeline runs it at build time. `/pipeline` enforces this at runtime (`blocked: concept-missing` if a WP reaches build with no frame).
4. **Justification check.** The work package must have a clear answer to: "Who specifically benefits, and what's the cost of NOT building this?" If the only argument is "it would be nice," "other products have it," or "the research says so," the work package is not justified. Features are complexity — every one makes the system harder to understand, maintain, and explain. The burden of proof is on the work package to earn its existence. Refuse to register if the justification is weak.
5. **Existing-implementation check.** Before writing the spec, search `{{paths.source}}` for the capability being proposed. Read the relevant source files — schemas, routes, services, UI pages. If the feature largely exists, the spec must document what's already built (in a "What exists today" paragraph) and identify only the genuine gap. Proposing to build something that already exists is the #1 failure mode in work-planning. When in doubt, spawn an Explore agent to audit the relevant subsystem.
6. **Dependencies are real blockers.** For each declared dependency, write one sentence justifying *why* this work package cannot start until that one is `done`. "Logically related" is not a blocker — it just serializes the scheduler. If you cannot articulate the blocker, drop the dep.
7. **Sizing fits the rule** (see below).

---

## Sizing rule (S / M / L)

| Size | Rule of thumb | Scheduler behavior |
|------|---------------|--------------------|
| **S** | ≤30 minutes of focused work. ≤3 acceptance criteria. Touches one subsystem. No new primitives. | **Batched** with up to 3 other S work packages from the same track in one agent session. |
| **M** | Half-day to one day. Touches one subsystem or contract. AC list fits in 5–7 bullets. | **Solo agent**, one session per work package. |
| **L** | Multi-day. Touches multiple subsystems, introduces or reshapes a primitive, or has ≥8 AC. | **Solo agent**, one session per work package. May need split into smaller work packages during `/architecture`; that's expected. |

**Decomposition rule.** If a work package has more than 7 acceptance criteria, or if its AC span more than one subsystem, split it. Two M work packages that compose are nearly always better than one L work package that doesn't.

**Honesty rule.** Don't size something S to make it batchable. If the work is genuinely M, say M. The scheduler's parallelism is not a reward for under-estimation.

---

## Output contract — the spec template

Work-package specs live **inline as H3 sections inside `.pipeline/work-packages/<track>.md`** (NOT as standalone files). Follow the existing convention used by the other track files. Pipeline-step artifacts (`<id>-architecture-review.md`, `<id>-plan.md`, …) DO get their own files — those are produced later by `/architecture` and friends, not by you.

Append the spec at the bottom of the relevant `<track>.md`, with **exactly** these sections, in this order:

```markdown
### <ID> — <Title>

**Work package.** One paragraph (4-6 sentences max) framed as: *As a <role>, I want <observable outcome>, so that <reason>.* Concrete, no jargon, no acronyms unless already established under `{{paths.docs}}`. The first reader must be able to picture the user-visible or system-visible result without reading further.

**Why this matters.** 2-4 sentences making the case for building this. Who benefits and how? What's the cost of NOT building it? Every feature adds complexity — the burden of proof is on the work package to justify its existence. Name the specific person (maintainer, team lead, agent, end user) whose life gets measurably better and how. If you can only argue "it would be nice" or "other products have it," the work package isn't ready. If simplicity would be better served by NOT building this, say so and don't register.

**Type.** A one-word label for the kind of work (e.g. frontend, backend, infra, library) — informational only, so the reader knows what to expect. It does not gate phases: the pipeline decides whether `design`/`design-critique` run from whether the work has a UI surface and whether `pipeline.config designSystem` is set.

**What exists today.** One paragraph summarizing the relevant infrastructure and capabilities that already exist in the codebase. Name the specific tables, services, routes, or UI pages that this work package builds on. If this is greenfield, say "Nothing — this is a new capability." This paragraph prevents the architecture pass from rebuilding what already works and helps the builder understand what to extend vs create. Required for M and L work packages; optional for S.

**What's genuinely missing.** 2-3 sentences identifying the specific gap between what exists and what the work package delivers. This is the delta — the reason this work package needs to exist. If you cannot articulate the delta clearly, the work package may not be needed.

**Depends on.** A bulleted list of work-package IDs, or "None." For each declared dep, one sentence on *why this work package cannot start until that one is `done`*.

**Complexity.** S | M | L — drives scheduler dispatch (see sizing rule).

**Pre-build gates.** Two explicit declarations so the maintainer (and `/pipeline`) know what runs *before* this WP is built, each with a one-line reason:
- **Refinement:** `Required — run /refine first (goal unclear, or introduces/reshapes: <noun>)` | `Not required — goal is clear and reuses requirements already locked in {{paths.docs}}`.
- **Design:** `Required — novel surface; /design multi-variant + human review` | `Light — extends <existing component/page>; single-variant /design` | `Not required — backend/infra; skip /design` (also implied when `pipeline.config designSystem: null`).

**Human concept review.** Yes | No — `<one-line reason>`. Forecasts whether the founder will review the user-facing parts (the user/dev-guide draft + the design). Forecast `Yes` when the WP introduces a new essential / base / primitive component, a large redesign, OR a significant rewrite of the user/dev guides; `No` for a routine tweak, a backend/infra-only WP, or an extension of an existing component. **Advisory forecast, NOT the trigger** — the authoritative gate is `DESIGN-CLASS == novel` OR `DOC-CLASS == significant` at review time (a WP forecast `No` that `/design` later classifies `novel` or `/refine` marks `DOC-CLASS: significant` still parks).

**Acceptance criteria.** A bulleted list of observable, testable statements — see `references/writing-acs.md`. These are the single source of truth flowing through all pipeline phases: `/refine` sharpens the requirement against them, `/design` produces variants for them, `/architecture` writes tasks to satisfy them, `/write-tests` produces one failing test per AC, `/write-code` makes those tests pass, and `/review` audits code against them.

**Validation scenarios.** 2–4 Given/When/Then scenarios. These are the minimum the QA gate (`/review`) will run. They must collectively cover every AC.

**Plan calls.** One short paragraph telling `/architecture` what kind of planning this work package needs. Most work packages: "Standard architecture pass — types, contracts, ordered tasks." Foundational primitives: "Multi-version exploration; design-it-twice on the data shape." Pure-backend infra: "Skip /design step; plan + write-tests + write-code." If the work package needs refinement (goal unclear or introduces/reshapes a noun), say so and name the noun so the pipeline runs `/refine` first.

**Contracts / constraints.** Bullet list of hard rules the implementation must honor (e.g. "no new on-disk file format dialect", "migration is forward-only", "no emojis", "back-compat preserved at the API level not the row level"). These are guarantees the reviewer will check, separate from AC.

**Out of scope.** Bullet list of things a reader might assume are part of this work package but are not. Future improvements, related work packages, edge cases deliberately deferred.

**Effort.** S (~Xmin) | M (~Xh) | L (~Xd) — same letter as Complexity, with a rough time estimate. The estimate is informational; the letter drives scheduler behavior. Examples: `S (~30min)`, `M (~4h)`, `L (~5d)`.
```

---

## Writing good ACs

ACs are the contract between the spec and every downstream phase. They describe **what becomes true** when the work ships — not how to build it. The full rubric — the outcome rule, the consumer table, good-vs-bad examples, the specificity gradient, structural-vs-behavioral ACs, the mental-state test, and forbidden phrasings — lives in **`references/writing-acs.md`**. Read it before writing any AC.

The one-line filter: **ACs should be specific about outcomes, vague about solutions.** If two different planners would produce the same solution from your AC, it's too prescriptive. If two different reviewers can't agree on whether it passes, it's too vague.

**Forbidden sections** (the architecture/design phases produce these later):
- "Implementation steps" / "Implementation plan"
- "File changes" / "File paths"
- "Types" / "Schema" / "API endpoints"
- "Component breakdown"
- "Visual design" / "Visual contract"
- "Tech choices" / "Library choices"

If a maintainer pastes implementation detail into the spec, strip it out before registering. The `/architecture` step is where those decisions live.

---

## Registration steps (perform in order, in one commit)

1. **Append the spec to the track file.** Add the new H3 section at the bottom of `.pipeline/work-packages/<track>.md` per the template above. If the track doesn't exist yet, create the file with the standard preamble (scope rules, reference docs, dependency-graph pointer to `.pipeline/work-packages/dependency-graph.md`) before appending.
2. **Append to the manifest.** Add an entry to `.pipeline/pipeline-manifest.yml` under the existing list of work packages:
    ```yaml
      - id: <ID>
        title: <Title — same as the spec H3>
        track: <single-letter track>
        type: frontend | backend | application | framework | infra
        depends: [<ID>, <ID>] # or []
        complexity: S | M | L
    ```
3. **Update the track index** if the row count changed for that track (e.g. `Work packages: L1–L30` → `L1–L31`).
4. **Validate.** Run the project's verify command, `{{verify}}` — manifest checks must pass (these catch a duplicate ID, an invalid complexity, an unknown type, or a dangling dep). If the project defines a faster typecheck/lint subset, run that first as a sanity pass.
5. **Single commit.** All changes ship together: track update + manifest + index. Message: `plan: register <ID> — <title>`.

---

## Refusal cases (return without registering)

- The work has no observable outcome — i.e. it's pure refactoring with no user-visible or system-visible change. Refactors don't get work packages; they happen *inside* a work package whose AC demand the cleanup, or under a parent work package with explicit "code health" AC.
- The "Why this matters" section cannot name a specific person whose life gets measurably better. "It would be nice" or "completeness" or "other products have it" are not justifications. Simplicity is a feature — the default answer to "should we build this?" is no.
- The dependency justification reduces to "they're related" or "the same area." Drop the dep; the scheduler will serialize via `done` ordering only when truly needed.
- The work package would create a cycle with an existing dependency. The manifest validator will catch it; do not register.
- The work package is sized S but has >3 AC or touches >1 subsystem. Re-size to M, or split.
- A maintainer asks to register work packages under a track whose **strategic frame** is undefined or too vague to give a stable frame. Hold and resolve it via the strategic-framing questionnaire; flag the open questions. (A per-WP noun that needs its own `/refine` is fine — defer it via the **Refinement** gate; it does not block registration.)
- The work package's deliverable is **findings, a recommendation, or a prototype** rather than a shipped feature or observable change. A research-only WP has no testable AC and isn't a unit of work. Tell the maintainer to do the research first (in this skill or `/refine`), then register the WP that *acts on* it.

---

## Anti-rationalizations

The full table of tempting rationalizations and why each is wrong lives in **`references/anti-rationalizations.md`**. The headline ones:

- "I'll add the implementation steps now and clean them out later" — specs with implementation creep get their architecture step skipped because "the spec already said how." Keep them out from the start.
- "S is fine, the AC bullets are short" — S is about scope and time, not bullet length. If it touches >1 subsystem it's M.
- "I know this feature doesn't exist yet" — do you? Audit `{{paths.source}}` before assuming a gap. The #1 spec failure mode is proposing what already exists.

---

## After registration

Hand control back to the maintainer.

## Target

$ARGUMENTS
