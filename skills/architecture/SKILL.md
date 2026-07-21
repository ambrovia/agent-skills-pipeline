---
name: architecture
description: "Produce the technical plan for a work package — feasibility probes, types, schemas, APIs, file paths, and a technical task DAG. Interrogate the spec, reconcile it against the codebase, then draft. Run AFTER founder-approved requirements, alongside /design when the work package has UI."
phase: 4
persona: pipeline-planner
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Architecture — the technical plan for a work package

**Writes `architecture.md` (+ `feasibility.md` when a feasibility check was warranted).** Architecture writes `.pipeline/work/<id>/architecture.md` (the technical plan — the builder's executable target) and, only when something load-bearing/new/unknown needed proving, `.pipeline/work/<id>/feasibility.md` (findings + verdicts for the reviewer). It READS `.pipeline/work/<id>/plan.md` (the WP spec + ACs) and the approved `.pipeline/work/<id>/requirements.md` (plus `.pipeline/work/<id>/design/approved.md` — a same-phase peer input — when the work package has UI) as fixed input, and UPDATES `plan.md` only if the overall plan changes (scope, acceptance criteria, intent). It does not add sections to `plan.md`.

**Why:** A clear plan prevents wasted implementation time. Without architectural planning, the pipeline-builder builds the wrong thing, misses edge cases, or invents abstractions the system doesn't need. The pipeline-reviewer catches errors before they become expensive rework.

**The implementability bar — the plan must be executable, not interpretable.** The builder turns the plan into code by *doing*, not *deciding*. That means the architecture is actually defined: the contracts (types/signatures/schemas), the data flow, the states, the file/repo structure, and the tech stack — with concrete files named wherever they're known. If the builder would have to choose a data shape, invent a contract, pick a library, or infer intent, the plan isn't done — resolve it here. The plan holds the decisions; the build is the typing.

**Fixed inputs (do NOT re-litigate):**
- **Engineering tier** (`prototype | mvp | production | critical`) from `plan.md` — calibrate the plan's rigor (hardening, error handling, security, observability, feasibility-probe depth) to it: lean on a `prototype`, exhaustive on a `critical`. Planning above or below the tier is a defect. Trust it as set; do not re-question it.
- **Founder-approved** requirement from the human requirement review (Phase 3) — read `.pipeline/work/<id>/requirements.md` and confirm `approvals.requirements` is set in `.pipeline/work/<id>/progress.json`. If it is not approved, stop — architecture does not run before human requirement approval.
- Design from `/design` (UI work packages), at `.pipeline/work/<id>/design/approved.md` — produced in the **same phase**, just before architecture. It is a **peer input, not yet human-approved**: design + architecture are approved together at the Phase 6 concept gate. If no design system is configured (pipeline.config `designSystem: null`), there is no design input and this clause does not apply.

**Doc discovery:** Read the "Required reading" from `/refine` output if available. Otherwise list `{{paths.docs}}` to identify relevant topic folders. **Output a "Required reading" section in the plan** listing the specific doc files the engineer must read before implementing. This is the natural filter — downstream skills read only what the plan prescribes.

If the spec contradicts an existing requirements doc, stop — that's a `/refine` gap.

## Project rules

Follow any `pipeline.config rules` slot below as binding (it overrides this skill on conflict); skip undeclared slots.

- **`{{rules.architecture}}`** — architecture invariants & conventions the plan must follow.
- **`{{rules.code}}`** — language / type / style conventions that shape the types and contracts you specify.

## Phase 0 — Interrogate the understanding

Before producing acceptance criteria, walk the decision tree. Pick only the questions that are actually unsettled — the ones where the spec, the work-package file, or existing code don't give you a confident answer. Skip what's already pinned. For each remaining question, propose your recommended answer with the evidence you have, then ask the human (or the pipeline-reviewer in autonomous mode) to confirm, override, or dig deeper. Issue all of these probes in one parallel batch — independent questions don't need separate round-trips.

**Few, important questions.** Three sharp probes force a real decision; ten low-stakes ones are noise that get answered with shrugs while the load-bearing assumption stays silent. The bar to ask is: "will the answer change the plan?" If no, don't ask.

Sample interrogation lines (adapt to the work package):
- "What's the smallest version of this that's still useful? My read: X. Confirm or correct?"
- "What's the failure mode if Y is wrong? My read: A. Confirm?"
- "What's actually being asked vs adjacent and tempting to also build? My read: in-scope = X, out = Y."
- "Is any domain term in this spec used inconsistently? My read: term Z is used for two distinct concepts."
- "Does the spec contradict an existing doc? My read: a canonical-shapes doc under `{{paths.docs}}` says X, this work package says Y."
- "What changes if the user's mental model about W is wrong?"

Stop interrogating when the path is clear, not when you run out of questions. Three to seven branches is typical. If the work package already pins a decision, don't re-litigate it — confirm and move on.

## Phase 1 — Feasibility check

Prove the plan is feasible **only where it's genuinely uncertain** — the technical counterpart to `/design`'s prototype. Probe the **load-bearing, new, or unknown** parts: a new capability or concept, a larger system, an external API/library, a non-obvious perf or migration claim. **Skip the obvious and small** — work that reuses a known pattern needs no proof; TDD and iteration straighten the normal stuff out.

For the parts that warrant it: do a quick **web search for reference implementations and patterns** (pinned versions, primary sources) and/or a **tiny, manual mini-POC** — a throwaway sketch that answers the one open question, never a full implementation — kept under `.pipeline/work/<id>/probes/<slug>/` (your scratch, for you). Record what you found and a `GO` / `GO-WITH-CHANGE` / `NO-GO` verdict, **with the details the reviewer needs**, in `.pipeline/work/<id>/feasibility.md`. If nothing was load-bearing or unknown, skip this — a one-line `feasibility.md` (or none) is fine.

**Check assumptions against reality, not only the repo.** When a load-bearing claim depends on live state (bucket contents, deployed config, running jobs/crons, live DB rows, real API quotas, infra outside this repo), run a **cheap empirical probe** against that state (`aws s3 ls`, a read-only query, a status check) — reading source is not verifying reality. Record the probe and outcome in `feasibility.md`; if it falsifies the premise, revise the plan before proceeding.

## Phase 2 — Plan reconciliation (spec ⇆ reality)

Before locking the plan, reconcile the spec against the actual codebase. Spec/codebase drift discovered at write-tests time is too late — catch it here.

For every named symbol the spec references — table, route, component, file, constant, env var — verify it exists with the expected shape. The lookups are independent: collect the full symbol list first, then issue all the greps and reads in one parallel batch (one tool-call round, not one per symbol). Specifically:
1. `grep` every symbol in the codebase. Does it exist? With what shape?
2. For UI-touching ACs, read the current rendered output (or the existing component) to verify columns / labels / states.
3. For API-touching ACs, read the existing route handler / interface / schema to verify the contract.

**Derive the blast radius — don't only verify what the spec named.** Specs undercount real call sites. After checking named symbols, search for *unnamed* consumers: callers of symbols you'll change, packages importing the same surface, fixtures/seed paths, adjacent tools/CLIs, eval/integration harnesses. **Record surfaces and obligations, not an exhaustive file list** — contracts, packages, call-site families, migrations, consumers that must keep working; write-tests / write-code discover the concrete paths. If the search turns up a package or call-site family the spec omitted, the plan must absorb that obligation (or defer it with a tracked reason) — never ship a plan that quietly ignores surface the codebase still uses.

Produce a `Plan reconciliation:` block in the plan listing every spec assumption that disagreed with reality, every newly discovered blast-radius *surface/obligation*, and how the plan handles each. If the spec assumes a table, route, or column that doesn't exist, the plan must include the migration / scaffolding step.

## Phase 3 — Acceptance criteria + technical task DAG

Read the `## Work package` + `## Acceptance criteria` sections of `.pipeline/work/<id>/plan.md`. Read existing code in the affected areas of `{{paths.source}}` and the relevant doc sections identified in doc discovery above.

If the work package has a UI surface and `/design` produced an approved spec, read it. The visual contract, component vocabulary, and interaction states are inputs — do not re-litigate them. (Skipped when no design system is configured.)

Produce:
1. **Acceptance criteria** — each with a specific verification method (see the criterion→verification table below).
2. **Technical task DAG** — the complete implementation order, ownership, dependencies, scoped context, and verification contract in the compact format below. It replaces both an ordered task list and `sharedFiles`.
3. **Type signatures / schemas / endpoints** — the contracts the implementation must match.
4. **Risks or ambiguities.**
5. **Route checklist** (if applicable) — when the spec enumerates a route list (e.g., "guard mounts on /sessions, /tasks, /admin"), the plan MUST include a `route-checklist:` block listing every route + every file the guard/middleware must cover. Step `/architecture-review` then greps the implementation against that checklist before signing off. Lesson: a plan that enumerated all routes but whose implementation applied the guard to only one route shipped a hole — the checklist makes the gap visible at review.
6. **Security & abuse cases** — required block. Default checklist: rate-limit on every state-changing endpoint, input-trust boundary for any agent-authored field, secret-handling for any new credential surface, path-traversal for any path input, SSRF for any outbound URL. Plan is not green until each is either marked applicable+addressed or explicitly N/A with reason.
7. **Protected tests** — `protectedTests: string[]` listing test files (under `{{paths.tests}}`) whose assertions must not change. The definition-of-done audit checks the protected set with `{{vcs}}`-tracked diffs (e.g. `git diff --name-only`).
8. **Migrations** — when the change renames, removes, or moves an existing symbol (route, test id, table column, function name, file path), enumerate every call site that needs updating. List affected source files, fixtures, unit tests, and end-to-end specs by name with the migration step for each (`delete | reroute | rename`). The migration is part of the plan, not a follow-up.
### Technical task DAG contract

Default to **one leaf**. Split only when the work has independently verifiable technical units or a real dependency boundary; ordinary file-level steps stay inside one leaf. Most split plans should contain 2–6 leaves.

Write exactly one fenced JSON object in `architecture.md`:

```json
{
  "technicalTaskDag": {
    "version": 1,
    "leaves": [
      {
        "id": "build-change",
        "title": "Build the change",
        "kind": "implementation",
        "dependsOn": [],
        "owns": ["contract:Example", "file:src/example.ts"],
        "consumes": [],
        "acceptanceCriteria": ["AC-1"],
        "context": {
          "files": ["src/example.ts"],
          "sections": ["architecture.md#Contracts"]
        },
        "verify": "the exact focused command that proves this leaf",
        "parallel": false,
        "independence": ""
      }
    ]
  }
}
```

- `kind` is `implementation` or `mechanical`. Use `mechanical` only for a fully specified repetitive transformation requiring no design or architecture judgment.
- `owns` is non-empty and is the single source for changed files and public surfaces. Every entry is namespaced (`file:src/exact.ts`, `path:src/owned-directory/`, `contract:Example`, `schema:records`, `route:GET /records`). `file:` is exact; `path:` covers descendants and ends in `/`. One surface has one leaf owner, and every file the leaf may write must be covered by `file:` or `path:` ownership.
- `consumes` names contracts owned elsewhere or held stable by the plan. Add the owning leaf to `dependsOn` when it changes that contract.
- `context` contains **pointers only**, never copied source, transcripts, or broad directory dumps. File pointers and the path portion of section pointers are repository-relative, contain no `..` segment or control character, and are never absolute/home paths. Include the smallest complete set of files and plan sections.
- `parallel: true` is an opportunity, not a command. Give a concrete `independence` reason explaining why the leaf does not share mutable state or an unsettled contract with another ready leaf. Structural validation cannot prove that claim; the architecture critique must.
- Every AC maps to at least one leaf. Each leaf maps to an AC or a forced integration/migration obligation.
- When behavior or wiring crosses multiple leaves, add a final non-parallel integration leaf that depends on them and owns the combined-seam test/wiring. Do not leave new implementation decisions to the integration builder outside the DAG.

Resolve `validate-task-dag.mjs` next to this `SKILL.md` and run `node <architecture-skill-dir>/validate-task-dag.mjs .pipeline/work/<id>/architecture.md`. Keeping it inside the skill makes the command available in plugin and copied Cursor/opencode installations. The validator checks shape, safe repository-relative context/ownership paths, references, cycles, and unique non-empty ownership; the planner and reviewer remain responsible for whether the decomposition is sensible.

**Every acceptance criterion MUST have a concrete verification method.** "Write a test" is not specific enough — say exactly what the test does and what it asserts. Map each criterion type to a concrete verification:

| Criterion type | Verification |
|---|---|
| Schema / data model | Migration runs clean; schema introspection shows the expected tables/columns/constraints |
| API endpoint | Integration test hits it, asserts status code + response shape |
| Type safety / whole-change correctness | `{{verify}}` passes with zero errors |
| Data integrity | Test inserts violating data (orphan FK, duplicate unique), asserts rejection |
| CRUD | Test creates / reads / updates / deletes, asserts each result |
| Error handling | Test triggers the error path (bad input, missing resource), asserts the error response |
| UI component | E2E test navigates to the page, asserts visible elements + interactions (skipped when no design system) |
| Performance | Benchmark runs N operations under X ms |

Where a criterion is "type safety" or "the whole change is green," the verification is the project's verify command, `{{verify}}` (or a fast typecheck, if the project defines one, for incremental checks).

## Phase 4 — Design-it-twice (for non-trivial decisions)

When a sub-decision in the plan is non-trivial — a schema with multiple plausible shapes, an API where versioning matters, a primitive (a load-bearing noun) that several work packages will consume — sketch **two** alternative shapes and pick. The reverse cost of getting it wrong is the budget for this phase.

For each alternative: 1-paragraph shape, 1 trade-off, 1 reason to reject. The synthesis often combines insights from both. Inspired by *A Philosophy of Software Design* — "design it twice" — and the discipline of designing reusable primitives once, well.

Skip when the decision is forced (existing pattern, single sane shape, low blast radius). Don't theatre-design where one obvious answer exists.

## Done when

- **Implementability holds:** contracts, data flow, states, structure, and tech stack are specified; load-bearing files named where already known. No decision about *what must change* is deferred — concrete path discovery is the builder's job.
- Feasibility probes ran (or were explicitly skipped with file:line precedent), including any live-state probes; `feasibility.md` exists under `.pipeline/work/<id>/` (with evidence in `probes/` when used).
- `architecture.md` has: Required reading, Plan reconciliation (named symbols + blast-radius surfaces/obligations — not a file inventory), ACs with verification methods, the validated technical task DAG, contracts, risks, feasibility reference, and required blocks (route checklist where applicable, security & abuse, protected tests, migrations).
- `architecture.md` is the durable producer→consumer handoff; downstream personas must not depend on a warm planner session.
