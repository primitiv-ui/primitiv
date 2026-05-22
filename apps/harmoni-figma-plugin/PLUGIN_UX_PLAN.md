# Harmoni Plugin — UX Plan

Design decisions and rationale for the plugin's user experience.
This is a living document: update it as decisions are revisited.

---

## Plugin dimensions

**Width: 360px.** Narrow enough to sit alongside the Figma canvas without
dominating it. All layout is single-column. Height scrolls.

---

## Overall structure

### Top level — Projects screen (landing)

The plugin opens on a **dedicated projects screen**: a named list of client
brand projects. The user picks or creates a project, then enters it.

**Why not a sidebar?**
A collapsible sidebar eats 120–160px of working width when open; at 360px
that's tight. The project list also benefits from full-width display
(palette chip previews, last-modified dates). Critically, users work on one
client per session — they don't switch projects mid-session — so the friction
of navigating back to the list is negligible.

**Why not a top dropdown?**
A dropdown can't surface a rich preview of each project (colour chips,
metadata). A full screen can.

The Drawer component (planned for `@primitiv/react`) is a better fit for
something **inside** a project (e.g. the Apply panel or settings) where the
user needs a temporary overlay without losing their place.

### Inside a project

Sections are **stacked vertically and scrolled** — no tabs, no accordion.

**Why?**
The Neutral and Brand sections are tightly related (a brand colour can tint
the neutral ramp). Keeping them in a single scroll preserves that spatial
relationship and avoids hiding state behind a tab the user might forget to
open.

---

## Screen inventory

### Screen 1 — Projects

```
┌─────────────────────────────────────┐
│ Harmoni                           × │  ← dark header, close button
├─────────────────────────────────────┤
│ Projects                            │
│ ┌─────────────────────────────────┐ │
│ │ + New project                   │ │
│ └─────────────────────────────────┘ │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ Acme Corp                     › │ │
│ │ ■ ■ ■ ■ ■                       │ │  ← brand colour chips
│ │ Modified 2 days ago             │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Studio Wren                   › │ │
│ │ ■ ■ ■ ■ ■                       │ │
│ │ Modified 1 week ago             │ │
│ └─────────────────────────────────┘ │
│  ...                                │
└─────────────────────────────────────┘
```

### Screen 2 — Project view (Neutral section in scope for v1)

Reference: `ColorEngine.tsx` + `Swatch.tsx` in `apps/workbench/src/`.

Each swatch mirrors the workbench layout exactly:
- **Inside the coloured block**: best-foreground step number, contrast ratio,
  AA/AAA rating (centered, small text, colour = `best_foreground.oklch`).
- **Below the block**: step label (50, 100 … 900).

```
┌─────────────────────────────────────┐
│ ‹  Acme Corp                      × │  ← back + project name + close
├─────────────────────────────────────┤
│ NEUTRAL                             │
│ ─────────────────────────────────── │
│  White [■]   Black [■]              │  ← colour pickers
│                                     │
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐   │
│ │  │  │  │  │  │  │  │  │  │  │   │  ← coloured swatch blocks
│ │fg│fg│fg│fg│fg│fg│fg│fg│fg│fg│   │     fg step + ratio + rating inside
│ │  │  │  │  │  │  │  │  │  │  │   │
│ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘   │
│  50 100 200 300 400 500 600 700 800 900  ← step labels below
│                        [Apply to Figma] │  ← quick apply, right-aligned
│                                     │
│ BRAND                               │
│ ─────────────────────────────────── │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│   Brand colours — coming soon       │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
└─────────────────────────────────────┘
```

### Screen 3 — Apply: choose outputs (initial state)

```
┌─────────────────────────────────────┐
│ ‹  Apply to Figma                 × │
├─────────────────────────────────────┤
│ GENERATE                            │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ □  Canvas swatches              │ │
│ │    Place swatch frames on the   │ │
│ │    active Figma page            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ □  Colour variables             │ │
│ │    Write variables to a chosen  │ │
│ │    collection                   │ │
│ └─────────────────────────────────┘ │
│ Select at least one output…         │
│                                     │
│ ─────────────────────────────────── │
│ [     Cancel     ] [    Apply ░   ] │  ← Apply disabled
└─────────────────────────────────────┘
```

### Screen 5 — Swatch style configuration

When "Canvas swatches" is checked, an additional **SWATCH STYLE** section
appears letting the user customise how generated swatches look before applying.

```
┌─────────────────────────────────────┐
│ ‹  Apply to Figma                 × │
├─────────────────────────────────────┤
│ GENERATE                            │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ ✓  Canvas swatches              │ │  ← checked
│ │    Place swatch frames on the   │ │
│ │    active Figma page            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ SWATCH STYLE                        │
│ ─────────────────────────────────── │
│  Shape   [■ Square] [● Circle]      │  ← segment control
│                                     │
│  Step numbers          50,100…  ●─  │  ← toggle ON
│                                     │
│  Accessibility info    Ratio+AA  ─○ │  ← toggle OFF
│                                     │
│ PREVIEW                             │
│ ─────────────────────────────────── │
│  ┌──┬──┬──┬──┬──┐                  │
│  │  │  │  │  │  │                  │  ← 5 sampled steps (50,200,400,700,900)
│  └──┴──┴──┴──┴──┘                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ □  Colour variables             │ │
│ └─────────────────────────────────┘ │
│ ─────────────────────────────────── │
│ [     Cancel     ] [    Apply    ]  │
└─────────────────────────────────────┘
```

### Screen 6 — Canvas output preview (dark Figma canvas)

Shows how the three swatch output modes would look on the Figma canvas:
square swatches with full info, circular swatches, and label-only swatches.

```
┌─────────────────────────────────────┐
│ ░░ Figma toolbar ░░░░  Harmoni      │  ← dark #2C2C2C toolbar
├─────────────────────────────────────┤
│                                     │  ← #3C3C3C canvas background
│  ┌────────── square-full ─────────┐ │
│  │ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■           │ │  ← 28×60px: fg step+ratio+AA inside
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────── circle-full ─────────┐ │
│  │ ● ● ● ● ● ● ● ● ● ●           │ │  ← 28×28px circles, AA inside
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────── square-labels ───────┐ │
│  │ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■           │ │  ← 28×40px: step number only
│  └────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Screen 4 — Apply: Colour variables checked + collection picker open

The collection picker uses the Tree component from `@primitiv/react`.
Selecting a collection row enables the Apply button.

```
┌─────────────────────────────────────┐
│ ‹  Apply to Figma                 × │
├─────────────────────────────────────┤
│ GENERATE                            │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ □  Canvas swatches              │ │
│ │    Place swatch frames on the   │ │
│ │    active Figma page            │ │
│ └─────────────────────────────────┘ │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│ │ ✓  Colour variables             │ │  ← checked, bold border
│ │    Write variables to a chosen  │ │
│ │    collection                   │ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
│                                     │
│ VARIABLE COLLECTION                 │
│ ─────────────────────────────────── │
│   ▶  Brand                          │
│ ██ ●  Neutral                    ▌  │  ← selected row (highlight bg)
│   ▶  Dark mode                      │
│                                     │
│   + New collection                  │
│                                     │
│ ─────────────────────────────────── │
│ [     Cancel     ] [    Apply    ]  │  ← Apply enabled
└─────────────────────────────────────┘
```

---

## Feature inventory

| Feature | Status |
|---|---|
| Neutral ramp — White/Black pickers | v1 (TDD plan in progress) |
| Neutral ramp — preview (10 swatches with contrast info) | v1 |
| Brand colour ramp | next |
| Brand → neutral tint (`tint_neutrals`) | next |
| Derive soft neutrals from brand (`derive_soft_neutrals`) | next |
| Apply to Figma — canvas swatches | deferred |
| Apply to Figma — swatch style config (shape, step numbers, a11y info) | deferred |
| Apply to Figma — colour variables | deferred |
| Variable collection picker (Tree / Miller Columns) | deferred |
| Project save / management | deferred |
| Settings | deferred |

---

## Apply to Figma — design notes (for when it's built)

Two separate output actions, both available:

1. **Generate canvas swatches** — places visual swatch frames on the active
   Figma page.
2. **Generate colour variables** — writes variables into a chosen collection.

**Variable collection picker:** The Tree or Miller Columns component (from
`@primitiv/react`) will let the user choose which Figma variable collection
to target. This opens as a **modal overlay** inside the plugin panel — the
user taps "Choose collection", selects from the tree, confirms. The main
panel stays behind it.

**Trigger model:** Both inline (quick Apply per section) and a full review
step (apply all palettes at once). See `NEUTRAL_PALETTE_TDD_PLAN.md` for the
deferred Apply integration test plan.

---

## Navigation model — routing

React Router (`MemoryRouter`) is used throughout — both in production and in
tests. The plugin UI runs in a sandboxed iframe with no real URL.

In tests, `initialEntries` pre-selects a route without simulating navigation
clicks. See `NEUTRAL_PALETTE_TDD_PLAN.md` for the full testing strategy.

| Route | Screen |
|---|---|
| `/` | Projects (landing) |
| `/project/:id` | Project view (Neutral + Brand sections) |

---

## Wireframe scripts

Paste into the Figma developer console (`Plugins → Development → Open console`).
Type `allow pasting` first, then paste. See the `figma-console-scripts` skill
for the full process and API reference.

| Script | Screens |
|---|---|
| `scripts/create-wireframes.js` | Screen 1 (Projects) + Screen 2 (Project / Neutral) |
| `scripts/create-apply-wireframes.js` | Screen 3 (Apply — choose outputs) + Screen 4 (Apply — collection picker) |
| `scripts/create-swatch-config-wireframes.js` | Screen 5 (Swatch style config) + Screen 6 (Canvas output preview) |

Run in order. Each script finds or creates the "Wireframes — Harmoni Plugin" page
and appends its frames to the right of the existing ones.
