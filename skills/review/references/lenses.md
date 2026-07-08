# Review — full per-lens checklists

Loaded on demand by the `review` skill. Each section is the exhaustive checklist for one lens. Work the relevant section field-by-field; do not rely on the one-line summaries in `SKILL.md`. Bindings (`{{paths.docs}}`, `{{designSystem.path}}`, `{{designSystem.tokens}}`, `{{verify}}`, `{{vcs}}`) are substituted from `pipeline.config.yml` at install time.

---

## Lens 1: Architecture

- **Layer violations** — does any layer reach past its neighbor? Respect the project's declared layering and dependency direction.
- **API contracts** — do routes, methods, request/response shapes match the architecture docs?
- **Data model alignment** — do fields, types, constraints, and indexes match the schema requirements exactly?
- **State machines** — do all states and transitions match the spec? Count them.
- **Event / message contracts** — are all specified events/messages present with the correct payloads?
- **Naming** — do names honestly describe what things do?
- **Component boundaries** — is responsibility correctly assigned across modules/packages?
- **Spec contradictions** — if two docs disagree, flag it.
- **Doc staleness** — if the implementation changes behaviour that a doc under `{{paths.docs}}` describes (API shape, state machine, UI layout, lifecycle, data model), flag the stale doc section as **CRITICAL**. The pipeline-builder must update the doc in the same change. Docs are not "someone else's problem" — they are part of the deliverable.

---

## Lens 2: Design

> Skip silently if no UI files changed. The entire lens never fires when no design system is configured (`pipeline.config` `designSystem: null`). Keep generic design wisdom below; defer the project-specific component budget, token set, and aesthetic rules to the configured design system at `{{designSystem.path}}`.

Check every component against its spec. If the spec says 4 columns, count the columns. If it specifies motion values, check the CSS transitions.

- **Component budget** — only the components the design system approves. Any addition needs a written reason.
- **Component reuse** — is existing design-system code used where it should be? Read `{{designSystem.path}}` to know what already exists.
- **Consistency** — same visual role = same treatment everywhere. Compare borders, spacing, radii, typography, and hover states across sibling components.
- **Token compliance** — no hardcoded colors, spacing, radii, or font sizes. Everything resolves through `{{designSystem.tokens}}`; no raw utility-class color values where a token exists.
- **States** — are ALL states handled (empty, loading, error, populated)?
- **Action → feedback loop** — every user action must produce visible acknowledgment on the current screen. A missing pending/loading indicator after submit is **CRITICAL**.
- **State-conditional affordances** — menus and action lists must filter options by what is semantically valid in the current state.
- **Design-system promotion** — if a new component will be consumed by 2+ screens, it belongs in `{{designSystem.path}}`, not local to one screen.
- **Accessibility** — focus management, aria labels, keyboard navigation, focus traps, roving tabindex.
- **Design-system integration** — does the component follow the design system's documentation/story convention? Do its classes resolve to the system's theme tokens?
- **Layout** — does the screen layout match the spec?
- **AI-aesthetic violations** — oversized padding, gratuitous gradients, hero sections, decorative icons.
- **Information density** — tight, deliberate spacing; a precision-instrument aesthetic rather than marketing-page airiness.
- **Motion** — transitions match the spec's values; no instant snaps where motion is specified.

### Visual verification

Look at pixels, not code. Render the screen and compare it against the approved reference for the work package. Read the reference image, the implementation image, and the diff. Include image paths and the percentage match in your findings.

---

## Lens 3: Security

Check every endpoint for input validation. Grep for known dangerous patterns across the **whole** codebase — don't rely on just reading the changed files.

### Bad patterns (find what shouldn't exist)

- **STRIDE** — Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege.
- **Input validation** — unsanitized user input, missing schema validation at boundaries.
- **Auth** — missing authorization checks, leaked internal state, privilege escalation.
- **OWASP Top 10** — injection, broken access control, cryptographic failures, SSRF.
- **Agent-specific** — prompt injection, workspace escape, knowledge poisoning, tool misuse.
- **XSS** — raw HTML injection sinks, unescaped template output, direct innerHTML-style assignments.
- **Dangerous primitives** — grep for dynamic-eval, dynamic function construction, raw HTML sinks, shell/subprocess execution, across the codebase, not just the changed files.

### Absence checks (find what should exist but doesn't)

- **Human-text → agent-context sanitization** — every path where user-supplied text reaches agent context must sanitize it (unicode normalization, control-char stripping, format-char removal). Missing sanitization is **CRITICAL**.
- **Rate limiting on new write endpoints** — any new POST/PUT/DELETE must have per-identity rate limiting.
- **Scoped authorization on new resources** — verify authorization is scoped to the actor's team/workspace, not "anyone with a valid session."
- **Concurrent-write handling** — create-or-update patterns must handle race conditions.

---

## Lens 4: Adversarial (hostile personas)

Switch mindset: you are no longer checking contracts — you are trying to break the code. Read the diff through three hostile personas.

**The Saboteur** — Could a working backdoor or silent regression pass tests, lint, and a normal review? Where could a race condition fire only at scale? What test was weakened?

**The New Hire (Day 7)** — Reading this code cold, what would take 10 minutes to understand that should take 10 seconds? Which name lies about its behaviour? What invariant must you know that nothing tells you?

**The Auditor** — Does every claim in the change description match the diff? If it says "rate-limit added," is it actually wired up? Are coverage claims supported?

Also review for:
- **Over-abstraction** — helpers for one-time ops, factories with one product, generic solutions to specific problems.
- **Missing error paths** — what happens when this throws? Who catches it? What state is left behind?
- **Type safety** — escape hatches (untyped values, unsafe casts, suppression comments, non-null assertions). Count them. Each one is a finding.
- **Coupling** — shared mutable state, import cycles, god objects.
- **Test quality** — happy-path-only tests, tautologies, tests that mock everything.
- **Mocked system-under-test** — an integration with an external system (LLM/agent harness or CLI, third-party API) proven only by a stubbed/scripted/mocked stand-in for that very system is a false green: it tests the wrapper, not the integration. The proof must exercise the real thing; an absent binary/credential must surface as unproven, not skip to green.
- **Sanity-break** — for a fix or enforcement test, confirm it fails without the change (revert the fix → red). A test green before its fix proves nothing.
- **Performance** — N+1 queries, unbounded lists, missing indexes, allocations in hot/render loops.

---

## Lens 5: Simplification

Flag anything where the same result could be achieved with simpler means:
- Helpers used only once (inline them).
- Premature generics.
- Dead code and unused exports.
- Commented-out code.
- Error handling for impossible scenarios.
- Unnecessary async (async on functions that never await).
- Wrapper types adding no value.

---

## Lens 6: AI slop

Flag AI-generated code anti-patterns:
- **Verbose naming** — shorten when context is clear.
- **Unnecessary comments** — comments that restate the code.
- **Over-abstraction** — single-use helpers, trivial wrappers.
- **Defensive over-engineering** — null checks for non-nullable types, try/catch around non-throwing code, validation of internal args.
- **Unnecessary async** — async on functions that never await.
- **Filler** — empty catch blocks, `=== true`, redundant else-return.
- **AI tell-tales** — "TODO: implement" on implemented code, "simplified version", "for now", "in production".
