#!/usr/bin/env node
// Skill-load injection — when a pipeline skill loads, inject fresh mechanical
// check results, the WP diff, and the critiqued artifacts, so agents start
// with evidence instead of spending round trips fetching it.
// Usage: skill-load-inject.mjs <claude|cursor|gemini|copilot|codex|opencode> [skill-name]
// Envelope formats read the tool payload on stdin; opencode takes the skill
// name as an argument and prints plain text. Guard discipline: a skill load
// must never break — every failure degrades to silence.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK_DIR = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = join(HOOK_DIR, '..');
// Project installers drop the snapshot next to this hook rather than under scripts/.
const SNAPSHOT_CANDIDATES = [
  join(PLUGIN_ROOT, 'scripts', 'pipeline-snapshot.mjs'),
  join(HOOK_DIR, 'pipeline-snapshot.mjs'),
];
const SKILL_TOOL = /^skill$/i;
const MAX_LINES = positiveInt(process.env.PIPELINE_INJECT_MAX_LINES, 300);
const CHECK_TIMEOUT_MS = positiveInt(process.env.PIPELINE_CHECK_TIMEOUT_MS, 45_000);

const DIGEST_SKILLS = new Set([
  'refine', 'design', 'architecture', 'ship', 'review', 'write-code', 'write-tests',
  'refine-critique', 'architecture-critique', 'design-critique',
]);

const EXTRA = {
  review: { checks: true, diff: true },
  'write-code': { checks: true, checksNote: 'baseline, ran before this session\'s edits' },
  'write-tests': { checks: true, checksNote: 'baseline, ran before this session\'s edits' },
  'refine-critique': { artifacts: ['plan.md', 'requirements.md'] },
  'architecture-critique': { artifacts: ['plan.md', 'architecture.md'] },
  'design-critique': { artifacts: ['plan.md', 'design/approved.md'] },
};

function positiveInt(raw, fallback) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function pick(payload, keys) {
  for (const key of keys) if (payload?.[key] !== undefined) return payload[key];
  return undefined;
}

function skillName(format) {
  if (format === 'opencode') return normalizeSkill(process.argv[3] ?? '');
  const payload = JSON.parse(readFileSync(0, 'utf8'));
  const tool = String(pick(payload, ['tool_name', 'toolName', 'tool']) ?? '');
  if (!SKILL_TOOL.test(tool)) return '';
  const input = pick(payload, ['tool_input', 'toolInput', 'parameters', 'input']) ?? {};
  return normalizeSkill(String(pick(input, ['skill', 'name', 'command']) ?? ''));
}

function normalizeSkill(raw) {
  return raw.replace(/^\//, '').split(/\s/)[0].toLowerCase();
}

// Minimal scalar read: a quoted value keeps every character (commands contain
// '#'), an unquoted one stops at the comment marker.
function scalar(raw) {
  const match = raw.trim().match(/^(?:"([^"]*)"|'([^']*)'|([^#]*?))\s*(?:#.*)?$/);
  if (!match) return null;
  return (match[1] ?? match[2] ?? match[3] ?? '').trim() || null;
}

function readConfig(root) {
  let verify = null;
  let preSpawn = null;
  let inChecks = false;
  try {
    for (const line of readFileSync(join(root, 'pipeline.config.yml'), 'utf8').split('\n')) {
      if (/^checks:\s*$/.test(line)) { inChecks = true; continue; }
      if (inChecks && /^\S/.test(line)) inChecks = false;
      let match = line.match(/^verify:\s*(.*)$/);
      if (match) verify = scalar(match[1]);
      match = line.match(/^\s+preSpawn:\s*(.*)$/);
      if (match && inChecks) preSpawn = scalar(match[1]);
    }
  } catch { /* no config — checks skipped */ }
  return { verify, preSpawn };
}

function findActiveWp(root) {
  const workRoot = join(root, '.pipeline', 'work');
  let entries = [];
  try {
    entries = readdirSync(workRoot).filter((name) => statSync(join(workRoot, name)).isDirectory());
  } catch {
    return null;
  }
  const active = [];
  for (const name of entries) {
    const dir = join(workRoot, name);
    let progress = null;
    try { progress = JSON.parse(readFileSync(join(dir, 'progress.json'), 'utf8')); } catch { /* absent */ }
    const status = String(progress?.status ?? '');
    if (status === 'done') continue;
    active.push({ name, mtime: touchedAt(dir) });
  }
  if (active.length === 0) return null;
  active.sort((a, b) => b.mtime - a.mtime);
  return active[0].name;
}

// State age is progress.json's mtime. A directory's mtime only moves when
// entries are added or removed — an in-place progress write never registers,
// while this hook's own checks-latest.log write does — so it is the fallback
// for a work package that has no progress file yet, not the primary signal.
function touchedAt(dir) {
  for (const path of [join(dir, 'progress.json'), dir]) {
    try { return statSync(path).mtimeMs; } catch { /* absent */ }
  }
  return 0;
}

function cap(text, label) {
  const lines = text.split('\n');
  if (lines.length <= MAX_LINES) return text;
  return `${lines.slice(0, MAX_LINES).join('\n')}\n… [truncated — full: ${label}]`;
}

function digest(root, wpId) {
  const script = SNAPSHOT_CANDIDATES.find((path) => existsSync(path));
  if (!script) return null;
  const result = spawnSync(process.execPath, [script, wpId], {
    cwd: root, encoding: 'utf8', timeout: 10_000,
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

// Stamps check results against the tree they ran on, so an agent can tell
// whether a green predates its own edits.
function treeState(root) {
  const head = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8', timeout: 5_000 });
  if (head.status !== 0) return null;
  const dirty = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8', timeout: 10_000 });
  const suffix = dirty.status === 0 && (dirty.stdout ?? '').trim() !== '' ? '+dirty' : '';
  return `${head.stdout.trim()}${suffix}`;
}

function runChecks(root, command, wpDir) {
  const cachePath = join(wpDir, 'checks-latest.log');
  const result = spawnSync(command, {
    shell: true, cwd: root, encoding: 'utf8', timeout: CHECK_TIMEOUT_MS, maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error || result.status === null) {
    try {
      return { text: readFileSync(cachePath, 'utf8').trim(), stale: true, exit: null };
    } catch {
      return null;
    }
  }
  const text = `${(result.stdout ?? '') + (result.stderr ?? '')}`.trim() || '(no output)';
  try {
    mkdirSync(wpDir, { recursive: true });
    writeFileSync(cachePath, `${text}\n`);
  } catch { /* cache is best-effort */ }
  return { text, stale: false, exit: result.status };
}

function diffSince(root, since) {
  if (!/^[\w.][\w.-]{0,63}$/.test(since)) return null;
  const result = spawnSync('git', ['diff', since, '--'], {
    cwd: root, encoding: 'utf8', timeout: 15_000, maxBuffer: 4 * 1024 * 1024,
  });
  if (result.status !== 0) return null;
  const diff = (result.stdout ?? '').trim();
  if (diff === '') return { text: '(no changes)', lines: 0 };
  const lines = diff.split('\n').length;
  if (lines <= MAX_LINES) return { text: diff, lines };
  const stat = spawnSync('git', ['diff', '--stat', since, '--'], { cwd: root, encoding: 'utf8', timeout: 15_000 });
  return {
    text: `${(stat.stdout ?? '').trim()}\n… [diff too large to inject — run: git diff ${since}]`,
    lines,
  };
}

function buildInjection(format) {
  if (process.env.PIPELINE_SKILL_INJECT === 'off') return null;
  const skill = skillName(format);
  if (!DIGEST_SKILLS.has(skill)) return null;

  const root = process.cwd();
  const wpId = findActiveWp(root);
  if (!wpId) return null;
  const wpDir = join(root, '.pipeline', 'work', wpId);
  const extra = EXTRA[skill] ?? {};
  const sections = [`[pipeline injection — skill: ${skill}, wp: ${wpId}]`];

  const state = digest(root, wpId);
  if (state) sections.push('## state', state);

  if (extra.checks) {
    const { verify, preSpawn } = readConfig(root);
    const command = preSpawn ?? verify;
    if (command) {
      const outcome = runChecks(root, command, wpDir);
      if (outcome) {
        const staleness = outcome.stale ? ', STALE cache, live run timed out' : '';
        const exit = outcome.exit === null ? '?' : outcome.exit;
        const tree = treeState(root);
        const marks = [`exit ${exit}`, tree ? `tree ${tree}` : null, extra.checksNote ?? null]
          .filter(Boolean).join(', ');
        sections.push(`## checks — ${command} (${marks}${staleness})`, cap(outcome.text, 'rerun the check command'));
      }
    }
  }

  if (extra.diff) {
    let since = null;
    try { since = JSON.parse(readFileSync(join(wpDir, 'progress.json'), 'utf8')).since; } catch { /* absent */ }
    if (since) {
      const diff = diffSince(root, String(since));
      if (diff) sections.push(`## diff since ${since} (${diff.lines} lines)`, cap(diff.text, `git diff ${since}`));
    }
  }

  for (const artifact of extra.artifacts ?? []) {
    const path = join(wpDir, artifact);
    if (!existsSync(path)) continue;
    try {
      sections.push(
        `## ${artifact} (.pipeline/work/${wpId}/${artifact} — already in context, do not re-read)`,
        cap(readFileSync(path, 'utf8').trim(), path),
      );
    } catch { /* unreadable artifact — skip */ }
  }

  return sections.length > 1 ? sections.join('\n\n') : null;
}

function formatMessage(format, message) {
  if (format === 'cursor') return { additional_context: message };
  if (format === 'gemini') return { hookSpecificOutput: { additionalContext: message } };
  if (format === 'copilot') return { additionalContext: message };
  return { hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: message } };
}

function main() {
  const format = process.argv[2] ?? 'claude';
  if (format === 'codex') return;
  const message = buildInjection(format);
  if (!message) return;
  if (format === 'opencode') {
    process.stdout.write(`${message}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(formatMessage(format, message))}\n`);
}

try {
  main();
} catch {
  // A guard must never break a skill load.
}
