# Why the pipeline is structured this way

Read this before you talk yourself out of a phase.

## Adversarial principle: author / critic boundaries are enforced by persona separation

(a) The **pipeline-planner** produces (`design`, `architecture`); the **pipeline-reviewer** evaluates
(`design-critique`, `architecture-critique`) — *different agents*, true independence. (b) The
pipeline-reviewer later reviews the code in Phase 4 against the approved plan in `.pipeline/work/<id>/plan.md`
(warm on those decisions if its Phase 2 session survived, reading them from the artifact if not),
applying both positive lenses (does it respect the contracts?) and negative lenses (what would
break it?). The pipeline-reviewer's AC-completeness audit enforces the one boundary that must never live
inside a producer session: it reads a *live* change against the spec, not the pipeline-builder's notes
about the change.

## Why the pipeline-reviewer does the critique (not the pipeline-planner)

The agent that created a design cannot objectively score it. Moving critique to the pipeline-reviewer gives
true producer/evaluator separation — different agents, not a "cognitive mode switch" on one agent.
Bonus: if the host keeps the pipeline-reviewer's Phase 2 session warm, those design decisions and
architecture contracts carry into Phase 4 for free; if not, it reads them from
`.pipeline/work/<id>/plan.md`. Either way it checks code against the written contract.

## Why ship runs after retro

Ship owns the full land sequence: sync mainline → `{{verify}}` → open/ready the PR → wait for CI
green. It runs **after** the retro (Phase 5) so the retro output is part of the verified tree. If
ship ran before retro, the later retro change would invalidate the verified state and force a full
re-verify cycle. (Lesson learned the expensive way: a post-ship retro change once caused repeated
CI failures and a full re-verify.) Ship is a separate skill because the sequence is error-prone
(stale base, dirty tree, CI divergence) and must be followed exactly — every attempt to inline it
produced a different subset of the steps.

## Why the variant count is conditional

Routine UI (existing component family, known layout) gets 1 variant plus a "did we consider
X / Y / Z?" check. Genuinely novel UI gets up to 3. New load-bearing primitives are always novel.
One variant for routine work keeps cost down without losing the documentation value of the brief.

## Token efficiency

- **Reuse warm sessions where the host supports it.** Keep a persona alive across phases and message
  it again rather than re-spawning, to save context/cache-creation cost. Where the host has no
  durable sessions, re-spawn freely — continuity is guaranteed by `.pipeline/` state, not the
  session.
- **Incremental verification.** Inside the build loop, use a fast typecheck if the project defines
  one; reserve the full `{{verify}}` for the gate before handoff.
- **Error output is bounded.** Don't re-run the same check hoping for different output — fix the
  shown errors first.

## Anti-rationalization table — don't skip personas

- **"Concept work isn't done but I'll figure it out"** → no. Fail fast with
  `blocked: concept-missing`; a maintainer locks the concept upstream.
- **"The plan is done, I can stop"** → planning is Phase 1 of 6. You haven't built anything yet.
- **"This story is simple, skip the review"** → simple stories have the highest skip rate *and* the
  highest regression rate.
- **"The pipeline-reviewer is redundant, the tests passed"** → tests prove behavior; the pipeline-reviewer proves the
  *right* thing was built against the spec, in *fresh context*. The boundary is the value.
- **"The retro is navel-gazing"** → without the cost signals it emits, the analysis/compounding step
  can't prove a change actually saved tokens, and can't propose the next round of improvements.

## When to skip design + design-critique

Skip when the WP has no UI surface (pure backend, schema, infra, concept-only), **or**
`pipeline.config designSystem` is `null` (the design phases do not apply at all). Verify by reading
the AC list: if no AC mentions a page, component, layout, route, or
visible state, skip them. When in doubt and a design system is configured, run `design` with
`routine` classification — one variant is cheap and the brief doubles as documentation.
