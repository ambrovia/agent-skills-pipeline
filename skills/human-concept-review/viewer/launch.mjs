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
import {
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { get } from "node:http";

const SELF_DIR = dirname(fileURLToPath(import.meta.url)); // the plugin's viewer/ dir
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;
const DEFAULT_STORY_GLOBS = [
  "../src/**/*.stories.tsx",
  "../packages/*/src/**/*.stories.tsx",
  "../apps/*/src/**/*.stories.tsx",
];
const COMMON_CSS_NAMES = new Set([
  "index.css",
  "global.css",
  "globals.css",
  "app.css",
  "styles.css",
  "style.css",
  "tokens.css",
  "index.scss",
  "global.scss",
  "globals.scss",
  "app.scss",
  "styles.scss",
  "style.scss",
  "tokens.scss",
]);
const MAIN_ENTRY_NAMES = new Set([
  "main.tsx",
  "main.ts",
  "main.jsx",
  "main.js",
  "index.tsx",
  "index.ts",
  "index.jsx",
  "index.js",
]);
const POSTCSS_CONFIG_NAMES = [
  "postcss.config.js",
  "postcss.config.cjs",
  "postcss.config.mjs",
  "postcss.config.ts",
  ".postcssrc",
  ".postcssrc.json",
  ".postcssrc.js",
  ".postcssrc.cjs",
  ".postcssrc.mjs",
];

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

function loud(msg) {
  log(`WARNING: ${msg}`);
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function fileExists(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function dirExists(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function resolveProjectPath(project, value) {
  return isAbsolute(value) ? value : resolve(project, value);
}

function slash(path) {
  return path.split(sep).join("/");
}

function viewerImportPath(viewerDir, targetPath) {
  return `/@fs/${slash(resolve(targetPath))}`;
}

function storyGlobFromProject(project, viewerDir, glob) {
  const absolutePattern = isAbsolute(glob)
    ? glob
    : resolve(project, glob.replace(/^\.\//, ""));
  let rel = slash(relative(viewerDir, absolutePattern));
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function parseJsonConfig(project) {
  const path = join(project, ".pipeline", "viewer.config.json");
  if (!fileExists(path)) return {};
  try {
    const parsed = JSON.parse(readText(path));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    loud(`${path} could not be parsed: ${error.message}`);
    return {};
  }
}

function parseScalar(raw) {
  const trimmed = stripInlineComment(raw).trim();
  if (!trimmed) return "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((part) => parseScalar(part))
      .filter(Boolean);
  }
  return trimmed;
}

function stripInlineComment(raw) {
  let quote = null;
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if ((char === '"' || char === "'") && raw[i - 1] !== "\\") {
      quote = quote === char ? null : quote ?? char;
    }
    if (char === "#" && !quote && (i === 0 || /\s/.test(raw[i - 1]))) {
      return raw.slice(0, i);
    }
  }
  return raw;
}

function parseSimpleYaml(project) {
  const path = join(project, "pipeline.config.yml");
  if (!fileExists(path)) return {};
  const out = {};
  const lines = readText(path).split(/\r?\n/);
  let section = null;
  let listKey = null;
  for (const line of lines) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const top = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (top) {
      section = top[1];
      listKey = null;
      if (!out[section]) out[section] = {};
      if (top[2]) out[section]._value = parseScalar(top[2]);
      continue;
    }
    if (!section) continue;
    const key = line.match(/^\s{2}([A-Za-z][\w-]*):\s*(.*)$/);
    if (key) {
      listKey = key[1];
      const value = key[2];
      if (!value) out[section][listKey] = [];
      else out[section][listKey] = parseScalar(value);
      continue;
    }
    const item = line.match(/^\s{4}-\s*(.*)$/);
    if (item && listKey) {
      if (!Array.isArray(out[section][listKey])) out[section][listKey] = [];
      out[section][listKey].push(parseScalar(item[1]));
    }
  }
  return out;
}

function walkFiles(root, shouldEnter, out = []) {
  if (!dirExists(root)) return out;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "viewer") {
      continue;
    }
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      if (!shouldEnter || shouldEnter(full)) walkFiles(full, shouldEnter, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function sourceRoots(project, designSystemPath) {
  const roots = [];
  for (const relRoot of ["src", "packages", "apps"]) {
    const abs = join(project, relRoot);
    if (dirExists(abs)) roots.push(abs);
  }
  if (designSystemPath) {
    const abs = resolveProjectPath(project, designSystemPath);
    if (dirExists(abs)) roots.push(abs);
  }
  return uniq(roots);
}

function detectStoryGlobs(project, explicitGlobs) {
  if (explicitGlobs.length > 0) return explicitGlobs;
  const candidates = [
    "src/**/*.stories.tsx",
    "packages/*/src/**/*.stories.tsx",
    "apps/*/src/**/*.stories.tsx",
  ];
  return candidates.filter((glob) => {
    const base = glob.split("/**/")[0].replace("/*/", "/");
    if (glob.startsWith("packages/*/")) return dirExists(join(project, "packages"));
    if (glob.startsWith("apps/*/")) return dirExists(join(project, "apps"));
    return dirExists(join(project, base));
  });
}

function cssImportsFromMainEntries(project, roots) {
  const found = [];
  const importRe = /import\s+(?:[^'"]+\s+from\s+)?["']([^"']+\.s?css(?:\?[^"']*)?)["'];?/g;
  for (const root of roots) {
    const files = walkFiles(root, (dir) => !dir.includes(`${sep}node_modules${sep}`));
    for (const file of files) {
      if (!MAIN_ENTRY_NAMES.has(file.split(sep).pop())) continue;
      const text = readText(file);
      let match;
      while ((match = importRe.exec(text))) {
        const spec = match[1].split("?")[0];
        if (spec.startsWith(".")) {
          const resolved = resolve(dirname(file), spec);
          if (fileExists(resolved)) found.push(resolved);
        } else if (spec.startsWith("/")) {
          const resolved = resolve(project, spec.slice(1));
          if (fileExists(resolved)) found.push(resolved);
        }
      }
    }
  }
  return found;
}

function commonCssEntries(roots) {
  const found = [];
  for (const root of roots) {
    const files = walkFiles(root, (dir) => !dir.includes(`${sep}node_modules${sep}`));
    for (const file of files) {
      if (COMMON_CSS_NAMES.has(file.split(sep).pop())) found.push(file);
    }
  }
  return found;
}

function detectCssEntries(project, viewerConfig, designSystem) {
  const explicit = [
    ...toArray(viewerConfig.css),
    ...toArray(viewerConfig.cssEntry),
    ...toArray(viewerConfig.cssEntries),
  ].map((entry) => resolveProjectPath(project, entry));
  if (explicit.length > 0) return { entries: explicit.filter(fileExists), source: "explicit config" };

  const roots = sourceRoots(project, designSystem.path);
  const mainImports = cssImportsFromMainEntries(project, roots);
  if (mainImports.length > 0) return { entries: uniq(mainImports), source: "app entry imports" };

  const common = commonCssEntries(roots);
  if (common.length > 0) {
    const designTokens = designSystem.tokens
      ? resolveProjectPath(project, designSystem.tokens)
      : null;
    const ordered = designTokens && fileExists(designTokens)
      ? [designTokens, ...common.filter((entry) => resolve(entry) !== resolve(designTokens))]
      : common;
    return { entries: uniq(ordered), source: "common CSS names" };
  }

  if (designSystem.tokens) {
    const tokens = resolveProjectPath(project, designSystem.tokens);
    if (fileExists(tokens)) return { entries: [tokens], source: "designSystem.tokens" };
  }

  return { entries: [], source: "none" };
}

function cssReferencesTailwind(entries) {
  return entries.some((entry) => /@import\s+["']tailwindcss["']|@tailwind|@config|@source/.test(readText(entry)));
}

function resolvePackageJson(project, packageName) {
  try {
    const projectRequire = createRequire(join(project, "package.json"));
    return projectRequire.resolve(`${packageName}/package.json`);
  } catch {
    try {
      const projectRequire = createRequire(join(project, "package.json"));
      let current = dirname(projectRequire.resolve(packageName));
      const root = parse(current).root;
      while (current && current !== root) {
        const pkg = join(current, "package.json");
        if (fileExists(pkg)) return pkg;
        current = dirname(current);
      }
    } catch {
      return null;
    }
    return null;
  }
}

function packageVersion(project, packageName) {
  const pkgPath = resolvePackageJson(project, packageName);
  if (!pkgPath) return null;
  try {
    return JSON.parse(readText(pkgPath)).version ?? null;
  } catch {
    return null;
  }
}

function hasPostcssConfig(project) {
  return POSTCSS_CONFIG_NAMES.some((name) => fileExists(join(project, name)));
}

function detectToolchain(project, viewerConfig, cssEntries) {
  const hint = viewerConfig.toolchain ?? viewerConfig.cssToolchain;
  if (hint && hint !== "auto") {
    if (hint === "tailwind-v3") return { toolchain: "tailwind-v3", postcssConfigDir: project };
    if (hint === "tailwind-v4") return { toolchain: "tailwind-v4", postcssConfigDir: null };
    return { toolchain: "none", postcssConfigDir: null };
  }

  const tailwindVersion = packageVersion(project, "tailwindcss");
  const major = tailwindVersion ? Number(tailwindVersion.split(".")[0]) : 0;
  const hasTailwindVite = Boolean(resolvePackageJson(project, "@tailwindcss/vite"));
  const referencesTailwind = cssReferencesTailwind(cssEntries);

  if (major >= 4 && hasTailwindVite && referencesTailwind) {
    return { toolchain: "tailwind-v4", postcssConfigDir: null };
  }
  if (major === 3 && hasPostcssConfig(project)) {
    return { toolchain: "tailwind-v3", postcssConfigDir: project };
  }
  return { toolchain: "none", postcssConfigDir: null };
}

function jsString(value) {
  return JSON.stringify(value);
}

function writeGeneratedViewerFiles(project, viewerDir) {
  const jsonConfig = parseJsonConfig(project);
  const yaml = parseSimpleYaml(project);
  const viewerConfig = { ...(yaml.viewer ?? {}), ...(jsonConfig.viewer ?? jsonConfig) };
  const designSystem = { ...(yaml.designSystem ?? {}) };
  const explicitStoryGlobs = [
    ...toArray(viewerConfig.storyGlobs),
    ...toArray(viewerConfig.stories),
  ];
  const storyGlobs = detectStoryGlobs(project, explicitStoryGlobs);
  const css = detectCssEntries(project, viewerConfig, designSystem);
  const toolchain = detectToolchain(project, viewerConfig, css.entries);

  const storyLines = (storyGlobs.length > 0 ? storyGlobs : DEFAULT_STORY_GLOBS)
    .map((glob) => storyGlobFromProject(project, viewerDir, glob))
    .map(
      (glob) =>
        `  ...import.meta.glob<Record<string, unknown>>(${jsString(glob)}, { eager: true }),`,
    );
  writeFileSync(
    join(viewerDir, "story-globs.generated.ts"),
    [
      'import type { GlobSource } from "./discovery.js";',
      "",
      "export const storyGlobs = {",
      ...storyLines,
      "} as GlobSource;",
      "",
    ].join("\n"),
  );

  const styleLines = css.entries.map(
    (entry) => `import ${jsString(viewerImportPath(viewerDir, entry))};`,
  );
  writeFileSync(
    join(viewerDir, "target-styles.generated.ts"),
    [
      "// Generated by launch.mjs from target project CSS detection.",
      ...styleLines,
      "",
    ].join("\n"),
  );

  writeFileSync(
    join(viewerDir, "viewer-runtime.generated.json"),
    `${JSON.stringify(
      {
        projectRoot: project,
        toolchain: toolchain.toolchain,
        postcssConfigDir: toolchain.postcssConfigDir,
      },
      null,
      2,
    )}\n`,
  );

  log(`story globs: ${storyGlobs.join(", ") || DEFAULT_STORY_GLOBS.join(", ")}`);
  if (css.entries.length === 0) {
    loud("no target CSS entry detected; stories will render without app styles");
  } else {
    log(`CSS entries (${css.source}): ${css.entries.map((entry) => slash(relative(project, entry))).join(", ")}`);
  }
  log(`CSS toolchain: ${toolchain.toolchain}`);
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

  const project = realpathSync(opts.project);
  const { port } = opts;
  const url = `http://localhost:${port}`;

  // 1. Sync the viewer into the project, unless we're already inside it.
  const destViewer = join(project, "viewer");
  const runningFromProject = resolve(destViewer) === resolve(SELF_DIR);
  if (!runningFromProject) {
    log(`${existsSync(destViewer) ? "syncing" : "copying"} viewer → ${destViewer}`);
    mkdirSync(project, { recursive: true });
    cpSync(SELF_DIR, destViewer, {
      recursive: true,
      filter: (src) =>
        !/(^|[\\/])(node_modules|dist|\.vite|\.annotations)([\\/]|$)/.test(src),
    });
  }
  const viewerDir = runningFromProject ? SELF_DIR : destViewer;

  // 2. Generate target-specific static imports before Vite evaluates the app.
  writeGeneratedViewerFiles(project, viewerDir);

  // 3. Already running? Reuse it after refreshing generated files for HMR.
  if (await probe(port)) {
    log(`already running — refreshed viewer files and reusing ${url}`);
    process.stdout.write(url + "\n");
    return 0;
  }

  // 4. Install the toolchain (once).
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

  // 5. Start the dev server, detached, so it outlives this launcher.
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

  // 6. Wait until it answers, then hand off the URL.
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
