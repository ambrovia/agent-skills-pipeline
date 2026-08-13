#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCodexRollout } from './parse-codex.mjs';
import { analyzeSession } from './analyze.mjs';

const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outPath = outFlag >= 0 ? args[outFlag + 1] : null;
const files = args.filter((a, i) => !a.startsWith('--') && i !== outFlag + 1);

const results = [];
for (const f of files) {
  try {
    const s = await parseCodexRollout(f);
    results.push(analyzeSession(s));
    process.stderr.write(`parsed ${s.id} (${s.toolCalls.length} tool calls)\n`);
  } catch (e) {
    process.stderr.write(`FAIL ${f}: ${e.message}\n`);
  }
}
const json = JSON.stringify(results, null, 1);
if (outPath) writeFileSync(outPath, json);
else console.log(json);
