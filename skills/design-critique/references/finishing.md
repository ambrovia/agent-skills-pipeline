# Finishing Touches

> Cross-check every concrete value against `{{designSystem.tokens}}` — those override any example below. Off-scale radius/motion and AI-aesthetic tells are also gated by the project's verify command, {{verify}}; this reference covers the judgment layer. A closed radius scale, a single standard easing curve, and a `prefers-reduced-motion` block in the token file are common conventions — confirm the project's actual choices.

The difference between "functional" and "polished" is in the micro-details.

## Borders

- **Default:** a hairline at low opacity (e.g. `1px solid rgba(255,255,255,0.10)`) — subtle structural borders.
- **Emphasized:** slightly stronger (e.g. `0.16` opacity) — input fields, active panels.
- **Focus:** `1px solid` the primary accent — keyboard focus indicator.
- **Never:** `2px` or thicker borders. Never colored borders for decoration.

Borders create structure that tonal-only layering fails to achieve at the dark end of the spectrum. A single border at low white opacity on a card immediately creates visual organization.

## Shadows

- **Use sparingly.** In dark mode, shadows have less effect than in light mode.
- **Only on floating elements:** modals, popovers, dropdowns, tooltips.
- **Use the project's float/shadow token**, not arbitrary shadow utilities.
- **Never:** large drop shadows on cards. Cards use surface elevation, not shadows.

## Corner Radii

Closed set — no arbitrary values. A common ladder:

| Token | Value | Usage |
|-------|-------|-------|
| `r0` | 0 | No rounding (table cells, full-width bars) |
| `r1` | 4px | Buttons, chips, badges, small controls |
| `r2` | 8px | Cards, panels, input fields |
| `r3` | 12px | Modals, overlays, large containers |
| `r-pill` | 999px | Pills, scrollbar thumbs |

**Rule:** Smaller elements get smaller radii. A chip (`r1`) inside a card (`r2`) inside a modal (`r3`) creates a coherent nesting hierarchy. Use the project's actual scale from `{{designSystem.tokens}}`.

## Hover States

Every interactive element needs a hover state:
- **Surface elements (cards, rows):** Background shifts up one surface level.
- **Buttons:** Background lightens or accent color brightens.
- **Text links:** Underline appears or opacity increases.
- **Transition:** the fast motion token.

## Focus States

- **Visible focus ring on ALL interactive elements.** No exceptions.
- **Style:** an inset outline on the primary accent (e.g. `outline: 1px solid var(--primary); outline-offset: -1px;`).
- **Never remove focus styles.** If default focus rings are ugly, replace them — don't remove them.

## Active/Pressed States

- **Buttons:** Slight scale reduction (`scale(0.98)`) or translate (`translateY(1px)`).
- **Cards/rows:** Subtle flash or deeper surface color.
- **Duration:** Instant or the fast motion token at most.

## Transitions

| What | Duration | Property |
|------|----------|----------|
| Hover background | fast | `background-color` |
| Focus ring | instant | `outline` |
| Panel expand/collapse | medium | `height, opacity` |
| Modal open/close | slow | `opacity, transform` |
| Color change | fast | `color, background-color` |

Map "fast / medium / slow" to the project's motion tokens (common defaults are roughly 80 / 150 / 250 ms).

**Only animate GPU-friendly properties:** `transform`, `opacity`, `background-color`, `color`, `outline`. Never animate `width`, `height`, `margin`, `padding`, `top/left`.

## Skeleton Loading

- Match the shape of the content being loaded.
- Use an animated shimmer on a ghost surface, not a generic spinner.
- Skeleton height/width should approximate the actual content size.
- Remove skeleton in one frame (no fade-out) when content loads.

## Empty States

- Center vertically in the available space.
- Icon (optional) + title + brief description + action button (if applicable).
- Title in mid-emphasis text, not high-emphasis (empty states are secondary).
- Keep copy concise. One sentence max for description.

## Error States

- Danger-colored indicator on the left or top (small, not overwhelming).
- Clear error message in high-emphasis text.
- Retry action if applicable.
- Never show raw error messages or stack traces to users.

## Scroll Behavior

- Custom scrollbar: narrow (e.g. 6px), ghost-surface track, high-surface thumb, pill radius.
- Scrollbar appears only on hover (opacity transition on the thumb).
- Content should not jump when scrollbar appears/disappears.

## The Polish Checklist

Before considering a component "done":

- [ ] Hover state on all interactive elements
- [ ] Focus ring visible on keyboard navigation
- [ ] Active/pressed state on buttons
- [ ] Transitions on state changes (not instant)
- [ ] Loading skeleton matches content shape
- [ ] Empty state is designed, not blank
- [ ] Error state is designed, not a raw message
- [ ] Text truncates with ellipsis where overflow is possible
- [ ] Scrollbar is styled consistently
- [ ] No hardcoded colors, sizes, or spacing values
