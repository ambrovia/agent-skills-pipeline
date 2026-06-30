# Persona agents — one source, generated per harness

Three personas (`planner`, `reviewer`, `builder`) drive the pipeline's
producer/evaluator separation. They are authored ONCE in `../personas/<name>.md`
(neutral frontmatter + the prompt body) and **generated** into each harness's
dialect by `../scripts/generate-agents.mjs`. Every generated file carries a
`GENERATED … do not edit` marker — edit `personas/` and regenerate, never the
outputs. Skills (`../skills/`) are neutral `SKILL.md` and need no generation —
every harness reads that format directly.

## Canonical source — `personas/<name>.md`

Frontmatter is harness-neutral; the generator maps it to each tool's dialect:

| Field | Meaning |
|---|---|
| `capability` | `high` (planner, reviewer) or `fast` (builder) |
| `write` / `edit` / `bash` | tool policy (read / grep / glob are always on) |

## Generated outputs

| Harness | File | Frontmatter the generator emits | Skills location |
|---|---|---|---|
| **Claude Code** | `agents/*.md` (registered in `.claude-plugin/plugin.json`) | `tools` PascalCase string + `model` real id (`opus` / `sonnet`) | `skills` field → `./skills` |
| **opencode** | `.opencode/agents/*.md` | `mode: subagent` + `tools` deny-map; `model` omitted (inherit) | `.opencode/skills/` (install-time copy) |
| **Codex** | `.codex/agents/*.toml` | `name` / `description` / `developer_instructions`; `model_reasoning_effort: high` for high-capability | `.codex-plugin/plugin.json` → `./skills` |

Codex has native TOML subagents (project-scoped `.codex/agents/`, loaded when the
project is trusted), so real producer/evaluator separation works there too — not
the orchestrator-inline fallback the pipeline used before.

## Changing a persona

1. Edit `personas/<name>.md` — the body and/or the neutral frontmatter.
2. Run `node scripts/generate-agents.mjs` to regenerate all nine outputs
   (3 personas × 3 harnesses).
3. Commit `personas/` and the regenerated files together.

CI / pre-commit guard: `node scripts/generate-agents.mjs --check` exits non-zero
if any generated file is stale, so the copies cannot silently drift.

## Harness notes

- **Claude:** `tools` MUST be a PascalCase comma string and `model` a real Claude
  id — lowercase array tools match zero tools (silent no-op) and abstract tiers
  (`high` / `fast`) are not valid model ids (spawn errors). The generator enforces both.
- **opencode:** the loader globs `{agent,agents}`, so the plural `.opencode/agents/`
  used here loads fine (the old singular/plural silent-no-load is fixed on current versions).
- **Codex:** project files in `.codex/agents/` load only when the project is trusted.
  The Codex plugin manifest has no `agents` field, so subagents ship as project files,
  separate from the `.codex-plugin` skill bundle.

After regenerating Claude agents, reinstall/update the plugin so the cache copy
(`~/.claude/plugins/cache/agent-pipeline/.../agents/`) picks up the change, and
restart the session — Claude loads agent definitions once at startup.
