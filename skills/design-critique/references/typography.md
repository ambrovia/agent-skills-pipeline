# Typography

> Cross-check the type scale, weight ladder, and families against `{{designSystem.tokens}}` — those override the examples below. Off-scale font sizes are also gated by the project's verify command, {{verify}}; this reference is the judgment layer. Common conventions worth confirming: body line-height ~1.5 (looser when comfortable), uppercase labels carry slight tracking, mobile inputs ≥ 16px.

Typography carries the majority of web-design information. It is THE primary interface.

## Type Scale (Closed Set)

A representative scale — use the project's actual one:

| Size | Weight | Line Height | Usage |
|------|--------|-------------|-------|
| 24px | 600 | 1.2 | Page titles (rare — one per page max) |
| 18px | 600 | 1.3 | Section headings |
| 14px | 500 | 1.45 | Subheadings, emphasized body, nav labels |
| 14px | 400 | 1.45 | Body text (default) |
| 13px | 400/500 | 1.4 | Monospace data values |
| 12px | 500 | 1.4 | Small labels, metadata |
| 11px | 500 | 1.3 | Uppercase tags, timestamps (+ letter-spacing) |

No sizes outside the project's scale. If you need a size not listed, you're making a mistake.

## Font Families

| Family | When to Use |
|--------|-------------|
| UI sans (e.g. 400/500/600) | All UI text: labels, body, headings, buttons |
| Monospace (e.g. 400/500) | Data values, numeric displays, IDs, timestamps, uppercase tags |

**Two families maximum.** Hierarchy through weight and size, not family switching.

## Weight Rules

- **Regular (400):** Body text, inactive labels, secondary information.
- **Medium (500):** Emphasis, nav labels, active states, data values.
- **Semi-bold (600):** Headings only. Never for body text.

If you're using Bold (700) anywhere, stop — confirm it against the project's weight ladder; most systems cap at 600.

## Line Height

- **Headings (18–24px):** 1.2–1.3 — tight, crisp.
- **Body text (14px):** ~1.45 — readable without being floaty.
- **Small text (11–12px):** 1.3–1.4 — compact but legible.
- **Monospace data:** ~1.4 — consistent with surrounding text.

## Letter Spacing

- **Uppercase small tags:** add slight tracking (e.g. `0.02–0.05em`) — required for readability at small uppercase sizes.
- **Everything else:** `normal` — don't add letter-spacing to body text.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using oversized heading utilities for most headings | Section headings are ~18px. Only page titles get ~24px. |
| Bold (700) for emphasis | Use medium (500) or increase size instead. |
| Monospace for non-data content | Monospace is for data: numbers, IDs, timestamps. Not paragraphs. |
| More than 3 font sizes in one component | A component needs at most: title, body, meta. |
| Missing letter-spacing on uppercase small text | Small uppercase MUST have tracking. |
| Line height too tight on body text | Body at 14px needs ~1.45, not 1.2. |

## The Reading Test

Cover the component with your hand except for the text. Can you understand the hierarchy from text alone (no backgrounds, no colors, no borders)? If yes, the typography is working. If everything reads at the same level, add size/weight differentiation.
