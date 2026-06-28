---
name: review
description: "Read-only review of implemented code against its work-package spec: 3 positive lenses (architecture, design, security), 3 negative lenses (adversarial, simplification, slop), plus an acceptance-criteria completeness audit. Use in Phase 4 after the builder produces code, or on demand to review a work package or a set of changed files. Produces findings only — never edits code."
phase: 4
persona: reviewer
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Review — read-only, 6 lenses + AC completeness audit

Read-only review. Produce findings — do **NOT** make code changes.

Six lenses plus an acceptance-criteria completeness audit, one session. Three positive lenses check that the code respects its contracts. Three negative lenses check what the contracts don't cover. The design lens is skipped silently if no UI files changed (and entirely if no design system is configured — `pipeline.config` `designSystem: null`).

**Why:** The agent that built it is the least qualified to verify it — it is biased toward believing its own work is correct. A fresh-context reviewer catches contract violations the implementer rationalized away, gaps the builder didn't notice, and complexity the builder introduced without realizing it. Run this on a fresh high-capability agent ({{models.review}}) so the review is not anchored by whatever produced the code. The same reviewer that scored the plan in Phase 2 carries that context forward — it arrives already knowing the contracts it is checking the code against.

## Project rules

Audit against every `pipeline.config rules` slot below as binding — a violation is a finding; skip undeclared slots.

- **`{{rules.code}}`** — language / type / style conventions.
- **`{{rules.testing}}`** — test conventions, layout, lane/fixture policy.
- **`{{rules.architecture}}`** — architecture invariants & conventions.
- **`{{rules.design-system}}`** — component budget, tokens, reuse-before-build, promotion.
- **`{{rules.frontend}}`** — client / UI conventions.
- **`{{rules.visual}}`** — visual fidelity / regression policy.
- **`{{rules.security}}`** — security policy / threat model.

## When this runs

- **In the pipeline:** Phase 4, after the builder completes the build act. Reviewer session.
- **On explicit invocation:** review a work package by id, or a set of changed files.
- **Skip conditions:** the design lens is skipped when no UI files changed; the whole design lens never fires when `designSystem: null`. The security lens always applies. All other lenses always apply.

## What it produces

Structured findings per lens (CRITICAL / WARNING / OBSERVATION) with file paths, line numbers, and a spec reference for each. An AC table mapping every acceptance criterion to PASS (with evidence) or FAIL (with a gap). A verdict: **DONE** or **NOT DONE**. Screenshot evidence for visual findings. Results recorded to `.pipeline/progress/<id>.json`.

## Required reading (do ALL before reviewing code)

1. The work package in `.pipeline/work-packages/<id>.md` — extract **every** acceptance criterion.
2. The plan (the architecture act's output for this work package) — always start here, especially its **Security & abuse cases** block.
3. The specific authoritative files named in the plan's **Required reading** section — read each end-to-end.
4. The locked concept output for the work package, if present.
5. The approved design output for the work package (UI work, only when a design system is configured).
6. The project instructions / tech-stack doc; the contract docs under `{{paths.docs}}` that define the load-bearing primitives the change touches; and — for UI work with a design system — the design-system conventions and `{{designSystem.tokens}}`.
7. The project's language/style rules the code must follow.

Then read **ALL** changed files (the supplied target, or the changed-file list from `{{vcs}}`).

## Be thorough — be hostile

Read every changed file end-to-end. For each file, verify it against the relevant spec section. Don't skim — open the doc, find the section, compare field-by-field, state-by-state, endpoint-by-endpoint. If a state machine has 8 states in the spec, count the states in the code. Surface-level "looks right" is not review.

Read every function body. Check every unsafe cast. Open every test file and verify the assertions actually test something meaningful. If a test claims to test an interaction, check that the interaction's hooks/handlers are actually invoked. If a component claims accessibility, walk the focus order mentally. The failure mode is "looks fine" — fight it.

## The six lenses

Run each lens in turn. Each summary below is the trigger; the full checklist for every lens is in **`references/lenses.md`** — open it and work the relevant section rather than relying on these summaries.

1. **Architecture** — layer violations, API/contract shape, data-model alignment, state machines, naming honesty, component boundaries, spec contradictions, and **doc staleness**. If the implementation changes behaviour that a doc under `{{paths.docs}}` describes, that stale doc section is CRITICAL — the builder must update it in the same change. Docs are part of the deliverable.

2. **Design** *(skip if no UI files changed; never fires when `designSystem: null`)* — component budget and reuse against `{{designSystem.path}}`, token compliance against `{{designSystem.tokens}}` (no hardcoded colors/spacing/radii/fonts), all states handled (empty/loading/error/populated), the action→feedback loop, state-conditional affordances, accessibility, layout vs. spec, motion values vs. spec, generic AI-aesthetic violations, and information density. Verify against pixels, not code: render the screen and compare it to the approved reference, including the percentage match in the finding. Keep generic design wisdom; defer product-specific component rules to the configured design system.

3. **Security** — STRIDE, input validation at every boundary, authorization scoping, the OWASP top 10, agent-specific risks (prompt injection, workspace escape, knowledge poisoning, tool misuse), and XSS. Grep for dangerous patterns across the **whole** codebase, not just changed files. Run the absence checks: human-text→agent-context sanitization (missing is CRITICAL), rate-limiting on new write endpoints, scoped authorization on new resources, and concurrent-write race handling.

4. **Adversarial (hostile personas)** — stop checking contracts; try to break the code. Read the diff as **The Saboteur** (could a silent regression or scale-only race pass tests and review?), **The New Hire** (what takes 10 minutes to understand that should take 10 seconds? which name lies?), and **The Auditor** (does every claim in the change description match the diff — is the thing it says it wired up actually wired up?). Also: over-abstraction, missing error paths, type-safety escapes (count every one), coupling, weak tests, and performance traps.

5. **Simplification** — anything where the same result needs simpler means: single-use helpers, premature generics, dead code, commented-out code, error handling for impossible cases, needless async, value-free wrapper types.

6. **AI slop** — AI-generated anti-patterns: verbose naming, comments that restate code, trivial wrappers, defensive over-engineering, needless async, filler (`=== true`, redundant else-return, empty catches), and tell-tales ("TODO: implement" on implemented code, "simplified version", "for now", "in production").

## AC completeness audit

For each acceptance criterion from the work package, answer three questions:

1. **Complete?** — find the implementation and the test that address it.
2. **Correct?** — compare against the spec, not just "does it work".
3. **Proven?** — can you prove to someone else this works? What is the evidence?

Watch for subtle incompleteness:
- "error handling" ≠ happy-path-only code.
- "validates input" ≠ a schema that accepts everything.
- A criterion with multiple conditions (A *and* B) requires proof of both.
- "accessible" ≠ "it renders".

### How to prove things

"I implemented it" is not proof. Only observable output is proof. Use the harnesses the project actually has, runnable under {{verify}}.

| Criterion type | How to prove it |
|---|---|
| Schema / data model | Run the migration, inspect the resulting schema |
| API endpoint | Call it and show the response (or an integration test that does) |
| Type safety | Run the type checker (a fast typecheck if the project defines one) — zero errors |
| Test coverage | Run tests with coverage — show the % for the new files |
| Behaviour | Run the specific test that exercises the criterion |
| UI / visual | Render the screen, take a screenshot, and **look at the pixels** |
| Error handling | Trigger the error path in a test (bad input → asserted error) |
| FK / constraints | Insert violating data and show it is rejected |

For UI criteria, look at pixels, not code. A UI criterion with no executable proof that it works (by whatever test kind the project's `testing` rule prescribes) is **NOT DONE**.

## Output format

```
## Review: <work-package-id>

### Architecture
CRITICAL / WARNING / OBSERVATION — file:line — spec ref (doc + section) — description

### Design        (omit if skipped)
...

### Security
...

### Adversarial / Simplification / Slop
...

### AC table
| Acceptance criterion | PASS/FAIL | Evidence (PASS) or gap (FAIL) |

VERDICT: DONE | NOT DONE
```

Record the verdict and finding counts to `.pipeline/progress/<id>.json` so the loop and the retro can read them.

## Don't rationalize passing

- "The tests pass, so the criterion is met" → tests prove code behaviour, not that the **right** thing was built.
- "This criterion is obviously met" → if it's obvious, proving it takes 30 seconds. Prove it.
- "Close enough, I'll fix it next work package" → deferred gaps become permanent.

## Done when

- All six applicable lenses have been run end-to-end (each finding carries a file:line and a spec reference).
- Every acceptance criterion has a PASS (with evidence) or FAIL (with a gap) in the AC table.
- A verdict is emitted: **DONE** (every criterion passes, zero CRITICAL findings) or **NOT DONE** (lists every gap and CRITICAL finding).
- Verdict and finding counts are written to `.pipeline/progress/<id>.json`. No code was changed.
