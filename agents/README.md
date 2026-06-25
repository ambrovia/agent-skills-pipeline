# Persona agents — per-harness formats

These three personas (`planner`, `reviewer`, `builder`) drive the pipeline's
producer/evaluator separation. **Agent frontmatter is harness-specific** — unlike
skills (`../skills/`), which are neutral `SKILL.md` and run everywhere unchanged.
There is no build step: each harness reads its own copy *as-is*, so each copy must
already be in that harness's dialect. Keep the three in sync by hand.

| Harness | Files | `tools` format | `model` format | Native subagents? |
|---|---|---|---|---|
| **Claude Code** | `agents/*.md` (this dir), registered in `.claude-plugin/plugin.json` | comma-separated **PascalCase** string: `Read, Grep, Glob, Bash, Write` | real id: `opus` / `sonnet` / `haiku` (or `inherit`) | ✅ parallel |
| **opencode** | `.opencode/agents/*.md` | object of booleans: `tools:\n  edit: false` | `provider/id`, or omit to inherit | ✅ parallel |
| **Codex** | — (none) | — | — | ❌ orchestrator-only |

## Rules

- **Claude (`agents/*.md`):** `tools` MUST be a PascalCase comma-separated string and
  `model` MUST be a real Claude id. Lowercase array tools (`[read, write]`) match zero
  tools → the subagent boots tool-less and silently no-ops; abstract tiers (`high`/`fast`)
  are not valid Claude model ids and the spawn errors. (Both were the original drift bug.)
- **opencode (`.opencode/agents/*.md`):** `mode: subagent` plus the boolean-object `tools`.
- **Codex:** no persona files. Codex has no subagent primitive here, so the pipeline runs
  as a **single orchestrator agent playing all roles inline** — producer/evaluator
  separation is *not* available on Codex (it is parallel and real only on Claude/opencode).
  Codex gets the shared `../skills/` + `.codex/hooks.json` only.

After editing any Claude agent here, reinstall/update the plugin so the cache copy
(`~/.claude/plugins/cache/agent-pipeline/.../agents/`) picks up the change, and restart
the session — Claude loads agent definitions once at startup.
