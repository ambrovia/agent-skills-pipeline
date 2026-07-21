#!/bin/bash
# Compatibility wrapper for the post-edit thrash detector.
# Format arg: claude|cursor|gemini|codex|copilot  (controls the output JSON shape).
#
# The per-tool config matcher restricts this to edit tools; the script also
# self-guards (only counts edit-like tool names) so a loose matcher can't make it
# count reads. Subagent edits are skipped where the tool exposes them (Claude:
# agent_id) — the pipeline-builder doing edits is its job. Other tools don't surface the
# orchestrator/subagent distinction at the tool level, so there the nudge is
# best-effort and may also fire inside a subagent.
fmt="${1:-claude}"
command -v node >/dev/null 2>&1 || exit 0
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec node "$root/thrash-detector.mjs" "$fmt"
