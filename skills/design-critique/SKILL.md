---
name: design-critique
description: "Score design variants against a 9-dimension rubric as a fresh pipeline-reviewer. Trigger in Phase 5 after the pipeline-planner finishes producing variants, on explicit /design-critique <work-package-id>, or to score a rendered implementation against its approved mockup. Skip if no design system is configured."
phase: 5
persona: pipeline-reviewer
applies-to: [frontend, application]
user-invocable: true
---

# Design Critique — score variants as a cold pipeline-reviewer

**Why:** The agent that created variants cannot objectively score them. Evaluation must be a different agent — the pipeline-reviewer — reading the pipeline-planner's output cold. True producer/evaluator separation: different personas, not just different cognitive modes. Run this on a fresh high-capability agent ({{models.review}}) that did not produce the variants.

This is the **evaluation** counterpart to `/design` (production). The pipeline-reviewer persona scores what the pipeline-planner produced. `/design` generates variants; `/design-critique` scores them. The design decisions land in `.pipeline/work/<id>/design/approved.md`, so the Phase 8 code review reads them there — reusing this critique's warm session if the host supports it, reconstituting from the artifact if not.

## Project rules

Follow any `pipeline.config rules` slot below as binding (it overrides this skill on conflict); skip undeclared slots.

- **`{{rules.design-system}}`** — score variants against the project's component budget, tokens, and reuse rules.
- **`{{rules.aesthetics}}`** — the project's aesthetic quality bar.
- **`{{rules.visual}}`** — visual fidelity / regression policy.

## When This Runs

- **In the pipeline:** Phase 5, after the pipeline-planner completes `/design`. Reviewer session.
- **On explicit `/design-critique <work-package-id>`:** full audit of variants under the work package's design directory, e.g. `.pipeline/work/<id>/design/<variant-slug>/`.
- **Post-implementation:** score the rendered component against the approved mockup.

If `pipeline.config` `designSystem` is `null`, stop — there is no design system to critique against.

## Required Reading (Before Scoring)

Read the project's design-system conventions before critiquing. These live at `{{designSystem.path}}`:

1. The aesthetic/principles documents — source of truth for token values and the project's AI-aesthetic anti-pattern catalog.
2. The token reference — surfaces, accents, spacing, radii, motion.
3. The actual token values: `{{designSystem.tokens}}`.
4. Any hard-rule / lint-rule documents the project defines for visual quality.

Always cross-check the concrete numbers against the project's own `{{designSystem.tokens}}` and the design system's aesthetics docs under `{{designSystem.path}}`.

## The Critique Loop

Read the variants produced by `/design` under `.pipeline/work/<id>/design/<variant-slug>/`.

```
1. Screenshot each variant's mockup (or read its spec if no mockup exists)
2. Score it (0-10) against the 9 dimensions below
3. List specific findings (CRITICAL / WARNING / SUGGESTION)
4. Fix the highest-priority issue
5. Re-screenshot and re-score
6. Repeat until score >= 7 or 4 iterations reached
```

Variants below 5 fail and get regenerated; variants 5-7 get noted findings; variants ≥7 advance. If all variants score below 5, the brief was wrong — go back to `/design` Phase 0 and re-interrogate. Do not push weak variants into the comparison.

**Read screenshots, not code, when scoring.** Reading code to score visual hierarchy is theatre.

## Calibrate to the Engineering tier

Scale *completeness and polish depth* to the WP's tier (`plan.md`): a `prototype`/`mvp` isn't failed for missing Premium Polish (dim. 9) or exhaustive state/mobile coverage; `production`/`critical` require them. The craft bar — hierarchy, tokens, anti-slop, accessibility — always applies; "it's only an MVP" never excuses slop.

## Scoring Dimensions (0-10 each, averaged)

### 1. Visual Hierarchy
- Is there a clear reading order? Can you identify primary, secondary, tertiary content at a glance?
- Are titles/values visually heavier than labels/metadata?
- Does the eye flow naturally from most important to least important?
- **Smell:** Everything at the same visual weight. Multiple elements competing for attention.

### 2. Spacing & Density
- Does spacing follow the project's grid (commonly a 4px grid) and density tokens?
- Is density appropriate for the context? (Lists = dense, detail views = spacious.)
- Are related items grouped tightly and unrelated items separated?
- **Smell:** Arbitrary padding values. Uniform spacing everywhere. Too much or too little breathing room.

### 3. Typography
- Are font sizes drawn from the project's type scale (no off-scale sizes)?
- Are font weights limited to the project's ladder (commonly 400/500/600 — no 700 bold)?
- Is line height appropriate? (Roughly 1.4–1.6 body, 1.2–1.3 headings.)
- Is monospace used correctly? (Data values, IDs, timestamps — not body text.)
- **Smell:** More than two font families. More than three weights visible. Cramped or floaty line height.

### 4. Color Usage
- Is color used for meaning, not decoration?
- Are all colors from the token palette?
- Does every colored element have a non-color signal too? (Shape, text, icon.)
- Is the contrast ratio ≥ 4.5:1 for all text?
- **Smell:** Colors not in the palette. Color as the sole differentiator. Decorative color.

### 5. Component Coherence & Consistency
- Does the component use design-system tokens consistently?
- Are hardcoded values (hex colors, px spacing, raw font sizes) present? They shouldn't be.
- Does the component compose from existing primitives where possible?
- **Cross-component consistency:** Does this component apply borders, spacing, radii, and typography the same way as other components in the same context?
- **Smell:** Hardcoded `#hex` values. Raw padding utilities instead of density tokens. Re-implementing what an existing primitive already does. Borders used differently than sibling components. Mixed radii in the same view.

### 6. States & Feedback
- Does the component handle all states? (Default, hover, focus, active, disabled, loading, empty, error.)
- Are transitions using the project's motion tokens?
- Do interactive elements have visible hover/focus states?
- **Smell:** Missing hover state. No focus ring. Instant state change with no transition. Missing empty/error states.

### 7. Accessibility
- Are focus rings visible?
- Is keyboard navigation supported?
- Do images/icons have alt text or aria-labels?
- Are roles and aria attributes correct?
- **Smell:** `outline: none` without replacement. Missing aria-labels. Non-semantic elements used as buttons.

### 8. Anti-Slop Check
- Does this look like every other AI-generated dashboard? If yes, it fails.
- Are any of the project's blacklisted patterns present? (See the design system's AI-aesthetic anti-pattern catalog.)
- Does the component have a distinctive, intentional design — or is it the "safe default"?
- **Screenshot rubric:** three or more screenshot-detectable tells in a single frame fails the screenshot.
- **Smell:** Purple gradients. Centered hero layout. Emoji icons. Generic card grid. Oversized padding. Maximally rounded corners. Glass morphism. Gradient-on-text. Full-bleed accent nav.

### 9. Premium Polish
Tied to the design system's "premium" checklist and recommendations tables. Calibrate the exact numbers against `{{designSystem.tokens}}`; treat the values below as defaults.

- **Tabular numerals** on numeric key/value rows and table cells (`font-variant-numeric: tabular-nums`).
- **Letter-spacing** (commonly `+0.02em`) on uppercase status/tag labels.
- **Density-tier coherence:** density presets derive from one base by a fixed ratio (e.g. compact = default × 0.75, comfortable = default × 1.25), each rounded to the grid.
- **Motion timing** uses the motion tokens with the project's standard easing; `prefers-reduced-motion` is respected.
- **Hover/focus/pressed** states defined for every interactive primitive (e.g. hover = +1 surface step, focus = an outset ring on the primary accent, pressed = −1 step).
- **Touch target ≥ 44 CSS px** at narrow viewports on every interactive element.
- **Mobile inputs ≥ 16px** font-size at phone viewports (prevents iOS zoom).
- **Halation guard:** no pure `#000` background in dark mode; the high-emphasis text token is off-white, not `#fff`.
- **Smell:** numeric columns visibly jitter, status chips at default tracking, hover with no transition, focus rings invisible, mobile input zooms iOS, motion ignores reduced-motion preference.

## Scoring Guide

| Score | Meaning | Action |
|-------|---------|--------|
| 9-10 | Exceptional | Ship it. This would impress a design-conscious user. |
| 7-8 | Good | Minor polish items. Acceptable for production. |
| 5-6 | Mediocre | Needs work on 2-3 dimensions before shipping. |
| 3-4 | Poor | Structural issues. Rethink the approach. |
| 0-2 | AI Slop | Start over. This looks like generic AI output. |

## Output Format

```
## Design Critique: [ComponentName / work-package-id]

DESIGN-CRITIQUE: variant=<slug> score=<int>/10  rounds=<n>  axes: H:_ S:_ T:_ C:_ Co:_ St:_ A:_ AS:_ PP:_

### CRITICAL
- [file:line] Description of issue → specific fix

### WARNING
- [file:line] Description of issue → specific fix

### SUGGESTION
- [file:line] Description of issue → specific fix

### What's Working Well
- List 1-2 things the component does right (reinforces good patterns)
```

The retro reads `rounds=<n>` to track design-quality drift over time. Record the result to the work package's progress file: `.pipeline/work/<id>/progress.json`.

## Screenshot Workflow

Render the variant and capture it, then read the image. Use whatever headless-browser screenshot tool the project provides; a typical invocation:

```bash
# Use the project's configured screenshot tool (see pipeline.config.yml or project docs).
# Example — Screenshot a running component view:
# <screenshot-tool> "<component-preview-url>" /tmp/critique-ComponentName.png

# Example — Screenshot a static HTML mockup:
# <screenshot-tool> "file://<absolute-path>/mockup.html" /tmp/critique-mockup.png
```

Read the screenshot. Evaluate it visually. Do not evaluate design from code alone.

## Cross-Component Checks

These checks go beyond what AST linters catch. Token/scale violations (hardcoded colors, off-grid spacing, off-scale radius/font/motion, AI-aesthetic tells) are caught by the project's verify command, {{verify}} (e.g. via a design-lint rule set) — don't duplicate that work here. This section is for the judgment calls the linter can't make.

### Consistency & Reuse

- **Same role, same treatment.** Section headers, card borders, list items, dividers, hover states — if two components serve the same visual role, they must look identical. Divergence is a finding even when both files individually pass lint.
- **Component reuse over inline reimplementation.** A mature design system has tiers (primitives, composed blocks, regions) plus utilities (empty-state, error-state, skeleton). Read `{{designSystem.path}}` to know what exists. Reimplementing any of these inline is **CRITICAL**.
- **Token compliance.** Every color, spacing value, radius, and font size must trace back to a design token defined in `{{designSystem.tokens}}`.
- **Theme portability.** If the design system ships multiple themes, components must use semantic tokens (not hardcoded values) so they work across all of them.

### Density-Tier Consistency

If the design system defines density tiers, an AST rule typically gates literal padding; this critique covers the contextual cases the rule can't see:

- For each density-aware component, confirm it consumes the prescribed density tokens for the axes the design system lists (e.g. distinguishing a card-internal fixed height from a row-anchor height).
- For each intentionally density-static component (chips, tags, fixed rails), confirm zero density-token consumption.
- **Same-role density-awareness.** Components that share a visual role (all cards, all list rows) must share the same density shape (the same padding/gap/text tokens). Drift between siblings is a finding.

### Completeness Checks

- **Empty states.** Every list / table / panel must define an explicit empty state. A component that renders a list with no empty-state branch is a finding.
- **Error states.** Same for failure paths.
- **Loading states.** Same for in-flight / skeleton paths.
- **Mobile readiness.** At narrow viewports, does the component switch to comfortable density? Are touch targets ≥ 44 CSS px?

## Done When

- Every variant has a `DESIGN-CRITIQUE:` line with per-axis scores and a `rounds` count.
- Each surviving variant scores ≥ 7, or has been regenerated / kicked back to `/design`.
- Findings are split CRITICAL / WARNING / SUGGESTION with concrete fixes.
- The result is recorded to `.pipeline/work/<id>/progress.json`.

## Target

$ARGUMENTS
