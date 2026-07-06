#!/usr/bin/env node
/**
 * launch.mjs — one-command launcher for the component viewer.
 *
 * Turns the manual "copy → npm install → npm run dev → find the URL" dance into
 * a single idempotent command the human-concept-review skill (or a human) runs.
 * Zero runtime dependencies — Node built-ins only — so it works straight from a
 * plugin install with nothing pre-installed.
 *
 * The viewer must live INSIDE the target project: it renders that project's
 * `src/**​/*.stories.tsx` live (Vite compiles them on demand), so a prebuilt
 * bundle can't stand in. This copies the viewer into the project once, installs
 * its toolchain once (esbuild ships a platform-native binary, so this can't be
 * vendored), then runs the dev server.
 *
 * Usage:
 *   node launch.mjs [project-dir]     # default: current working directory
 *   node launch.mjs --port 5200 .
 *   node launch.mjs --help
 *
 * Resolving the launcher path from an installed plugin:
 *   Claude Code : node "${CLAUDE_PLUGIN_ROOT}/skills/human-concept-review/viewer/launch.mjs" <project>
 *   Codex CLI   : node "${PLUGIN_ROOT}/skills/human-concept-review/viewer/launch.mjs" <project>
 *   opencode    : resolve via the plugin module's import.meta.url (no plugin-root env var)
 *
 * Exit codes: 0 = viewer reachable (freshly started or already running); 1 = failed.
 */
import { cpSync, existsSync, mkdirSync, openSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { get } from "node:http";

const SELF_DIR = dirname(fileURLToPath(import.meta.url)); // the plugin's viewer/ dir
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;

function parseArgs(argv) {
  const opts = { project: process.cwd(), port: 5173 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "--port") opts.port = Number(argv[++i]);
    else if (a.startsWith("--port=")) opts.port = Number(a.slice(7));
    else if (!a.startsWith("-")) opts.project = resolve(a);
  }
  return opts;
}

function log(msg) {
  process.stderr.write(`[viewer] ${msg}\n`);
}

/** Resolve to any HTTP response (even a 404) — that proves the port is serving. */
function probe(port) {
  return new Promise((res) => {
    const req = get({ host: "localhost", port, path: "/", timeout: 1500 }, (r) => {
      r.resume();
      res(true);
    });
    req.on("error", () => res(false));
    req.on("timeout", () => {
      req.destroy();
      res(false);
    });
  });
}

async function waitUntilReady(port, deadline) {
  while (Date.now() < deadline) {
    if (await probe(port)) return true;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(
      "Usage: node launch.mjs [project-dir] [--port N]\n" +
        "Copies the viewer into the project (once), installs deps (once), and starts\n" +
        "the dev server. Idempotent — reuses an already-running viewer.\n",
    );
    return 0;
  }

  const { project, port } = opts;
  const url = `http://localhost:${port}`;

  // 1. Already running? Reuse it.
  if (await probe(port)) {
    log(`already running — reusing ${url}`);
    process.stdout.write(url + "\n");
    return 0;
  }

  // 2. Copy the viewer into the project (once), unless we're already inside it.
  const destViewer = join(project, "viewer");
  const runningFromProject = resolve(destViewer) === resolve(SELF_DIR);
  if (!runningFromProject && !existsSync(destViewer)) {
    log(`copying viewer → ${destViewer}`);
    mkdirSync(project, { recursive: true });
    cpSync(SELF_DIR, destViewer, {
      recursive: true,
      filter: (src) =>
        !/(^|[\\/])(node_modules|dist|\.vite|\.annotations)([\\/]|$)/.test(src),
    });
  }
  const viewerDir = runningFromProject ? SELF_DIR : destViewer;

  // 3. Install the toolchain (once).
  if (!existsSync(join(viewerDir, "node_modules"))) {
    log("installing dependencies (first run only)…");
    const install = spawnSync("npm", ["install"], {
      cwd: viewerDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (install.status !== 0) {
      log("npm install failed — fall back to the screenshot channel.");
      return 1;
    }
  }

  // 4. Start the dev server, detached, so it outlives this launcher.
  const viteBin = join(
    viewerDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "vite.cmd" : "vite",
  );
  const logFile = join(viewerDir, "vite.log");
  const out = openSync(logFile, "a");
  log("starting dev server…");
  const child = spawn(viteBin, ["--port", String(port)], {
    cwd: viewerDir,
    detached: true,
    stdio: ["ignore", out, out],
    shell: process.platform === "win32",
  });
  child.unref();

  // 5. Wait until it answers, then hand off the URL.
  const ready = await waitUntilReady(port, Date.now() + READY_TIMEOUT_MS);
  if (!ready) {
    log(`did not become ready within ${READY_TIMEOUT_MS / 1000}s — see ${logFile}`);
    return 1;
  }
  log(`ready at ${url}`);
  process.stdout.write(url + "\n");
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    log(`unexpected error: ${err?.message ?? err}`);
    process.exit(1);
  },
);
