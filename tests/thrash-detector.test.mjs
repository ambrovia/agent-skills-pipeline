import assert from "node:assert/strict";
import test from "node:test";

import { detectThrash, normalizeEvent, processPayload } from "../hooks/thrash-detector.mjs";

const edit = (input, output, extra = {}) => ({
  tool_name: "Edit",
  tool_input: input,
  ...(output === undefined ? {} : { tool_response: output }),
  ...extra,
});

test("ignores non-edit tools and subagents", () => {
  assert.equal(normalizeEvent({ tool_name: "Read", tool_input: { file: "a" } }), null);
  const state = { sessions: {} };
  assert.equal(processPayload(edit({ file: "a" }, "error", { agent_id: "child" }), state).kind, null);
});

test("three distinct edits do not warn", () => {
  let records = [];
  for (const name of ["a", "b", "c"]) {
    const event = normalizeEvent(edit({ file: name }, "updated"));
    const result = detectThrash(records, event);
    records = result.records;
    assert.equal(result.kind, null);
  }
});

test("a successful result resets an earlier failure recurrence", () => {
  const failed = normalizeEvent(edit({ file: "a" }, "error: no match"));
  const success = normalizeEvent(edit({ file: "a" }, "updated successfully"));
  let records = detectThrash([], failed).records;
  records = detectThrash(records, failed).records;
  const reset = detectThrash(records, success);
  assert.equal(reset.kind, null);
  assert.deepEqual(reset.records, []);
  assert.equal(detectThrash(reset.records, failed).kind, null);
});

test("three identical actions and results report exact repeat", () => {
  let records = [];
  let kind = null;
  for (let i = 0; i < 3; i += 1) {
    const result = detectThrash(records, normalizeEvent(edit({ file: "a", old: "x", new: "y" }, "error: no match")));
    records = result.records;
    kind = result.kind;
  }
  assert.equal(kind, "exact-repeat");
});

test("result-free repeats produce only the cautious signal", () => {
  let records = [];
  let kind = null;
  for (let i = 0; i < 3; i += 1) {
    const result = detectThrash(records, normalizeEvent(edit({ file: "a", old: "x", new: "y" })));
    records = result.records;
    kind = result.kind;
  }
  assert.equal(kind, "cautious-repeat");
});

test("failed A-B-A-B reports oscillation, successful A-B-A-B does not", () => {
  for (const failed of [true, false]) {
    let records = [];
    let kind = null;
    for (const file of ["a", "b", "a", "b"]) {
      const output = failed ? "failed: unchanged" : "updated";
      const result = detectThrash(records, normalizeEvent(edit({ file }, output)));
      records = result.records;
      kind = result.kind;
    }
    assert.equal(kind, failed ? "oscillation" : null);
  }
});

test("session state is hashed and isolated", () => {
  let state = { sessions: {} };
  for (let i = 0; i < 3; i += 1) {
    ({ state } = processPayload({ ...edit({ file: "a" }, "error"), session_id: "private-session" }, state, i + 1));
  }
  assert.equal(Object.keys(state.sessions).includes("private-session"), false);
  assert.equal(Object.keys(state.sessions).length, 1);
});

test("expired sessions are discarded", () => {
  const state = { sessions: { old: { updatedAt: 0, records: [] } } };
  const processed = processPayload({ ...edit({ file: "a" }, "updated"), session_id: "new" }, state, 7 * 60 * 60 * 1000);
  assert.equal(Object.hasOwn(processed.state.sessions, "old"), false);
  assert.equal(Object.keys(processed.state.sessions).length, 1);
});
