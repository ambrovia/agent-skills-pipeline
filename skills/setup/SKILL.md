---
name: setup
description: "Configure this repo's pipeline rules — the pipeline.config rule slots (code, testing, architecture, design-system, security, docs, …) plus the design-system paths — that steer the otherwise-generic skills to this stack. Works by deep-researching the repo, proposing best-practice defaults, then heavily surveying the maintainer. Use when installing the pipeline into a repo, or when a skill's behaviour needs to reflect this repo's conventions."
argument-hint: "[rule slot to configure, e.g. 'design-system', 'testing', 'security', 'docs', or 'all']"
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Setup — wire this repo's rules

The pipeline skills carry their craft inline — how to write ACs, the review lenses, the documentation
principles, the verification patterns. They run with **zero configuration**. But a generic plugin
cannot know *your* design system, *your* test layout, *your* security policy, or *your* type
conventions. Those live in the repo, and the skills defer to them through the **`pipeline.config`
rule slots**. This skill configures those slots — it is the one place the pipeline learns about
*this* repo, so the generic skills sharpen to it.

## Assume nothing

You start knowing **nothing** about this repo. Every rule this skill writes must be grounded in
**either** evidence found in the repo **or** an explicit answer from the maintainer. Never invent a
convention, a token, a lane, or a policy. When you can't find it and the maintainer hasn't said it —
ask. Do not guess, and do not copy another project's conventions.

## What this configures

`pipeline.config.yml` exposes rule slots; each points at a repo-authored markdown file of **binding**
guidance that the named skills read (a project rule WINS over a skill's generic advice on conflict).
Plus the design-system paths. Leave a slot `null` and the consuming skill falls back to its inline
generic craft — that's fine; configure the ones where this repo holds a real, binding opinion.

| Config | Steers | What it should capture |
|---|---|---|
| `designSystem.path` / `.tokens` | design, design-critique, write-code, review | component inventory, token set, aesthetic bar |
| `rules.design-system` | design, design-critique, write-code, review | component budget, reuse-before-build, promotion rules |
| `rules.code` | write-code, architecture, review | language, type discipline, style, forbidden patterns |
| `rules.testing` | write-tests, review | what counts as a test, layout, lanes/fixtures, coverage bar; **isolation + combined/integration seams** (unit alone is not enough — which lane proves the wired path) |
| `rules.architecture` | architecture, architecture-critique, review | layering, contracts, invariants, verification conventions |
| `rules.frontend` | design, write-code, review | client / UI conventions |
| `rules.visual` | design-critique, review | visual fidelity / regression policy |
| `rules.aesthetics` | design, design-critique | the aesthetic quality bar |
| `rules.security` | review | threat model, auth model, sanitization policy |
| `rules.docs` | write-docs | documentation voice, audience, house conventions |

## How it works (run per slot, or `all`)

For each slot the repo cares about:

1. **Research the repo first.** Before asking anything, dig for evidence and report it with file
   paths. Examples: *design-system* → find the component directory, token files, existing stories;
   *testing* → find the runner, existing tests, fixtures, CI lanes, coverage config; *code* → detect
   language, lint/format config, type config; *security* → find auth middleware and validation
   boundaries; *docs* → read existing docs and learn their voice.
2. **Propose a best-practice starting point.** From what you found plus the pipeline's craft
   defaults, draft a **concrete** proposal for this rule — real component names, real token paths,
   real test lanes — not a template. A first draft grounded in this repo's reality.
   For **`rules.testing`**, the proposal must name (a) which kinds/layers count, (b) fixture/mock
   policy, and (c) which lane proves the **combined / integrated seam** (not units alone) so
   write-tests and review share one binding answer for "green ≠ wired correctly."
3. **Survey the maintainer — heavily.** Present the proposal and interrogate it. Confirm every
   load-bearing choice: is this the real component budget? is this the test that counts? is this the
   security boundary? What did the research miss? Where the maintainer disagrees, their answer wins.
   Keep asking until every rule is either evidence-backed or maintainer-confirmed.
4. **Write the rule file** from this repo's reality — real names, real tokens, real lanes — under the
   repo's agent-config folder (e.g. `.claude/rules/`, `.opencode/…`, or wherever the repo keeps such
   docs). Keep it a rule set, not a fork: capture *what this repo requires*, never restate the
   pipeline's process.
5. **Wire the slot.** Point the `pipeline.config` slot at the file (design specifics →
   `designSystem.path` / `.tokens`). Confirm it resolves to a real file.

## Done when

- Every slot the repo cares about points at a real rule file that is evidence-backed and
  maintainer-confirmed.
- No rule contains an invented convention or content borrowed from another project.
- `pipeline.config.yml` slots resolve to real files; slots left `null` are a deliberate choice.

## Target

$ARGUMENTS
