---
name: ship
description: "Turn an approved, reviewed work package into a clean CI-green merge-ready PR. Verifies, commits, updates the PR, and waits for CI; does not merge. Use only after implementation review is DONE and required human approval is recorded."
phase: 11
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

1. Ensure retro and every intended change are present. Commit them with domain-based messages; never put
   the WP ID in branch, commit, or PR metadata.
2. Update pipeline state consistently and commit it before final verification.
3. Reconcile the target branch using the project's non-destructive VCS workflow. On semantic conflict,
   return to implementation/review rather than improvising a fix here.
4. Run `{{verify}}` from a clean committed tree. Distinguish change-caused from pre-existing failures;
   required verification must pass under project policy.
5. Push and open or update a non-draft PR using the project's VCS. Summarize outcome, evidence, and known
   non-blocking limitations without internal WP identifiers.
6. Wait for required CI. If CI fails, return to the owning phase; any mutation re-enters ship and repeats
   verification.
7. Attest last that CI is green, commits are pushed, and the worktree is clean.

Stop at a CI-green merge-ready PR. A human decides whether to merge. Tagging and releases run only when
explicitly requested and configured; they are not part of ordinary ship completion.

## Target

$ARGUMENTS
