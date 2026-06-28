# Anti-rationalizations

The tempting reasons to cut a corner in work-planning, and why each is wrong.

| Rationalization | Why it's wrong |
|---|---|
| "I'll add the implementation steps now and clean them out later" | Specs with implementation creep get their architecture step skipped because "the spec already said how." This is how spec drift happens. Keep them out from the start. |
| "S is fine, the AC bullets are short" | S is about scope and time, not bullet length. If it touches >1 subsystem it's M. |
| "Dependency on X is just a logical ordering" | Then it's not a dependency. The scheduler will serialize via real `done` blockers. Logical ordering is what the planner uses to plan tasks within a work package. |
| "I'll skip the strategic frame and write the specs; we can backfill it later" | A per-WP requirement can be deferred (flag the **Refinement** gate; the pipeline runs `/refine` before that WP's design/architecture). The strategic frame cannot: without a stable frame the ACs churn. Flag/hold the track until the frame is defined enough (run the strategic-framing questionnaire). |
| "This is a small fix, it doesn't need a work package" | Then it's a commit on an open work package or a one-off PR — not a thing the pipeline picks up. The manifest is the queue; if it isn't there, the pipeline won't build it. |
| "I know this feature doesn't exist yet" | Do you? A mature codebase covers vast ground. Audit `{{paths.source}}` before assuming a gap — read the relevant schemas, services, routes, and UI. The #1 spec failure mode is proposing what already exists. When in doubt, spawn an Explore agent to audit the subsystem. |
| "This feature is clearly needed" | Every feature adds complexity. Simplicity is the default. The question isn't "would this be useful?" — most things would. The question is "is the cost of NOT having this higher than the cost of maintaining it forever?" If you can't articulate the cost of not building it, don't build it. |
| "The AC needs to specify the exact columns / pages / components" | No. ACs describe outcomes. `/design` decides which pages and components. `/architecture` decides which columns and endpoints. An AC that prescribes the solution bypasses both phases and produces a spec that's brittle to any design change. |
| "This AC is too vague for the builder" | The builder doesn't read ACs directly — they read the plan from `/architecture`, which translates each AC into specific tasks, types, and verification methods. ACs are the contract with the reviewer, not the builder's instruction manual. |
