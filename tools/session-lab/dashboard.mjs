#!/usr/bin/env node
// Generates a self-contained HTML dashboard from fleet scan outputs.
import { readFileSync, writeFileSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const T = '/var/folders/sr/wnvq_y611f9dvjf3tk9n389r0000gn/T/opencode';
const sum = JSON.parse(readFileSync(`${T}/fleet-summary.json`, 'utf8'));
const codexFleet = JSON.parse(readFileSync(`${T}/codex-fleet.json`, 'utf8'));
const claudeFleet = JSON.parse(readFileSync(`${T}/claude-fleet.json`, 'utf8'));
const top10 = JSON.parse(readFileSync(`${T}/top10.json`, 'utf8'));
const typical = JSON.parse(readFileSync(`${T}/fleet-typical.json`, 'utf8'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const B = n => (n / 1e9).toFixed(1);
const M = n => (n / 1e6).toFixed(1);
const usd = n => '$' + Math.round(n).toLocaleString('en-US');

function hbar(rows, { w = 820, rh = 25, fmt = v => v, color = '#4f7cff', labelW = 250 } = {}) {
  const max = Math.max(...rows.map(r => r.value), 1);
  const h = rows.length * rh + 8;
  let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:ui-monospace,monospace">`;
  rows.forEach((r, i) => {
    const y = i * rh;
    const bw = Math.max(2, (r.value / max) * (w - labelW - 130));
    svg += `<text x="0" y="${y + 16}" font-size="11.5" fill="#c9d1d9">${esc(r.label)}</text>`;
    svg += `<rect x="${labelW}" y="${y + 4}" width="${bw}" height="${rh - 11}" rx="3" fill="${r.color || color}" opacity="0.85"/>`;
    svg += `<text x="${labelW + 6 + bw}" y="${y + 16}" font-size="11.5" fill="#e6edf3">${fmt(r.value)}</text>`;
  });
  return svg + '</svg>';
}

function lineChart(series, { w = 820, h = 270, markers = [], xLabel = '', yFmt = v => v } = {}) {
  const pad = { l: 62, r: 16, t: 16, b: 32 };
  const maxY = Math.max(...series.flatMap(s => s.points.map(p => p.y)), 1);
  const n = Math.max(...series.map(s => s.points.length));
  const X = i => pad.l + (i / Math.max(1, n - 1)) * (w - pad.l - pad.r);
  const Y = v => pad.t + (1 - v / maxY) * (h - pad.t - pad.b);
  let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:ui-monospace,monospace">`;
  for (let g = 0; g <= 4; g++) {
    const gv = (maxY / 4) * g, gy = Y(gv);
    svg += `<line x1="${pad.l}" y1="${gy}" x2="${w - pad.r}" y2="${gy}" stroke="#21262d"/>`;
    svg += `<text x="4" y="${gy + 4}" font-size="11" fill="#8b949e">${yFmt(gv)}</text>`;
  }
  for (const s of series) {
    const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
    svg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2"/>`;
  }
  for (const m of markers) {
    if (m.at < 0 || m.at >= n) continue;
    const mx = X(m.at);
    svg += `<line x1="${mx}" y1="${pad.t}" x2="${mx}" y2="${h - pad.b}" stroke="${m.color || '#f85149'}" stroke-dasharray="3,3" opacity="0.85"/>`;
    svg += `<text x="${Math.min(mx + 3, w - 220)}" y="${pad.t + 10 + (m.dy || 0)}" font-size="10" fill="${m.color || '#f85149'}">${esc(m.label)}</text>`;
  }
  svg += `<text x="${w / 2}" y="${h - 6}" font-size="11" fill="#8b949e" text-anchor="middle">${esc(xLabel)}</text>`;
  return svg + '</svg>';
}

// ---------- L1 spawn timeline ----------
async function spawnTimeline(rollout) {
  const rl = createInterface({ input: createReadStream(rollout), crlfDelay: Infinity });
  let cum = 0;
  const spawns = [], users = [];
  for await (const line of rl) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const p = o.payload || {};
    if (o.type === 'event_msg' && p.type === 'token_count') cum = p.info?.total_token_usage?.total_tokens || cum;
    if (o.type === 'event_msg' && p.type === 'user_message') users.push({ msg: String(p.message || '').slice(0, 90), cum });
    if (o.type === 'response_item' && p.type === 'function_call' && p.name === 'spawn_agent') {
      try { spawns.push({ task: JSON.parse(p.arguments).task_name || '?', cum }); } catch { /* skip */ }
    }
  }
  return { spawns, users };
}
const classify = t => {
  t = String(t).toLowerCase();
  if (/(review|rereview)/.test(t)) return /fix|repair|correction/.test(t) ? 'review+fix' : 'review';
  if (/fix|repair|correction|reset|simplif|retro|audit/.test(t)) return 'rework';
  if (/builder|build|implementation|red_tests|tests|ship/.test(t)) return 'build';
  return 'plan/critique';
};
const PHASE_COLORS = { 'plan/critique': '#d29922', 'build': '#3fb950', 'review': '#4f7cff', 'review+fix': '#bc8cff', 'rework': '#f85149' };

const l1 = await spawnTimeline(`${process.env.HOME}/.codex/sessions/2026/08/05/rollout-2026-08-05T01-13-26-019fcf0d-a84a-7f33-8d7c-5471343cc6ce.jsonl`);
const phaseCounts = {}, phaseDelta = {};
let prevC = 0;
for (const s of l1.spawns) {
  const c = classify(s.task);
  phaseCounts[c] = (phaseCounts[c] || 0) + 1;
  phaseDelta[c] = (phaseDelta[c] || 0) + (s.cum - prevC);
  prevC = s.cum;
}
const firstBuild = l1.spawns.findIndex(s => classify(s.task) === 'build');
const userMarkers = l1.users
  .filter(u => /overengineer|too long|bring the worktree back|plain english/i.test(u.msg))
  .map(u => ({ at: l1.spawns.findIndex(s => s.cum >= u.cum), label: '“' + u.msg.slice(0, 40) + '…”', color: '#f85149', dy: (u.cum / 1e6) % 3 * 12 }));

// ---------- derived fleet numbers ----------
const cx = sum.codex, cl = sum.claude;
const ratioTotal = Math.round(cx.input / cx.output);
const smallClaude = claudeFleet.filter(r => { const m = r.msgs + r.sideMsgs; return m >= 1 && m <= 10; });
const smallCr = smallClaude.reduce((a, r) => a + r.cacheRead, 0);
const topTreeInput = cx.topTrees.slice(0, 15).reduce((a, t) => a + t.input, 0);

// per-WP table
const byWP = {};
for (const r of claudeFleet) {
  const m = (r.branch || '').match(/(?:pipeline|plan|framework|backend|feat)\/([A-Z]{1,2}\d{1,2})/);
  if (!m) continue;
  const w = byWP[m[1]] || { sessions: 0, cacheRead: 0, output: 0, sideOutput: 0, edits: 0 };
  w.sessions++; w.cacheRead += r.cacheRead; w.output += r.output; w.sideOutput += r.sideOutput; w.edits += r.edits;
  byWP[m[1]] = w;
}
const wpRows = Object.entries(byWP).sort((a, b) => b[1].cacheRead - a[1].cacheRead).slice(0, 12);

const card = (title, body) => `<section class="card"><h2>${title}</h2>${body}</section>`;
const kv = (k, v, cls = '') => `<div class="kv"><div class="k">${k}</div><div class="v ${cls}">${v}</div></div>`;

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>agent-skills-pipeline — token forensics</title>
<style>
:root{color-scheme:dark}
body{background:#0d1117;color:#e6edf3;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:32px;max-width:1120px;margin-inline:auto}
h1{font-size:26px;margin:0 0 4px}
h2{font-size:17px;margin:0 0 14px}
h3{font-size:13px;color:#8b949e;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.06em}
.sub{color:#8b949e;margin:0 0 26px;font-size:14px}
.card{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:22px;margin:18px 0}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:10px 0}
.kv{background:#0d1117;border:1px solid #21262d;border-radius:8px;padding:10px 12px}
.kv .k{color:#8b949e;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
.kv .v{font-size:19px;font-weight:650;margin-top:3px}
.kv .v.bad{color:#f85149}.kv .v.warn{color:#d29922}.kv .v.ok{color:#3fb950}
.note{color:#8b949e;font-size:13px;line-height:1.55}
.note b{color:#e6edf3}
table{border-collapse:collapse;width:100%;font-size:12.5px;font-family:ui-monospace,monospace}
th,td{border-bottom:1px solid #21262d;padding:6px 9px;text-align:left;vertical-align:top}
th{color:#8b949e;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
td.num{text-align:right}
blockquote{border-left:3px solid #4f7cff;margin:10px 0;padding:6px 14px;color:#c9d1d9;font-size:13px;background:#0d1117;border-radius:0 6px 6px 0}
blockquote .src{display:block;color:#8b949e;font-size:11px;margin-top:5px;font-family:ui-monospace,monospace}
.legend{display:flex;gap:14px;font-size:12px;color:#8b949e;margin:8px 0;flex-wrap:wrap}
.legend span::before{content:"";display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;background:var(--c)}
code{background:#0d1117;border:1px solid #21262d;border-radius:4px;padding:1px 5px;font-size:12px}
</style></head><body>
<h1>Token forensics — agent-skills-pipeline in production</h1>
<p class="sub">Every number below is parsed from raw transcripts: <b>${codexFleet.length.toLocaleString()}</b> codex rollout threads + <b>${claudeFleet.length.toLocaleString()}</b> Claude Code sessions (~/hyperidle, ~/Development/nimmly, Jun–Aug 2026), cross-checked against codeburn usage data and the .pipeline retro logs. Tools: <code>tools/session-lab/</code>.</p>

${card('0. What is excluded: gigantic refactoring programs', `
<p class="note">The hyperidle AU track contains five multi-increment refactoring programs that are not representative of typical pipeline work — they ran as weeks-long, multi-iteration rebuilds in single sessions. They are excluded from the "typical pipeline" numbers below (classification source: <code>~/hyperidle/.pipeline/AU.md</code> registry):</p>
<table>
<tr><th>WP</th><th>why excluded</th></tr>
<tr><td>AU19</td><td>Applications/Layers/Services framework composition — the foundational refactoring program the whole track was registered from</td></tr>
<tr><td>AU20</td><td>"Challenge every Service's exposed method surface" — L, multi-round audit/reduction; the 37B-input codex tree (307 threads)</td></tr>
<tr><td>AU21</td><td>core-api↔agent-orchestration seam — 15 increments, Decisions A–L, reopened once, Increment 14 added post-approval</td></tr>
<tr><td>AU26</td><td>domain relocation — "REWRITTEN AND GENERALIZED, then extended again"</td></tr>
<tr><td>AU28</td><td>canonical interface architecture — 38-violation warn-then-clean program</td></tr>
</table>
<div class="grid">
${kv('codex before', '1,928th / ' + B(typical.before.codex.input) + 'B / ' + typical.before.codex.ratio + ':1')}${kv('codex after', '1,605th / ' + B(typical.after.codex.input) + 'B / ' + typical.after.codex.ratio + ':1', 'warn')}${kv('claude before', typical.before.claude.sessions.toLocaleString() + 's / ' + B(typical.before.claude.cacheRead) + 'B')}${kv('claude after', typical.after.claude.sessions.toLocaleString() + 's / ' + B(typical.after.claude.cacheRead) + 'B', 'warn')}
</div>
<p class="note"><b>The exclusion removes volume, not the pattern.</b> The five programs account for ~31% of codex input — but the fleet input:output ratio moves 926:1 → 916:1, and the share of trees above 1000:1 stays at ~77%. The typical pipeline (nimmly feature WPs, single-outcome AU packages, everything else) is itself the problem; the refactor programs merely made it more visible.</p>`)}

${card('0. Excluded: gigantic multi-iteration refactoring programs', `
<p class="note">Five hyperidle AU work packages are excluded from the "typical pipeline" picture: they were weeks-long, multi-increment refactoring programs run in single sessions, not representative pipeline work (classification from <code>~/hyperidle/.pipeline/AU.md</code> registry):</p>
<table>
<tr><th>WP</th><th>why it is excluded</th></tr>
<tr><td>AU19</td><td>Applications/Layers/Services framework composition — the foundational refactoring program the whole AU track was registered from</td></tr>
<tr><td>AU20</td><td>"Challenge every Service's exposed method surface" — complexity L, multi-round audit/reduction; the 37B-input, 307-thread codex tree</td></tr>
<tr><td>AU21</td><td>core-api↔agent-orchestration seam — 15 increments (0–13, 10a, K1…), Decisions A–L, reopened once, Increment 14 added post-approval</td></tr>
<tr><td>AU26</td><td>domain relocation — "REWRITTEN AND GENERALIZED, then extended again"</td></tr>
<tr><td>AU28</td><td>canonical interface architecture — 38-violation warn-then-clean program</td></tr>
</table>
<div class="grid">
${kv('codex before', '1,928 th / ' + B(typical.before.codex.input) + 'B / ' + typical.before.codex.ratio + ':1')}${kv('codex typical', '1,605 th / ' + B(typical.after.codex.input) + 'B / ' + typical.after.codex.ratio + ':1', 'warn')}${kv('claude before', typical.before.claude.sessions.toLocaleString() + ' sessions / ' + B(typical.before.claude.cacheRead) + 'B')}${kv('claude typical', typical.after.claude.sessions.toLocaleString() + ' sessions / ' + B(typical.after.claude.cacheRead) + 'B', 'warn')}
</div>
<p class="note"><b>The exclusion removes volume, not the pattern.</b> The five programs account for ~31% of all codex input, yet the fleet input:output ratio moves only 926:1 → 916:1, and the share of productive trees above 1000:1 stays ~77% (${typical.after.codex.ratioBuckets['>1000:1']} of ${Object.values(typical.after.codex.ratioBuckets).reduce((a, b) => a + b, 0)}). The typical pipeline — nimmly feature WPs, single-outcome AU packages — is itself the problem; the refactor programs only made it more visible.</p>`)}

${card('1. Fleet totals', `
<div class="grid">
${kv('codex input processed', B(cx.input) + 'B', 'bad')}${kv('codex output', M(cx.output) + 'M')}${kv('codex input:output', ratioTotal + ':1', 'bad')}${kv('codex threads', cx.threads.toLocaleString())}
${kv('claude cache reads', B(cl.cacheRead) + 'B', 'warn')}${kv('claude output (main+side)', M(cl.output + cl.sideOutput) + 'M')}${kv('claude sessions', cl.sessions.toLocaleString())}${kv('agent spawns (claude)', cl.agentSpawns.toLocaleString())}
${kv('30-day $ (codeburn)', usd(18368), 'bad')}${kv('flagged recoverable', usd(8714) + ' (43.7%)', 'warn')}${kv('poll calls (codex)', cx.polls.toLocaleString(), 'warn')}${kv('compactions (codex)', cx.compactions.toLocaleString(), 'warn')}
</div>
<p class="note">"Input processed" = context tokens fed to model calls (97–99% served from cache — billed at cache rates, but every call re-pays the full context). Codex carries the pipeline's heavy multi-agent runs; Claude carries orchestrator sessions plus thousands of subagent sessions.</p>`)}

${card('2. The defining number: input processed per token of output', `
${hbar(Object.entries(cx.ratioBuckets).map(([k, v]) => ({ label: k, value: v, color: k === '>1000:1' ? '#f85149' : k === '500-1000:1' ? '#d29922' : '#3fb950' })), { fmt: v => v + ' trees', labelW: 120 })}
<p class="note">Distribution of input:output ratios across ${Object.values(cx.ratioBuckets).reduce((a, b) => a + b, 0)} codex session-trees that produced output. <b>${cx.ratioBuckets['>1000:1']} of them (${Math.round(cx.ratioBuckets['>1000:1'] / Object.values(cx.ratioBuckets).reduce((a, b) => a + b, 0) * 100)}%) sit above 1000:1</b> — over a thousand context-tokens processed for every token the model actually produced. Only ${cx.ratioBuckets['<10:1'] + cx.ratioBuckets['10-100:1']} trees are below 100:1. This is not a prompt-wordiness problem; it is an architecture-of-work problem.</p>`)}

${card('3. Concentration: 15 runs dominate everything', `
${hbar(cx.topTrees.slice(0, 15).map(t => ({ label: `${t.id.slice(0, 8)} ${t.project} ${(t.start || '').slice(5, 10)} (${t.threads}th)`, value: t.input / 1e9 })), { fmt: v => v.toFixed(1) + 'B input', color: '#bc8cff' })}
<p class="note">Top 15 session-trees = <b>${B(topTreeInput)}B of ${B(cx.input)}B (${Math.round(topTreeInput / cx.input * 100)}%)</b> of all codex input. Each bar is one work-package run (or a slice of one). The biggest: AU20 (hyperidle) — 180 parent-linked threads (lower bound; following the spawn activity log finds 307), 37.1B input, 1,182 compactions, 6,400 polls. Fixing the mechanics of these few runs is worth more than any fleet-wide micro-optimization.</p>`)}

${card('4. Mechanism A — the fork tax', `
<table>
<tr><th>session-tree</th><th class="num">threads</th><th class="num">input</th><th class="num">≤5-call threads</th><th class="num">their input</th><th class="num">share</th></tr>
${cx.topTrees.slice(0, 10).map(t => `<tr><td>${t.id.slice(0, 8)} ${t.project}</td><td class="num">${t.threads}</td><td class="num">${B(t.input)}B</td><td class="num">${t.smallThreads}</td><td class="num">${B(t.smallInput)}B</td><td class="num" style="color:#f85149">${Math.round(t.smallInput / t.input * 100)}%</td></tr>`).join('')}
</table>
<p class="note">Codex <code>spawn_agent</code> forks the parent conversation into the child (<code>fork_turns: "all"</code>). Threads that made five or fewer tool calls still carry — and re-pay on every inference — a 100–170k-token inherited context. Across the top ten runs, these near-idle threads consume <b>53–83% of all input</b>. Claude's mirror of the same mechanism: <b>${smallClaude.length.toLocaleString()} subagent sessions of 1–10 messages</b>, each re-reading a ~98k-token prefix → ${B(smallCr)}B cache-read tokens for ${M(smallClaude.reduce((a, r) => a + r.output + r.sideOutput, 0))}M output.</p>`)}

${card('5. Mechanism B — polling is a model call', `
<div class="grid">
${kv('wait/wait_agent/list_agents calls', cx.polls.toLocaleString(), 'warn')}${kv('top orchestrator', '4,104 of 5,036 calls (81%)', 'bad')}${kv('AU20 tree', '6,400 polls', 'bad')}${kv('avg context per poll', '~110–140k tokens', 'warn')}
</div>
<p class="note">The orchestrator waits on subagents with <code>wait_agent(timeout_ms: 1000)</code> — and every poll is a full model inference over the whole orchestrator context. In the ten deepest orchestrator threads, polling averages <b>${Math.round(top10.reduce((a, s) => a + s.pollShare, 0) / top10.length * 100)}% of all tool calls</b>. The orchestrator produces almost nothing itself (median output per run &lt;1M tokens); it is a supervisor paying frontier-context prices to watch paint dry.</p>`)}

${card('6. Mechanism C — rounds multiply threads', `
<p class="note">Every critique round, review round, and fix round spawns a fresh forked thread over a context that has grown since the last round. From the top runs:</p>
<table>
<tr><th>run</th><th>observed round chains</th></tr>
<tr><td>L1 (nimmly)</td><td>5 consecutive architecture-critique rounds before build; implementation reviews ×3; then 12 fix→review pairs after first DONE (spawns 54–103)</td></tr>
<tr><td>AU20 (hyperidle)</td><td>per-subsystem chains: plan → review → rewrite → rereview → revision → finalize (policy, filesystems, settings, git_export, connections, users…); architecture_v3 spawned 20+ critique/inventory threads incl. _r2 and _r3 rounds</td></tr>
<tr><td>D4/D6 (nimmly)</td><td>75 threads for two small WPs; 530 compactions fleet-wide in that run</td></tr>
</table>`)}

${card('7. Case study: WP L1 (nimmly) — scope vs. how it got there', `
<div class="grid">
${kv('shipped (PR #155)', '43 files, +1,933/−304', 'ok')}${kv('input processed', '14.1B (tree, linked)', 'bad')}${kv('threads', '105 linked + forks')}${kv('named spawns', l1.spawns.length)}
${kv('compactions', '680 (run files)', 'bad')}${kv('wall clock', '4.9 days')}${kv('codeburn cost', usd(823), 'bad')}${kv('churn vs shipped', '+138k/−45k vs +1.9k', 'bad')}
</div>
<h3>Orchestrator cumulative tokens across the 104 subagent spawns</h3>
${lineChart([{ color: '#e6edf3', points: l1.spawns.map((s, i) => ({ x: i, y: s.cum / 1e6 })) }], { markers: [{ at: firstBuild, label: 'first build spawn', color: '#3fb950' }, ...userMarkers], xLabel: 'spawn # (0–103) — each point is a fresh forked thread', yFmt: v => v.toFixed(0) + 'M' })}
<div class="legend">
${Object.entries(PHASE_COLORS).map(([k, c]) => `<span style="--c:${c}">${k}: ${phaseCounts[k] || 0} spawns, +${((phaseDelta[k] || 0) / 1e6).toFixed(0)}M orchestrator tokens</span>`).join('')}
</div>
<p class="note"><b>${l1.spawns.filter((s, i) => i < firstBuild).length} planning/critique spawns precede the first build spawn.</b> After the first review, the run entered a fix→re-review spiral that consumed more orchestrator tokens than everything before it. The founder intervened mid-run — and each intervention cost another wave of spawns:</p>
<blockquote>"can you please identify where this overengineering came from"<span class="src">user turn at 204.6M cumulative → spawned l1_overengineering_retro, then simplification rounds</span></blockquote>
<blockquote>"yeez. that architecutre is too long…"<span class="src">user turn at 400.8M cumulative → concise-architecture rewrite chain (spawns 88–93)</span></blockquote>
<blockquote>"can you please bring the worktree back into the state of the…"<span class="src">user turn at 420.5M cumulative → rollback after a failed rewrite</span></blockquote>
<p class="note">This single run shows the quality problem and the token problem are the same problem: <b>scope and structure were decided during coding, not before it</b>, and every correction re-entered the full machinery.</p>`)}

${card('8. Per-work-package spend (Claude fleet, by branch)', `
<table>
<tr><th>WP</th><th class="num">sessions</th><th class="num">cache reads</th><th class="num">output</th><th class="num">edits</th><th>note</th></tr>
${wpRows.map(([wp, w]) => `<tr><td>${wp}</td><td class="num">${w.sessions.toLocaleString()}</td><td class="num">${B(w.cacheRead)}B</td><td class="num">${M(w.output + w.sideOutput)}M</td><td class="num">${w.edits.toLocaleString()}</td><td class="note">${w.edits === 0 ? '<span style="color:#f85149">zero edits — pure overhead sessions</span>' : ''}</td></tr>`).join('')}
</table>
<p class="note">AU20 and AU21 each accumulated thousands of Claude sessions on their branches; AU20's Claude-side sessions contain <b>zero edits</b> — coordination and subagent churn only. (The heavy AU20 build ran in the codex tree of §3.)</p>`)}

${card('9. Corroborating records from the pipeline itself', `
<blockquote>"Documentation-only 6-phase pipeline was 2.3× over-engineered; lightweight 3-phase pipeline recommended for future audits."<span class="src">~/hyperidle/.pipeline/retro-log/Z8.jsonl — rigidity, measured by the system itself</span></blockquote>
<blockquote>"Solution over-scoping — pipeline elaborates an enterprise-grade solution beyond founder intent for a pre-alpha product; founder resets scope, discarding built work. Dominant recent nimmly failure, all July, escalating."<span class="src">.pipeline/compound-candidates.md — C12, CONFIRMED, 6 WPs</span></blockquote>
<blockquote>"SendMessage tool unavailable… forcing fresh planner/reviewer spawn at each phase… Each re-spawn paid cache-setup + artifact re-read cost (~2–3 min)."<span class="src">20 occurrences across .pipeline/retro-log/*.jsonl — the respawn tax, pre-fork era</span></blockquote>
<blockquote>"Claude is re-reading the same files: 2,868 redundant re-reads. Top repeats: architecture.md (260×)."<span class="src">codeburn optimize — artifact re-read tax</span></blockquote>
<blockquote>"Round 2→3 was AVOIDABLE — it existed only to revert the W-2 over-tightening…"<span class="src">nimmly retro-log — round multiplication from orchestrator drift</span></blockquote>`)}

${card('10. What this implies for the skills', `
<p class="note" style="font-size:14px;line-height:1.75">
<b>1. The unit of cost is the spawned thread, not the prompt byte.</b> Fork-per-phase + fork-per-round is the dominant term (53–83% of input in top runs). Skill leanness (T1) helps at the margin; thread economics are the prize.<br>
<b>2. Small work must never enter multi-thread machinery.</b> 74% of productive trees run &gt;1000:1; a compact single-agent profile removes both the fork tax and the polling loop for the majority of work chunks (flexibility WP).<br>
<b>3. Polling is an orchestration instruction problem.</b> "Spawn and wait" should become "spawn and continue / batch-check", or disappear entirely in compact mode.<br>
<b>4. Rounds are the multiplier — decisions made during code are the root cause.</b> Every critique/review/fix round is a fresh fork over a grown context. Front-loaded program design (shape-of-code before build) plus hard round caps attack the same root: structure decided before coding, not discovered by review (quality WP).<br>
<b>5. Over-engineering is one problem with two bills.</b> The L1 founder interventions show scope correction paid in tokens and in discarded code (+138k churned vs +1.9k shipped). Scope/ambition governance belongs at plan time (C12), where it is nearly free, not at review time, where it costs rounds.<br>
<b>6. Measure continuously.</b> tools/session-lab now parses both transcript formats and can re-run after every change — before/after comparisons per WP become possible.
</p>`)}

<p class="sub" style="margin-top:28px">Generated by <code>tools/session-lab</code>: fleet-codex.mjs, fleet-claude.mjs, aggregate.mjs, parse-codex.mjs, analyze.mjs, tree.mjs, dashboard.mjs. Reproduce: <code>node tools/session-lab/fleet-codex.mjs &amp;&amp; node tools/session-lab/fleet-claude.mjs &amp;&amp; node tools/session-lab/aggregate.mjs &amp;&amp; node tools/session-lab/dashboard.mjs</code></p>
</body></html>`;

const out = process.argv[2] || 'tools/session-lab/report.html';
writeFileSync(out, html);
console.log(`wrote ${out} (${html.length} bytes)`);
