---
name: figma-component-example-page
description: How to build a clean "size × density × light/dark" example specimen on a Figma component page — two side-by-side theme panels, each a density-columns × size-rows grid of component INSTANCES, with the correct mode-override recipe (Intent flips Light/Dark, Palette stays Light) and the hug/clip cell trap. TRIGGER when adding or tidying a specimen/example/showcase layout on a component page, laying out instances across sizes and densities and themes, or asked to demonstrate a component across the density/theme matrix. SKIP for arranging the raw variant GRID inside a component set (see figma-arrange-component-set), building or extending the component itself (see figma-framed-control-component), and token-value changes (see figma-bridge-token-sync / figma-variable-architecture).
This is the page-level *showcase* of finished instances, distinct from figma-arrange-component-set (which lays out the variant set itself).
---

# Component-page example specimen (size × density × theme)

The demonstration layout that sits **below the component set** on a component
page: two theme panels (Light | Dark) side by side, each a grid of
**density columns × size rows**, every cell a live INSTANCE of the component in a
representative state. Built via `use_figma` / `figma_execute` (Plugin API). This
is the *showcase*; `figma-arrange-component-set` lays out the raw variant grid of
the set itself — different job.

## The two things that will bite you

### 1. Theming — Intent flips, **Palette stays Light**

The whole design system resolves through the **Light** `Primitives / Palette`.
`Intent` (Light/Dark) alone does the light/dark theming: in Dark, `content/primary`
→ `neutral/50`, `surface/default` → `color/black`, etc., and those aliases are
read against the **Light** palette (`neutral/50` = the light `[229]`).

- **Light panel:** Intent = Light, Palette = Light.
- **Dark panel:** Intent = **Dark**, Palette = **Light** (do NOT flip Palette).

If you also set Palette = Dark, the neutral ramp inverts a second time:
`surface/default` survives (it's a mode-invariant black anchor) so the panel
*looks* dark, but `content/primary` → `neutral/50` now resolves to the *dark*
palette's dark value and the labels **vanish** on the dark surface. This exact
double-inversion cost a debugging loop the first time. (See the theming rule in
`figma-variable-architecture` → intent-tokens.)

### 2. Cell frames — hug height + no clip (the `resize()` trap)

Each cell is a fixed-width, **hug-height** frame. Two hazards:

- Figma's `node.resize(w, h)` **pins the counter axis to FIXED**. If you resize a
  cell's height and leave it, taller instances (lg/xl boxes, or any control whose
  height grows with size/density) overflow the pinned height and get **clipped** —
  the box's bottom corners are cut off, so it reads as a *different shape* (looks
  like a radius/token bug when it's pure clipping). Set
  `counterAxisSizingMode = "AUTO"` **after** the resize.
- Set `clipsContent = false` on **every** frame in the specimen (root, panels,
  grid, header, rows, cells) so nothing — focus-ring overflow, a tall label, a big
  thumb — is ever cut.

Order that works: create cell → `appendChild(instance)` → set variant props →
`primaryAxisSizingMode="FIXED"; resize(CELL_W, cell.height)` → then
`counterAxisSizingMode="AUTO"` → then the density mode override.

## Collections & mode IDs (this file's design system)

| Collection | ID | Modes |
| --- | --- | --- |
| `Context` (density) | `VariableCollectionId:369:31958` | Dense `369:8` · Compact `369:9` · Comfortable `369:10` · Spacious `369:11` |
| `Intent` (theme) | `VariableCollectionId:346:4407` | Light `346:7` · Dark `372:1` |
| `Primitives / Palette` | `VariableCollectionId:345:4376` | Light `345:6` · Dark `371:0` |

Override on a node: `node.setExplicitVariableModeForCollection(collectionObject, modeId)`
(pass the resolved collection object, not the id string).

- **Theme** → on each panel frame (Intent + Palette per §1). Inherits to all cells.
- **Density** → on each cell frame (`Context` = its column's density). Inherits
  into the nested instance and its sub-nodes.

## Structure

```
root  (VERTICAL, fills [], clip off; Intent=Light + Palette=Light so stray text is legible)
  title  "Size × density × theme"        (content/primary)
  Panels (HORIZONTAL, gap 32, clip off)
    Light panel                          (fill surface/default; Intent=Light, Palette=Light)
      title "Light"                      (content/primary)
      Grid (VERTICAL)
        Header row: [corner spacer(LABEL_W)] + density names (content/secondary, each CELL_W wide)
        Size row (HORIZONTAL, counterAxis CENTER): [size label(LABEL_W)] + 4 cells
          Cell (FIXED CELL_W, HUG height, clip off; Context = column density)
            instance  (setProperties Size + State=on/checked + Interaction=default)
    Dark panel                           (fill surface/default; Intent=Dark, Palette=Light)
      … same grid …
```

- Density **columns** (Dense · Compact · Comfortable · Spacious), size **rows**
  (xs · sm · md · lg · xl). Column widths are a fixed `CELL_W` (≈160–170) so header
  and every row column-align; the corner/size-label column is a fixed `LABEL_W` (≈44).
- Header/size labels → `content/secondary` (theme-aware, legible on both panels).
  Panel + specimen titles → `content/primary`. Bind text fills with
  `figma.variables.setBoundVariableForPaint(paint, "color", varObj)`.
- One representative state per cell (checked / selected / on) **with a label** so the
  brand colour, the mark, and the label scaling all show in one control.

## Instances

```js
const set = await figma.getNodeByIdAsync(SET_ID);
const defComp = set.defaultVariant || set.children.find(c => c.type === "COMPONENT");
const inst = defComp.createInstance();
inst.setProperties({ Size: size, State: "checked", Interaction: "default" }); // "checked" == on for switch/radio
// Show label / Label default to true / "Label" — no need to set unless customising.
```

Variant values are the set's verbatim `Size|State|Interaction` strings. `Show label`
+ `Label` (the props added in the 2026-07 label build) default true / `"Label"`.

## Build order & verify

1. Position the set at `(40, 40)`; regenerate its variant-grid labels
   (`figma-arrange-component-set`) on the **correct page** — `setCurrentPageAsync`
   first, or labels land on whatever page is focused (a real bug: the bridge does
   not auto-switch pages, so cross-page `figma.currentPage.appendChild` dumps
   labels on the wrong page and can even swallow the set into a label group).
2. Build the specimen below the set (e.g. `root.y = 340`). Re-run safe: remove any
   existing `"… size × density × theme"` frame first.
3. Screenshot with `get_screenshot` (needs `fileKey` + `nodeId`; pass
   `enableBase64Response: true` — the asset URL is proxy-blocked for curl
   in-sandbox). Confirm: Dark labels visible (§1), no clipped corners (§2), columns
   aligned, marks centred at every size.

## Reusable builder

The proven builder is a single `use_figma` script — a `themes`/`densities`/`sizes`
loop creating the panels → grid → rows → cells → instances with the §1 theme
overrides and the §2 cell sizing. It is component-agnostic: parametrise `SET_ID`,
the page name, and the "on" state value. Used to build the Checkbox, Radio and
Switch specimens (2026-07). Drive it by `fileKey` via `use_figma` (no bridge
pairing) or `figma_execute` when the Desktop Bridge is paired — see the no-pair
note in `figma-bridge-token-sync`.
