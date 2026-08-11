# Work journeys — the second dimension of adaptivity

Date: 2026-08-10. Status: maintainer insight, recorded for reference. Splits the old single
"proportionality" axis (solution-axes.md A4) into two orthogonal axes, defines the archetypal
journeys through that space, and maps the 13 improvement ideas (work-groups.md) against them.

## The two axes

1. **Work size** (T-shirt sizes) → decides the complexity of **orchestration during
   development** (how many agents, how much coordination, how many waves).
2. **Decision complexity** → decides the complexity of **ceremonies beforehand** (how much
   planning, refinement, design, program-design, human decision gates).

The insight: these are orthogonal, and the pipeline today treats them as one. Proof cases:

- A list of 100 bugs: **large work, near-zero decision complexity** → almost no ceremony, best
  done with tons of stateless fresh agents.
- An architectural governance linter: **small work, high decision complexity** → a ton of
  planning and refinement, only a bit of code written.

Both would be mistreated by a size-only pipeline: the bug list drowns in ceremonies, the linter
gets waved through without the decisions it lives or dies by.

## The archetypal journeys

**J1 — Bug swarm.** Large size, low decision complexity. Many independent units, each small, no
shared design decisions. Shape: minimal ceremony, massive fan-out of empty-context agents, each
fix self-contained, mechanical verification per fix, LGTM-lane review.

**J2 — Small architectural change.** Small size, high decision complexity (example: an
architectural governance linter). Almost everything depends on the decision being right; the code
is small but the placement/rule design is heavy. Shape: heavy planning/refinement/program-design,
human decision gates on the contracts, heavy-scrutiny review, tiny build.

**J3 — Classic new feature.** Medium size, medium decision complexity, has design. The
step-by-step pipeline as it is meant to run: refine → design → architecture → program design →
build → review → ship, with gates at concept and final.

**J4 — Heavy refactor.** Large size, decision complexity front-loaded. First discover a pattern
that works, then turn it into a procedure, then repeat massively. Shape: discovery + procedure
design is the ceremony; the repetition army runs stateless and cheap, each application reviewed
against the procedure, LGTM-lane for repetitions, heavy scrutiny only on the pattern itself and
on exceptions. (This is the shape the AU26/AU28 monsters ran badly — one long session instead of
discover → proceduralize → repeat.)

**J5 — Exploratory build (POC-first).** Feasibility unknown. Prototypes and deep analysis first;
a lot of trying out **without decisions taken**; then a decision; then building is mostly
correcting the POC. Shape: exploration is a first-class mode whose output is learning and
decisions, not code; budget-gated; exits into J3/J2 once the decision is taken.

Journeys compose: a WP can travel J5 → J3, or contain J4 inside a J3. The transition points are
where the axes shift — and where gates belong.

## Mapping: 13 ideas × 5 journeys

● = primary help, ○ = secondary, — = not relevant.

| # | Idea (work-groups.md) | J1 bugs | J2 arch | J3 feature | J4 refactor | J5 POC |
|---|---|---|---|---|---|---|
| 1 | Empty-context spawn + active injection | ● army | — | ○ build | ● repetition army (procedure = injection payload) | ○ probes |
| 2 | Host capability tracking | ○ | — | ○ | ● fan-out mechanics | ○ |
| 3 | Sequential-vs-parallel rule | ● | — | ○ | ● | — |
| 4 | Progressive planning depth | ○ stays shallow | ● | ● | ● front-loaded | ● deliberately delayed until feasibility |
| 5 | Refinement scaling for large WPs | — | ● | ○ | ● discovery phase | ● prototyping is the refinement |
| 6 | Program design | — | ● | ● | ● the procedure | ○ only after the decision |
| 7 | Tracer-bullet slices | ● each bug is a slice | — | ○ | ● each application | — |
| 8 | Care lanes | ● LGTM lane | ● heavy scrutiny | ● standard | ● mixed: pattern vs repetitions | special: exploratory lane |
| 9 | Delta-based iteration | ○ | ○ | ● | ● per-application deltas | ○ |
| 10 | Typed verdicts extension | ○ | ● | ● | ○ | ● decision-gate clarity |
| 11 | Budget gate | ○ | — | ○ | ○ | ● the circuit breaker |
| 12 | Verify-in-build hooks | ● per-fix checks | ○ | ○ | ● conformance to procedure | ○ |
| 13 | Human-gate rebalance | — | ● decision gates | ● concept/final | ○ pattern approval | ● the decide moment |

## Observations from the mapping

1. **Ideas 1, 3, 7, 8, 12 are the journey-shapers** — they differentiate most across journeys
   (fan-out vs sequential, slices vs monolith, LGTM vs scrutiny). These are where adaptivity
   becomes visible.
2. **Ideas 2, 9, 10, 11, 13 are journey-agnostic infrastructure** — they should land once and
   serve every journey.
3. **Idea 4 (progressive planning depth) must key on BOTH axes** — J1 stays shallow despite
   large size; J2 goes deep despite small size. Size-only keying reproduces today's mistakes in
   both directions.
4. **J4 couples ideas 1 and 6**: the discovered pattern becomes a program-design artifact which
   becomes the active injection payload for the repetition army. Procedure = context injection.
5. **J1 needs fan-out mechanics to survive empty-spawn**: wave boundaries, dependency receipts,
   and owned writes (already in the pipeline skill) must work when children start empty.

## Gaps uncovered

- **G1 — Exploratory lane (J5).** No idea fully covers "output is learning, not code": a mode
  with its own success measure (decisions taken, feasibility established), budget-gated, with an
  explicit exit gate into a building journey. Closest today: feasibility probes in architecture +
  budget gate — not a first-class lane.
- **G2 — Journey detection.** Something must classify which journey a WP is (and detect
  transitions, e.g. J5→J3) — the two-axis assessment is the natural place (refinement/planning
  emits it), but the classification itself is undesigned.
- **G3 — Procedure artifact format (J4).** Program design covers one-shot shape decisions; a
  repeatable procedure for mass application is a different artifact (injection-ready, per-unit
  acceptance) and has no home yet.
