#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  chmodSync, closeSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync,
  realpathSync, statSync, unlinkSync, writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_RECORDS = 12;
const MAX_SESSIONS = 100;
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const STALE_LOCK_MS = 30 * 1000;

const EDIT_TOOL = /edit|write|patch|replace|create|notebook/i;
const FAILURE_TEXT = /\b(error|failed|failure|non[- ]?zero|timed? out|exception|rejected|cannot|unable)\b/i;
const NO_PROGRESS_TEXT = /\b(no changes?|unchanged|not found|no match|already (?:applied|exists))\b/i;

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

function resultLooksStalled(payload, result) {
  const status = String(pick(payload, ["status", "tool_status", "toolStatus"]) ?? "");
  const exitCode = pick(payload, ["exit_code", "exitCode"])
    ?? (result && typeof result === "object" ? pick(result, ["exit_code", "exitCode"]) : undefined);
  if (/error|fail/i.test(status)) return true;
  if (typeof exitCode === "number" && exitCode !== 0) return true;
  const text = typeof result === "string" ? result : JSON.stringify(result ?? "");
  return FAILURE_TEXT.test(text) || NO_PROGRESS_TEXT.test(text);
}

export function normalizeEvent(payload) {
  const tool = String(pick(payload, ["tool_name", "toolName", "tool"]) ?? "");
  if (!EDIT_TOOL.test(tool)) return null;

  const action = pick(payload, ["tool_input", "toolInput", "parameters", "input"]);
  if (action === undefined) return null;
  const result = pick(payload, ["tool_response", "toolResponse", "result", "output"]);
  return {
    actionHash: hash({ tool: tool.toLowerCase(), action }),
    resultHash: result === undefined ? null : hash(result),
    stalled: result === undefined ? false : resultLooksStalled(payload, result),
  };
}

export function detectThrash(records, event) {
  // A successful edit proves progress and breaks the recurrence chain.
  if (event.resultHash !== null && !event.stalled) return { kind: null, records: [] };
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
    && repeated.every((item) => item.stalled)
    && repeated.every((item) => item.actionHash === event.actionHash && item.resultHash === event.resultHash)
  ) {
    return { kind: "exact-repeat", records: next };
  }

  const cycle = tail(4);
  if (
    cycle.length === 4
    && cycle.every((item) => item.stalled)
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

function readSession(path, now) {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return now - parsed.updatedAt < SESSION_TTL_MS ? parsed : { updatedAt: now, records: [] };
  } catch {
    return { updatedAt: now, records: [] };
  }
}

function writeSession(path, state) {
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify(state)}\n`, { mode: 0o600 });
  chmodSync(temp, 0o600);
  renameSync(temp, path);
}

function evictSessions(directory, now) {
  try {
    const entries = readdirSync(directory)
      .filter((name) => /^[a-f0-9]{64}\.json$/.test(name))
      .map((name) => ({ name, mtime: statSync(join(directory, name)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    for (const [index, entry] of entries.entries()) {
      if (index >= MAX_SESSIONS || now - entry.mtime >= SESSION_TTL_MS) {
        try { unlinkSync(join(directory, entry.name)); } catch { /* concurrent cleanup is harmless */ }
      }
    }
  } catch { /* detector state must never break an edit */ }
}

function acquireLock(path, now) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return openSync(path, "wx", 0o600);
    } catch {
      try {
        if (now - statSync(path).mtimeMs >= STALE_LOCK_MS) {
          unlinkSync(path);
          continue;
        }
      } catch { /* the owner may have released it between checks */ }
      // Hooks are tiny. A bounded 5 ms wait serializes same-session events while
      // capping added latency at 45 ms; after that the detector still fails open.
      if (attempt < 9) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
    }
  }
  return null;
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
  const stateDirectory = process.env.PIPELINE_THRASH_STATE
    ?? join(process.env.CLAUDE_PLUGIN_DATA || process.env.TMPDIR || "/tmp", "agent-pipeline-thrash");
  const now = Date.now();
  if (pick(payload, ["agent_id", "agentId"])) return;
  const event = normalizeEvent(payload);
  if (!event) return;
  const session = hash(String(pick(payload, ["session_id", "sessionId", "conversation_id"]) ?? "default"));
  mkdirSync(stateDirectory, { recursive: true, mode: 0o700 });
  chmodSync(stateDirectory, 0o700);
  const lockPath = join(stateDirectory, `${session}.lock`);
  const lock = acquireLock(lockPath, now);
  if (lock === null) return; // another hook for this session owns state; fail open
  try {
    const statePath = join(stateDirectory, `${session}.json`);
    const prior = readSession(statePath, now);
    const detection = detectThrash(prior.records, event);
    writeSession(statePath, { updatedAt: now, records: detection.records });
    evictSessions(stateDirectory, now);
    if (detection.kind) process.stdout.write(`${JSON.stringify(formatMessage(format, messageFor(detection.kind)))}\n`);
  } finally {
    closeSync(lock);
    try { unlinkSync(lockPath); } catch { /* fail open */ }
  }
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main().catch(() => process.exit(0));
}
