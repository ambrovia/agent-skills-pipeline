# Spacing & Density

> Canonical research, the project's recommendations table, and exact token values
> live in the design system docs under `{{designSystem.path}}` and
> `{{designSystem.tokens}}`. Density-tier ratios are a pipeline-planner call — a common
> default is compact = default × 0.75, comfortable = default × 1.25.

## The 4px Grid

All spacing values must be multiples of 4px. The closed scale:

| Value | Usage |
|-------|-------|
| 2px | Inline padding (chip internals, badge padding-y) |
| 4px | Icon gap, tight grouping, small component internal gap |
| 8px | Default padding, component gap, standard internal padding |
| 12px | Horizontal padding (default density), section padding |
| 16px | Section gap, comfortable density padding, page-level margins |
| 24px | Major section separation |
| 32px | Page-level separation |

## Density Zones

Not everything should be the same density. Apply density by zone:

| Zone | Density | Why |
|------|---------|-----|
| Navigation (sidebar, submenu) | Compact | Users already know what's here. Scanning speed matters. |
| List views | Default | Scanning for specific items. Row height consistency matters. |
| Detail / reading views | Comfortable | Reading comprehension. Content needs room to breathe. |
| Data tables | Compact | Maximum visible rows. Strict row height (~32px). |
| Forms | Comfortable | Reducing input errors. Clear label-field association. |

## Grouping Rules

- **Related items:** 4-8px gap (they belong together)
- **Sibling groups:** 12-16px gap (same level, different group)
- **Sections:** 24px gap (different concerns)
- **Regions:** Border or background change (different contexts entirely)

## Common Mistakes

| Mistake | Why It's Wrong | Fix |
|---------|---------------|-----|
| Same padding everywhere | Destroys grouping hierarchy | Use spacing to show relationships |
| `p-8` / `p-12` (32-48px) | AI default, too generous | `p-2` to `p-3` (8-12px) for cards |
| `gap-6` (24px) between cards | Cards look disconnected | `gap-2` (8px) keeps cards as a unit |
| No padding variation | Monotonous rhythm | Vary by content importance |
| Margins instead of gap | Harder to maintain | Use flexbox/grid gap consistently |

## Token Usage

Always use density tokens for component internals (names will vary by design system):
- `var(--density-pad-x)` — horizontal padding
- `var(--density-pad-y)` — vertical padding
- `var(--density-gap)` — gap between child elements
- `var(--density-row-h)` — row height in lists
- `var(--density-text)` — text size

These automatically adapt when the user switches density preset.

## The Squint Test for Spacing

Zoom out to 50%. Can you tell where the groups are? If everything looks like one uniform block, spacing isn't creating structure. If everything looks scattered, spacing is too generous.
