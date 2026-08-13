#!/usr/bin/env node
// Fleet scan: parse every codex rollout, emit one compact record per thread,
// then link threads into trees via parent_thread_id and aggregate per root.
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const HOME = process.env.HOME;
const SESSIONS = `${HOME}/.codex/sessions`;

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
    file, id: null, parentId: null, forkedFrom: null, threadSource: null, agentPath: null,
    cwd: null, start: null, end: null,
    input: 0, cached: 0, output: 0, reasoning: 0, calls: 0,
    polls: 0, execs: 0, execFailed: 0, patches: 0, filesPatched: new Set(),
    adds: 0, dels: 0, compactions: 0, aborts: 0, spawns: 0,
    userTurns: 0, model: null, bytes: 0,
  };
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const p = o.payload || {};
    if (o.timestamp) { if (!r.start) r.start = o.timestamp; r.end = o.timestamp; }
    if (o.type === 'session_meta' && !r.id) {
      r.id = p.id; r.parentId = p.parent_thread_id || null; r.forkedFrom = p.forked_from_id || null;
      r.threadSource = p.thread_source || null; r.agentPath = p.agent_path || null; r.cwd = p.cwd || null;
    } else if (o.type === 'event_msg') {
      if (p.type === 'token_count') {
        const last = p.info?.last_token_usage || {};
        r.input += last.input_tokens || 0; r.cached += last.cached_input_tokens || 0;
        r.output += last.output_tokens || 0; r.reasoning += last.reasoning_output_tokens || 0;
        r.calls++;
      } else if (p.type === 'sub_agent_activity') { if (p.kind === 'started') r.spawns++; }
      else if (p.type === 'context_compacted') r.compactions++;
      else if (p.type === 'turn_aborted') r.aborts++;
      else if (p.type === 'user_message') r.userTurns++;
      else if (p.type === 'patch_apply_end') {
        r.patches++;
        for (const [path, ch] of Object.entries(p.changes || {})) {
          r.filesPatched.add(path);
          const d = ch.unified_diff || '';
          for (const l of d.split('\n')) {
            if (l.startsWith('+') && !l.startsWith('+++')) r.adds++;
            else if (l.startsWith('-') && !l.startsWith('---')) r.dels++;
          }
        }
      }
    } else if (o.type === 'turn_context' && p.model && !r.model) {
      r.model = p.model;
    } else if (o.type === 'response_item' && p.type === 'function_call') {
      if (p.name === 'wait_agent' || p.name === 'wait' || p.name === 'list_agents') r.polls++;
      else if (p.name === 'exec_command' || p.name === 'shell') r.execs++;
    }
  }
  r.filesPatchedCount = r.filesPatched.size;
  delete r.filesPatched;
  return r;
}

const files = [...walk(SESSIONS)];
console.error(`found ${files.length} rollout files`);
const records = [];
let i = 0;
for (const f of files) {
  try { records.push(await extract(f)); } catch (e) { console.error(`fail ${f}: ${e.message}`); }
  if (++i % 200 === 0) console.error(`parsed ${i}/${files.length}`);
}
writeFileSync(`${process.argv[2] || '/tmp/codex-fleet.json'}`, JSON.stringify(records));
console.error(`wrote ${records.length} records`);
