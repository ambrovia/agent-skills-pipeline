import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pipeline = readFileSync(new URL('../skills/pipeline/SKILL.md', import.meta.url), 'utf8');
const config = readFileSync(new URL('../pipeline.config.example.yml', import.meta.url), 'utf8');

test('leaf integration preflights commit paths before cherry-pick', () => {
  const preflight = pipeline.indexOf('**Preflight before cherry-pick.**');
  const cherryPick = pipeline.indexOf('cherry-picks the preflighted source commits');
  assert(preflight >= 0 && cherryPick > preflight);
  assert.match(pipeline, /Every changed path must match an exact `file:/);
});

test('plan invalidation rebuilds from base and preserves the old tip', () => {
  assert.match(pipeline, /From `integration\.json\.baseCommit`/);
  assert.match(pipeline, /Do not replay invalid receipts or their code/);
  assert.match(pipeline, /attempt-<n>-old/);
});

test('leaf retries use attempt-specific identities and bootstrap first', () => {
  assert.match(pipeline, /leaf\/<leaf-id>\/attempt-<n>/);
  assert.match(pipeline, /Bootstrap every new leaf worktree/);
});

test('mechanical leaves do not promise an unmapped model role', () => {
  assert.doesNotMatch(config, /^\s*mechanical:/m);
  assert.doesNotMatch(pipeline, /models\.mechanical/);
});
