import { parseCodexRollout } from './parse-codex.mjs';

const POLL_TOOLS = new Set(['wait_agent', 'wait', 'list_agents']);
const READ_CMD = /^\s*(cat|head|tail|sed|less|rg|grep|find|ls|wc)\b/;

function normCmd(cmd) {
  return String(cmd).replace(/\s+/g, ' ').trim().slice(0, 200);
}

function extractReadPath(cmd) {
  const c = String(cmd);
  const m = c.match(/(?:cat|head|tail|less)\s+(?:-\S+\s+)*([^\s|;&]+)/)
    || c.match(/sed\s+-n\s+'[^']*'\s+([^\s|;&]+)/)
    || c.match(/(?:rg|grep)\s+(?:-\S+\s+)*(?:'[^']*'|"[^"]*"|\S+)\s+([^\s|;&>]+)/);
  if (!m) return null;
  const p = m[1];
  return p.includes('/') && !p.startsWith('-') ? p : null;
}

const PHASE_MARKERS = [
  ['work-planning', /\bwork-planning\b|\/work-planning|register work package/i],
  ['refine', /\brefine\b|requirements\.md/i],
  ['design', /\/design\b|design\/approved\.md|design-critique/i],
  ['architecture', /architecture\.md|\/architecture|architecture-critique|feasibility/i],
  ['write-tests', /write-tests|red evidence|failing test/i],
  ['build', /write-code|\/build|implement/i],
  ['review', /\/review\b|review\.md|verdict|NOT DONE|blocking finding/i],
  ['retro', /\/retro|retro\.jsonl/i],
  ['ship', /\/ship|opens? (the )?PR|CI green/i],
];

export function analyzeSession(s) {
  const toolCounts = {};
  let pollCalls = 0, pollOutputBytes = 0;
  let execCalls = 0, execFailed = 0;
  const cmdSequence = [];
  const readsByPath = {};
  const patchesByFile = {};
  let patchedFiles = new Set();
  let additions = 0, deletions = 0;

  for (const c of s.toolCalls) {
    toolCounts[c.name] = (toolCounts[c.name] || 0) + 1;
    if (POLL_TOOLS.has(c.name)) { pollCalls++; pollOutputBytes += c.outputBytes; }
    if (c.name === 'exec_command' || c.name === 'shell') {
      execCalls++;
      const cmd = c.args.cmd || (Array.isArray(c.args.command) ? c.args.command.join(' ') : c.args.command) || '';
      if (c.failed) execFailed++;
      cmdSequence.push({ ts: c.ts, cmd: normCmd(cmd), failed: c.failed });
      if (READ_CMD.test(cmd)) {
        const p = extractReadPath(cmd);
        if (p) readsByPath[p] = (readsByPath[p] || 0) + 1;
      }
    }
  }

  for (const p of s.patches) {
    for (const f of p.files) {
      patchedFiles.add(f.path);
      additions += f.add;
      deletions += f.del;
      patchesByFile[f.path] = (patchesByFile[f.path] || 0) + 1;
    }
  }

  // retry chains: same normalized command repeated within a window of 6 calls
  const retryChains = [];
  for (let i = 0; i < cmdSequence.length; i++) {
    let run = 1;
    while (i + run < cmdSequence.length && cmdSequence[i + run].cmd === cmdSequence[i].cmd && run < 50) run++;
    if (run >= 3) retryChains.push({ cmd: cmdSequence[i].cmd, count: run, ts: cmdSequence[i].ts });
    if (run > 1) i += run - 1;
  }

  // token economics
  const tot = { input: 0, cached: 0, output: 0, reasoning: 0 };
  for (const t of s.tokenEvents) {
    tot.input += t.input; tot.cached += t.cached; tot.output += t.output; tot.reasoning += t.reasoning;
  }
  const nTe = s.tokenEvents.length;
  const avgContextPerCall = nTe ? Math.round(tot.input / nTe) : 0;
  const cacheRate = tot.input ? tot.cached / tot.input : 0;

  // poll cost estimate: each poll is a model call over the avg context
  const pollContextTokens = pollCalls * avgContextPerCall;

  // phase detection from messages
  const allText = [
    ...s.userMessages.map(m => m.text),
    ...s.agentMessages.map(m => m.text),
  ].join('\n');
  const phases = PHASE_MARKERS.filter(([, re]) => re.test(allText)).map(([n]) => n);
  const wpIds = [...new Set(allText.match(/\b(?:AU|AV|AW|[A-MW-Z])\d{1,2}\b/g) || [])].slice(0, 12);
  const pipelineRun = /pipeline|work package|SKILL\.md/.test(allText);

  const reReads = Object.entries(readsByPath).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);
  const rePatches = Object.entries(patchesByFile).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);

  const started = s.subagents.filter(a => a.kind === 'started');
  const agentPaths = [...new Set(started.map(a => a.path))];

  return {
    file: s.file,
    id: s.id,
    cwd: s.cwd,
    agentPath: s.agentPath || null,
    threadSource: s.threadSource || null,
    parentThread: s.parentThread || null,
    start: s.start,
    end: s.end,
    durationMin: s.start && s.end ? Math.round((new Date(s.end) - new Date(s.start)) / 60000) : null,
    contextWindow: s.contextWindow,
    userTurns: s.userMessages.length,
    toolCalls: s.toolCalls.length,
    toolCounts,
    pollCalls,
    pollShare: s.toolCalls.length ? pollCalls / s.toolCalls.length : 0,
    pollContextTokens,
    execCalls,
    execFailed,
    compactions: s.compactions.length,
    aborts: s.aborts.length,
    tokens: tot,
    avgContextPerCall,
    cacheRate,
    modelInferences: nTe,
    retryChains,
    reReads: reReads.slice(0, 15),
    rePatches: rePatches.slice(0, 15),
    patchedFileCount: patchedFiles.size,
    additions,
    deletions,
    phases,
    wpIds,
    pipelineRun,
    subagentSpawns: started.length,
    subagentThreads: new Set(s.subagents.map(a => a.thread)).size,
    agentPaths,
    contextCurve: s.tokenEvents.filter((_, i) => i % Math.max(1, Math.floor(nTe / 200)) === 0)
      .map(t => ({ ts: t.ts, input: t.input, cached: t.cached, output: t.output })),
    compactionTimes: s.compactions.map(c => c.ts),
  };
}
