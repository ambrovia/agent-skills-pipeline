#!/usr/bin/env node
// Pipeline-state snapshot — one-call digest of a work package's current state.
// Usage: node scripts/pipeline-snapshot.mjs [wp-id]   (run from the repo root)
// A read-only view over the file-backed state in .pipeline/work/<id>/: phase,
// status, verdicts, open items, artifact pointers, delta pointer, next action.
// Replaces the folder scan an agent otherwise needs to get up to speed.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ARTIFACTS = [
  ['plan.md', 'plan'],
  ['requirements.md', 'requirements'],
  ['design/approved.md', 'approved design'],
  ['architecture.md', 'architecture'],
  ['feasibility.md', 'feasibility'],
  ['review.md', 'review findings'],
  ['retro.jsonl', 'retro'],
  ['progress.json', 'state'],
];

function readJson(path) {
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'));
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

function readText(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function fail(message) {
  process.stderr.write(`snapshot: ${message}\n`);
  process.exit(1);
}

function resolveWp(workRoot, id) {
  if (id) {
    if (!existsSync(join(workRoot, id))) fail(`no work package "${id}" under .pipeline/work/`);
    return id;
  }
  let entries = [];
  try {
    entries = readdirSync(workRoot).filter((name) => statSync(join(workRoot, name)).isDirectory());
  } catch {
    /* no .pipeline/work yet */
  }
  if (entries.length === 0) fail('no work packages under .pipeline/work/');
  if (entries.length > 1) fail(`multiple work packages — pass one of: ${entries.join(', ')}`);
  return entries[0];
}

function verdictLines(progress, dir) {
  const evaluations = progress.evaluations ?? progress.verdicts ?? [];
  const lines = Array.isArray(evaluations)
    ? evaluations
      .filter((entry) => entry && typeof entry === 'object' && entry.verdict)
      .map((entry) => `  ${entry.phase ?? 'review'} attempt ${entry.attempt ?? '?'}: ${entry.verdict}`)
    : [];
  if (lines.length > 0) return lines;
  const review = readText(join(dir, 'review.md'));
  const marked = (review ?? '').split('\n').filter((line) => /verdict\s*[:\-]/i.test(line));
  return marked.length > 0 ? [`  ${marked[marked.length - 1].trim()}`] : [];
}

function digest(workRoot, id) {
  const dir = join(workRoot, id);
  const progress = readJson(join(dir, 'progress.json')) ?? {};
  const lines = [`wp: ${id}`];

  const heading = (readText(join(dir, 'plan.md')) ?? '').split('\n').find((line) => /^#\s+/.test(line));
  if (heading) lines.push(`title: ${heading.replace(/^#\s+/, '').trim()}`);
  if (progress.phase) lines.push(`phase: ${progress.phase}`);
  if (progress.status) lines.push(`status: ${progress.status}`);

  const verdicts = verdictLines(progress, dir);
  if (verdicts.length > 0) lines.push('verdicts:', ...verdicts);
  if (typeof progress.openBlocking === 'number') lines.push(`open-blocking: ${progress.openBlocking}`);

  const agents = progress.agents ?? progress.agentsSpawned;
  if (agents && typeof agents === 'object') {
    lines.push(`agents: ${Object.entries(agents).map(([role, count]) => `${role} ${count}`).join(', ')}`);
  }

  const present = ARTIFACTS.filter(([path]) => existsSync(join(dir, path)));
  if (present.length > 0) lines.push('artifacts:', ...present.map(([path, role]) => `  ${path} — ${role}`));

  const since = progress.since ?? progress.delta;
  if (since) lines.push(`delta: since ${since}`);
  const next = progress.next ?? progress.nextAction;
  if (next) lines.push(`next: ${next}`);

  return lines.join('\n');
}

const workRoot = join(process.cwd(), '.pipeline', 'work');
const id = resolveWp(workRoot, process.argv[2]);
process.stdout.write(`${digest(workRoot, id)}\n`);
