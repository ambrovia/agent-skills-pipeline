import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const script = resolve(new URL('..', import.meta.url).pathname, 'scripts/pipeline-snapshot.mjs');

function fixtureRoot() {
  return mkdtempSync(join(tmpdir(), 'pipeline-snapshot-'));
}

function makeWp(root, id, files = {}) {
  for (const [name, content] of Object.entries(files)) {
    const path = join(root, '.pipeline', 'work', id, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

function run(root, ...args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
}

const FULL = {
  'plan.md': '# Fix login race condition\n\nOutcomes...\n',
  'requirements.md': 'value and scope\n',
  'architecture.md': 'contracts and tasks\n',
  'review.md': 'findings\n\nVerdict: NOT DONE\n',
  'progress.json': JSON.stringify({
    phase: 'build',
    status: 'in-progress',
    evaluations: [
      { phase: 'review', attempt: 1, verdict: 'NOT DONE' },
      { phase: 'review', attempt: 2, verdict: 'DONE' },
    ],
    openBlocking: 1,
    agents: { builder: 2, reviewer: 1 },
    since: 'a1b2c3d',
    next: 'builder retry on blocking findings',
  }),
};

test('full fixture produces the digest', () => {
  const root = fixtureRoot();
  makeWp(root, 'demo', FULL);
  const result = run(root, 'demo');
  assert.equal(result.status, 0);
  for (const line of [
    'wp: demo',
    'title: Fix login race condition',
    'phase: build',
    'status: in-progress',
    'review attempt 2: DONE',
    'open-blocking: 1',
    'agents: builder 2, reviewer 1',
    'requirements.md — requirements',
    'architecture.md — architecture',
    'review.md — review findings',
    'delta: since a1b2c3d',
    'next: builder retry on blocking findings',
  ]) {
    assert.match(result.stdout, new RegExp(`^\\s*${line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'), `missing line: ${line}`);
  }
});

test('auto-discovers a single work package', () => {
  const root = fixtureRoot();
  makeWp(root, 'solo', { 'plan.md': '# Solo\n' });
  const result = run(root);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^wp: solo$/m);
  assert.match(result.stdout, /^title: Solo$/m);
});

test('ambiguous discovery lists candidates and fails', () => {
  const root = fixtureRoot();
  makeWp(root, 'one', { 'plan.md': '# One\n' });
  makeWp(root, 'two', { 'plan.md': '# Two\n' });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /one/);
  assert.match(result.stderr, /two/);
});

test('unknown work package id fails cleanly', () => {
  const root = fixtureRoot();
  makeWp(root, 'demo', { 'plan.md': '# Demo\n' });
  const result = run(root, 'missing');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing/);
});

test('degrades gracefully with only plan.md', () => {
  const root = fixtureRoot();
  makeWp(root, 'bare', { 'plan.md': '# Bare bones\n' });
  const result = run(root, 'bare');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^title: Bare bones$/m);
  assert.doesNotMatch(result.stdout, /verdicts:/);
  assert.doesNotMatch(result.stdout, /delta:/);
});

test('malformed progress.json does not break the digest', () => {
  const root = fixtureRoot();
  makeWp(root, 'broken', { 'plan.md': '# Broken\n', 'progress.json': 'not json' });
  const result = run(root, 'broken');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^wp: broken$/m);
});

test('falls back to review.md for the latest verdict', () => {
  const root = fixtureRoot();
  makeWp(root, 'verdict', {
    'plan.md': '# Verdict\n',
    'review.md': 'findings\n\nVerdict: NOT DONE\n\nlater\n\nVerdict: DONE\n',
  });
  const result = run(root, 'verdict');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Verdict: DONE/);
  assert.doesNotMatch(result.stdout, /Verdict: NOT DONE/);
});

test('no work packages fails cleanly', () => {
  const root = fixtureRoot();
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no work packages/);
});
