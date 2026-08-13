# session-lab

Forensics tooling for tuning the agent-skills-pipeline. Parses raw host transcripts
(codex rollout files, Claude Code session jsonl), links multi-agent session trees,
and attributes token spend to mechanisms (fork tax, polling, round multiplication)
and to pipeline phases/work packages.

## Data sources

- `~/.codex/sessions/**/*.jsonl` — codex rollout threads (orchestrators + forked subagents)
- `~/.claude/projects/**/*.jsonl` — Claude Code sessions (incl. sidechain subagents, `attributionSkill`)
- codeburn (`codeburn export -f json`) — dollar/cost cross-check

## Tools

| script | purpose |
|---|---|
| `fleet-codex.mjs <out.json>` | Parse every codex rollout into one compact record per thread |
| `fleet-claude.mjs <out.json>` | Parse every Claude session; attributes usage to `attributionSkill` |
| `aggregate.mjs` | Link codex threads into trees via `parent_thread_id`; fleet stats → `fleet-summary.json` |
| `parse-codex.mjs` | Full-fidelity single-rollout parser (tool calls, patches, token timeline) |
| `analyze.mjs` | Pipeline-aware metrics for one parsed session (polls, retries, re-reads, phases) |
| `run.mjs <files...> --out x.json` | Batch single-session analysis |
| `tree.mjs <rollout> --out x.json` | Walk a session tree (root + all subagent rollouts, recursive) |
| `dashboard.mjs [out.html]` | Generate the self-contained HTML report (`report.html`) |

## Reproduce the report

```sh
T=/tmp/session-lab && mkdir -p $T
node tools/session-lab/fleet-codex.mjs $T/codex-fleet.json
node tools/session-lab/fleet-claude.mjs $T/claude-fleet.json
node tools/session-lab/aggregate.mjs          # reads/writes $T paths (see file)
node tools/session-lab/dashboard.mjs tools/session-lab/report.html
```

Note: `aggregate.mjs` and `dashboard.mjs` currently read from a hardcoded temp dir
(`T` at the top of each file) — point it at your fleet json files.

## Key metrics

- **input:output ratio** per session-tree — tokens of context processed per token produced
- **fork tax** — input consumed by threads that made ≤5 tool calls (inherited context)
- **poll share** — `wait_agent`/`wait`/`list_agents` calls as share of orchestrator tool calls
- **round chains** — repeated critique/review/fix spawns per work package
- **churn vs shipped** — lines patched during a run vs the merged PR diff
