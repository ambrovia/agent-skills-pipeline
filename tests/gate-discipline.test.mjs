import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pipeline = readFileSync(
  new URL('../skills/pipeline/SKILL.md', import.meta.url),
  'utf8',
);

// Gates are negotiated per item rather than fixed, so there is no ordering to assert.
// What must survive is the anti-churn rule: once something is in front of the maintainer,
// it stops moving.
test('presented artifacts are not revised or re-critiqued while parked or after approval', () => {
  assert.match(
    pipeline,
    /do not revise or re-critique the presented artifacts while\s+parked or after approval/i,
  );
});

test('the agent may never run with no gate ahead of it', () => {
  assert.match(pipeline, /plan at least as far as the next gate/i);
});
