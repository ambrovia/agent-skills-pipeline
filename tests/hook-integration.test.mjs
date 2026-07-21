import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, readdirSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";

import { createPipelinePlugin } from "../.opencode/plugins/pipeline.js";
import * as detector from "../hooks/thrash-detector.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const wrapper = join(root, "hooks/edit-streak.sh");
const payload = JSON.stringify({
  session_id: "session-fixture",
  tool_name: "Edit",
  tool_input: { file_path: "src/a.ts", old_string: "x", new_string: "y" },
  tool_response: "error: old_string not found",
});

function invoke(format, state, input = payload, session = "session-fixture") {
  const body = input === payload ? payload.replace("session-fixture", session) : input;
  return spawnSync("bash", [wrapper, format], {
    cwd: root,
    input: body,
    encoding: "utf8",
    env: { ...process.env, PIPELINE_THRASH_STATE: state },
  });
}

for (const [format, assertion] of [
  ["claude", (value) => value.hookSpecificOutput?.hookEventName === "PostToolUse"],
  ["cursor", (value) => typeof value.additional_context === "string"],
  ["gemini", (value) => typeof value.hookSpecificOutput?.additionalContext === "string"],
  ["copilot", (value) => typeof value.additionalContext === "string"],
]) {
  test(`${format} wrapper accepts its post-edit fixture and emits its host envelope`, () => {
    const state = mkdtempSync(join(tmpdir(), `pipeline-${format}-`));
    assert.equal(invoke(format, state).stdout, "");
    assert.equal(invoke(format, state).stdout, "");
    const third = invoke(format, state);
    assert.equal(third.status, 0);
    assert(assertion(JSON.parse(third.stdout)));
  });
}

test("Codex is explicitly unsupported and remains silent", () => {
  const state = mkdtempSync(join(tmpdir(), "pipeline-codex-"));
  const result = invoke("codex", state);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
  assert.deepEqual(readdirSync(state), []);
});

test("malformed input fails open without state or output", () => {
  const state = mkdtempSync(join(tmpdir(), "pipeline-malformed-"));
  const result = invoke("cursor", state, "not json");
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
  assert.deepEqual(readdirSync(state), []);
});

test("persistent state is private, per-session, bounded, and expires", () => {
  const state = mkdtempSync(join(tmpdir(), "pipeline-state-"));
  chmodSync(state, 0o755);
  for (let index = 0; index < 105; index += 1) invoke("cursor", state, undefined, `session-${index}`);
  let files = readdirSync(state).filter((name) => name.endsWith(".json"));
  assert(files.length <= 100);
  assert.equal(statSync(state).mode & 0o777, 0o700);
  assert(files.every((name) => /^[a-f0-9]{64}\.json$/.test(name)));
  assert(files.every((name) => (statSync(join(state, name)).mode & 0o777) === 0o600));
  assert(files.every((name) => !readFileSync(join(state, name), "utf8").includes("src/a.ts")));

  const old = join(state, files[0]);
  utimesSync(old, new Date(0), new Date(0));
  invoke("cursor", state, undefined, "fresh-session");
  files = readdirSync(state).filter((name) => name.endsWith(".json"));
  assert.equal(files.includes(old.split("/").at(-1)), false);
});

test("different sessions can update concurrently without lost shared state", async () => {
  const state = mkdtempSync(join(tmpdir(), "pipeline-concurrent-"));
  await Promise.all(Array.from({ length: 12 }, (_, index) => new Promise((resolveChild, reject) => {
    const child = spawn("bash", [wrapper, "cursor"], {
      cwd: root,
      env: { ...process.env, PIPELINE_THRASH_STATE: state },
      stdio: ["pipe", "ignore", "ignore"],
    });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolveChild() : reject(new Error(`exit ${code}`)));
    child.stdin.end(payload.replace("session-fixture", `parallel-${index}`));
  })));
  assert.equal(readdirSync(state).filter((name) => name.endsWith(".json")).length, 12);
});

test("concurrent calls for one session never corrupt its private state", async () => {
  const state = mkdtempSync(join(tmpdir(), "pipeline-same-session-"));
  await Promise.all(Array.from({ length: 8 }, () => new Promise((resolveChild, reject) => {
    const child = spawn("bash", [wrapper, "cursor"], {
      cwd: root,
      env: { ...process.env, PIPELINE_THRASH_STATE: state },
      stdio: ["pipe", "ignore", "ignore"],
    });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolveChild() : reject(new Error(`exit ${code}`)));
    child.stdin.end(payload);
  })));
  const files = readdirSync(state).filter((name) => name.endsWith(".json"));
  assert.equal(files.length, 1);
  assert.doesNotThrow(() => JSON.parse(readFileSync(join(state, files[0]), "utf8")));
});

test("a stale per-session lock is recovered", () => {
  const state = mkdtempSync(join(tmpdir(), "pipeline-stale-lock-"));
  invoke("cursor", state);
  const json = readdirSync(state).find((name) => name.endsWith(".json"));
  const lock = join(state, json.replace(/\.json$/, ".lock"));
  readFileSync(join(state, json));
  writeFileSync(lock, "");
  utimesSync(lock, new Date(0), new Date(0));
  const result = invoke("cursor", state);
  assert.equal(result.status, 0);
  assert.equal(readdirSync(state).some((name) => name.endsWith(".lock")), false);
});

test("opencode captures before-hook args and reuses them in after-hook detection", async () => {
  const plugin = await createPipelinePlugin(async () => detector);
  let final = "";
  for (let index = 0; index < 3; index += 1) {
    const input = { tool: "edit", sessionID: "s", callID: `c${index}`, args: { deliberately: "different-after-value" } };
    await plugin["tool.execute.before"](input, { args: { filePath: "a", old: "x", new: "y" } });
    const output = { output: "error: no match" };
    await plugin["tool.execute.after"](input, output);
    final = output.output;
  }
  assert.match(final, /repeating without progress/);
});

test("opencode disables detection when no matching before-hook arguments exist", async () => {
  const plugin = await createPipelinePlugin(async () => detector);
  const output = { output: "error: no match" };
  await plugin["tool.execute.after"]({ tool: "edit", sessionID: "s", callID: "missing" }, output);
  assert.equal(output.output, "error: no match");
});

test("project installers package the detector beside their wrappers/plugins", () => {
  const cursorTarget = mkdtempSync(join(tmpdir(), "pipeline-cursor-install-"));
  const cursor = spawnSync("bash", [join(root, "scripts/install-cursor.sh"), cursorTarget], { cwd: root, encoding: "utf8" });
  assert.equal(cursor.status, 0, cursor.stderr);
  assert.equal(statSync(join(cursorTarget, ".cursor/hooks/thrash-detector.mjs")).isFile(), true);

  const openTarget = mkdtempSync(join(tmpdir(), "pipeline-open-install-"));
  const open = spawnSync("bash", [join(root, "scripts/install-opencode.sh"), openTarget], { cwd: root, encoding: "utf8" });
  assert.equal(open.status, 0, open.stderr);
  assert.equal(statSync(join(openTarget, ".opencode/plugins/thrash-detector.mjs")).isFile(), true);
});

test("installed opencode plugin resolves its packaged detector", async () => {
  const target = mkdtempSync(join(tmpdir(), "pipeline-open-runtime-"));
  const installed = spawnSync("bash", [join(root, "scripts/install-opencode.sh"), target], { cwd: root, encoding: "utf8" });
  assert.equal(installed.status, 0, installed.stderr);
  const module = await import(`${pathToFileURL(join(target, ".opencode/plugins/pipeline.js")).href}?test=${Date.now()}`);
  const plugin = await module.createPipelinePlugin();
  let final = "";
  for (let index = 0; index < 3; index += 1) {
    const input = { tool: "edit", sessionID: "installed", callID: `i${index}` };
    await plugin["tool.execute.before"](input, { args: { filePath: "a", old: "x", new: "y" } });
    const output = { output: "error: no match" };
    await plugin["tool.execute.after"](input, output);
    final = output.output;
  }
  assert.match(final, /repeating without progress/);
});
