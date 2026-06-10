# Intent tokens — action, surface, border, content

Collection: `Intent` — two modes: **Light** and **Dark**.

Action tokens encode colour decisions for interactive controls by intent. All
aliases point into `Primitives / Palette` by variable name; the palette's own
Light/Dark modes resolve the actual colour value. Both Intent modes use
identical alias targets — the palette modes handle the colour difference.

**Important:** `action/*/foreground/default` and `content/on-action` alias
`color/absolute-white` (#FFFFFF), **not** `color/white` and not
`color/neutral/50`. `color/white` is Harmoni's palette white-point (a soft,
potentially tinted off-white, e.g. `#ebebeb`) — wrong for text on coloured
surfaces where true white is required. `color/absolute-white` is a
design-system constant that Harmoni never writes and the sync plugin excludes
from DTCG export. See "Primitives / Palette anchor variables" below.

## Token structure per intent

Filled-button intents (primary, secondary, danger) each have three groups:

| Group | Tokens | Role |
| ----- | ------ | ---- |
| `action/{intent}/` | `default · hover · active · disabled` | Background fill per interaction state |
| `action/{intent}/foreground/` | `default · disabled` | Text/icon colour on top of the fill |
| `action/{intent}/border/` | `default · hover · active · disabled` | Border/stroke colour per interaction state |

## Palette alias targets

| Intent | default bg | hover bg | active bg | disabled bg | foreground/default |
| ------ | ---------- | -------- | --------- | ----------- | ------------------ |
| primary | `color/brand/500` | `color/brand/600` | `color/brand/700` | `color/brand/200` | `color/absolute-white` |
| secondary | `color/neutral/100` | `color/neutral/200` | `color/neutral/300` | `color/neutral/50` | `color/neutral/900` |
| danger | `color/danger/500` | `color/danger/600` | `color/danger/700` | `color/danger/200` | `color/absolute-white` |

Secondary border: `neutral/300` default → `neutral/400` hover → `neutral/500` active → `neutral/200` disabled.
Primary and danger borders mirror their background alias at each state.

## The link variant

`action/link` has **foreground tokens only** — no background, no border. The
button frame has no fill; 50% opacity on the disabled variant frame handles the
muted appearance.

| Token | Alias |
| ----- | ----- |
| `action/link/foreground/default` | `color/brand/500` |
| `action/link/foreground/hover` | `color/brand/600` |
| `action/link/foreground/active` | `color/brand/700` |
| `action/link/foreground/disabled` | `color/brand/500` (opacity does the work) |

## Other intent groups

| Group | Notable tokens |
| ----- | -------------- |
| `surface/*` | `default/raised → color/neutral/50`, `overlay → color/neutral/900`, `inverse → color/neutral/800` |
| `content/*` | `primary → color/neutral/900`, `secondary · muted · disabled → neutral steps`, `error → color/danger/500`, `on-action → color/absolute-white`, `inverse → color/white` |
| `border/*` | `subtle/default/strong → neutral steps`, `focus → color/brand/500`, `invalid → color/danger/500` |
| `focus/ring` | `color/brand/500` |

## Non-action controls use surface / border / content (not `action/*`)

`action/*` tokens are for **buttons** (intent-coloured fills). Form-input controls
— Input, Textarea, Select, and the Field wrapper — are **not actions**: they use
the neutral semantic families instead. The Input set (the first such component)
binds: fill → `surface/default` (disabled `surface/subtle`); stroke →
`border/default` (hover `border/strong`, focus `border/focus`, invalid
`border/invalid`); value text → `content/muted` (placeholder) / `content/primary`
(value) / `content/disabled`. There is **no intent/Variant axis** — a single
visual style.

**Two focus border patterns (confirmed 2026-06-04):**
- **Input**: `border/focus` on the focused control border (changes border colour) + ring.
  `border/focus` resolves to a strong **blue** (`#235CE1` in the current palette) — not teal.
- **Select / Textarea**: `border/default` on focus — border colour does not change; the
  2-frame focus ring is the **sole** focus indicator. More appropriate for large controls
  where a coloured border would be visually heavy. Disabled state also differs: Input uses
  `border/subtle`, Select uses `border/default`.

When adding a new form-input control, decide upfront which pattern to follow and
document it in the component description.

## Overlay / surface components — `dropdown/*` pattern in Context

Dropdown menus, popovers, and similar surface components are also **not framed
controls** — they contain items rather than being interactive controls
themselves. Their sizing lives in component-specific namespaces within the
unified `Context` collection, not under `framed-control/*`.

The `dropdown/*` namespace (10 tokens, added 2026-06-01) is the established pattern:

| Token group | Tokens |
| --- | --- |
| `dropdown/item/*` | `height`, `padding-inline`, `gap`, `icon-size`, `radius` |
| `dropdown/label/*` | `height`, `padding-inline` |
| `dropdown/separator/*` | `spacing` |
| `dropdown/panel/*` | `padding-block`, `radius` |

Bindings: item-type frames bind `height`, `paddingLeft/Right`, `itemSpacing`,
`cornerRadius` to `dropdown/item/*`. The Panel binds its padding and radius to
`dropdown/panel/*`. Item text uses `body/sm/*` (Asta Sans Regular); the group
Label header uses `label/xs/*` (Khand SemiBold — the face contrast creates
hierarchy).

Future surface components (Tooltip, Popover, Context Menu, Command Palette)
should follow this same `<component>/*` namespace-in-Context pattern.

## Planned: `elevation/*` variables for drop shadows

Drop shadows on surface components (Panel, Tooltip, Dialog, etc.) are currently
hardcoded effects. **Elevation variables have not yet been created.** When they
are, they should live in a dedicated collection or under `Primitives`, covering
at minimum three levels:

| Level | Use case | Y | Blur | Alpha |
| --- | --- | --- | --- | --- |
| `elevation/sm` | Cards, raised elements | 2 | 4 | 0.08 |
| `elevation/md` | Dropdowns, popovers | 4 | 16 | 0.12 |
| `elevation/lg` | Dialogs, modals | 8 | 24 | 0.16 |

The Dropdown Panel (`elevation/md`) is the first consumer — its current
hardcoded shadow `rgba(0,0,0,0.12)` y=4 blur=16 maps exactly to that slot. Once
elevation variables exist, rebind the Panel's effect `boundVariables` (color,
radius, offsetY) accordingly.

## Danger-semantic tokens (`border/invalid`, `content/error`)

Both alias `color/danger/500` in Light **and** Dark (the palette's own modes do
the inversion — same pattern as every other Intent COLOR var). `border/invalid`
is the red stroke on an invalid control; `content/error` is red text (error
helper text, required `*`). Do **not** reuse a `border/*` token for text fill or
an `action/danger/*` (button) token for a control border — those are
semantically wrong. Created 2026-05-31 for Input/Field; both backed up to
`intent.json` by hand (the deterministic transform: `border.invalid` after
`border.focus`, `content.error` after `content.on-action`).

## Primitives / Palette anchor variables

There are two distinct categories of white/black in the palette — do not confuse them:

| Variable | Written by Harmoni | DTCG export | What it is |
| --- | --- | --- | --- |
| `color/white` | ✓ (when "Write white & black" checked) | ✓ | Palette white-point — the user-chosen soft white, e.g. `#ebebeb`. May be tinted/off-white. Same value in Light and Dark. |
| `color/black` | ✓ | ✓ | Palette black-point — the user-chosen soft black, e.g. `#141414`. May be near-black. Same value in both modes. |
| `color/absolute-white` | ✗ (never touched by Harmoni) | ✗ (excluded from DTCG backup) | Pure `#FFFFFF`. Design-system constant. |
| `color/absolute-black` | ✗ | ✗ | Pure `#000000`. Design-system constant. |

**Rule:** use `color/absolute-white` for any token that must be true white
regardless of the palette (foreground on coloured action surfaces:
`action/primary/foreground/default`, `action/danger/foreground/default`,
`content/on-action`). Use `color/white` only where the palette's white-point is
semantically appropriate (e.g. `content/inverse` — inverse text on a dark
surface, where the soft white reads fine). Never use `color/neutral/50` for
foreground-on-colour — it inverts in dark mode and is palette-tinted.
