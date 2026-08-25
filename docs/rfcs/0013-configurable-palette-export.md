# RFC 0013 — Configurable palette export (variables & canvas swatches)

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-25
> **Seeds from:** the 2026-06-25 plugin-frame feature-parity discussion — the
> workbench replica needs the plugin's export section, but the current export is
> hardcoded to the author's personal variable setup and must instead work for
> *any* user before it is worth replicating.
> **Relates to:** RFC 0002 (Harmoni → Intent → Plugin) — this generalises the
> last hop, where the engine's palette is written into Figma variables; RFC 0003
> (Dynamic foreground wiring) — the per-step foreground alias must survive a
> custom naming scheme; RFC 0010 §9 / RFC 0011 §8 — the plugin is rebuilt from
> scratch (ports & adapters + TDD) once the workbench feature set is locked, and
> the export flow is the missing piece of that set.
> Skills: `figma-variable-architecture` (collections, modes, the `/`-group
> naming), `figma-token-sync` (how variables are backed up as DTCG),
> `react-component-patterns` (MillerColumns / Tree).

---

## 0. Summary

The plugin's `applyPalette` (`apps/harmoni-figma-plugin/src/code/applyPalette.ts`)
writes the engine's ramps into Figma with three hardcoded choices:

```ts
const COLLECTION_NAME = 'Primitives / Palette'          // fixed collection
// fixed modes:
const lightMode = ...'Light'; const darkMode = ...'Dark'
// fixed name paths:
`color/${name}`                 // singles  (white / black)
`color/${ramp.name}/${step}`    // ramp steps
```

That is one designer's convention. Any other user has their own collection
structure, their own mode names, and their own variable-naming convention — so
today's export only works for the author.

The export section also has a **second output the plugin doesn't have yet:
generating swatches on the Figma canvas** — laying the ramps out as frames the
designer can see, annotate, and hand off, with their own look-and-feel controls
(orientation, swatch shape, gap, step labels, a11y contrast badges, ...). The two
outputs are independent and either or both can be produced from one run.

This RFC proposes a **configurable export flow** spanning both: for **variables**,
the user chooses **where** the palette is written (which collection, which group
location, which modes) and **how** the variables are named; for **canvas
swatches**, the user configures **how the swatches look**. Today's variable
behaviour is kept as the default preset so nothing regresses.

The moves:

1. **Output configuration is pure, serializable data.** A plain config object
   plus pure functions — `resolve(config, palette) → planned variables` and
   `planSwatches(config, palette) → swatch layout` — live in shared code,
   testable to 100% with no Figma. Each *effect* (writing variables, drawing
   frames) is a thin adapter behind its own port.
2. **The UI is built and iterated in the workbench first**, against a sample
   collection tree and a live HTML swatch preview, then the plugin supplies the
   real Figma tree and canvas. One UI, swappable adapters.
3. **Dual audience by construction.** The author's flow is a saved preset; an
   end user gets a guided first run with a smart default. Same config object
   drives both.

## 0.1 Scope

In scope: the two output targets and their shared config — for variables, the
destination model (collection + group location + mode mapping), the naming
convention and its preview, the pure resolver and its `VariableStore` port, and
the destination-browser UX (MillerColumns / Tree); for canvas swatches, the
look-and-feel controls, the pure swatch-layout planner and its `CanvasRenderer`
port, and the live preview; plus preset save/load + persistence and the
workbench-first build. Out of scope: changes to the *engine* (the palette it
produces is unchanged), non-colour variable types, importing/reading a theme back
out of Figma (export only), and the cross-file publishing of a variable library
(a Figma feature, not ours).

---

## 1. Principles

### Principle 1 — Configuration is data, each output is an effect

The decision of *what variables to create and what to call them*, and *where each
swatch frame sits and what it shows*, is a pure function of `(config, palette)`.
Performing the writes (variables) and the draws (canvas frames) are effects, each
behind its own port — `VariableStore` and `CanvasRenderer`. This keeps the
naming/location and layout logic 100%-testable and shared between the workbench
(fake store, HTML preview) and the plugin (real `figma`), exactly as
`primitiv-cli` separates its pure core from the `FileSystem` port.

### Principle 2 — Works for the author *and* the stranger

The same serializable `ExportConfig` powers both audiences. The author saves
their setup (`Primitives / Palette`, `color/...`, Light/Dark) as a named preset;
a first-time user is handed that as the default and can drill in to retarget it.
No behaviour is reachable by one audience and not the other.

### Principle 3 — Never silently clobber

Writing into someone else's file must be legible and reversible-in-intent: the
flow previews exactly which variables will be created vs. overwritten before it
writes, and the per-step foreground aliasing (RFC 0003) is recomputed against
the chosen names rather than assuming the fixed `color/...` paths.

---

## 2. The Figma destination model

A Figma file holds **variable collections**; each collection has **modes** and
**variables**. A variable's `name` uses `/` as a group separator, so
`color/brand/500` renders as the nested group `color → brand → 500` in Figma's
variables panel. There is no separate "folder" entity — the group hierarchy is
purely the set of `/`-split name prefixes across the collection's variables.

Two consequences:

- **A destination is `(collection, groupPath)`** — e.g. collection
  `Primitives / Palette`, group path `color`. The browser drills the *existing*
  group prefixes and can create a new one by typing.
- **Naming is the rest of the path** appended to `groupPath` — e.g.
  `{groupPath}/{ramp}/{step}`. So "location" and "naming convention" are two
  ends of the same variable name; the UI splits them where the user stops
  browsing and starts templating.

Modes are independent: a collection may have `Light`/`Dark`, or density modes
(RFC 0009), or one default mode. The export must **map** the palette's light/dark
values onto whichever modes the user picks, creating `Light`/`Dark` only when the
user opts into the default preset on a fresh collection.

## 3. The export configuration

One config holds both output targets; either may be absent (don't produce that
output), and a run can do one or both.

```ts
type ExportConfig = {
  targets: {
    variables?: VariableExportConfig   // §3.1 — write Figma variables
    swatches?: SwatchExportConfig      // §3.2 — draw swatch frames on the canvas
  }
}
```

### 3.1 Variables

```ts
type VariableExportConfig = {
  // Destination
  collection: { kind: 'existing'; id: string } | { kind: 'new'; name: string }
  groupPath: string                 // e.g. "color"  ("" = collection root)
  modes: {
    light: { kind: 'existing'; id: string } | { kind: 'new'; name: string }
    dark?: { kind: 'existing'; id: string } | { kind: 'new'; name: string }
    // omit `dark` → single-mode export (light values only)
  }

  // Naming convention
  naming: {
    rampTemplate: string            // default "{group}/{ramp}/{step}"
    singleTemplate: string          // default "{group}/{name}"
    separator: string               // default "/"
    stepLabels: 'numeric' | 'index' | string[]   // 50..900 | 0..9 | custom
    case: 'asis' | 'kebab' | 'snake' | 'camel'
  }

  writeMode: 'create-and-overwrite' | 'create-only'   // clobber policy
}
```

`{group}` expands to `groupPath`, `{ramp}`/`{name}` to the ramp/single name,
`{step}` to the resolved step label, `{mode}` (optional) to the mode name. The
default config reproduces `applyPalette` exactly (Principle 2 / regression
guard). The pure resolver:

```ts
type PlannedVariable = {
  name: string                      // fully-resolved Figma variable name
  type: 'COLOR'
  valuesByMode: { modeRef: ModeRef; rgba: RgbaColor }[]
  alias?: { modeRef: ModeRef; targetName: string }   // foreground (RFC 0003)
  status: 'create' | 'overwrite'    // vs. the file's existing variables
}

resolve(config: VariableExportConfig, palette: ExportPayload, existing: ExistingTree)
  : { planned: PlannedVariable[]; warnings: string[] }
```

`resolve` is pure and exhaustively testable: every template token, every
`stepLabels`/`case` branch, the clobber policy, and the alias retargeting are
driven by unit tests with a fake `ExistingTree`.

### 3.2 Canvas swatches

Lay the ramps out as frames on the canvas. The engine already gives every swatch
its `hex`/`oklch`, its contrast `rating` (`AA`/`AAA`/...) and `display_ratio`, and
its `best_foreground` (RFC 0003) — so labels and a11y badges are *free data*, not
new computation.

```ts
type SwatchExportConfig = {
  orientation: 'horizontal' | 'vertical'   // ramp runs across or down
  shape: 'square' | 'rounded'
  cornerRadius: number                      // when rounded
  swatchSize: number                        // px per swatch
  gap: number                               // px between swatches
  ramps: 'separate' | 'stacked'             // one row/col each, or one block
  form: 'tile' | 'block' | 'card' | 'circle' | 'row' | 'panel'
                                            // the swatch's anatomy; constrains
                                            // `orientation` for circle and row
  stepLabels: { show: boolean }             // placement follows `form`
  hex: boolean                              // print the hex
  oklch: boolean                            // print the OkLCH — both may be on
  a11yBadge: { show: boolean; against: 'auto' | 'white' | 'black' }
  foregroundSwatch: boolean                 // show the engine's best foreground
  title: boolean                            // a heading per ramp
}
```

The **a11y badge** prints each swatch's contrast `rating` (and optionally the
`display_ratio`), coloured by pass/fail — `against: 'auto'` uses the engine's
`best_foreground`, or force a check against white/black. This makes a generated
sheet a contrast audit at a glance.

The pure planner turns config + palette into a renderer-agnostic layout — a flat
list of positioned boxes and text — testable with zero Figma:

```ts
type PlacedNode =
  | { kind: 'swatch'; x; y; w; h; radius; rgba: RgbaColor }
  | { kind: 'text'; x; y; text: string; rgba: RgbaColor; role: 'step' | 'value' | 'title' }
  | { kind: 'badge'; x; y; text: string; pass: boolean }

planSwatches(config: SwatchExportConfig, palette: ExportPayload)
  : { nodes: PlacedNode[]; width: number; height: number }
```

`planSwatches` owns all the geometry (orientation, gap, shape, label placement,
badge positioning) and is unit-tested exhaustively. The **`CanvasRenderer` port**
then turns `PlacedNode[]` into real Figma nodes (`createFrame` / `createRectangle`
/ `createText`) in the plugin, or into absolutely-positioned `<div>`s for the
workbench's live HTML preview — same plan, two renderers.

**Placement (the generate trigger).** Two ways to drop the planned frame:

- **Generate button** — the primary path: build the frame and place it on the
  **current page**, near the viewport centre (`figma.viewport.center`), selected
  and scrolled into view so the user sees it land.
- **Drag-and-drop** — drag a handle from the plugin UI onto the canvas; on drop
  the frame is created at the cursor position (Figma's `on('drop')` /
  `dropMetadata` carries the point). Same `planSwatches` output; only the origin
  `(x, y)` differs. **Open question (O6):** ship the button first and add
  drag-and-drop as a fast-follow, since drop-positioning is the fiddlier half.
  **Resolved (O6): the Generate button is the drag handle** — the preview's own
  drag gesture is taken by panning.

## 4. UX

The export panel has two output sections, each independently toggled on, both
reading/writing the one `ExportConfig`: **Variables** (§4.1–4.3) and **Canvas
swatches** (§4.5), with shared **presets** (§4.4). Sections 4.1–4.3 below are the
Variables sub-flow.

### 4.1 Destination browser — MillerColumns (recommended), Tree as alt

Collections → groups → subgroups is a drill-down of a `/`-delimited hierarchy,
which is exactly the **MillerColumns** mental model (column per level, pick a
node or type to create a new one — like a file open dialog). It scales to deep
group trees without a tall expanded panel and makes "create here" obvious at the
focused column.

**Tree** is the alternative: a denser single-pane overview that's better when the
user wants to *see* the whole existing structure at once. **Open question (O1):**
ship MillerColumns first, or Tree, or both behind a toggle.

In the workbench the columns are fed a **sample collection tree**; in the plugin
the same component is fed the real tree built from
`getLocalVariableCollectionsAsync()` + variable-name parsing. The component never
knows the difference (Principle 1).

### 4.2 Naming convention editor

The naming fields (`rampTemplate`, `separator`, `stepLabels`, `case`, optional
prefix) above a **live preview** that shows the first few resolved variable names
for the current palette (e.g. `color/brand/50`, `color/brand/100`, ...). The
preview is just `resolve(config, ...)` run on a sample — no Figma needed — so it is
honest about exactly what will be written.

### 4.3 Mode mapping

Pick which existing mode receives light values and which receives dark (or "write
a single mode"). On a brand-new collection, the default preset offers to create
`Light` and `Dark`. Collections with density or other modes are handled by
mapping, not assumption.

### 4.4 Presets & persistence

Ship one built-in preset — **"Primitiv default"** = today's behaviour. Users can
save the current `ExportConfig` as a named preset and reselect it. Persist the
last-used config + presets via plugin storage (`figma.clientStorage` /
`root.setPluginData`) in the plugin and `localStorage` in the workbench, so a
reload or a new session restores the user's setup. The author's personal
convention is simply the preset they save and keep selected.

### 4.5 Swatch style controls

The look-and-feel controls (orientation, shape + radius, size, gap, ramp
grouping, step labels, value, a11y badge, foreground swatch, title) above a
**live HTML preview** — the workbench renders `planSwatches(config, palette)`
through its DOM `CanvasRenderer`, so what the user tweaks is exactly what the
plugin will draw on the canvas (Principle 1). The preview is the design surface;
no Figma round-trip is needed to iterate the look.

Producing the swatches is an explicit, user-triggered action (§3.2):

- A **Generate swatches** button drops the frame on the **current page** at the
  viewport centre, selected and scrolled into view.
- Optionally, **drag a handle** from the panel onto the canvas to place the frame
  at the drop point (O6 — fast-follow).

Unlike the variable write (idempotent, overwrites in place), each generate is a
**fresh frame** the designer positions — so there is no clobber concern here.

### 4.6 Mock up in Figma first

Before any of this is built, both flows — the variables sub-flow (destination
browser, naming editor with its live preview, mode mapping, presets) and the
swatch style controls + preview — should be **wireframed in Figma** to settle the
layout and the step-by-step UX (what's one screen vs. a disclosure, where "create
new" lives, how the preview sits next to the controls, how the two output
sections coexist). The author can launch a **Figma-console-mcp** session from
their machine and drive the mock-ups with one-shot console scripts (see the
`figma-console-scripts` skill); the wireframes then become the reference the
workbench UI is built against. Settle O1 (MillerColumns vs Tree) on the mock-up,
not in code.

## 5. Architecture & build

- **Pure core** (`exportConfig.ts` + `resolve.ts` + `planSwatches.ts`) — the
  `ExportConfig` type and the two pure functions. No React, no Figma. 100%
  unit-tested.
- **Ports** — `VariableStore` (`listTree()` + `apply(planned)`) and
  `CanvasRenderer` (`render(plan, origin)`); fake/DOM implementations for the
  workbench and tests (the swatch preview is the DOM renderer), the real `figma`
  implementations in the (rebuilt) plugin.
- **UI** — the variables sub-flow (browser + naming + mode mapping) and the
  swatch style controls + live preview, both controlled by `ExportConfig`, built
  and iterated on the **workbench plugin-frame page**.
- The current `applyPalette` / `figmaIdempotent` become the first real
  `VariableStore` adapter when the plugin is rebuilt (RFC 0011 §8); their logic is
  the reference. The `CanvasRenderer` figma adapter is new (`createFrame` /
  `createRectangle` / `createText` + viewport/drop placement).

This is the same seam the CLI proved (RFC 0007). The export flow is therefore not
throwaway workbench scaffolding — its core and its UI are the spec the plugin
rebuild consumes.

## 6. Decisions

| # | Decision |
|---|---|
| D1 | **Destination = `(collection, groupPath)`; naming = the remaining path.** Location and naming are two ends of one variable name, split where browsing stops and templating begins. |
| D2 | **`ExportConfig` is pure, serializable data**; resolution and swatch-layout are pure functions; each output is an effect behind its own port — `VariableStore`, `CanvasRenderer` (Principle 1). |
| D3 | **Today's behaviour is the built-in "Primitiv default" preset** and the resolver reproduces it exactly (Principle 2 regression guard). |
| D4 | **Preview before write.** The variable flow shows planned create/overwrite per variable; the swatch flow shows a live render. Nothing is produced blind (Principle 3). |
| D5 | **Modes are mapped, not assumed.** Light/Dark are created only on the default-preset path for a fresh collection. |
| D6 | **Built workbench-first** against a fake `VariableStore` + a DOM `CanvasRenderer`, then the plugin supplies the real `figma` adapters — one UI, swappable adapters. |
| D7 | **Two independent outputs, either or both.** Variables and canvas swatches share one config and one run but are toggled independently; a user can generate swatches without touching variables and vice versa. |
| D8 | **Swatches are generated on demand onto the current page** (button → viewport centre; drag-and-drop → cursor), as a fresh frame each time — no idempotent overwrite, so no clobber concern. |

## 7. Open questions

- **O1 — MillerColumns vs Tree (vs both)** for the destination browser. Leaning
  MillerColumns for the create-as-you-drill flow; Tree as a possible overview
  toggle. Settle before the browser is built.
- **O2 — Naming template syntax.** A token string (`{group}/{ramp}/{step}`) is
  proposed; the alternative is a small set of structured dropdowns. The string is
  more expressive but needs validation + a forgiving parser.
- **O3 — Clobber policy default.** `create-and-overwrite` (idempotent re-export,
  matches today) vs `create-only` (never touch an existing variable). Proposed
  default: overwrite, with the preview making it explicit.
- **O4 — Foreground aliases under custom names (RFC 0003).** The per-step
  foreground alias points at another variable by name; confirm the resolver
  rewrites those targets through the same naming convention so aliases still
  resolve after a rename.
- **O5 — Persistence scope.** Per-file (`root.setPluginData`) vs per-user
  (`clientStorage`) vs both (presets per-user, last-used per-file). Likely both.
- ~~**O6 — Swatch placement.**~~ **Closed 2026-08-24: the Generate button is also
  the drag handle.** Click places at viewport centre; dragging the same button
  onto the canvas places at the cursor. A handle on the preview was rejected
  because the preview already uses drag to pan (it shows ~6 of 10 steps at its
  0.5× floor), and two drag gestures a few pixels apart is the ambiguity that
  makes drag targets feel unreliable. Both paths emit the same `planSwatches`
  output; only the origin differs, which is how §4.5 already framed them.
- ~~**O7 — Swatch sheet defaults & grouping.**~~ **Closed on the Figma mock-up:**
  separate · rounded 4 · size 56 · gap 8. Also settled there, and reflected in
  `SwatchExportConfig` above: the nine controls only fit 360 px as two
  Dense two-column cards; `value` became two independent booleans so one swatch
  can print both; and `form` was added while `stepLabels.placement` was removed —
  inside-vs-below is a property of the form, not an independent axis (the built
  view proved the overlap: `Inside` was selectable on a `panel` and silently did
  nothing).

## 8. Status

Draft. Seeds the export work that must land in the workbench before the plugin is
rebuilt. Two outputs share one config: **variables** (pure `resolve` +
`VariableStore`, destination browser + naming) and **canvas swatches** (pure
`planSwatches` + `CanvasRenderer`, style controls + live preview, generated onto
the current page). The pure cores and the two UIs are the substance; O1–O7 are the
decisions to settle — starting on the Figma mock-up (§4.6) — before the config
shape and the layouts are frozen.
