import assert from 'node:assert/strict';
import test from 'node:test';

import { extractTaskDag, validateTaskDag } from '../skills/architecture/validate-task-dag.mjs';

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

test('rejects empty or unnamespaced ownership', () => {
  assert(validateTaskDag({ version: 1, leaves: [leaf({ owns: [] })] }).some((error) => error.includes('at least one')));
  assert(validateTaskDag({ version: 1, leaves: [leaf({ owns: ['src/file.ts'] })] }).some((error) => error.includes('namespaced')));
});

test('rejects absolute, traversal, and control-character context paths', () => {
  for (const path of ['/tmp/file', '../secret', 'src/../secret', 'src/bad\nname']) {
    const errors = validateTaskDag({ version: 1, leaves: [leaf({ context: { files: [path], sections: [] } })] });
    assert(errors.some((error) => error.includes('unsafe path')), path);
  }
});

test('rejects traversal in a section pointer path', () => {
  const errors = validateTaskDag({
    version: 1,
    leaves: [leaf({ context: { files: [], sections: ['../architecture.md#Contracts'] } })],
  });
  assert(errors.some((error) => error.includes('context.sections contains unsafe path')));
});

test('rejects unsafe file ownership paths', () => {
  const errors = validateTaskDag({ version: 1, leaves: [leaf({ owns: ['file:../../outside'] })] });
  assert(errors.some((error) => error.includes('unsafe repository path')));
});

test('requires path ownership to end in a directory slash', () => {
  const errors = validateTaskDag({ version: 1, leaves: [leaf({ owns: ['path:src/generated'] })] });
  assert(errors.some((error) => error.includes('must end in /')));
});

test('rejects normalized file/file overlap across leaves', () => {
  const errors = validateTaskDag({ version: 1, leaves: [
    leaf({ id: 'a', owns: ['file:src/./same.ts'] }),
    leaf({ id: 'b', owns: ['file:src/same.ts'] }),
  ] });
  assert(errors.some((error) => error.includes('ownership overlaps')));
});

for (const [name, first, second] of [
  ['parent path before child path', 'path:src/', 'path:src/generated/'],
  ['child path before parent path', 'path:src/generated/', 'path:src/'],
  ['path before contained file', 'path:src/generated/', 'file:src/generated/out.ts'],
  ['contained file before path', 'file:src/generated/out.ts', 'path:src/generated/'],
]) {
  test(`rejects ${name} across leaves`, () => {
    const errors = validateTaskDag({ version: 1, leaves: [
      leaf({ id: 'a', owns: [first] }),
      leaf({ id: 'b', owns: [second] }),
    ] });
    assert(errors.some((error) => error.includes('ownership overlaps')));
  });
}

test('rejects backslash-rooted and UNC context paths', () => {
  for (const path of ['\\rooted\\file.ts', '\\\\server\\share\\file.ts']) {
    const errors = validateTaskDag({ version: 1, leaves: [leaf({ context: { files: [path], sections: [] } })] });
    assert(errors.some((error) => error.includes('unsafe path')), path);
  }
});

test('rejects backslash-rooted and UNC ownership paths', () => {
  for (const surface of ['file:\\rooted\\file.ts', 'path:\\\\server\\share\\']) {
    const errors = validateTaskDag({ version: 1, leaves: [leaf({ owns: [surface] })] });
    assert(errors.some((error) => error.includes('unsafe repository path')), surface);
  }
});
