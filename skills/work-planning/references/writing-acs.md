# Writing good acceptance criteria

ACs are the contract between the spec and every downstream phase. They describe **what becomes true** when the work ships — not how to build it. The pipeline phases exist to decide the how: `/refine` sharpens the requirement, `/design` explores UX, `/architecture` plans implementation. ACs that prescribe the solution bypass those phases and produce brittle specs.

## The outcome rule

An AC describes the **observable state** a user, agent, or system is in after the work ships. It answers "what changed?" not "what was built?"

## What ACs should describe (by downstream consumer)

| Consumer | AC should describe | AC should NOT describe |
|---|---|---|
| `/design` (if a design system is configured and the WP has UI) | What the user understands, can do, or sees | Specific pages, layouts, component names, CSS values |
| `/architecture` | What behavior the system exhibits, what data is queryable | Specific tables, columns, endpoints, parameter names |
| `/write-tests` | What can be proven true or false | How to test it (test method is the plan's job) |
| `/review` | What to audit the code against | Implementation patterns or coding style |

## Good vs bad AC examples

| Bad AC | Why it's bad | Better version |
|---|---|---|
| "A `docs/index.md` exists containing a pitch, architecture overview, and concept list" | Prescribes file path and page structure — that's design/architecture work | "A first-time reader can explain what the project does in their own words after reading the product entry point" |
| "The profile page shows name, role, team, configuration summary, capability tier, creation date, and status" | Prescribes the exact UI layout — that's design work | "A team lead can see an entity's complete operational picture — identity, configuration, capabilities, activity, and health — in one view" |
| "Add `valid_from` timestamp and `valid_until` nullable timestamp columns to the records table" | Prescribes schema — that's architecture work | "Records track when they became valid and when they were superseded, queryable by date" |
| "The detail sheet reuses the existing sheet component pattern" | Prescribes component reuse — that's design/architecture | "Clicking an item shows its history and configuration without leaving the current page" |
| "Uses the existing rich-text editor component" | Names a specific component — that's architecture | "The authoring flow provides rich text editing for item bodies" |
| "Keyboard shortcuts: v to validate, e to edit, r to reject" | Prescribes the interaction design | "A reviewer can process the queue rapidly without reaching for the mouse" |

## The specificity gradient

ACs should be **specific about outcomes, vague about solutions.** The test: if two different planners would produce the same solution from your AC, it's too prescriptive. If two different reviewers can't agree on whether it passes, it's too vague.

- **Too vague:** "Item management works well" — no reviewer can audit this
- **Too prescriptive:** "List page has 3 tabs: Curated, Triage, Review, with server-side pagination and quick-search" — this is a design spec, not an AC
- **Right level:** "A human can find, review, and validate items efficiently, with the most important items surfaced first" — testable (time-on-task, can they find items?), but leaves room for design

## Structural ACs vs behavioral ACs

Some work packages are purely structural (schema changes, data model evolution). These CAN use specific structural language because there's no design/UX decision to make:

- **OK for backend-only WPs:** "Items can be queried as of a specific date, returning only items that were valid at that point" — structural behavior, no UI
- **OK for backend-only WPs:** "Superseded items are excluded from search results by default" — search behavior, testable

But even structural ACs should describe **behavior** ("items can be queried as of a date") not **implementation** ("add a `valid_from` timestamp column").

## The mental-state test (for UI work packages)

For any AC involving a human, ask: "What mental state is the user in after this?" The AC should describe that mental state:

- "The team lead understands which entities are healthy and which need attention" (mental state)
- "A maintainer can tell whether the system is getting better over time" (mental state)
- "A new user knows what to do next after completing the getting-started guide" (mental state)

If the AC describes what's on screen instead of what the user understands, it's prescribing design.

**Forbidden phrasings:** "is implemented", "is well-designed", "follows best practices", "is efficient", "is clean."

**Required quality:** Each AC must be provable true or false by a test (unit, integration, E2E, screenshot, eval, or human walkthrough for documentation WPs). If you can't imagine the test, the AC is too vague.
