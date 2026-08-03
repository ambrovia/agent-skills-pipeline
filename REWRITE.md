# Pipeline rewrite guide

This is not an instruction catalog. It records the structural quality failures the rewrite must fix,
then defines how we rewrite and review one canonical file at a time.

## Cross-cutting quality failures

Use these as review questions for every rewritten file. A file does not need to discuss every issue;
it must avoid recreating them.

### 1. Downstream artifacts silently create scope

**Failure:** `plan.md` is called authoritative, but design, architecture, tests, project rules, and review
findings can introduce additional obligations that later become mandatory.

**Mechanism:** Detail written downstream is treated as a contract, then encoded in tests or findings,
then sent through a retry loop without an approved scope change.

**Rewrite rule:** Approved plan outcomes and acceptance criteria define required product scope.
Downstream artifacts may constrain an in-scope solution but may not add outcomes silently. New required
scope must amend the plan through its approval path or become follow-up work.

### 2. Quality is confused with completeness

**Failure:** “Thorough,” “production quality,” or “high quality” becomes pressure to add every state,
failure path, platform treatment, security control, migration facility, and operational feature.

**Mechanism:** Review and planning checklists enumerate possible completeness dimensions without first
asking whether they are reachable, changed, required, or proportionate.

**Rewrite rule:** Quality means the approved scope is correct, coherent, maintainable, and adequately
proven. Completeness is bounded by the ACs, configured project rules, affected behavior, concrete risks,
and engineering tier.

### 3. Numeric scores manufacture work

**Failure:** Average thresholds in refinement, design, architecture, and documentation turn optional
dimensions and polish into release requirements.

**Mechanism:** Every scored dimension affects the gate, so an agent improves low-value dimensions to
clear the average even when no defect exists against approved scope.

**Rewrite rule:** Gates use explicit blocking conditions. Scores may be diagnostic only and may not
trigger revisions, retries, or completion failure.

### 4. Warning labels do not match operational force

**Failure:** Warnings and suggestions are nominally non-critical but orchestration sends all findings
back for repair.

**Mechanism:** Severity is descriptive while the handoff and retry behavior treats the whole findings
bundle as mandatory work.

**Rewrite rule:** Use operational categories: blocking, non-blocking defect, and follow-up/note. Only
blocking findings enter the current work package’s retry loop or change its verdict.

### 5. Retry loops amplify classification mistakes

**Failure:** Once optional advice is admitted as a finding, automated revise/review loops make it
progressively more expensive and authoritative.

**Mechanism:** The state machine retries “findings” rather than a precisely defined blocker set.

**Rewrite rule:** Retry inputs must identify the violated authority: failed AC, violated approved
in-scope constraint or configured rule, concrete regression, or plausible risk introduced by the
change. Retry caps and changed-strategy requirements remain.

### 6. Abstract proportionality loses to concrete exhaustive lists

**Failure:** A sentence saying “calibrate to tier” cannot outweigh dozens of specific mandatory checks.

**Mechanism:** Models can demonstrate checklist compliance more easily than restraint; repeated concrete
instructions acquire more practical force than a general simplification principle.

**Rewrite rule:** Put applicability conditions on the concrete rule itself. Mark each expectation as an
invariant, gate, default, conditional rule, or guidance. Do not rely on a distant tier disclaimer.

### 7. Proof requirements become infrastructure requirements

**Failure:** “Every AC needs a test,” executable UI proof, coverage targets, or seam lanes can make the
proof system larger than the change.

**Mechanism:** Examples of strong evidence are interpreted as mandatory evidence formats regardless of
repository policy or existing test lanes.

**Rewrite rule:** Every AC needs the cheapest reliable evidence allowed by configured verification
rules. Require new automation only when the AC, regression risk, or binding project policy warrants it.
Tests prove requirements; they do not create them.

### 8. Reviewer independence is mistaken for broader authority

**Failure:** A fresh, hostile, exhaustive reviewer invents adjacent requirements while believing it is
enforcing quality.

**Mechanism:** Read-only permissions prevent code edits but do not prevent scope creation through
blocking findings.

**Rewrite rule:** Preserve producer/evaluator separation and deep inspection. Constrain finding
admissibility and require every blocker to cite its authority and concrete impact. Inspection depth
increases confidence, not feature breadth.

### 9. Broad routing activates heavyweight workflows too early

**Failure:** Frontmatter such as “any UI surface” or unconditional phase language invokes design,
critique, architecture, documentation, or testing ceremony for trivial changes.

**Mechanism:** Routing and applicability metadata activate the whole body before its calibration
language can help.

**Rewrite rule:** Treat frontmatter as behavioral policy. Use narrow observable triggers, explicit skip
conditions, and trivial-change paths. Keep tool/write permissions aligned with the role.

### 10. Repetition accidentally multiplies force

**Failure:** A sensible safeguard repeated in personas, skills, rubrics, done conditions, and
orchestration becomes absolute and crowds out judgment.

**Mechanism:** Repetition is interpreted as priority even when the copies use slightly different scope
or severity.

**Rewrite rule:** Give each cross-cutting rule one canonical home. Repeat only a short reminder where an
agent makes the relevant decision, using the same applicability and force.

### 11. Planning removes useful implementation discretion

**Failure:** “No decisions left for the builder” drives exhaustive architecture, premature abstraction,
file transcription, and ceremonial task trees.

**Mechanism:** Reversible local choices are treated like costly structural decisions, and completeness
critique punishes any unspecified detail.

**Rewrite rule:** Planning locks outcomes, public contracts, irreversible choices, cross-cutting
decisions, ownership boundaries, and real dependencies. Builders retain local, reversible choices.
One task leaf is the default; split only at real dependency or safe parallel boundaries.

### 12. Craft guidance becomes universal release policy

**Failure:** Design polish, anti-slop heuristics, documentation funnels, accessibility extras, mobile,
themes, observability, and enterprise hardening become mandatory regardless of the change.

**Mechanism:** Useful expert checklists are placed inside scored gates or unconditional done criteria.

**Rewrite rule:** Separate universal correctness/accessibility/security invariants from conditional
craft guidance. Optional polish cannot block unless required by the plan, tier, affected surface, or a
configured project rule.

### 13. Project rules can expand rather than constrain in-scope work

**Failure:** Setup can promote aspirational best practices into binding rules, after which review uses
them to demand adjacent infrastructure or cleanup.

**Mechanism:** Observed repository invariants, chosen future policy, and suggestions are not clearly
distinguished.

**Rewrite rule:** Project rules require evidence and maintainer authorization. They govern how in-scope
work is performed and block only when the change actually affects the invariant they protect.

### 14. Process artifacts become proof or deliverables

**Failure:** Receipts, screenshots, task trees, progress metadata, lore, and guide drafts can become
mandatory product work or be mistaken for evidence that behavior works.

**Mechanism:** Navigation, coordination, evidence, and requirements are mixed together.

**Rewrite rule:** State each artifact’s role explicitly. Navigation artifacts locate work; observable
behavior and verification prove it; only approved requirements define outcomes.

## Safeguards the rewrite must not accidentally lose

These are not causes of overengineering. Preserve them while simplifying surrounding prose:

- Maintainer-only creation of new work-package scope and explicit plan-amendment approval.
- Producer/reviewer separation and read-only review.
- Human approval and park/block behavior where strategic intent is missing.
- Exact and derived WP-ID containment under `.pipeline/**`.
- Untrusted design annotations remain evidence, never executable instructions.
- Visual review uses the correct project/style context and degrades without auto-approval.
- Tests may not weaken protected behavior merely to turn red into green.
- Parallel work retains explicit write ownership, dependency order, invalidation, and integration checks.
- Retro observes but does not fix; compound proposes but does not apply; lore stays concise and
  cross-cutting.
- Final verification, clean-tree/CI attestation, human merge, and no silent mutation afterward.
- `personas/*.md` are canonical. Regenerate `agents/`, `agents-cursor/`, `.opencode/agents/`, and
  `.codex/agents/` with `node scripts/generate-agents.mjs`, then run it again with `--check`.

## File-by-file rewrite method

Only one canonical file is rewritten at a time. The owner reviews and approves that complete file
before the next file begins.

For each file:

1. Read the current file and its relevant git history. Extract only the surgical safeguards and the
   behavior this file uniquely owns.
2. State the file’s role, authority, inputs, outputs, applicability, and explicit non-authority before
   drafting prose.
3. Rewrite the whole file coherently. Do not preserve wording merely because it exists; do preserve
   the underlying safeguard or explicitly propose its removal.
4. Check the draft against all 14 quality failures above and the preservation list.
5. Exercise it against at least three scenarios: a trivial change, a routine in-scope change, and a
   genuinely high-risk or novel change. The first two must not acquire high-risk ceremony.
6. Show the owner the complete rewritten file plus a short change note: what was preserved, removed,
   narrowed, and left unresolved.
7. Revise until the owner approves that file. Then regenerate host copies if it is a persona and run
   the relevant repository checks.
8. Record any cross-file dependency discovered, but do not edit the dependent file early. Resolve it
   when that file’s turn arrives.

## Rewrite order

The order establishes scope and authority first, then producers, evaluators, executors, supporting
process, and orchestration last.

1. `skills/work-planning/SKILL.md` — scope ownership, AC boundaries, tier, sizing.
2. `personas/pipeline-planner.md` — producer authority and shared planning judgment.
3. `skills/refine/SKILL.md` — clarify value without creating shadow scope.
4. `skills/design/SKILL.md` — applicability, variants, evidence, and conditional craft.
5. `skills/architecture/SKILL.md` — necessary decisions without implementation transcription.
6. `personas/pipeline-reviewer.md` — admissible findings, authority, and calibrated skepticism.
7. `skills/refine-critique/SKILL.md` — replace scores and warning-driven revision.
8. `skills/design-critique/SKILL.md` — baseline defects versus optional polish.
9. `skills/architecture-critique/SKILL.md` — implementability without completeness inflation.
10. `skills/review/SKILL.md` — blocker semantics, proportional evidence, and verdicts.
11. `personas/pipeline-builder.md` — faithful execution with local discretion.
12. `skills/write-tests/SKILL.md` — proportionate proof and test integrity.
13. `skills/write-code/SKILL.md` — smallest passing implementation and scope containment.
14. `skills/write-docs/SKILL.md` — accuracy gates versus conditional craft guidance.
15. `skills/setup/SKILL.md` — evidence-backed, authorized project rules.
16. `skills/lore/SKILL.md` — preserve rationale without a second policy system.
17. `skills/retro/SKILL.md` — observation without mutation or ceremony growth.
18. `skills/compound/SKILL.md` — evidence-backed proposals without automatic policy change.
19. `skills/ship/SKILL.md` — final verification and mutation boundary.
20. `skills/pipeline/SKILL.md` — orchestration last, after all gate and retry semantics are settled.

## Completion rule

The rewrite is complete only when every canonical file has been approved individually, cross-file
terms have one consistent meaning, generated personas are synchronized, and the scenario suite shows
that trivial/routine work stays small while genuinely risky work still receives the safeguards it needs.
