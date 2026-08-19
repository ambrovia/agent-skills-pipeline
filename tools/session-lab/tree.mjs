#!/usr/bin/env node
// Walk a codex session tree: root rollout + all subagent thread rollouts (recursive).
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { parseCodexRollout } from './parse-codex.mjs';
import { analyzeSession } from './analyze.mjs';

const SESSIONS_DIR = `${process.env.HOME}/.codex/sessions`;
const findCache = new Map();

function findRollout(threadId) {
  if (findCache.has(threadId)) return findCache.get(threadId);
  let p = null;
  try {
    p = execSync(`find ${SESSIONS_DIR} -name "*${threadId}*.jsonl" 2>/dev/null | head -1`, { encoding: 'utf8' }).trim() || null;
  } catch { /* ignore */ }
  findCache.set(threadId, p);
  return p;
}

async function walk(rootFile, depth = 0, seen = new Set()) {
  const s = await parseCodexRollout(rootFile);
  const a = analyzeSession(s);
  a.depth = depth;
  a.children = [];
  const threads = [...new Set(s.subagents.map(x => x.thread))].filter(t => t && t !== s.id && !seen.has(t));
  for (const t of threads) {
    seen.add(t);
    const f = findRollout(t);
    if (f && existsSync(f)) {
      a.children.push(await walk(f, depth + 1, seen));
    } else {
      a.children.push({ id: t, missing: true, depth: depth + 1, children: [] });
    }
  }
  return a;
}

function summarize(node, acc = { threads: 0, missing: 0, input: 0, cached: 0, output: 0, reasoning: 0, polls: 0, tools: 0, patches: 0, adds: 0, dels: 0, spawns: 0, compactions: 0 }) {
  if (!node.missing) {
    acc.threads++;
    acc.input += node.tokens?.input || 0;
    acc.cached += node.tokens?.cached || 0;
    acc.output += node.tokens?.output || 0;
    acc.reasoning += node.tokens?.reasoning || 0;
    acc.polls += node.pollCalls || 0;
    acc.tools += node.toolCalls || 0;
    acc.patches += node.patchedFileCount || 0;
    acc.adds += node.additions || 0;
    acc.dels += node.deletions || 0;
    acc.spawns += node.subagentSpawns || 0;
    acc.compactions += node.compactions || 0;
  } else acc.missing++;
  for (const c of node.children || []) summarize(c, acc);
  return acc;
}

const root = process.argv[2];
const outFlag = process.argv.indexOf('--out');
const outPath = outFlag >= 0 ? process.argv[outFlag + 1] : null;
const tree = await walk(root);
const sum = summarize(tree);
console.error(`tree for ${tree.id}: ${sum.threads} threads found, ${sum.missing} missing`);
const report = { root: tree, summary: sum };
if (outPath) (await import('node:fs')).writeFileSync(outPath, JSON.stringify(report, null, 1));
else console.log(JSON.stringify(sum, null, 1));
