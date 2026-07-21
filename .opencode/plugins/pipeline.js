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

async function loadDetector() {
  try {
    return await import("./thrash-detector.mjs"); // installed opencode plugin
  } catch {
    return import("../../hooks/thrash-detector.mjs"); // repository checkout
  }
}

export async function createPipelinePlugin(detectorLoader = loadDetector) {
  let detectorState = { sessions: {} };
  const pending = new Map();
  const keyFor = (input) => `${input?.sessionID ?? "default"}:${input?.callID ?? input?.toolCallID ?? "unknown"}`;

  return {
    "tool.execute.before": async (input, output) => {
      try {
        if (!input || !EDIT_TOOLS.test(input.tool || "") || !output?.args) return;
        pending.set(keyFor(input), output.args);
        if (pending.size > 100) pending.delete(pending.keys().next().value);
      } catch {
        // Argument capture is an optimization and must never break a tool call.
      }
    },
    "tool.execute.after": async (input, output) => {
      try {
        if (!input || !EDIT_TOOLS.test(input.tool || "")) return;
        const key = keyFor(input);
        const args = pending.get(key);
        pending.delete(key);
        // Use the before-hook snapshot so the signature is stable across opencode
        // versions and cannot reflect later mutation. Without it, disable detection.
        if (!args) return;

        const detector = await detectorLoader();
        const processed = detector.processPayload({
          tool_name: input.tool,
          tool_input: args,
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
}

export const AgentPipeline = async () => createPipelinePlugin();
