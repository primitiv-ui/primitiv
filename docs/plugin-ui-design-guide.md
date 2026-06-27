# Plugin UI design guide — layout modes + export section

> **Status:** Working guide
> **Audience:** the person hand-building the plugin wireframes (you).
> **Purpose:** walk through each part still to design — the **two layout
> modes** (narrow ↔ expanded) and the **bottom export / canvas-swatch
> section** — so they can be wireframed by hand from the components and
> styles already in the system, ahead of the ports-&-adapters + TDD
> rebuild.
> **Specs it implements:** RFC 0013 (configurable export — variables &
> canvas swatches), RFC 0010 §9 (OKLCH picker, the workbench-first build),
> `apps/harmoni-figma-plugin/PLUGIN_UX_PLAN.md` (single-screen direction).

---

## 0. How to use this guide

Each numbered part is a self-contained thing to wireframe. For every part
you get: **what it is**, **which system component(s) to compose**, **which
tokens/classes to reach for**, and **the decisions to settle while you
draw it** (the relevant RFC 0013 open questions, O1–O7, plus the new
layout ones). Build in the order in §9 — it front-loads the cheap,
self-contained pieces.

This is **design work, not the TDD build.** Nothing here is gated by
red-green or coverage. The settled layout becomes the spec the rebuild
consumes (pure `resolve` / `planSwatches` + the `VariableStore` /
`CanvasRenderer` ports, RFC 0013 §5) — so the goal is to lock the
*layout, composition, and the O-decisions*, not to write production code.

---

## 1. The reference — what's already settled

**The canonical, most up-to-date UI is the workbench replica:**
`apps/workbench/src/pages/PluginFrameExample/`. Treat it as the source of
truth for the plugin's look, its token usage, and its top/middle layout.
Do **not** reference `apps/harmoni-figma-plugin/src/` — that plugin
(including its old export and sync code) is being rebuilt and its
hardcoded export is exactly what RFC 0013 replaces.

What the reference already nails down (do not redesign these):

| Section | Component(s) | File |
|---|---|---|
| White / Black anchors | painted `LightnessSlider` + swatch + value | `PluginColorEngine.tsx` (`pf-anchors`) |
| Brand colour | `OklchPicker` (`layout="row"`) | same |
| "Use brand as neutral tint" + Strength / Spread / Bow | `Button`, `Slider`, preview chips | same (`pf-neutral-tint`) |
| Four palette rows (neutral L/D, brand L/D) | `PluginPalette` / `PluginSwatch` | same (`pf-color-engine__palettes`) |
| Per-ramp curve editor + ramp padding | `CurveEditor`, `RampPadding` | same (`pf-curve-wrap`) |

The replica ends right where the export section begins — its
`PluginColorEngine` carries the note *"Export-to-Figma is omitted."* That
omission is the work this guide covers, plus the layout-mode feature.

**Styling conventions to mirror** (from `PluginFrameExample.css`):

- Every selector is prefixed `pf-` — the workbench bundles all example CSS
  into one global sheet, so a bare element/attribute selector leaks onto
  other pages (see the `workbench-examples` skill). Keep new selectors
  `pf-` prefixed.
- Style with **`--primitiv-*` design tokens**, not Figma-theme literals,
  so it themes light/dark for free. Genuine non-token literals only (a
  `ch` measure, `50%` radii, optical letter-spacing).
- The frame is `.pf-frame` (width = the plugin window size, fixed height,
  `overflow: hidden`), body is `.pf-frame__body` (`overflow-y: auto`,
  `--primitiv-surface-default`). The expand feature changes `.pf-frame`'s
  width — see §2.

---

## 2. Layout modes — narrow ↔ expanded (NEW)

The plugin ships **two width modes** the user toggles:

| Mode | Width | When |
|---|---|---|
| **Narrow** (default) | **600px — the minimum** | Everyday palette tuning; sits as a sidekick beside the Figma canvas. |
| **Expanded / wide** | a single wider width (propose **960px**; trial 900–1040) | Deep OKLCH-picker work (charts get room); driving the export / canvas-swatch generator (preview beside controls). |

600px is the floor — below it the curve sliders, contrast badges, and the
picker charts crowd (confirmed in the browser). Design every part to be
**legible at 600** first; expanded is a comfort upgrade, never a
requirement to reach any control.

### 2.1 The expand control

- **An icon button in the header strip**, far end (opposite the title /
  project picker). It toggles narrow ↔ expanded; show it pressed
  (`aria-pressed`) in expanded mode. Use a `Button` with an `Icon`-only
  child (see `IconButton` patterns / the `Button` registry styles already
  imported in the sandbox).
- **Icon gap to resolve first:** `@primitiv-ui/icons` has **no
  maximize/expand glyph** today (closest existing: `ExternalLink`,
  `Grid`, `ChevronRight`). Options, in order of preference:
  1. **Add a `Maximize` (and matching `Minimize`) glyph** via the
     `figma-icon-glyph` skill — the house line style, 5 sizes, SVG export,
     generate/README/test loop. This is the clean answer and a small,
     well-trodden task.
  2. Temporarily wireframe with `ExternalLink` / `Grid` as a placeholder
     and note the glyph as a follow-up.
- **Behaviour in the real plugin:** the toggle calls
  `figma.ui.resize(width, height)`. In the **sandbox** it just swaps the
  `frameWidth` state that already drives `.pf-frame` (the sandbox already
  has a `FRAME_WIDTHS` control — fold the expand toggle into that same
  state; the freeform width buttons can stay as a dev aid or be retired).

### 2.2 What reflows between the two modes

Decide and draw both states for each. Starting proposals (trial in the
browser, don't treat as settled):

| Area | Narrow (600) | Expanded (960) |
|---|---|---|
| Engine inputs (anchors + brand + tint) | single column, as today | anchors/brand can sit beside the tint controls |
| Palette rows + curve/padding | full-width stacked rows | same, but with room to widen swatches / show more per-swatch data |
| OKLCH picker | `layout="row"`, current `chartAspect` | wider charts (raise `chartAspect`), the deep-work payoff |
| **Export section** | controls stacked **above** their live preview | controls **beside** the preview (two-column) — the main reason export benefits from expanded |

Keep the `{ l, c, h }` / engine contract identical across modes — layout
mode is **view state only**, exactly as the picker's gamut toggle is
internal view state (RFC 0010). The palette the engine produces never
depends on width.

---

## 3. The export section — overview (RFC 0013)

The bottom section is **two independent outputs that share one
`ExportConfig`** and can be produced singly or together (RFC 0013 D7):

1. **Canvas swatches** — draw the ramps as frames on the Figma canvas with
   look-and-feel controls + a live preview (§5 here; RFC 0013 §3.2/§4.5).
2. **Variables** — write the palette into Figma variables, with a
   configurable destination, naming, and mode mapping (§6 here; RFC 0013
   §3.1/§4.1–4.3).

Each is toggled on/off independently; a single action area at the bottom
performs whichever are on. Everything previews before it writes (RFC 0013
Principle 3 / D4).

The **engine already supplies the data** every part needs — each swatch
carries `hex`/`oklch`, contrast `rating`, `display_ratio`, and
`best_foreground` (RFC 0003). Labels, values, and a11y badges are
*rendering of existing data*, not new computation.

---

## 4. Part A — section container + output toggles

**What:** the shell that holds both outputs and their on/off switches,
below the palette rows.

**Compose:** two stacked cards, each headed by a `Switch` (output on/off)
+ a title. Recommended over a `Tabs` split because **both outputs can be
on at once** (D7) and a tab hides one. In expanded mode the two cards can
sit side by side.

**Tokens/classes:** new `pf-export` block; card surfaces with
`--primitiv-surface-subtle` / `--primitiv-border-subtle`; section spacing
with `--primitiv-space-space-12` / `-16` to match `pf-color-engine`.

**Decisions to settle:** stacked cards vs tabs vs accordion; whether a
card collapses its body when its `Switch` is off (recommended: collapse to
just the header to keep the screen short at 600px).

---

## 5. Part B — Canvas swatches generator (build this first)

**Why first:** fully self-contained — no Figma variable tree needed, it
reuses the palette rows already on screen, and its live preview settles
the most open look-and-feel questions (O7).

**What:** style controls driving a **live HTML preview** of the rendered
sheet (the preview *is* the DOM `CanvasRenderer` from RFC 0013 §5 — but in
the wireframe it's throwaway markup, not the real port).

**Controls** (RFC 0013 §3.2) and the system component for each:

| Control | Component |
|---|---|
| `orientation` horizontal / vertical | `ToggleGroup` |
| `shape` square / rounded (+ `cornerRadius`) | `ToggleGroup` + `Slider` |
| `swatchSize`, `gap` | `Slider` |
| `ramps` separate / stacked | `ToggleGroup` |
| `stepLabels` show + placement inside/below | `Switch` + `ToggleGroup` |
| `value` none / hex / oklch | `Select` or `ToggleGroup` |
| `a11yBadge` show + against auto/white/black | `Switch` + `Select` |
| `foregroundSwatch`, `title` | `Switch` |
| **Generate** action | `Button` (primary) |

**Preview:** reuse `PluginSwatch`/`PluginPalette` markup; render from the
live palette. The a11y badge prints each swatch's `rating` coloured by
pass/fail — a contrast audit at a glance.

**Placement copy:** the Generate button "drops the frame on the current
page at the viewport centre, selected and scrolled into view." Drag-and-
drop is a fast-follow (O6) — you can draw the drag handle but mark it
deferred.

**Decisions to settle (O7):** default look (size/gap/shape, which
labels/badges on), and whether multiple ramps render `separate` (a
labelled block each) or `stacked`, and how neutral + brand + light/dark
arrange on one sheet. Settle these by eye in the preview.

---

## 6. Part C — Variables export

Three sub-parts, all driven against a **hardcoded sample collection tree**
in the wireframe (the real Figma tree arrives at rebuild — same component,
swapped data; RFC 0013 §4.1).

### 6.1 Destination browser

**What:** drill collection → group → subgroup of a `/`-delimited
hierarchy; pick a node or type to create a new one (a destination is
`(collection, groupPath)`, RFC 0013 D1).

**Compose:** `MillerColumns` (recommended — column-per-level, "create
here" is obvious at the focused column) with `Tree` as the A/B
alternative. **Both already have workbench example pages**
(`MillerColumnsExample`, `TreeExample`) — copy their composition.

**Decision — O1:** MillerColumns vs Tree vs both-behind-a-toggle. This is
*the* call to make here; try MillerColumns at 600px width first (it scales
to deep trees without a tall panel), keep Tree as a denser overview to
compare.

### 6.2 Naming editor + live preview

**What:** the naming fields above a preview of the first few resolved
variable names for the live palette (`color/brand/50`, `color/brand/100`…)
— honest about exactly what will be written (RFC 0013 §4.2).

**Controls:** `rampTemplate` / `singleTemplate` (`Input` — a token string
like `{group}/{ramp}/{step}`), `separator` (`Input`/`Select`), `stepLabels`
numeric / index / custom (`Select`), `case` asis/kebab/snake/camel
(`Select`). Each in a `Field` for label + help text. Preview = a short
read-only list (a `List` or a small `Table`).

**Decisions:** O2 (token-string template vs structured dropdowns — string
is more expressive but needs a forgiving parser), O3 (clobber default:
overwrite vs create-only — show create/overwrite per row in the preview,
D4), O4 (foreground aliases must rewrite through the same naming so they
still resolve — surface in the preview).

### 6.3 Mode mapping

**What:** map the palette's light/dark onto the collection's modes, or
write a single mode; on a fresh collection the default preset offers to
create `Light`/`Dark` (RFC 0013 §4.3, D5 — modes are mapped, never
assumed).

**Compose:** two `Select`s (light → mode, dark → mode) + a `Switch` /
checkbox for "single mode only".

---

## 7. Part D — presets + the action row

**What:** the built-in **"Primitiv default"** preset (= today's behaviour,
the regression guard, RFC 0013 D3), save-current-as-named, and the bottom
action row.

**Compose:** a `Select` or chip row for presets + a save `Button`; the
action row carries **Apply variables** / **Generate swatches** primary
`Button`s (only the enabled outputs). Persistence is faked in the
wireframe (the real `clientStorage` / `localStorage` split, O5, is a
rebuild concern).

---

## 8. Component → system mapping (quick reference)

Everything the export section needs already exists as a headless component
with registry styles and a workbench example page:

| Need | Component | Example page |
|---|---|---|
| Destination browser | `MillerColumns` / `Tree` | `MillerColumnsExample` / `TreeExample` |
| Naming / mode fields | `Field` + `Input` + `Select` | `FieldExample`, `InputExample`, `SelectExample` |
| On/off + binary choices | `Switch`, `ToggleGroup` | `SwitchExample`, `ToggleGroupExample` |
| Size / gap / radius | `Slider` | `SliderExample` |
| Preview lists / create-vs-overwrite table | `List` / `Table` | `TableExample` |
| Actions, expand toggle | `Button` (+ `Icon`) | `ButtonExample` |
| Disclosure / collapsible cards | `Collapsible` / `Accordion` | `CollapsibleExample`, `AccordionExample` |

Tokens cheat-sheet (from the reference CSS): spacing
`--primitiv-space-space-{2,4,8,12,16,20,24,80,200}`; text
`--primitiv-content-{primary,secondary}`; surfaces
`--primitiv-surface-{default,subtle}`; borders
`--primitiv-border-{default,subtle,focus}` + `--primitiv-border-width-{1,2}`;
focus `--primitiv-focus-ring-{width,offset}`; radii
`--primitiv-container-{sm,md}-radius`; type
`--primitiv-{body,heading}-*-font-*`.

---

## 9. Build order + checklist

Front-loads the self-contained, decision-rich pieces:

- [ ] **§2 Layout modes** — add the expand icon button + narrow/expanded
      states (resolve the `Maximize` glyph first, §2.1). Draw what reflows.
- [ ] **§4 Section container** + output on/off toggles.
- [ ] **§5 Canvas swatches** — controls + live preview (settles **O7**).
- [ ] **§6.1 Destination browser** — MillerColumns vs Tree (settles **O1**).
- [ ] **§6.2 Naming editor** + live name preview (touches O2/O3/O4).
- [ ] **§6.3 Mode mapping.**
- [ ] **§7 Presets + action row.**
- [ ] Re-check the whole screen at **600px** (nothing crowded/unreachable),
      then at the expanded width (preview-beside-controls earns its keep).
- [ ] **Capture decisions back into docs:** settled O1/O7 (+ any of
      O2–O5) into RFC 0013 §6–7; an iteration-log entry + a reconciliation
      of the now-stale "hex picker" inventory in `PLUGIN_UX_PLAN.md`
      against the OKLCH picker and this export layout.

When the layout and the O-decisions are locked, the rebuild begins: the
pure cores (`resolve`, `planSwatches`) and the `VariableStore` /
`CanvasRenderer` ports get built TDD (RFC 0013 §5), with these wireframes
as their spec. Nothing drawn here is throwaway — it's the reference the
ported, tested plugin is measured against.
