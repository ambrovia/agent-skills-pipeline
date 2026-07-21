/**
 * agent-pipeline — opencode plugin.
 *
 * Ports the post-edit thrash detector. A cautious nudge is appended only when
 * equivalent actions/results repeat without progress. opencode surfaces the
 * nudge to the model on its next turn (verified against the
 * `@opencode-ai/plugin` `tool.execute.after` signature: `output.output` is the
 * mutable result string the model reads).
 *
 * The other half of the Claude hooks — the session-start "pipeline is active"
 * guidance — is NOT a plugin here. opencode plugins only expose tool/chat
 * lifecycle hooks, with no stable way to inject standing context once per
 * session; opencode's documented mechanism for that is the AGENTS.md rules file.
 * `scripts/install-opencode.sh` writes that guidance into AGENTS.md.
 *
 * Caveat: opencode does not expose an orchestrator/subagent distinction at the
 * tool layer, so — unlike
 * Claude, which skips edits made inside a subagent — this can't tell whether an
 * edit came from the orchestrator or from the pipeline-builder. The nudge is best-effort
 * and may also fire inside a subagent.
 */

const EDIT_TOOLS = /^(edit|write|patch|multiedit|notebookedit)$/i;
let detectorState = { sessions: {} };

async function loadDetector() {
  try {
    return await import("./thrash-detector.mjs"); // installed opencode plugin
  } catch {
    return import("../../hooks/thrash-detector.mjs"); // repository checkout
  }
}

export const AgentPipeline = async () => {
  return {
    "tool.execute.after": async (input, output) => {
      try {
        if (!input || !EDIT_TOOLS.test(input.tool || "")) return;

        const detector = await loadDetector();
        const processed = detector.processPayload({
          tool_name: input.tool,
          tool_input: input.args ?? input.input ?? {},
          tool_response: output?.output,
          session_id: input.sessionID || "default",
        }, detectorState);
        detectorState = processed.state;

        if (processed.kind && output && typeof output.output === "string") {
          output.output +=
            `\n\n---\n[agent-pipeline] ${detector.messageFor(processed.kind)}`;
        }
      } catch {
        // A nudge must never break a tool call.
      }
    },
  };
};
