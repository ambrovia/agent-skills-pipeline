import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

export async function parseCodexRollout(filePath) {
  const s = {
    file: filePath,
    id: null,
    cwd: null,
    cliVersion: null,
    modelProvider: null,
    start: null,
    end: null,
    turns: [],
    tokenEvents: [],
    toolCalls: [],
    patches: [],
    compactions: [],
    aborts: [],
    subagents: [],
    agentMessages: [],
    userMessages: [],
    tasksStarted: 0,
    tasksComplete: 0,
    contextWindow: null,
  };

  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  let prevTotal = null;

  for await (const line of rl) {
    if (!line) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const ts = o.timestamp;
    if (ts) { if (!s.start) s.start = ts; s.end = ts; }
    const p = o.payload || {};

    switch (o.type) {
      case 'session_meta':
        if (!s.id) {
          s.id = p.id || p.session_id;
          s.cwd = p.cwd;
          s.cliVersion = p.cli_version;
          s.modelProvider = p.model_provider;
          s.threadSource = p.thread_source;
          s.agentPath = p.agent_path;
          s.forkedFrom = p.forked_from_id;
          s.parentThread = p.parent_thread_id;
        }
        break;
      case 'event_msg': {
        switch (p.type) {
          case 'user_message':
            s.userMessages.push({ ts, text: String(p.message || '').slice(0, 400) });
            break;
          case 'agent_message':
            s.agentMessages.push({ ts, text: String(p.message || '').slice(0, 400) });
            break;
          case 'token_count': {
            const last = p.info?.last_token_usage || {};
            const total = p.info?.total_token_usage || {};
            if (p.info?.model_context_window) s.contextWindow = p.info.model_context_window;
            s.tokenEvents.push({
              ts,
              input: last.input_tokens || 0,
              cached: last.cached_input_tokens || 0,
              output: last.output_tokens || 0,
              reasoning: last.reasoning_output_tokens || 0,
              cumOutput: total.output_tokens || 0,
              cumInput: total.input_tokens || 0,
              deltaTotal: prevTotal == null ? null : (total.total_tokens || 0) - prevTotal,
            });
            prevTotal = total.total_tokens || 0;
            break;
          }
          case 'sub_agent_activity':
            s.subagents.push({ ts, thread: p.agent_thread_id, path: p.agent_path, kind: p.kind });
            break;
          case 'patch_apply_end': {
            const files = [];
            for (const [path, ch] of Object.entries(p.changes || {})) {
              const diff = ch.unified_diff || '';
              let add = 0, del = 0;
              for (const l of diff.split('\n')) {
                if (l.startsWith('+') && !l.startsWith('+++')) add++;
                else if (l.startsWith('-') && !l.startsWith('---')) del++;
              }
              files.push({ path, type: ch.type, add, del });
            }
            s.patches.push({ ts, ok: p.success !== false, files });
            break;
          }
          case 'context_compacted':
            s.compactions.push({ ts });
            break;
          case 'turn_aborted':
            s.aborts.push({ ts, reason: p.reason, durationMs: p.duration_ms });
            break;
          case 'task_started': s.tasksStarted++; break;
          case 'task_complete': s.tasksComplete++; break;
        }
        break;
      }
      case 'compacted':
        s.compactions.push({ ts });
        break;
      case 'response_item': {
        if (p.type === 'function_call') {
          let args = {};
          try { args = JSON.parse(p.arguments || '{}'); } catch { args = { _raw: String(p.arguments).slice(0, 200) }; }
          const call = { ts, name: p.name, ns: p.namespace || '', args, outputBytes: 0, failed: false, outputPreview: '' };
          s.toolCalls.push(call);
        } else if (p.type === 'function_call_output') {
          const out = typeof p.output === 'string' ? p.output : JSON.stringify(p.output || '');
          const last = s.toolCalls[s.toolCalls.length - 1];
          if (last) {
            last.outputBytes = out.length;
            last.outputPreview = out.slice(0, 300);
            if (/exit code (?!0)\d|error|Error: FAILED|failed/i.test(out.slice(0, 400)) && /exit code|FAILED/i.test(out.slice(0, 400))) last.failed = true;
          }
        }
        break;
      }
    }
  }
  return s;
}
