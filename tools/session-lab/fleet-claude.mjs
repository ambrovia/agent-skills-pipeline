#!/usr/bin/env node
// Fleet scan of Claude Code session jsonl files. One record per session file.
// Attributes assistant-message token usage to attributionSkill (pipeline skills).
import { readdirSync, statSync, writeFileSync, createReadStream } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const HOME = process.env.HOME;
const DIRS = [`${HOME}/.claude/projects`];

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (e.endsWith('.jsonl')) yield p;
  }
}

async function extract(file) {
  const r = {
    file, id: null, cwd: null, branch: null, start: null, end: null, version: null,
    input: 0, cacheRead: 0, cacheWrite: 0, output: 0, msgs: 0,
    sideInput: 0, sideCacheRead: 0, sideOutput: 0, sideMsgs: 0,
    tools: {}, skills: {}, userTurns: 0, edits: 0, reads: 0, bash: 0, agentSpawns: 0,
    pipelineMention: false, wpIds: [],
  };
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.timestamp) { if (!r.start) r.start = o.timestamp; r.end = o.timestamp; }
    if (!r.cwd && o.cwd) r.cwd = o.cwd;
    if (!r.branch && o.gitBranch) r.branch = o.gitBranch;
    if (!r.id && o.sessionId) r.id = o.sessionId;
    if (!r.version && o.version) r.version = o.version;

    if (o.type === 'user') {
      const text = typeof o.message?.content === 'string' ? o.message.content : JSON.stringify(o.message?.content || '').slice(0, 500);
      if (!o.isMeta && !o.isSidechain) {
        r.userTurns++;
        if (/pipeline|work package|\$\w{1,2}\d{1,2}\b/i.test(text)) r.pipelineMention = true;
        const ids = text.match(/\b[A-Z]{1,2}\d{1,2}\b/g);
        if (ids) for (const id of ids) if (!r.wpIds.includes(id) && r.wpIds.length < 8) r.wpIds.push(id);
      }
    } else if (o.type === 'assistant' && o.message?.usage) {
      const u = o.message.usage;
      const inp = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      const cr = u.cache_read_input_tokens || 0;
      const out = u.output_tokens || 0;
      r.msgs++;
      if (o.isSidechain) {
        r.sideMsgs++; r.sideInput += inp; r.sideCacheRead += cr; r.sideOutput += out;
      } else {
        r.input += inp; r.cacheRead += cr; r.output += out;
        const sk = o.attributionSkill || '(none)';
        const s = r.skills[sk] || { input: 0, cacheRead: 0, output: 0, msgs: 0 };
        s.input += inp; s.cacheRead += cr; s.output += out; s.msgs++;
        r.skills[sk] = s;
      }
      for (const b of o.message.content || []) {
        if (b.type !== 'tool_use') continue;
        r.tools[b.name] = (r.tools[b.name] || 0) + 1;
        if (b.name === 'Edit' || b.name === 'Write' || b.name === 'MultiEdit') r.edits++;
        else if (b.name === 'Read') r.reads++;
        else if (b.name === 'Bash') r.bash++;
        else if (b.name === 'Agent' || b.name === 'Task') r.agentSpawns++;
      }
    }
  }
  return r;
}

const files = [];
for (const d of DIRS) { try { for (const f of walk(d)) files.push(f); } catch { /* skip */ } }
console.error(`found ${files.length} claude session files`);
const records = [];
let i = 0;
for (const f of files) {
  try { records.push(await extract(f)); } catch (e) { console.error(`fail ${f}: ${e.message}`); }
  if (++i % 300 === 0) console.error(`parsed ${i}/${files.length}`);
}
writeFileSync(process.argv[2] || '/tmp/claude-fleet.json', JSON.stringify(records));
console.error(`wrote ${records.length} records`);
