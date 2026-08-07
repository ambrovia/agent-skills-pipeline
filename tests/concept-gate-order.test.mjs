import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pipeline = readFileSync(
  new URL('../skills/pipeline/SKILL.md', import.meta.url),
  'utf8',
);

test('concept critique completes before human approval', () => {
  const critiqueLoop = pipeline.indexOf('completing each loop before the concept gate');
  const approvalGate = pipeline.indexOf('The concept gate is mandatory');

  assert.notEqual(critiqueLoop, -1);
  assert.notEqual(approvalGate, -1);
  assert.ok(critiqueLoop < approvalGate);
});

test('presented concepts are not re-critiqued while awaiting or after approval', () => {
  assert.match(
    pipeline,
    /do not revise or re-critique the presented artifacts while parked or after approval/,
  );
});
