---
name: figma-arrange-component-set
description: Canonical recipe for arranging a framed-control component set into the documented size × variant grid, generating row/column text labels, and saving the script as a repo artefact. Covers the EDGE_PAD focus-ring fix, re-run safety, name-based variant parsing, and how to adapt the template for any new component. TRIGGER when laying out a component set grid, adding labels to a component set, writing or running an arrange script, or adapting the arrange pattern to a new component. SKIP for token work, component anatomy building, and React work.
---

# Arranging a framed-control component set

Every framed-control component set ships with a dedicated arrange script saved
under `apps/harmoni-figma-plugin/scripts/`. These scripts are run once (or
re-run after adding variants) via the Figma developer console **or** via
`mcp__figma-console__figma_execute`.

Existing scripts:
- `arrange-button-component-set.js` — Button (Variant/Size/State) — 100 variants
- `arrange-switch-component-set.js` — Switch (Size/State/Interaction) — 40 variants
- `arrange-checkbox-component-set.js` — Checkbox (Size/State/Interaction) — 60 variants
- `arrange-input-component-set.js` — Input (Size/State/Filled) — 50 variants; State major col × Filled sub-col, no Variant axis
- `arrange-field-component-set.js` — Field (Size/State) — 15 variants; **single column axis** (State only, no sub-columns) — the minimal case

## Grid convention

| Axis | Groups (major) | Rows/cols (minor) |
|------|---------------|-------------------|
| **Rows** | Size: md first, then xs sm lg xl | — |
| **Cols** | Variant or State groups | Interaction or State sub-columns |

**md first** — placing `md` at the top means the top-left cell is always the
most-used variant at the most-used size, which also becomes the component's
**default instance**.

**No density rows.** Density is controlled by the containing frame's `Context`
variable mode override — it is not a grid dimension. All components in the set
display at the default mode (Comfortable) in the canvas; they adapt to their
frame's mode when used in a design.

## Gap constants (standard values)

```js
const GAP_INTERACTION = 16;   // between sub-columns within a group
const GAP_STATE       = 48;   // between variant/state column groups
const GAP_SIZE        = 20;   // between size rows
const EDGE_PAD        = 24;   // inner padding on all 4 edges of the component set
```

`EDGE_PAD` is **required**. Focus ring frames extend 4 px beyond each
component's nominal bounds. Without the pad, the first row and column sit at
`x=0, y=0` inside the component set frame, and the −4 px ring overflow is
clipped by the frame boundary. 24 px = 4 px ring + 20 px breathing room.

Apply it by shifting *all* colX and rowY values by EDGE_PAD after calculating
them, then adding `EDGE_PAD * 2` to both dimensions when resizing the set:

```js
for (const k of Object.keys(colX)) colX[k] += EDGE_PAD;
for (const k of Object.keys(rowY)) rowY[k] += EDGE_PAD;
componentSet.resize(totalW + EDGE_PAD * 2, totalH + EDGE_PAD * 2);
```

## Re-run safety

The label group must be deleted before regenerating or labels accumulate:

```js
const existing = figma.currentPage.findOne(n => n.name === "Switch Grid Labels");
if (existing) existing.remove();
```

Use a predictable name: `"<ComponentName> Grid Labels"`.

## Name-based variant parsing (preferred over variantProperties)

During a build session, the component set may have mixed variant schemas.
`node.variantProperties` throws `"Component set for node has existing errors"`
in that state. Parse from the node name instead — it is always reliable:

```js
function parseProps(name) {
  return {
    sz:   name.match(/Size=(\w+)/)?.[1],
    st:   name.match(/State=(\w+)/)?.[1],
    iact: name.match(/Interaction=(\w+)/)?.[1],
  };
}
```

Only use `variantProperties` in scripts that run on a clean, fully-built set.

## Adapting for a new component

1. Copy the closest existing script to
   `apps/harmoni-figma-plugin/scripts/arrange-<component>-component-set.js`.
2. Change the property name constants and ordering arrays.
3. Update gap constants if the component has different visual weight.
4. Change the label group name to `"<ComponentName> Grid Labels"`.
5. Update the default-instance lookup to the correct top-left cell values.

The column/row measurement, EDGE_PAD, and label generation logic are identical
across all components — do not change them.

### Mapping component dimensions to Button's Variant/State axes

| Button axis | Meaning | Switch equivalent | Checkbox equivalent | Input equivalent | Field equivalent |
|-------------|---------|-------------------|---------------------|------------------|------------------|
| Variant (major col) | Visual intent (primary/secondary/…) | State (unchecked/checked) | State (unchecked/checked/indeterminate) | State (default/hover/focus/disabled/invalid) | State (default/invalid/disabled) |
| State (sub col) | Interaction state (default/hover/…) | Interaction (default/hover/…) | Interaction (default/hover/…) | Filled (empty/filled) | — *(none — single col axis)* |

If a component has no Variant equivalent (e.g. a single-appearance toggle),
collapse to one "group" — the major column axis just has one entry. And if there
is no sub-column axis either (Field: State only), drop the inner loop entirely —
`colX[state] = x; x += colMaxWidth[state]` with just `GAP_STATE` between columns.

## Running via figma_execute

The scripts are written to be pasted into the Figma developer console, but
they work equally well via `figma_execute` with minor adaptations:

1. Replace `figma.currentPage.selection.find(…)` with a direct `getNodeByIdAsync` lookup.
2. Replace `await figma.setCurrentPageAsync(page)` where needed.
3. The `figma.viewport.scrollAndZoomIntoView` call is harmless but optional.

Keep the font-load calls (`figma.loadFontAsync`) — they are required before
any text node characters can be set, even in `figma_execute`.

## Label layout details

```
         [above - 48px]  GROUP HEADERS  (bold, centred over each group's full width)
         [above - 24px]  sub-col labels (regular, centred on each column's width)
[left -  56px] size labels     (regular, vertically centred over each size row)
```

Sub-column labels are **centred on their column**, not left-aligned. This prevents
overlap at small sizes (e.g. "disabled" ≈ 44 px wide would bleed into the next
column at `GAP_INTERACTION = 8`). Pattern used in all three scripts:

```js
const colW = colMaxWidth[colKey] ?? 0;
const lbl  = makeLabel(text, 0, labelY, false);
lbl.x = cx + colX[colKey] + colW / 2 - lbl.width / 2;
```

All label nodes are collected into a single `figma.group(nodes, page)` so they
can be selected, hidden, or deleted as one unit. Re-style font/colour
afterwards — Inter is the safe default that is always available in Figma.
