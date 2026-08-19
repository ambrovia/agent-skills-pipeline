#!/usr/bin/env node
// Aggregate codex + claude fleet records into fleet-wide statistics.
import { readFileSync, writeFileSync } from 'node:fs';

const T = '/var/folders/sr/wnvq_y611f9dvjf3tk9n389r0000gn/T/opencode';
const codex = JSON.parse(readFileSync(`${T}/codex-fleet.json`, 'utf8'));
const claude = JSON.parse(readFileSync(`${T}/claude-fleet.json`, 'utf8'));

const proj = cwd => {
  if (!cwd) return '(unknown)';
  const c = cwd.replace(/^\/Users\/tg\//, '~/');
  if (c.includes('nimmly')) return 'nimmly';
  if (c.includes('hyperidle')) return 'hyperidle';
  if (c.includes('agent-skills-pipeline')) return 'agent-skills-pipeline';
  if (c.includes('infra')) return 'infra';
  return c.split('/').slice(0, 3).join('/');
};

// ---------- codex trees ----------
const byId = new Map(codex.map(r => [r.id, r]));
const childOf = new Map();
for (const r of codex) {
  if (r.parentId && byId.has(r.parentId)) {
    if (!childOf.has(r.parentId)) childOf.set(r.parentId, []);
    childOf.get(r.parentId).push(r);
  }
}
const roots = codex.filter(r => !r.parentId || !byId.has(r.parentId));

function aggTree(root) {
  const a = { threads: 0, input: 0, cached: 0, output: 0, polls: 0, execs: 0, compactions: 0, aborts: 0, spawns: 0, adds: 0, dels: 0, patches: 0, files: new Set(), smallThreads: 0, smallInput: 0 };
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    a.threads++;
    a.input += n.input; a.cached += n.cached; a.output += n.output;
    a.polls += n.polls; a.execs += n.execs; a.compactions += n.compactions;
    a.aborts += n.aborts; a.spawns += n.spawns; a.adds += n.adds; a.dels += n.dels; a.patches += n.patches;
    if (n.input <= 0 && n.output <= 0 && n.calls <= 1) { /* empty */ }
    if ((n.execs + n.polls) <= 5) { a.smallThreads++; a.smallInput += n.input; }
    for (const c of childOf.get(n.id) || []) stack.push(c);
  }
  return a;
}

const trees = roots
  .filter(r => r.input > 0 || r.output > 0)
  .map(r => ({ root: r, agg: aggTree(r) }))
  .sort((x, y) => y.agg.input - x.agg.input);

// ---------- codex fleet stats ----------
const cx = {
  threads: codex.length,
  roots: roots.length,
  input: codex.reduce((a, r) => a + r.input, 0),
  cached: codex.reduce((a, r) => a + r.cached, 0),
  output: codex.reduce((a, r) => a + r.output, 0),
  polls: codex.reduce((a, r) => a + r.polls, 0),
  execs: codex.reduce((a, r) => a + r.execs, 0),
  compactions: codex.reduce((a, r) => a + r.compactions, 0),
  spawns: codex.reduce((a, r) => a + r.spawns, 0),
  adds: codex.reduce((a, r) => a + r.adds, 0),
  dels: codex.reduce((a, r) => a + r.dels, 0),
  byProject: {},
  threadDist: { '1': 0, '2-5': 0, '6-20': 0, '21-50': 0, '51-100': 0, '101-300': 0, '300+': 0 },
  ratioBuckets: { '<10:1': 0, '10-100:1': 0, '100-500:1': 0, '500-1000:1': 0, '>1000:1': 0 },
  topTrees: [],
};
for (const r of codex) {
  const p = proj(r.cwd);
  const b = cx.byProject[p] || { threads: 0, input: 0, output: 0, polls: 0 };
  b.threads++; b.input += r.input; b.output += r.output; b.polls += r.polls;
  cx.byProject[p] = b;
}
for (const t of trees) {
  const th = t.agg.threads;
  const k = th === 1 ? '1' : th <= 5 ? '2-5' : th <= 20 ? '6-20' : th <= 50 ? '21-50' : th <= 100 ? '51-100' : th <= 300 ? '101-300' : '300+';
  cx.threadDist[k]++;
  if (t.agg.output > 0) {
    const ratio = t.agg.input / t.agg.output;
    const rk = ratio < 10 ? '<10:1' : ratio < 100 ? '10-100:1' : ratio < 500 ? '100-500:1' : ratio < 1000 ? '500-1000:1' : '>1000:1';
    cx.ratioBuckets[rk]++;
  }
}
cx.topTrees = trees.slice(0, 25).map(t => ({
  id: t.root.id, project: proj(t.root.cwd), start: t.root.start, model: t.root.model,
  threads: t.agg.threads, input: t.agg.input, output: t.agg.output, polls: t.agg.polls,
  compactions: t.agg.compactions, adds: t.agg.adds, dels: t.agg.dels,
  smallThreads: t.agg.smallThreads, smallInput: t.agg.smallInput,
  ratio: t.agg.output ? Math.round(t.agg.input / t.agg.output) : null,
  agentPath: t.root.agentPath,
}));

// ---------- claude fleet stats ----------
const cl = {
  sessions: claude.length,
  input: claude.reduce((a, r) => a + r.input, 0),
  cacheRead: claude.reduce((a, r) => a + r.cacheRead, 0),
  output: claude.reduce((a, r) => a + r.output, 0),
  sideOutput: claude.reduce((a, r) => a + r.sideOutput, 0),
  sideCacheRead: claude.reduce((a, r) => a + r.sideCacheRead, 0),
  agentSpawns: claude.reduce((a, r) => a + r.agentSpawns, 0),
  edits: claude.reduce((a, r) => a + r.edits, 0),
  reads: claude.reduce((a, r) => a + r.reads, 0),
  bash: claude.reduce((a, r) => a + r.bash, 0),
  pipelineSessions: claude.filter(r => r.pipelineMention).length,
  byProject: {},
  bySkill: {},
  topSessions: [],
};
for (const r of claude) {
  const p = proj(r.cwd);
  const b = cl.byProject[p] || { sessions: 0, input: 0, cacheRead: 0, output: 0, sideOutput: 0, spawns: 0 };
  b.sessions++; b.input += r.input; b.cacheRead += r.cacheRead; b.output += r.output; b.sideOutput += r.sideOutput; b.spawns += r.agentSpawns;
  cl.byProject[p] = b;
  for (const [sk, u] of Object.entries(r.skills)) {
    if (!sk.startsWith('pipeline:')) continue;
    const s = cl.bySkill[sk] || { input: 0, cacheRead: 0, output: 0, msgs: 0, sessions: 0 };
    s.input += u.input; s.cacheRead += u.cacheRead; s.output += u.output; s.msgs += u.msgs; s.sessions++;
    cl.bySkill[sk] = s;
  }
}
cl.topSessions = [...claude]
  .sort((a, b) => (b.input + b.cacheRead) - (a.input + a.cacheRead))
  .slice(0, 25)
  .map(r => ({
    id: r.id, project: proj(r.cwd), branch: r.branch, start: r.start,
    input: r.input, cacheRead: r.cacheRead, output: r.output,
    sideOutput: r.sideOutput, sideMsgs: r.sideMsgs,
    msgs: r.msgs, edits: r.edits, reads: r.reads, bash: r.bash, spawns: r.agentSpawns,
    skills: Object.keys(r.skills).filter(s => s.startsWith('pipeline:')),
    wpIds: r.wpIds,
  }));

writeFileSync(`${T}/fleet-summary.json`, JSON.stringify({ codex: cx, claude: cl }, null, 1));
console.log('=== CODEX ===');
console.log('threads', cx.threads, '| roots', cx.roots, '| input', (cx.input / 1e9).toFixed(1) + 'B', '| output', (cx.output / 1e6).toFixed(0) + 'M', '| polls', cx.polls, '| compactions', cx.compactions, '| spawns', cx.spawns);
console.log('by project:', Object.entries(cx.byProject).sort((a, b) => b[1].input - a[1].input).map(([p, b]) => `${p}: ${b.threads}th ${(b.input / 1e9).toFixed(1)}B`).join(' | '));
console.log('tree size dist:', cx.threadDist);
console.log('input:output ratio dist:', cx.ratioBuckets);
console.log();
console.log('=== CLAUDE ===');
console.log('sessions', cl.sessions, '| input+cacheWrite', ((cl.input) / 1e9).toFixed(1) + 'B', '| cacheRead', (cl.cacheRead / 1e9).toFixed(1) + 'B', '| output', (cl.output / 1e6).toFixed(0) + 'M', '| sidechain output', (cl.sideOutput / 1e6).toFixed(0) + 'M', '| agent spawns', cl.agentSpawns);
console.log('pipeline-attributed sessions:', cl.pipelineSessions);
console.log('by project:', Object.entries(cl.byProject).sort((a, b) => b[1].cacheRead - a[1].cacheRead).slice(0, 6).map(([p, b]) => `${p}: ${b.sessions}s cr:${(b.cacheRead / 1e9).toFixed(1)}B`).join(' | '));
console.log();
console.log('=== SKILL ATTRIBUTION (claude main threads) ===');
for (const [sk, s] of Object.entries(cl.bySkill).sort((a, b) => b[1].cacheRead - a[1].cacheRead)) {
  console.log(sk.padEnd(30), '| sessions', String(s.sessions).padStart(5), '| cacheRead', (s.cacheRead / 1e9).toFixed(2) + 'B', '| output', (s.output / 1e6).toFixed(2) + 'M', '| msgs', s.msgs);
}
