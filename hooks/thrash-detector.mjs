#!/usr/bin/env node

import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const MAX_RECORDS = 12;
const MAX_SESSIONS = 100;
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;

const EDIT_TOOL = /edit|write|patch|replace|notebook/i;
const FAILURE_TEXT = /\b(error|failed|failure|non[- ]?zero|timed? out|exception|rejected|cannot|unable)\b/i;

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function pick(payload, keys) {
  for (const key of keys) {
    if (payload?.[key] !== undefined) return payload[key];
  }
  return undefined;
}

function resultLooksFailed(payload, result) {
  const status = String(pick(payload, ["status", "tool_status", "toolStatus"]) ?? "");
  const exitCode = pick(payload, ["exit_code", "exitCode"])
    ?? (result && typeof result === "object" ? pick(result, ["exit_code", "exitCode"]) : undefined);
  if (/error|fail/i.test(status)) return true;
  if (typeof exitCode === "number" && exitCode !== 0) return true;
  const text = typeof result === "string" ? result : JSON.stringify(result ?? "");
  return FAILURE_TEXT.test(text);
}

export function normalizeEvent(payload) {
  const tool = String(pick(payload, ["tool_name", "toolName", "tool"]) ?? "");
  if (tool && !EDIT_TOOL.test(tool)) return null;

  const action = pick(payload, ["tool_input", "toolInput", "parameters", "input"]);
  if (action === undefined) return null;
  const result = pick(payload, ["tool_response", "toolResponse", "result", "output"]);
  return {
    actionHash: hash({ tool: tool.toLowerCase(), action }),
    resultHash: result === undefined ? null : hash(result),
    failed: result === undefined ? false : resultLooksFailed(payload, result),
  };
}

export function detectThrash(records, event) {
  const next = [...records, event].slice(-MAX_RECORDS);
  const tail = (count) => next.slice(-count);

  if (event.resultHash === null) {
    const repeated = tail(3);
    if (repeated.length === 3 && repeated.every((item) => item.actionHash === event.actionHash)) {
      return { kind: "cautious-repeat", records: next };
    }
    return { kind: null, records: next };
  }

  const repeated = tail(3);
  if (
    repeated.length === 3
    && repeated.every((item) => item.actionHash === event.actionHash && item.resultHash === event.resultHash)
  ) {
    return { kind: "exact-repeat", records: next };
  }

  const cycle = tail(4);
  if (
    cycle.length === 4
    && cycle.every((item) => item.failed)
    && cycle[0].actionHash === cycle[2].actionHash
    && cycle[0].resultHash === cycle[2].resultHash
    && cycle[1].actionHash === cycle[3].actionHash
    && cycle[1].resultHash === cycle[3].resultHash
    && (cycle[0].actionHash !== cycle[1].actionHash || cycle[0].resultHash !== cycle[1].resultHash)
  ) {
    return { kind: "oscillation", records: next };
  }
  return { kind: null, records: next };
}

function readState(path, now) {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    const sessions = Object.fromEntries(
      Object.entries(parsed.sessions ?? {}).filter(([, value]) => now - value.updatedAt < SESSION_TTL_MS),
    );
    return { sessions };
  } catch {
    return { sessions: {} };
  }
}

function writeState(path, state) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify(state)}\n`, { mode: 0o600 });
  chmodSync(temp, 0o600);
  renameSync(temp, path);
}

export function processPayload(payload, state, now = Date.now()) {
  if (pick(payload, ["agent_id", "agentId"])) return { state, kind: null };
  const event = normalizeEvent(payload);
  if (!event) return { state, kind: null };
  const rawSession = String(pick(payload, ["session_id", "sessionId", "conversation_id"]) ?? "default");
  const session = hash(rawSession);
  const activeSessions = Object.fromEntries(
    Object.entries(state.sessions ?? {}).filter(([, value]) => now - value.updatedAt < SESSION_TTL_MS),
  );
  const prior = activeSessions[session]?.records ?? [];
  const detection = detectThrash(prior, event);
  const sessions = { ...activeSessions, [session]: { updatedAt: now, records: detection.records } };
  const newest = Object.entries(sessions)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, MAX_SESSIONS);
  return { state: { sessions: Object.fromEntries(newest) }, kind: detection.kind };
}

export function messageFor(kind) {
  if (kind === "cautious-repeat") {
    return "The same edit action has repeated without result data. Check whether it made progress before repeating it again; if not, diagnose the assumption and change strategy.";
  }
  return "This edit/failure pattern is repeating without progress. Stop editing, inspect the latest evidence, classify the cause, and use a materially different strategy or raise a plan BLOCKER.";
}

function formatMessage(format, message) {
  if (format === "cursor") return { additional_context: message };
  if (format === "gemini") return { hookSpecificOutput: { additionalContext: message } };
  if (format === "copilot") return { additionalContext: message };
  return { hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: message } };
}

async function main() {
  const format = process.argv[2] ?? "claude";
  if (format === "codex") return;
  const input = readFileSync(0, "utf8");
  const payload = JSON.parse(input);
  const statePath = process.env.PIPELINE_THRASH_STATE
    ?? join(process.env.CLAUDE_PLUGIN_DATA || process.env.TMPDIR || "/tmp", "agent-pipeline-thrash.json");
  const now = Date.now();
  const state = readState(statePath, now);
  const processed = processPayload(payload, state, now);
  writeState(statePath, processed.state);
  if (processed.kind) process.stdout.write(`${JSON.stringify(formatMessage(format, messageFor(processed.kind)))}\n`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch(() => process.exit(0));
}
