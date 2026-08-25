import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const hook = resolve(new URL('..', import.meta.url).pathname, 'hooks/skill-load-inject.mjs');

function git(repo, ...args) {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function fixture({ verify = 'echo CHECKS-GREEN', status = 'in-progress', since: sinceOverride, config } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'pipeline-inject-'));
  git(root, 'init', '-q');
  writeFileSync(join(root, 'file.txt'), 'one\n');
  git(root, 'add', 'file.txt');
  git(root, '-c', 'user.email=t@t.t', '-c', 'user.name=t', 'commit', '-qm', 'base');
  const since = git(root, 'rev-parse', 'HEAD');
  writeFileSync(join(root, 'file.txt'), 'one\ntwo\n');

  const wp = join(root, '.pipeline', 'work', 'demo');
  mkdirSync(wp, { recursive: true });
  writeFileSync(join(wp, 'plan.md'), '# Demo fix\n\nOutcomes...\n');
  writeFileSync(join(wp, 'requirements.md'), 'REQ-MARKER value and scope\n');
  writeFileSync(join(wp, 'architecture.md'), 'ARCH-MARKER contracts and tasks\n');
  writeFileSync(join(wp, 'progress.json'), JSON.stringify({
    phase: 'review', status, since: sinceOverride ?? since,
  }));
  writeFileSync(join(root, 'pipeline.config.yml'), config ?? `verify: "${verify}"\n`);
  return { root, since, wp };
}

function run(root, format, payload, env = {}) {
  const args = [hook, format];
  const input = format === 'opencode' || format === 'codex'
    ? undefined
    : JSON.stringify(payload);
  if (format === 'opencode') args.push(payload);
  return spawnSync(process.execPath, args, {
    cwd: root, input, encoding: 'utf8', env: { ...process.env, ...env },
  });
}

const skillPayload = (skill) => ({ tool_name: 'Skill', tool_input: { skill } });

function claudeContext(result) {
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
}

test('review skill gets state, fresh check results, and the diff', () => {
  const { root, since } = fixture();
  const result = run(root, 'claude', skillPayload('review'));
  assert.equal(result.status, 0);
  const context = claudeContext(result);
  assert.match(context, /skill: review, wp: demo/);
  assert.match(context, /title: Demo fix/);
  assert.match(context, /## checks — echo CHECKS-GREEN \(exit 0, tree [0-9a-f]+\+dirty\)/);
  assert.match(context, /CHECKS-GREEN/);
  assert.match(context, new RegExp(`## diff since ${since.slice(0, 7)}|## diff since ${since}`));
  assert.match(context, /\+two/);
});

test('check results are cached for stale fallback', () => {
  const { root, wp } = fixture();
  run(root, 'claude', skillPayload('review'));
  const cached = spawnSync('cat', [join(wp, 'checks-latest.log')], { encoding: 'utf8' }).stdout;
  assert.match(cached, /CHECKS-GREEN/);
});

test('architecture-critique gets the critiqued artifacts with paths', () => {
  const { root } = fixture();
  const result = run(root, 'claude', skillPayload('architecture-critique'));
  const context = claudeContext(result);
  assert.match(context, /ARCH-MARKER/);
  assert.match(context, /# Demo fix/);
  assert.match(context, /\.pipeline\/work\/demo\/architecture\.md — already in context, do not re-read/);
  assert.doesNotMatch(context, /REQ-MARKER/);
});

test('build skills are told their checks predate the session edits', () => {
  const { root } = fixture();
  const context = claudeContext(run(root, 'claude', skillPayload('write-code')));
  assert.match(context, /baseline, ran before this session's edits/);
  assert.doesNotMatch(context, /## diff/);
});

test('checks.preSpawn overrides verify and keeps a quoted #', () => {
  const { root } = fixture({
    config: 'verify: "echo FULL-GATE"\nchecks:\n  preSpawn: "echo FAST#TAG"\n',
  });
  const context = claudeContext(run(root, 'claude', skillPayload('review')));
  assert.match(context, /## checks — echo FAST#TAG/);
  assert.match(context, /FAST#TAG/);
  assert.doesNotMatch(context, /FULL-GATE/);
});

test('a flag-shaped since is never handed to git', () => {
  const { root } = fixture({ since: '--stat' });
  const context = claudeContext(run(root, 'claude', skillPayload('review')));
  assert.doesNotMatch(context, /## diff/);
});

test('the work package with the newest progress.json wins', () => {
  const { root, wp } = fixture();
  // Created second, so its *directory* mtime is the newer one — but its state
  // is older, and directory mtimes do not move on an in-place progress write.
  const stale = join(root, '.pipeline', 'work', 'stale');
  mkdirSync(stale, { recursive: true });
  writeFileSync(join(stale, 'plan.md'), '# Stale package\n');
  writeFileSync(join(stale, 'progress.json'), JSON.stringify({ phase: 'build', status: 'in-progress' }));
  const long_ago = Date.now() / 1000 - 600;
  utimesSync(join(stale, 'progress.json'), long_ago, long_ago);
  assert.ok(statSync(stale).mtimeMs >= statSync(wp).mtimeMs, 'fixture must give the stale WP the newer dir mtime');

  const context = claudeContext(run(root, 'claude', skillPayload('review')));
  assert.match(context, /wp: demo/);
  assert.doesNotMatch(context, /wp: stale/);
});

test('non-pipeline skills get no injection', () => {
  const { root } = fixture();
  const result = run(root, 'claude', skillPayload('some-other-skill'));
  assert.equal(result.stdout, '');
});

test('no active work package means silence', () => {
  const root = mkdtempSync(join(tmpdir(), 'pipeline-inject-empty-'));
  const result = run(root, 'claude', skillPayload('review'));
  assert.equal(result.stdout, '');
});

test('done work packages are not injected', () => {
  const { root } = fixture({ status: 'done' });
  const result = run(root, 'claude', skillPayload('review'));
  assert.equal(result.stdout, '');
});

test('slow checks fall back to the stale cache', () => {
  const { root, wp } = fixture({ verify: 'sleep 2' });
  writeFileSync(join(wp, 'checks-latest.log'), 'EARLIER-GREEN\n');
  const result = run(root, 'claude', skillPayload('review'), { PIPELINE_CHECK_TIMEOUT_MS: '300' });
  const context = claudeContext(result);
  assert.match(context, /STALE/);
  assert.match(context, /EARLIER-GREEN/);
});

test('opencode format prints plain text', () => {
  const { root } = fixture();
  const result = run(root, 'opencode', 'review');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /skill: review, wp: demo/);
  assert.match(result.stdout, /CHECKS-GREEN/);
  assert.doesNotMatch(result.stdout, /hookSpecificOutput/);
});

test('codex stays silent until its hook contract supports injection', () => {
  const { root } = fixture();
  const result = run(root, 'codex', 'review');
  assert.equal(result.stdout, '');
});

test('kill switch disables injection', () => {
  const { root } = fixture();
  const result = run(root, 'claude', skillPayload('review'), { PIPELINE_SKILL_INJECT: 'off' });
  assert.equal(result.stdout, '');
});

test('malformed payload never breaks the load', () => {
  const { root } = fixture();
  const result = spawnSync(process.execPath, [hook, 'claude'], {
    cwd: root, input: 'not json', encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});
