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

## Install

### Claude Code — plugin

```text
/plugin marketplace add ambrovia/agent-skills-pipeline
/plugin install pipeline@agent-pipeline
```

Skills become `/pipeline:concept`, `/pipeline:review`, … and the orchestrator `/pipeline`.

### Cursor · Copilot · Gemini · Codex — copy the files

These tools read `SKILL.md` from their own directory. Copy `skills/` (and `agents/`) into it, plus `hooks/` and your tool's hook config (`.cursor/`, `.gemini/`, `.codex/`, or `.github/`) so the pipeline surfaces at session start:

| Tool | Put skills in |
|---|---|
| Cursor | `.cursor/skills/` or `.agents/skills/` |
| Copilot | `.github/skills/` or `.agents/skills/` |
| Gemini / Antigravity | `.gemini/skills/` or `.agents/skills/` |
| Codex | `.agents/skills/` |

> `.agents/skills/` is the shared standard for all of these. **Claude Code is the exception** — it reads `.claude/skills/`, so use the plugin (or copy into `.claude/`).

## Configure

Everything project-specific lives in one file. Copy [`pipeline.config.example.yml`](pipeline.config.example.yml) to `pipeline.config.yml`; skills resolve `{{key}}` from it:

```yaml
verify: "go test ./..."   # the single command that must pass before ship
designSystem: null        # null → the design phases are skipped
vcs: github
```

## The skills

`concept` · `design` · `architecture` · `design-critique` · `architecture-critique` · `write-tests` · `write-code` · `write-docs` · `review` · `ship` · `retro` · `compound` · `lore` · `work-planning` · `pipeline`

Run a whole work package through every applicable phase with `/pipeline <id>`. After several work packages, run `/compound` to mine the retro log for recurring patterns and propose process fixes. Use `/lore` anytime to capture or surface tribal knowledge.

## License

[Apache-2.0](LICENSE).
