# Host capabilities

What each host offers the pipeline's context mechanics. Skills pick the cheapest mechanic the host
supports; a missing capability is a gap to record, not a reason to downgrade every host to the lowest
common denominator.

Scope is **claude and codex** — where hosts disagree, those two decide.

**Everything below marked "tested" was verified empirically on 2026-08-27** against
**Claude Code 2.1.247** and **Codex 0.150.1**, by injecting a unique marker from a hook and asking
the model whether the marker was in its context, each with a negative control. Re-run the probes
after a host upgrade rather than trusting this table indefinitely.

| capability | claude 2.1.247 | codex 0.150.1 |
|---|---|---|
| empty-context spawn | yes — subagents start empty | yes — `spawn_agent`, `fork_turns: "none"` |
| warm-session reuse | yes | yes |
| session-start injection | **tested — works**, incl. from a plugin's own `hooks/hooks.json` | **tested — works**; plain stdout and `additionalContext` both land |
| **subagent-start injection** | **tested — works, and is subagent-scoped**: the subagent saw the marker, the parent did not | **tested — works**; matcher is `agent_type` |
| skill-load injection | **tested — works**: `PostToolUse` with matcher `Skill` fires for `Skill` tool calls | **no such thing** — Codex has no skill lifecycle event; SKILL.md is rendered statically from disk |
| plugin-distributed hooks | **tested — works** (`--plugin-dir`, plugin `hooks/hooks.json`) | registered with a `trusted_hash` under `[hooks.state]`; the pipeline plugin's own hooks fire |
| token-usage exposure | unknown | unknown |

## Two prior findings, both reversed

**Codex `SessionStart` stdout is not broken.** The Phase 1 note recorded it as silently dropped,
observed against 0.142.5 (2026-07-01). Fixed by openai/codex#35194, shipped in `rust-v0.146.0`
(2026-07-29), and confirmed by test here. Hooks are stable and enabled by default (`features.hooks`).

**Claude's `Skill` matcher does fire, and plugin `SessionStart` context does surface.** Both were
reported broken in the issue tracker (anthropics/claude-code#43630 and #16538). Neither reproduces
on 2.1.247. Issue trackers were a poor source here — both issues predate the current behavior, and
one was closed as inactive rather than fixed.

## What this means for the injection path

**`SubagentStart` is the mechanism.** It is the only injection point that works on *both* hosts, and
it is the moment the pipeline actually cares about: the snapshot exists to make a fresh spawn cheap,
and spawn is when the context should arrive. Skill load was always a proxy for it.

Skill-load injection stays viable as a **claude-only supplement**, not as the primary path — it
cannot exist on codex at all.

## Rules for hook scripts

Codex-specific, verified from source; harmless on claude, so apply them everywhere:

1. **Always `exit 0`.** A non-zero exit marks the run failed and discards stdout — report check
   failures as content, never as an exit code.
2. **Never start stdout with `{` or `[`** unless it is a valid hook-output object. JSON-shaped
   output that fails to deserialize is dropped.
3. **Consume stdin.** The payload carries `cwd` and `source`, and older builds lose output on a
   broken pipe.
4. **Budget ~1,000 tokens.** Codex truncates injected context at
   `MAX_ADDITIONAL_CONTEXT_VALUE_TOKENS = 1_000` and spills past `additionalContextLimit` (2,500).
   Emit pointers, not contents.

Require Codex ≥ 0.146.0 for the stdin fix; prefer ≥ 0.150.x for the current twelve-event set.

## Known live issues (unverified here)

Open against codex, all affecting *where* hooks are installed rather than whether injection works:
repo-level `.codex/hooks.json` skipped without a trust prompt (#35306), repo `.codex/config.toml`
hooks not firing interactively (#17532), `SessionStart` not firing when bare `codex` auto-restores a
thread (#24228), and no hook execution in the VS Code extension (#33413) or Desktop (#21639). CLI is
the reliable host.
