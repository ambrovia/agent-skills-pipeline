#!/usr/bin/env node
// Recompute fleet stats excluding gigantic multi-iteration refactoring programs
// that are not representative of typical pipeline runs.
//
// EXCLUDED hyperidle WPs (evidence: ~/hyperidle/.pipeline/AU.md registry):
//   AU19 — Applications/Layers/Services framework composition; the foundational
//          refactoring program the whole AU track was registered from
//   AU20 — "Challenge every Service's exposed method surface"; L, multi-round
//          audit/reduction program (the 37B-input codex tree)
//   AU21 — core-api↔agent-orchestration seam; 15 increments (0–13, 10a, K1…),
//          Decisions A–L, reopened once, Increment 14 added post-approval
//   AU26 — domain relocation; "REWRITTEN AND GENERALIZED, then extended again"
//   AU28 — canonical interface architecture + 38-violation warn-then-clean program
// KEPT: AU27, AU29–AU36 (single-outcome WPs run through the normal pipeline),
//       AU9–AU18 (small), and ALL nimmly runs (feature WPs, not refactorings).
import { readFileSync, writeFileSync } from 'node:fs';

const T = '/var/folders/sr/wnvq_y611f9dvjf3tk9n389r0000gn/T/opencode';
const EXCLUDED = ['AU19', 'AU20', 'AU21', 'AU26', 'AU28'];
const wpRe = new RegExp(`(^|[^A-Z])(${EXCLUDED.join('|')})([^0-9]|$)`, 'i');

const codex = JSON.parse(readFileSync(`${T}/codex-fleet.json`, 'utf8'));
const claude = JSON.parse(readFileSync(`${T}/claude-fleet.json`, 'utf8'));

// ---- codex: mark threads belonging to excluded WPs ----
const byId = new Map(codex.map(r => [r.id, r]));
const excludedIds = new Set();
for (const r of codex) {
  const path = r.agentPath || '';
  const cwd = r.cwd || '';
  if (wpRe.test(path)) excludedIds.add(r.id);
  else if (/\.worktrees\//.test(cwd) && wpRe.test(cwd)) excludedIds.add(r.id);
}
// roots whose tree is majority-excluded
const children = new Map();
for (const r of codex) {
  if (r.parentId && byId.has(r.parentId)) {
    if (!children.has(r.parentId)) children.set(r.parentId, []);
    children.get(r.parentId).push(r);
  }
}
for (const r of codex) {
  if (r.parentId && byId.has(r.parentId)) continue;
  const stack = [r.id]; let total = 0, ex = 0;
  while (stack.length) {
    const id = stack.pop(); total++;
    if (excludedIds.has(id)) ex++;
    for (const c of children.get(id) || []) stack.push(c.id);
  }
  if (total > 1 && ex / total >= 0.5) {
    const st2 = [r.id];
    while (st2.length) { const id = st2.pop(); excludedIds.add(id); for (const c of children.get(id) || []) st2.push(c.id); }
  }
}
const codexKept = codex.filter(r => !excludedIds.has(r.id));

// ---- claude: exclude sessions on excluded-WP branches, and main-branch
//      orchestrators whose PRIMARY work package (first WP mentioned) is excluded ----
const claudeKept = claude.filter(r => {
  const isHy = (r.cwd || '').includes('hyperidle');
  if (!isHy) return true;
  const b = r.branch || '';
  if (wpRe.test(b)) return false;
  if ((b === 'main' || b === 'HEAD' || b === '') && r.wpIds.length && EXCLUDED.includes(r.wpIds[0])) return false;
  return true;
});
const claudeExcluded = claude.length - claudeKept.length;

// ---- stats ----
function cxStats(rs) {
  const input = rs.reduce((a, r) => a + r.input, 0);
  const output = rs.reduce((a, r) => a + r.output, 0);
  const roots = rs.filter(r => !r.parentId || !byId.has(r.parentId));
  const ratioBuckets = { '<10:1': 0, '10-100:1': 0, '100-500:1': 0, '500-1000:1': 0, '>1000:1': 0 };
  for (const r of roots) {
    if (r.output <= 0) continue;
    const ratio = r.input / r.output;
    const k = ratio < 10 ? '<10:1' : ratio < 100 ? '10-100:1' : ratio < 500 ? '100-500:1' : ratio < 1000 ? '500-1000:1' : '>1000:1';
    ratioBuckets[k]++;
  }
  return { threads: rs.length, roots: roots.length, input, output, ratio: output ? Math.round(input / output) : null, ratioBuckets, polls: rs.reduce((a, r) => a + r.polls, 0), compactions: rs.reduce((a, r) => a + r.compactions, 0) };
}
function clStats(rs) {
  const cacheRead = rs.reduce((a, r) => a + r.cacheRead, 0);
  const output = rs.reduce((a, r) => a + r.output + r.sideOutput, 0);
  const small = rs.filter(r => { const m = r.msgs + r.sideMsgs; return m >= 1 && m <= 10; });
  return { sessions: rs.length, cacheRead, output, smallSessions: small.length, smallCacheRead: small.reduce((a, r) => a + r.cacheRead, 0) };
}

const before = { codex: cxStats(codex), claude: clStats(claude) };
const after = { codex: cxStats(codexKept), claude: clStats(claudeKept) };

writeFileSync(`${T}/fleet-typical.json`, JSON.stringify({ excluded: EXCLUDED, before, after, codexKept, claudeKept }, null, 1));

const B = n => (n / 1e9).toFixed(1);
const M = n => (n / 1e6).toFixed(1);
console.log('=== CODEX (all time) ===');
console.log('before:', before.codex.threads, 'threads,', B(before.codex.input) + 'B input,', M(before.codex.output) + 'M output, ratio', before.codex.ratio + ':1');
console.log('after: ', after.codex.threads, 'threads,', B(after.codex.input) + 'B input,', M(after.codex.output) + 'M output, ratio', after.codex.ratio + ':1');
console.log('ratio buckets before:', before.codex.ratioBuckets);
console.log('ratio buckets after: ', after.codex.ratioBuckets);
console.log();
console.log('=== CLAUDE ===');
console.log('before:', before.claude.sessions, 'sessions,', B(before.claude.cacheRead) + 'B cacheRead,', M(before.claude.output) + 'M output, small:', before.claude.smallSessions);
console.log('after: ', after.claude.sessions, 'sessions,', B(after.claude.cacheRead) + 'B cacheRead,', M(after.claude.output) + 'M output, small:', after.claude.smallSessions, `(${claudeExcluded} excluded)`);
console.log('small-session tax after:', B(after.claude.smallCacheRead) + 'B cacheRead across', after.claude.smallSessions, 'sessions');
