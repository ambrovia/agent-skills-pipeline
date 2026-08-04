---
name: ship
description: "Turn an approved, reviewed work package into a clean CI-green merge-ready PR. Consolidates the work-package folder, verifies, commits, updates the PR, and waits for CI; does not merge. Use only after implementation review is DONE and required human approval is recorded."
phase: 6
persona: pipeline-builder
applies-to: [frontend, backend, application, framework, infra]
argument-hint: "[work-package-id or branch description]"
user-invocable: true
---

# Ship

Ship is the final mutation and verification boundary before human merge.

## Preconditions

Confirm review verdict `DONE`, required human approval, intended diff, no unresolved blocking finding,
and no WP-ID leakage outside `.pipeline/**`. Stop rather than repairing product work in ship.

## Sequence

1. Consolidate `.pipeline/work/<id>/`. Fold the approved requirement, the as-built architecture and
   design decisions, and durable learnings into `plan.md`; keep `progress.json` and `retro.jsonl`; delete
   the superseded phase artifacts (`requirements.md`, `design/`, `architecture.md`, `feasibility.md`,
   `probes/`, `receipts/`, `integration.json`, `review.md`). Consolidation is editorial: never change the
   work-package outcome, constraints, or acceptance criteria, and never drop a decision a future reader
   needs. Anything worth keeping is in `plan.md` before the rest is removed — including every deferral,
   known limitation, and accepted residual risk that outlives the run. A deferral recorded only in a
   deleted artifact is a deferral nobody will ever act on.
2. Ensure retro and every intended change are present. Stage deliberately — inspect the worktree, commit
   intended changes with domain-based messages, revert unintended ones, and never stage the whole tree
   blindly. Never put the WP ID in branch, commit, or PR metadata.
3. Update pipeline state consistently and commit it before final verification.
4. Reconcile the target branch using the project's non-destructive VCS workflow. Never force-push shared
   history. On semantic conflict, return to implementation/review rather than improvising a fix here.
5. Run `{{verify}}` from a clean committed tree and wait for it to finish — an interrupted, backgrounded,
   or hook-bypassed run is not a green gate. Distinguish change-caused from pre-existing failures;
   required verification must pass under project policy.
6. If `{{vcs}}` is `none`, skip to the final attestation — the work is committed and verified and there is
   no PR or CI. Otherwise push and open or update a non-draft PR using `{{vcs}}`. Summarize outcome,
   evidence, and known non-blocking limitations without internal WP identifiers.
7. Wait for required CI. If CI fails, diagnose from the failing check's log, return to the owning phase,
   and re-enter ship with a changed strategy; any mutation repeats verification from step 3. After three
   failed attempts, stop and record the WP blocked.
8. Attest last that verification passed on the committed tree, CI is green where a PR exists, everything
   intended is pushed, and the worktree is clean. The attestation ends local mutation.

Stop at a CI-green merge-ready PR. A human decides whether to merge. Tagging and releases run only when
explicitly requested and configured; they are not part of ordinary ship completion.

## Target

$ARGUMENTS
