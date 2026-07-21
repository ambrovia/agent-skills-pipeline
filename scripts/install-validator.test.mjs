import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');

for (const installer of ['install-cursor.sh', 'install-opencode.sh']) {
  test(`${installer} installs the task DAG validator with the architecture skill`, () => {
    const target = mkdtempSync(join(tmpdir(), 'pipeline-validator-install-'));
    try {
      execFileSync('bash', [join(root, 'scripts', installer), target], { stdio: 'pipe' });
      const host = installer.includes('cursor') ? '.cursor' : '.opencode';
      const validator = join(target, host, 'skills', 'architecture', 'validate-task-dag.mjs');
      assert.equal(existsSync(validator), true, validator);
      const architecture = join(target, 'architecture.md');
      writeFileSync(architecture, '```json\n{"technicalTaskDag":{"version":1,"leaves":[{"id":"build","title":"Build","kind":"implementation","dependsOn":[],"owns":["file:src/build.ts"],"consumes":[],"acceptanceCriteria":["AC-1"],"context":{"files":["src/build.ts"],"sections":["architecture.md#Contracts"]},"verify":"npm test","parallel":false,"independence":""}]}}\n```\n');
      const output = execFileSync('node', [validator, architecture], { encoding: 'utf8' });
      assert.match(output, /task-dag valid: 1 leaf/);
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });
}
