---
name: ship
description: "Verify, commit, push, and wait for CI green — the single gate between code and a merge-ready PR. Use to ship a completed work package: run the verify command, open/ready a PR via the project's VCS, and confirm CI is green. Stops at CI-green PR open; does not merge."
phase: 6
persona: pipeline-builder
applies-to: [frontend, backend, application, framework, infra]
argument-hint: "[work-package-id or branch description]"
user-invocable: true
---

# Ship — the gate between code and a merge-ready PR

> **Applies once a work package has passing local code.** If the project sets
> `vcs: none`, stop after `{{verify}}` is green and the changes are committed —
> there is no PR/CI to wait on.

**Why:** A clean main branch ensures the next change starts from a reliable
basis. Clean git history makes it possible to understand what changed and why.

**Ship is not done until CI is green.** Local verify is necessary but not
sufficient — the PR check must pass.

## When this runs

Phase 6, after code review has emitted a DONE verdict for the work package and
the change is locally complete.

## What it produces

A pushed branch with a CI-green PR open against the main branch, left for a human
to merge.

## Steps

### 0. Code-review gate (MANDATORY — do not skip)

Verify that code review is complete before shipping. Check that the pipeline-reviewer
emitted "Verdict: DONE" for this work package (see
`.pipeline/progress/<id>.json`). If no review verdict exists, stop — do not
proceed to verify/ship. Shipping without code review is a process violation, not
an efficiency gain.

### 1. Stage and commit all code changes

Stage files intentionally — never `git add -A` or `git add .`.

Commit with `<type>(<scope>): <imperative description>` referencing the work
package ID. If changes span multiple logical units, make multiple atomic commits.

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`. Choose a scope that
names the affected area of `{{paths.source}}`, or omit it.

### 2. Merge the main branch (MANDATORY — do not skip)

Merge the latest main before verifying so verify runs against the tree that will
actually merge. This prevents surprises when main has moved since the branch was
created.

```bash
git fetch origin main
git merge origin/main --no-edit
```

If there are merge conflicts, resolve them and commit the merge. The working tree
must be **completely clean** before proceeding.

### 3. Pre-flight validation (MANDATORY — do not skip)

Run the project's verify command:

```bash
{{verify}}
```

This is non-negotiable. Do not ship with failures. Do not bypass commit hooks
(no `--no-verify`). Do not rationalize "pre-existing failures" — if it's red, fix
it or document why it's blocked and stop.

The working tree must be clean when verify runs, so that what you validate is
exactly what you push.

(Optional: projects MAY cache a signed verify attestation to skip re-running CI;
off by default.)

### 4. Push

```bash
git push -u origin HEAD
```

Never force push — history is shared.

### 5. Open or update the PR

Using the project's VCS ({{vcs}}):

- If no PR exists yet, **open a PR** titled `<type>(<scope>): <description>` with
  a body containing a `## Summary` (what changed and why) and a `## Verification`
  note (`{{verify}}` — all green).
- If a **draft PR** already exists (pipeline mode), flip it to **ready**.

Main is protected — commits only land via pull request.

### 6. Wait for CI green (MANDATORY — do not skip)

Poll the PR's checks until CI reports a result. **Ship is not complete until CI
is green.**

**If CI is red:**
1. Pull the failure log for the failing check.
2. Read the error message and identify the cause. Common causes: a check that
   passes locally but not in CI (environment difference), or code committed after
   verify ran (re-run verify on the final tree).
3. Fix the issue, then re-run from step 2 (merge main, verify, push).
4. Max 3 push attempts. After 3, mark the work package `blocked` with reason
   `ci-red-after-3-fixes` in `.pipeline/progress/<id>.json`.

**Ship is only complete when the PR checks return green.** Do not declare success
before this.

### 7. Merge decision

**Do NOT merge automatically.** Ship stops at "CI-green PR open." Merging is a
human decision — leave the PR open and re-runnable for the maintainer.

## Rules

- **Never ship failing verify** — fix first.
- **Never skip the merge-main step** — stale branches are a common CI failure cause.
- **Never declare ship complete before CI is green** — local green is not enough.
- **Never `git add -A`** — stage specific files.
- **Never force push** — history is shared.
- **Never bypass commit hooks** (`--no-verify`) — hooks exist for a reason.
- **Never merge** — leave the PR for the maintainer.
- **One PR per work package** in pipeline mode.

## Releasing (optional, project-specific)

If the project ships versioned releases (binaries, packages, deployments), the
release flow is whatever that project defines — typically: stage artifacts
locally (build/sign/notarize where needed), bump versions, open a release PR, and
let CI publish/deploy **on merge**. Keep two invariants regardless of stack:

- **The version-bump merge is what triggers publish/deploy.** A local release
  script should *stage*, not push or publish — publishing is CI's job.
- **A release guard check** should verify staged artifacts (present + checksum
  matches a manifest) so a version bump can't merge half-built.

Consult the project's own release/deployment docs in `{{paths.docs}}` for the
exact commands and credentials.

## Done when

- Code review verdict is DONE for the work package.
- `{{verify}}` passed on a clean, main-merged tree.
- The branch is pushed and a PR is open (or readied) via {{vcs}}.
- CI on the PR is green.
- The PR is left open for a human to merge.

## Target

$ARGUMENTS
