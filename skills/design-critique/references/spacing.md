# Spacing & Density

> Cross-check the grid step and density-tier ratios against `{{designSystem.tokens}}` — those override the examples below. Off-grid and off-scale spacing are also gated by the project's verify command, {{verify}}; this reference is the judgment layer. Density-tier ratios (e.g. compact = default × 0.75, comfortable = default × 1.25) are a common convention — confirm the project's actual ratios.

## The Grid

All spacing values must be multiples of the project's grid step (commonly 4px). A typical closed scale:

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
| List views | Default | Scanning for specific items. Row-height consistency matters. |
| Detail views | Comfortable | Reading comprehension. Content needs room to breathe. |
| Data tables | Compact | Maximum visible rows. Strict row height. |
| Forms | Comfortable | Reducing input errors. Clear label-field association. |

## Grouping Rules

- **Related items:** 4–8px gap (they belong together).
- **Sibling groups:** 12–16px gap (same level, different group).
- **Sections:** 24px gap (different concerns).
- **Regions:** Border or background change (different contexts entirely).

## Common Mistakes

| Mistake | Why It's Wrong | Fix |
|---------|---------------|-----|
| Same padding everywhere | Destroys grouping hierarchy | Use spacing to show relationships |
| Oversized padding (32–48px) on cards | AI default, too generous | 8–12px for cards |
| Large gaps (24px) between cards | Cards look disconnected | ~8px keeps cards as a unit |
| No padding variation | Monotonous rhythm | Vary by content importance |
| Margins instead of gap | Harder to maintain | Use flexbox/grid gap consistently |

## Token Usage

Always use the project's density tokens for component internals, e.g.:
- horizontal padding token
- vertical padding token
- gap-between-children token
- row-height token (lists)
- density-aware text-size token

These automatically adapt when the user switches density preset. Read `{{designSystem.tokens}}` for the actual names.

## The Squint Test for Spacing

Zoom out to 50%. Can you tell where the groups are? If everything looks like one uniform block, spacing isn't creating structure. If everything looks scattered, spacing is too generous.
