---
name: retro
description: "Collect observations from all sources after a work package or pipeline run. Use at the end of a work package (or the whole pipeline) to log what went well and what created friction. Observe, don't fix. Trigger: 'retro <wp-id>', 'last-session', or 'pipeline'."
phase: 5
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Retro — record what happened, so the same mistakes stop repeating

## When this runs

After a work package finishes (success OR failure), or at the end of a full pipeline
run. It is the observation pass that feeds `/compound`, which mines the log for recurring
patterns and proposes process improvements. A single friction noted three times becomes an
actionable change.

**Skip condition:** none — retro applies to every project type. There is no design-system
or framework dependency here.

**Why it matters:** without recording what went well and what didn't, the same mistakes
repeat every work package. Observations compound; the log is the memory.

## What it produces

Appended lines in `.pipeline/work/<id>/retro.jsonl` — **one file per work package**,
co-located with the rest of the work package's state, created if absent. Each observation is one JSON line:

```json
{"date": "2026-06-16", "workpackage": "A1", "type": "friction|failure|gap|success|escalation", "observation": "specific sentence", "severity": "low|medium|high|critical", "tags": ["consistent", "tags"]}
```

The per-work-package split is deliberate: a single shared log produces a merge conflict every time
two branches each append. Writing to `.pipeline/work/<id>/retro.jsonl` means parallel
branches touch different files and never collide. Always write to the file co-located with the work
package you are retro-ing — never a shared log. (If the target is a whole pipeline run spanning
work packages, write each entry to its own work package's file.)

## Steps

Collect insights about `<target>` from every available source:

1. **Pipeline progress** — read `.pipeline/work/<id>/progress.json` for attempts, step
   failures, and blocked work packages. Cross-check against the per-track
   `.pipeline/<track>.md` and `.pipeline/work/<id>/plan.md` for what was meant
   to happen vs. what did.
2. **VCS history** — use {{vcs}} / `git log` for commits, reverts, fixups. How many
   commits? Any rework? Did CI fail and force a redo?
3. **Inline annotations** — search the changed files for `@lore` annotations and for
   `TODO`/`FIXME`/`HACK` markers added during implementation. Lore captured during the
   work package is evidence of decisions and workarounds worth recording.
4. **Verification** — did `{{verify}}` reveal anything painful? Tests that were hard to
   write, kept failing, or had to be rewritten? A check that was slow or flaky?
5. **Agent sessions** — spawn an Explore agent (a fast model is fine) to scan recent
   conversation artifacts, task outputs, and any `.pipeline/logs/` for errors, retries,
   permission denials, timeouts, and context-compaction events.

Record successes too — they confirm what's working and protect good practices from being
optimized away later. If something is actively broken and will break the next work
package, record it as `escalation` with `critical` severity and output a warning.

### Reusing known frictions

Before writing a new free-text observation, check `.pipeline/compound-candidates.md` for
existing candidate IDs:

- If a friction matches an existing **CONFIRMED** candidate, reference its ID (e.g.
  `"CC-002"`) in the observation instead of restating the issue.
- If a previously **RESOLVED** candidate has returned, change its status in the tracker to
  `RECURRED` and note which fix didn't stick.
- Only invent a new free-text observation for frictions with no matching tracker row.

If no tracker exists yet, just append free-text observations — `/compound` will cluster
them when it first runs.

## Rules

- **Observe, don't fix.** Recording is your job; changing the process is `/compound`'s
  job. Do not edit configs, skills, or code here.
- **Be specific.** "tests were hard" is useless; "FK-constraint test needed pragma setup
  not documented anywhere" is actionable.
- **One observation per line.** Don't bundle multiple issues into one record.
- **Tag consistently.** Read existing tags in the log and reuse them rather than coining
  near-duplicates.
- **Record successes.** They protect working practices from removal during future
  optimization.
- **Escalate rarely.** Reserve `escalation` / `critical` for things actively broken that
  will definitely break the next work package.

## Done when

- Every source above has been checked for `<target>`.
- Each distinct observation is appended as its own JSON line in
  `.pipeline/work/<id>/retro.jsonl`.
- Any matching compound candidates have been referenced or updated in the tracker.
- Any `critical` escalation is also surfaced as a visible warning in the output.

## Target

$ARGUMENTS
