---
name: ship
description: "Turn completed work into a clean CI-green merge-ready PR. Consolidates the item folder when one exists, verifies, commits, updates the PR, and waits for CI; does not merge. Review and approval gates belong to the pipeline skill."
persona: pipeline-builder
applies-to: [frontend, backend, application, framework, infra]
argument-hint: "[item-id or branch description]"
user-invocable: false
---

# Ship

Ship is the final mutation and verification boundary before human merge.

## Preconditions

Start from the injected state, then confirm the intended diff and, when an item exists, that no item
identifier leaks outside `.pipeline/**`. Stop rather than repairing product work in ship.

## Sequence

1. When an item ran, reduce `.pipeline/work/<id>/` to **`plan.md` and `retro.jsonl`** — what was
   agreed, and what was learned. Everything else is working material and does not survive the merge:
   `design/`, `architecture.md`, `feasibility.md`, `probes/`, `receipts/`, `integration.json`,
   `review.md`, `checks-latest.log`, `progress.json`. Delete the plan's `## Confusions` and
   `## Proposed items` sections too, once `/retro` has recorded the first and the maintainer has seen
   the second.

   The retro stays where it was written. Never merge it into a shared log — one file per item is what
   keeps concurrent branches from colliding, and `/compound` reads across the work folders.

   **Do not otherwise rewrite `plan.md`.** Never fold an as-built architecture into it.

   **Durable knowledge goes to `@lore`** before the rest is deleted — an accepted limitation, a
   residual risk, a non-obvious constraint the next person will trip over. A deferral recorded only
   in a deleted artifact is a deferral nobody will ever act on.
2. Ensure the retro (when an item ran) and every intended change are present. Stage deliberately —
   inspect the worktree, commit intended changes with domain-based messages, revert unintended ones, and
   never stage the whole tree blindly. Never put an item ID in branch, commit, or PR metadata.
3. Bring `progress.json` up to date and commit it before final verification.
4. Reconcile the target branch using the project's non-destructive VCS workflow. Never force-push shared
   history. On semantic conflict, return to implementation/review rather than improvising a fix here.
5. Run `{{verify}}` from a clean committed tree and wait for it to finish — an interrupted, backgrounded,
   or hook-bypassed run is not a green gate. Distinguish change-caused from pre-existing failures;
   required verification must pass under project policy.
6. If `{{vcs}}` is `none`, ship ends here — the work is committed and verified, with no PR or CI.
   Otherwise push and open or update a non-draft PR using `{{vcs}}`. Summarize outcome, evidence, and
   known non-blocking limitations without internal item identifiers.
7. Wait for required CI. If CI fails, diagnose from the failing check's log, hand the failure back to
   whoever owns it — the builder for code, the maintainer for anything the plan got wrong — and
   re-enter ship with a changed strategy; any mutation repeats verification from step 5. After three
   failed attempts, stop and report the item blocked with the failing check and what you tried.

Stop at a CI-green merge-ready PR. A human decides whether to merge. Tag or release only when
explicitly requested and configured.

## Target

$ARGUMENTS
