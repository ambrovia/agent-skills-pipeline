import assert from 'node:assert/strict';
import test from 'node:test';

import { extractTaskDag, validateTaskDag } from './validate-task-dag.mjs';

const leaf = (overrides = {}) => ({
  id: 'build',
  title: 'Build the change',
  kind: 'implementation',
  dependsOn: [],
  owns: ['file:src/change.ts'],
  consumes: [],
  acceptanceCriteria: ['AC-1'],
  context: { files: ['src/change.ts'], sections: ['architecture.md#Contracts'] },
  verify: 'npm test',
  parallel: false,
  ...overrides,
});

test('accepts the default single-leaf DAG', () => {
  assert.deepEqual(validateTaskDag({ version: 1, leaves: [leaf()] }), []);
});

test('extracts the named DAG and ignores unrelated JSON fences', () => {
  const source = '```json\n{"example":true}\n```\n```json\n{"technicalTaskDag":{"version":1,"leaves":[]}}\n```';
  assert.equal(extractTaskDag(source).version, 1);
});

test('rejects cycles and unknown dependencies', () => {
  const errors = validateTaskDag({ version: 1, leaves: [
    leaf({ id: 'a', dependsOn: ['b'], owns: ['contract:a'] }),
    leaf({ id: 'b', dependsOn: ['a', 'missing'], owns: ['contract:b'] }),
  ] });
  assert(errors.some((error) => error.includes('cycle')));
  assert(errors.some((error) => error.includes('unknown leaf missing')));
});

test('rejects duplicate ownership', () => {
  const errors = validateTaskDag({ version: 1, leaves: [
    leaf({ id: 'a' }),
    leaf({ id: 'b' }),
  ] });
  assert(errors.some((error) => error.includes('owned by both')));
});

test('requires an independence reason for a parallel leaf', () => {
  const errors = validateTaskDag({ version: 1, leaves: [leaf({ parallel: true })] });
  assert(errors.some((error) => error.includes('independence')));
});

test('requires a dependency on the owner of a consumed surface', () => {
  const errors = validateTaskDag({ version: 1, leaves: [
    leaf({ id: 'schema', owns: ['contract:Record'] }),
    leaf({ id: 'api', owns: ['route:GET /records'], consumes: ['contract:Record'] }),
  ] });
  assert(errors.some((error) => error.includes('without depending')));
});
