import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('personas enforce the WP ID boundary', () => {
  for (const persona of [
    'personas/pipeline-planner.md',
    'personas/pipeline-builder.md',
    'personas/pipeline-reviewer.md',
  ]) {
    const source = read(persona);
    assert.match(source, /WP IDs .*`\.pipeline\/\*\*`/);
    assert.match(source, /exact or derived/);
  }
});

test('workflow examples do not put work-package IDs in VCS metadata', () => {
  assert.doesNotMatch(read('skills/ship/SKILL.md'), /git commit -m "[^"]*<id>/i);
  assert.doesNotMatch(read('skills/work-planning/SKILL.md'), /Message: `[^`]*<ID>/);
  assert.doesNotMatch(read('skills/pipeline/SKILL.md'), /pipeline\/<id>\//);
});
