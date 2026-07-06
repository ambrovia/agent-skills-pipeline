<h1 align="center">Pipeline</h1>

<p align="center">
  <b>Structured, multi-agent software development for any AI coding tool.</b><br>
  From agentic development to agents <i>as the developer team</i>.
</p>

---

Freeform "vibe coding" with an agent fails at scale: no separation between deciding *what* to build and building it, the author grades their own homework, scope creeps, review gets skipped when "it's simple," and nothing compounds.

**Pipeline** replaces that with structure. Work is broken into **work packages** — small, outcome-level specs with acceptance criteria — and each runs through a fixed phase loop driven by three separated personas:

```
work package ──▶ design ──▶ critique ──▶ build (TDD) ──▶ review ──▶ retro ──▶ ship
                planner    reviewer      builder        reviewer    fresh     builder
```

- **The agent that designs is not the agent that reviews it.** Producer/evaluator separation is enforced by persona.
- **Planning is phase 1, never the finish line.** A plan isn't done until the builder makes it real and the reviewer signs off.
- **Gates are mechanical.** Your `verify` command must pass and the review verdict must be `DONE` before ship.
- Phases that don't apply are skipped — a backend work package skips the design phases automatically.

## What's in here

- **[`skills/`](skills/)** — the pipeline skills, each a [`SKILL.md`](https://agents.md/) (the Agent Skills open standard).
- **[`agents/`](agents/)** — `planner` / `reviewer` / `builder` persona subagents.
- **[`hooks/`](hooks/)** — a session-start hook (surfaces the pipeline) and an edit-streak hook (nudges the orchestrator to delegate after 5 consecutive edits). Both are wired for Claude, Cursor, Gemini, Codex, and Copilot via `.cursor/`, `.codex/`, `.gemini/`, `.github/`. The edit-streak skips subagent edits on Claude (which exposes that distinction); on the others it's best-effort.
- **[`.opencode/plugins/pipeline.js`](.opencode/plugins/pipeline.js)** — the opencode plugin entrypoint, exported by [`package.json`](package.json) for npm-style opencode plugin installs.

## Install

### Claude Code — plugin

```text
/plugin marketplace add ambrovia/agent-skills-pipeline
/plugin install pipeline@agent-pipeline
```

Skills become `/pipeline:refine`, `/pipeline:review`, … and the orchestrator `/pipeline`.

### Codex — plugin

This repo is packaged as a Codex plugin via [`.codex-plugin/plugin.json`](.codex-plugin/plugin.json) and advertises that plugin through [`.agents/plugins/marketplace.json`](.agents/plugins/marketplace.json). Installing it gives Codex the pipeline skills and the bundled lifecycle hooks in `hooks/hooks.json`.

Add this repository as a Codex marketplace source:

```text
codex plugin marketplace add ambrovia/agent-skills-pipeline
```

Restart Codex, open `/plugins`, choose the **Agent Pipeline** marketplace, and install `pipeline`. The repo also includes `.codex/` custom agent config for project-local development of Pipeline itself; Codex plugin manifests currently do not declare those agent files, so they are not part of the installed plugin contract.

### Cursor · Copilot · Gemini — copy the files

These tools read `SKILL.md` from their own directory. Copy `skills/` (and `agents/`) into it, plus `hooks/` and your tool's hook config (`.cursor/`, `.gemini/`, or `.github/`) so the pipeline surfaces at session start:

| Tool | Put skills in |
|---|---|
| Cursor | `.cursor/skills/` or `.agents/skills/` |
| Copilot | `.github/skills/` or `.agents/skills/` |
| Gemini / Antigravity | `.gemini/skills/` or `.agents/skills/` |

> `.agents/skills/` is the shared standard for all of these. **Claude Code is the exception** — it reads `.claude/skills/`, so use the plugin (or copy into `.claude/`).

### opencode — plugin

opencode supports plugins as JavaScript/TypeScript modules loaded from `.opencode/plugins/`, `~/.config/opencode/plugins/`, or npm packages listed in `opencode.json`. This repo exposes the edit-streak nudge as a proper opencode plugin through [`.opencode/plugins/pipeline.js`](.opencode/plugins/pipeline.js).

**This package is not published to npm** — install it from a clone using the one-command bootstrap below (or copy `.opencode/plugins/pipeline.js` into your own `.opencode/plugins/`). [`package.json`](package.json) exports that module, so *if you fork and publish it yourself*, you could then list your package in `opencode.json` (`"plugin": ["<your-package>"]`) — but the published-npm path is not provided here.

For local development from this clone, no install is needed: opencode auto-loads project plugins from `.opencode/plugins/`, so opening this repository in opencode loads the plugin directly.

The opencode plugin covers the lifecycle hook only. Pipeline’s skills, persona agents, and session-start guidance are separate opencode configuration files, so the installer remains the one-command bootstrap for the full Pipeline experience in another project:

```text
scripts/install-opencode.sh            # into the current project
scripts/install-opencode.sh ../my-app  # into another project
scripts/install-opencode.sh --global   # into ~/.config/opencode
```

It installs:

| Piece | Goes to | Why |
|---|---|---|
| Skills | `.opencode/skills/` | opencode reads project-level skills from its config directory |
| Agents | `.opencode/agents/` | opencode-format `planner` / `reviewer` / `builder` — available as `@planner`, etc. |
| Edit-streak hook | `.opencode/plugins/pipeline.js` | nudges the orchestrator to delegate after 5 edits, via `tool.execute.after` |
| Session-start guidance | `AGENTS.md` (managed block) | opencode's rules file — the equivalent of the session-start hook |

The agents inherit your session model by default; pin one with `model: <provider>/<id>` in the agent files. The edit-streak nudge is best-effort: opencode doesn't expose the orchestrator/subagent split at the tool layer, so (unlike Claude) it can't skip a subagent's own edits.

## Configure

Everything project-specific lives in one file. Copy [`pipeline.config.example.yml`](pipeline.config.example.yml) to `pipeline.config.yml`; skills resolve `{{key}}` from it:

```yaml
verify: "go test ./..."   # the single command that must pass before ship
designSystem: null        # null → the design phases are skipped
vcs: github
```

### Steer skills with project rules

The skills are deliberately generic — repo-specific knowledge (test layout, where code lives, type conventions, component budget, reuse-before-build, security policy) lives in **rules**, not in forks of the skills. `pipeline.config.yml` exposes a fixed set of optional rule **slots**; point a slot at a markdown file and the skills that consult that slot read it as **binding** guidance (a project rule overrides the skill's generic advice on conflict). Leave a slot null and skills skip it.

```yaml
rules:
  code: .claude/rules/typescript.md       # → write-code, architecture, review
  testing: .claude/rules/testing.md        # → write-tests, review
  design-system: .claude/rules/design.md   # → design, design-critique, write-code, review
  security: .claude/rules/security.md      # → review
```

| Slot | Read by | Use it for |
|---|---|---|
| `code` | write-code, architecture, review | language / type / style conventions |
| `testing` | write-tests, review | what counts as a test, layout, lanes/fixtures |
| `architecture` | architecture, architecture-critique, review | architecture invariants & conventions |
| `design-system` | design, design-critique, write-code, review | component budget, tokens, reuse-before-build, promotion |
| `frontend` | design, write-code, review | client / UI conventions |
| `visual` | design-critique, review | visual fidelity / regression policy |
| `aesthetics` | design, design-critique | aesthetic quality bar |
| `security` | review | security policy / threat model |
| `docs` | write-docs | documentation voice & conventions |

This is how one repo makes `/review` enforce its own reuse-before-build rule, or `/write-tests` follow its real-vs-mock lane policy, while another repo running the same plugin does something different — same skills, different rules. See [`pipeline.config.example.yml`](pipeline.config.example.yml) for the full slot list.

## The skills

`refine` · `design` · `architecture` · `refine-critique` · `design-critique` · `architecture-critique` · `write-tests` · `write-code` · `write-docs` · `review` · `ship` · `retro` · `compound` · `lore` · `work-planning` · `pipeline`

Run a whole work package through every applicable phase with `/pipeline <id>`. After several work packages, run `/compound` to mine the retro log for recurring patterns and propose process fixes. Use `/lore` anytime to capture or surface tribal knowledge.

## License

[Apache-2.0](LICENSE).
