#!/usr/bin/env node
// Pipeline-state snapshot — one-call digest of an item's current state.
// Usage: node scripts/pipeline-snapshot.mjs [item-id]   (run from the repo root)
// A read-only view over the file-backed state in .pipeline/work/<id>/: dials,
// status, gates, verdicts, artifact pointers, delta pointer, next action.
// Replaces the folder scan an agent otherwise needs to get up to speed.
//
// Artifacts come from progress.json's `artifacts` registry, because structure is
// agreed per item and this tool cannot know it in advance. The conventional
// names below are only a fallback for items that never recorded a registry.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FALLBACK_ARTIFACTS = [
  ['plan.md', 'the plan — what is wanted, how it works, how we work on it'],
  ['design/approved.md', 'approved design'],
  ['architecture.md', 'architecture'],
  ['feasibility.md', 'feasibility'],
  ['review.md', 'review findings'],
  ['retro.jsonl', 'retro'],
  ['progress.json', 'state'],
];

// registry -> [path, role][]; accepts {path: role}, [{path, role}], or ["path"].
function artifactList(progress) {
  const registry = progress.artifacts;
  if (registry && !Array.isArray(registry) && typeof registry === 'object') {
    return Object.entries(registry).map(([path, role]) => [path, String(role ?? '')]);
  }
  if (Array.isArray(registry) && registry.length > 0) {
    return registry
      .map((entry) => (typeof entry === 'string'
        ? [entry, '']
        : [entry?.path, String(entry?.role ?? entry?.for ?? '')]))
      .filter(([path]) => typeof path === 'string' && path);
  }
  return FALLBACK_ARTIFACTS;
}

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

function resolveItem(workRoot, id) {
  if (id) {
    if (!existsSync(join(workRoot, id))) fail(`no item "${id}" under .pipeline/work/`);
    return id;
  }
  let entries = [];
  try {
    entries = readdirSync(workRoot).filter((name) => statSync(join(workRoot, name)).isDirectory());
  } catch {
    /* no .pipeline/work yet */
  }
  if (entries.length === 0) fail('no items under .pipeline/work/');
  if (entries.length > 1) fail(`multiple items — pass one of: ${entries.join(', ')}`);
  return entries[0];
}

function verdictLines(progress, dir) {
  const evaluations = progress.evaluations ?? progress.verdicts ?? [];
  const lines = Array.isArray(evaluations)
    ? evaluations
      .filter((entry) => entry && typeof entry === 'object' && entry.verdict)
      .map((entry) => `  ${entry.phase ?? 'review'}: ${entry.verdict}`)
    : [];
  if (lines.length > 0) return lines;
  const review = readText(join(dir, 'review.md'));
  const marked = (review ?? '').split('\n').filter((line) => /verdict\s*[:\-]/i.test(line));
  return marked.length > 0 ? [`  ${marked[marked.length - 1].trim()}`] : [];
}

function digest(workRoot, id) {
  const dir = join(workRoot, id);
  const progress = readJson(join(dir, 'progress.json')) ?? {};
  const lines = [`item: ${id}`];

  const heading = (readText(join(dir, 'plan.md')) ?? '').split('\n').find((line) => /^#\s+/.test(line));
  if (heading) lines.push(`title: ${heading.replace(/^#\s+/, '').trim()}`);
  if (progress.phase) lines.push(`phase: ${progress.phase}`);
  if (progress.status) lines.push(`status: ${progress.status}`);

  const dials = progress.dials;
  if (dials && typeof dials === 'object') {
    lines.push(`dials: ${Object.entries(dials).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  }

  const gates = progress.gates;
  if (Array.isArray(gates) && gates.length > 0) {
    lines.push('gates:', ...gates.map((gate) => (typeof gate === 'string'
      ? `  ${gate}`
      : `  ${gate?.name ?? 'gate'} — ${gate?.passed ? 'passed' : 'open'}`)));
  }

  const verdicts = verdictLines(progress, dir);
  if (verdicts.length > 0) lines.push('verdicts:', ...verdicts);
  if (typeof progress.openBlocking === 'number') lines.push(`open-blocking: ${progress.openBlocking}`);

  const agents = progress.agents ?? progress.agentsSpawned;
  if (agents && typeof agents === 'object') {
    lines.push(`agents: ${Object.entries(agents).map(([role, count]) => `${role} ${count}`).join(', ')}`);
  }

  const present = artifactList(progress).filter(([path]) => existsSync(join(dir, path)));
  if (present.length > 0) {
    lines.push('artifacts:', ...present.map(([path, role]) => (role ? `  ${path} — ${role}` : `  ${path}`)));
  }

  const since = progress.since ?? progress.delta;
  if (since) lines.push(`delta: since ${since}`);
  const next = progress.next ?? progress.nextAction;
  if (next) lines.push(`next: ${next}`);

  return lines.join('\n');
}

const workRoot = join(process.cwd(), '.pipeline', 'work');
const id = resolveItem(workRoot, process.argv[2]);
process.stdout.write(`${digest(workRoot, id)}\n`);
