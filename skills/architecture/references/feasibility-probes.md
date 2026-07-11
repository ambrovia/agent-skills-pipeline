# Feasibility probes — architecture's looked-at artifacts

Architecture's counterpart to `/design`'s `mockup.html`: before locking a technical plan, prove
the load-bearing assumptions are **actually doable** — not vibes, not "should work."

## When a probe is required

Run at least one probe when the plan depends on any assumption that, if wrong, forces a redesign:

- A third-party API, SDK, or SaaS whose limits/pricing/auth you haven't verified in this project
- A library or framework feature you haven't used here before (version constraints, breaking changes)
- A performance or scale claim (latency, throughput, row counts) without precedent in the codebase
- A cross-service integration whose wire format or auth flow is inferred, not read from code
- A deployment / infra capability (ports, IAM, quotas) not already exercised in this repo
- A data migration whose target backend accepts the proposed shape

**Skip probes** when every load-bearing decision reuses an existing, grep-verified pattern with no
new external dependency — say so explicitly in `feasibility.md` with file:line citations.

## Probe anatomy

Each probe lives under `.pipeline/work/<id>/probes/<slug>/`:

| File | Purpose |
|---|---|
| `hypothesis.md` | One sentence: what must be true for the plan to work |
| `method.md` | How you tested it — web research queries, doc URLs, or POC steps |
| `result.md` | What you found — quotes/links, command output, screenshots |
| `verdict.md` | `GO` \| `GO-WITH-CHANGE` \| `NO-GO` + what changes in the plan |

For code POCs, add a runnable artifact:

- `poc.ts` / `poc.py` / `poc.sh` — minimal script that exercises the risky integration
- `poc-output.txt` — captured stdout/stderr proving it ran

POCs are **throwaway** — they live under `.pipeline/work/<id>/probes/` (not `{{paths.source}}`). They exist
to de-risk the plan, not to ship.

## Web research discipline

- Search for the **specific version** the project pins (read lockfiles / package.json first).
- Prefer primary sources: official docs, release notes, OpenAPI specs, vendor status pages.
- Record URLs in `method.md` and the decisive fact in `result.md`.
- "Stack Overflow says yes" without a version match is not a probe — dig until you have a primary source or a POC.

## POC discipline

- Smallest possible surface: one API call, one query, one render, one migration against a scratch DB.
- Use the project's real toolchain (`{{verify}}` harness, test DB, docker compose) when available.
- Time-box: if a POC can't run in ~15 minutes, narrow the hypothesis or split the probe.
- A failed POC is valuable — `NO-GO` saves a week of building the wrong thing.

## The `feasibility.md` file (required for every plan)

`.pipeline/work/<id>/architecture.md` MUST reference `.pipeline/work/<id>/feasibility.md` (a summary table; raw evidence stays under `.pipeline/work/<id>/probes/`) summarizing:

```
## Feasibility

| Assumption | Probe | Verdict | Plan impact |
|---|---|---|---|
| Stripe webhooks accept … | probes/stripe-webhook | GO | none |
| SQLite migration handles JSON column … | probes/json-migration | GO-WITH-CHANGE | use TEXT + check constraint |

Unprobed assumptions: none — OR list each with why it reuses verified precedent (file:line).
```

`architecture-critique` treats any unprobed load-bearing assumption as CRITICAL.
