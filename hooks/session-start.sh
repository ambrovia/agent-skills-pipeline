#!/bin/bash
# agent-pipeline session-start hook — surface how to work in this repo.
# Usage: session-start.sh [claude|cursor|gemini|codex|copilot]   (default: claude)
# Each tool wants the injected context in a different output shape; the message
# is the same. Per-tool config files (.cursor/, .codex/, .gemini/, .github/) pass
# the matching format.
fmt="${1:-claude}"

read -r -d '' MSG <<'EOF'
agent-pipeline is active. Work in structured phases, not freeform.

- Large or non-trivial changes: start with /work-planning to define the work
  package, then run it through /pipeline. Don't freelance big changes.
- Conceptual questions (what a thing IS or should be): use /concept, and resolve
  them interactively with the user — don't settle load-bearing meaning alone.
- Structured work uses three dedicated agents; you are the orchestrator, delegate
  work to your team: planner (concept/design/architecture) plans & structures
  details; builder implements & ships and thus does the heavy lifting; reviewer
  critiques and reviews.
EOF

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

case "$fmt" in
  cursor)  jq -cn --arg m "$MSG" '{additional_context:$m}' ;;
  gemini)  jq -cn --arg m "$MSG" '{hookSpecificOutput:{additionalContext:$m}}' ;;
  codex)   jq -cn --arg m "$MSG" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$m}}' ;;
  copilot) jq -cn --arg m "$MSG" '{additionalContext:$m}' ;;
  *)       jq -cn --arg m "$MSG" '{priority:"IMPORTANT",message:$m}' ;;  # claude / default
esac
