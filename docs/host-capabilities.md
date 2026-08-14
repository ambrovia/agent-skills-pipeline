# Host capabilities

What each host offers the pipeline's context mechanics. Skills pick the cheapest mechanic the host
supports; a missing capability is a gap to record, not a reason to downgrade every host to the lowest
common denominator. Verify `unknown` cells before relying on them, and update this file when a
capability is confirmed or lost.

| capability | claude | codex | cursor | gemini | copilot | opencode |
|---|---|---|---|---|---|---|
| empty-context spawn | yes — subagents start empty | fork mode configurable; verify minimal-fork behavior | unknown | unknown | unknown | unknown |
| warm-session reuse | yes | yes | unknown | unknown | unknown | task-resume supported |
| hook events | SessionStart, PostToolUse | SessionStart, PostToolUse | sessionStart, postToolUse | unknown | unknown | unknown |
| spawn-time context injection | via spawn brief | SessionStart stdout broken (Codex 0.142.5 marks it failed) — brief only | via spawn brief | unknown | unknown | via spawn brief |
| token-usage exposure | unknown | unknown | unknown | unknown | unknown | unknown |

Evidence: `hooks/hooks.json` and `hooks/cursor-hooks.json` (hook envelopes), the `@lore` in
`hooks/session-start.sh` (Codex SessionStart), and the open-decision record in
`docs/research/work-groups.md` (Claude empty spawn, codex fork mode). Token-usage exposure is
unverified everywhere — the budget gate stays feasibility-gated until it is.
