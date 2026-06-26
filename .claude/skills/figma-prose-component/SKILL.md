---
name: figma-prose-component
description: Conventions for building prose/content Figma components (List, DescriptionList, Blockquote, Table, Figure, Divider…) — slot strategy, boolean-item expansion, variant axes, layout patterns, and API gotchas specific to content components. TRIGGER when building or extending a typography-library content component. SKIP for framed controls (Button, Input, Switch — see figma-framed-control-component), token value lookups (see figma-variable-architecture), and pure React/Rust work.
---

# Building a prose component in Figma

Playbook for content components in the RFC 0012 typography library: List,
DescriptionList, Blockquote, Table, Figure, Divider, and similar. These
components differ from framed controls (Button, Input) in that their primary
concern is **flexible content slots** rather than interaction states.

## Definition of done — every prose component page

A component page is not done until all five of these exist:

1. **Component set** — variants in a named grid, all token-bound, description field set.
2. **Minimum slots** — 8 item slots (items 1–4 always visible, 5–8 behind boolean properties). See §2.
3. **Grid labels** — `"ComponentName Grid Labels"` group: column headers above each size column, rotated tone/type section labels, per-row citation/state labels. Khand SemiBold 11px. See §6b.
4. **Light + Dark example frame** — `"ComponentName Example"` frame below the set: two rows (LIGHT / DARK) × four density columns (Dense / Compact / Comfortable / Spacious), intent mode on each row, context mode on each cell. See §9.
5. **Tokens backed up** — every new Figma variable written back to `packages/tokens/src/context.json` (Context) or `intent.json` (Intent), and the RFC D-section updated with variable IDs.

---

## 1. Slot strategy — INSTANCE_SWAP vs boolean visibility

### Preferred: INSTANCE_SWAP slots (publish-gated)

Every nested component instance in a content component is a natural slot.
Add an `INSTANCE_SWAP` component property so designers can swap the instance
for an alternative in the Figma panel:

```js
set.addComponentProperty('Item 1', 'INSTANCE_SWAP', defaultComponentKey, {
  preferredValues: [{ type: 'COMPONENT_SET', key: itemSetKey }]
});
```

**D11 limitation:** `addComponentProperty` for INSTANCE_SWAP throws
`"Property value is incompatible with component property type"` when the
default component has **not been published to a team library**. TEXT and
BOOLEAN are unaffected. Do not waste time retrying with different key formats.
Once the file is published, add INSTANCE_SWAP properties retroactively.

### Fallback: boolean visibility (always works)

Until published, expose slots via boolean `Show Item N` properties that
control the `visible` property of pre-baked nested instances:

```js
// Add the boolean property on the set
const propKey = set.addComponentProperty('Show Item 5', 'BOOLEAN', false);

// Bind a child node's visibility — must be AFTER appendChild
node.componentPropertyReferences = { visible: propKey };
```

The pair instance must already be a child of the component (inside the set)
before `componentPropertyReferences` is assigned, otherwise Figma throws
`"Could not find a component property"`.

---

## 2. Minimum slot count — 8 items

Every list-like content component ships with **at least 8 item slots**:

- Items 1–4: always visible (default state designers see on drop)
- Items 5–8: hidden by default, each gated by a `Show Item N` boolean property

In Figma auto-layout, property-bound hidden nodes **collapse to zero height**
— the component stays compact until a slot is toggled on. This is confirmed
behaviour; `visible=false` + property binding achieves the same ergonomics as
a native SLOT.

```
Component properties (boolean):
  Show Item 5 — default: false
  Show Item 6 — default: false
  Show Item 7 — default: false
  Show Item 8 — default: false
```

Apply this pattern to:
- **List** — 8 item slots (ListItem instances), Show Item 5–8
- **DescriptionList** — 8 pair slots (term + detail per pair), Show pair 3–8
  (pairs 1–2 always visible to give the component minimum useful content)
- **Table** — 8+ body-row slots
- Any future list-like component

---

## 3. Variant axes for content components

### Standard axes used across the library

| Axis | Values | Notes |
|------|--------|-------|
| `Size` | `xs · sm · md · lg · xl` | Maps to `body/{size}` tokens |
| `Type` | `unordered · ordered` | List only |
| `Indent` | `true · false` | List — controls `paddingLeft` binding |
| `Layout` | `stacked · inline` | DescriptionList — stacked vs side-by-side |
| `Tone` | `default · accent` | Blockquote — bar colour token |
| `Citation` | `with · without` | Blockquote — show/hide attribution |

### Adding a new axis via `combineAsVariants`

```js
// Rename existing variants before combining:
v.name = `Indent=true, Type=${type}, Size=${size}`;

// Then combine:
const newSet = figma.combineAsVariants([...originals, ...newClones], figma.currentPage);

// Fix garbled names from combineAsVariants (pre-existing variants get
// "Property 1=..., Property 2=..." mangled names):
newSet.children.forEach(v => {
  const m = v.name.match(/Property 2=(\w+),\s*Property 3=(\w+),\s*Property 4=(\w+)/);
  if (m) v.name = `Indent=${m[1]}, Type=${m[2]}, Size=${m[3]}`;
});
```

### Adding variants to an EXISTING set (no combineAsVariants)

When adding a new axis to an existing set (e.g. adding `Layout=inline` to
DescriptionList), use `set.appendChild(comp)` directly instead of
`combineAsVariants`. This preserves existing component properties and avoids
name mangling:

```js
// 1. Create and fully build the component (children, fonts, tokens)
const comp = figma.createComponent();
comp.name = `Layout=inline, Size=xs`;
// ... build structure ...

// 2. Append to set BEFORE binding component property references
dlSet.appendChild(comp);

// 3. NOW set FILL sizing (requires parent auto-layout)
childNode.layoutSizingHorizontal = 'FILL';

// 4. NOW bind component property references
childNode.componentPropertyReferences = { visible: propKey };
```

---

## 4. Layout patterns and common structures

### List container

```
List (vertical auto-layout, FIXED width, HUG height)
  itemSpacing → list/item-gap (Context variable)
  paddingLeft → list/indent (Context variable) — Indent=true only
  paddingLeft = 0 — Indent=false (unbind: setBoundVariable('paddingLeft', null))
  Item 1 … Item 8 (ListItem instances, Show Item 5–8 boolean)
```

### DescriptionList stacked

```
DescriptionList (vertical auto-layout, HUG)
  itemSpacing → list/item-gap
  Pair 1 … Pair 8:
    Pair (vertical auto-layout)
      Term (DescriptionTerm instance, HUG)
      Detail (DescriptionDetail instance, HUG, paddingLeft=16)
```

### DescriptionList inline

```
DescriptionList (vertical auto-layout, FIXED 320px)
  itemSpacing → list/item-gap
  Pair 1 … Pair 8:
    Pair (horizontal auto-layout, FILL width, counterAxisAlignItems=CENTER)
      Term (HUG)
      Detail (FILL width, primaryAxisAlignItems='MAX' → text right-aligns)
```

`primaryAxisAlignItems = 'MAX'` on the Detail instance pushes the text to the
right end of its FILL container. Set this on the instance (override), not on
the component's own layout.

### Blockquote

```
Blockquote (vertical auto-layout, FIXED width, HUG height)
  strokeLeftWeight = 3  ← accent bar (not a child frame)
  strokes → border/strong (default) | border/focus (accent)
  paddingLeft → quote/padding-inline (Context variable)
  itemSpacing — fixed per Size axis (4/4/8/12/16 for xs/sm/md/lg/xl)
  Quote text (FILL, body/{size}, content/secondary)
  Citation text (FILL, body/{size}, content/muted, textAlignHorizontal='RIGHT')
    — visible=false when Citation=without
```

**Quote/citation gap** scales with Size, not density. Bind `itemSpacing` to a
`quote/body-gap/{size}` Context variable on each variant (constant value across all
density modes — set the same value for every mode when creating the variable):

```js
const allVars = await figma.variables.getLocalVariablesAsync();
const gapVar = allVars.find(v => v.name === 'quote/body-gap/lg');
variant.setBoundVariable('itemSpacing', gapVar);
```

Variable IDs (VariableCollectionId:369:31958):

| Variable | Value | ID |
|----------|-------|-----|
| `quote/body-gap/xs` | 4px | `VariableID:588:8720` |
| `quote/body-gap/sm` | 4px | `VariableID:588:8721` |
| `quote/body-gap/md` | 8px | `VariableID:588:8722` |
| `quote/body-gap/lg` | 12px | `VariableID:588:8723` |
| `quote/body-gap/xl` | 16px | `VariableID:588:8724` |

Both Quote and Citation bind to `body/{size}` — the same scale. Do **not** use a
fixed `body/sm` for the citation across all sizes; it was a bug in the first
Blockquote build.

**Why stroke instead of a child bar frame:** A child frame with
`layoutSizingVertical = 'FILL'` in a `HUG`-height parent creates a circular
dependency — Figma resolves the FILL child to 1px. A left stroke on the
component frame itself always matches the full rendered height.

---

## 5. Critical ordering rules (D7, D8 — applies to content components too)

These gotchas apply equally to framed controls and content components:

### D7 — Use `layoutSizingHorizontal/Vertical`, not `primaryAxisSizingMode`

```js
// WRONG — throws "Invalid enum value. Expected 'FIXED' | 'AUTO', received 'HUG'"
comp.primaryAxisSizingMode = 'HUG';

// CORRECT
comp.layoutSizingHorizontal = 'HUG';
comp.layoutSizingVertical = 'HUG';
```

### D8 — Call `resize()` BEFORE setting HUG/FILL sizing modes

```js
// CORRECT order
comp.layoutMode = 'VERTICAL';
comp.resize(320, 80);              // 1. Set dimensions first
comp.layoutSizingHorizontal = 'FIXED';  // 2. Then sizing modes
comp.layoutSizingVertical = 'HUG';
```

Calling `resize()` after `layoutSizingVertical = 'HUG'` overrides HUG back to
FIXED and pins the height.

### FILL sizing — must be set AFTER appendChild

```js
comp.appendChild(child);          // 1. Append to auto-layout parent first
child.layoutSizingHorizontal = 'FILL';  // 2. THEN set FILL
```

Setting FILL before the node is a child of an auto-layout frame throws
`"FILL can only be set on children of auto-layout frames"`.

### componentPropertyReferences — must be set AFTER appendChild

```js
dlSet.appendChild(comp);          // 1. comp must be IN the set
pair.componentPropertyReferences = { visible: propKey };  // 2. THEN bind
```

Binding before append throws `"Could not find a component property"`.

### `clone()` drops descendant `componentPropertyReferences`

When you build a new variant axis by cloning existing variants (e.g. adding a
`Tone` axis by `clone()`-ing every variant and recolouring), the clone does
**not** carry over the `componentPropertyReferences` on nested nodes — so a
cloned variant's text node loses its `Text` TEXT-property binding (and any
`visible` boolean binding) and silently shows the default with no editable
property. After cloning + `appendChild`, **re-bind every reference on the
clone's descendants**:

```js
const clone = comp.clone();
set.appendChild(clone);
clone.findOne(n => n.type === 'TEXT').componentPropertyReferences =
  { characters: 'Text#606:436' };   // the set's existing TEXT property key
```

(`instance.resetOverrides()` is a related trap: it also clears a nested
instance's custom **name** and layout-sizing overrides — re-apply `name` and
`layoutSizingHorizontal = 'FILL'` after calling it.)

---

## 6. Grid layout for component sets

After building all variants, position them in a grid and resize the set.
Do NOT rely on Figma's auto-arrange — calculate positions explicitly:

```js
const PAD = 24, GAP = 24;

// Row 1 (e.g. Layout=stacked)
allV.filter(v => v.name.includes('Layout=stacked')).forEach((v, i) => {
  v.x = PAD + i * (v.width + GAP);
  v.y = PAD;
});

const row1MaxH = Math.max(...row1Variants.map(v => v.height));

// Row 2 (e.g. Layout=inline, all FIXED 320px)
allV.filter(v => v.name.includes('Layout=inline')).forEach((v, i) => {
  v.resize(320, v.height);   // enforce consistent width
  v.x = PAD + i * (320 + GAP);
  v.y = PAD + row1MaxH + GAP;
});

const row2MaxH = Math.max(...row2Variants.map(v => v.height));
set.resize(PAD + numCols * 320 + (numCols-1)*GAP + PAD, PAD + row1MaxH + GAP + row2MaxH + PAD);
```

After repositioning children, always call `set.resize(w, h)` — the set does
not auto-expand.

---

## 6b. Grid labels for component sets (REQUIRED)

Every component set ships with a "Grid Labels" group on the page. Labels use
Khand SemiBold 11px, colour bound to `content/primary` (or `/secondary` for
secondary labels).

```js
await figma.loadFontAsync({ family: "Khand", style: "SemiBold" });
const allVars = await figma.variables.getLocalVariablesAsync();
const contentPrimary   = allVars.find(v => v.id === 'VariableID:346:4435');
const contentSecondary = allVars.find(v => v.id === 'VariableID:346:4436');

const labelNodes = [];

function makeLabel(chars, x, y, color, rotateClockwise90) {
  const t = figma.createText();
  t.fontName = { family: 'Khand', style: 'SemiBold' };
  t.fontSize = 11;
  t.characters = chars;
  t.fills = [{ type: 'SOLID', color: { r:0,g:0,b:0 }, boundVariables: { color: figma.variables.createVariableAlias(color) } }];
  figma.currentPage.appendChild(t);
  if (rotateClockwise90) t.rotation = -90;  // -90° = 90° clockwise; text reads bottom-to-top
  t.x = x; t.y = y;
  labelNodes.push(t);
  return t;
}

const SET_X = set.x, SET_Y = set.y, COL_W = 320, GAP = 24, PAD = 24;

// Column headers — centred above each column
COLS.forEach((col, i) => {
  const lbl = makeLabel(col.name, 0, 0, contentPrimary);
  lbl.x = SET_X + PAD + i * (COL_W + GAP) + (COL_W - lbl.width) / 2;
  lbl.y = SET_Y - 24;
});

// Rotated section labels (e.g. TONE spanning multiple rows)
// For -90° CW rotation: text renders top→bottom (reads L→R when tilted right).
// After rotation, place y = midY + textNode.width / 2  (width becomes visual height).
TONE_SPANS.forEach(span => {
  const lbl = makeLabel(span.label, 0, 0, contentPrimary, true);
  const midY = SET_Y + (span.topY + span.bottomY) / 2;
  lbl.x = SET_X - 108;
  lbl.y = midY + lbl.width / 2;
});

// Per-row labels (horizontal, secondary colour)
ROWS.forEach(row => {
  const lbl = makeLabel(row.label, 0, 0, contentSecondary);
  lbl.x = SET_X - 72;
  lbl.y = SET_Y + row.y + (row.h - lbl.height) / 2;
});

// Group — MUST pass a non-empty array
const group = figma.group(labelNodes, figma.currentPage);
group.name = 'ComponentName Grid Labels';
```

**Critical:** `figma.group([], page)` throws "must be an array of at least one
node". Always collect nodes into an array first, then call `group(nodes, page)`.

The rotated label `y` formula (`midY + lbl.width / 2`) accounts for Figma's
rotation pivot: after `-90°` rotation the original text WIDTH becomes the visual
HEIGHT, so centring requires half the original width as the vertical offset.

---

## 7. Token bindings for content components

### Spacing (Context collection — density-scaling)

| Property | Variable | API |
|----------|----------|-----|
| `itemSpacing` | `list/item-gap` | `frame.setBoundVariable('itemSpacing', v)` |
| `paddingLeft` (indent) | `list/indent` | `frame.setBoundVariable('paddingLeft', v)` |
| `paddingLeft` (quote) | `quote/padding-inline` | `frame.setBoundVariable('paddingLeft', v)` |
| `paddingLeft = 0` (no indent) | — | `frame.setBoundVariable('paddingLeft', null)` |

### Colour (Intent collection — light/dark aware)

```js
node.fills = [{
  type: 'SOLID',
  color: { r: 0, g: 0, b: 0 },
  boundVariables: { color: figma.variables.createVariableAlias(intentVar) }
}];
```

### Strokes (for accent bars, borders)

```js
node.strokes = [{
  type: 'SOLID',
  color: { r: 0, g: 0, b: 0 },
  boundVariables: { color: figma.variables.createVariableAlias(borderVar) }
}];
node.strokeTopWeight = 0;
node.strokeRightWeight = 0;
node.strokeBottomWeight = 0;
node.strokeLeftWeight = 3;
node.strokeAlign = 'INSIDE';
```

### Typography (four inline bindings — never a named text style inside a component)

```js
node.setBoundVariable('fontFamily', bodyLgFontFamilyVar);
node.setBoundVariable('fontSize',   bodyLgFontSizeVar);
node.setBoundVariable('lineHeight', bodyLgLineHeightVar);
node.setBoundVariable('fontStyle',  bodyLgFontStyleVar);
```

Variable IDs for body/lg and body/sm in the Context collection:

| Variable | ID |
|----------|----|
| `body/lg/font-family` | `VariableID:369:31999` |
| `body/lg/font-size`   | `VariableID:369:32001` |
| `body/lg/line-height` | `VariableID:369:32002` |
| `body/lg/font-style`  | `VariableID:369:32003` |
| `body/sm/font-family` | `VariableID:369:31989` |
| `body/sm/font-size`   | `VariableID:369:31991` |
| `body/sm/line-height` | `VariableID:369:31992` |
| `body/sm/font-style`  | `VariableID:369:31993` |

---

## 8. Component descriptions

Every component set gets a `.description` string documenting:
- What it is (one sentence)
- Variant axes and their values
- Boolean properties and what they show/hide
- Token bindings that affect density/theme
- Any known limitations (INSTANCE_SWAP blocked until published, etc.)

```js
bqSet.description = 'Blockquote with left accent bar.\n\nVariants:\n• Tone=default — neutral bar (border/strong)\n• Tone=accent — brand bar (border/focus)\n• Citation=with/without\n\nQuote: body/lg, content/secondary. Citation: body/sm, content/muted, end-aligned.';
```

---

## 9. Light + Dark example frame (REQUIRED)

Every component page ships with a "ComponentName Example" frame below the
component set. Two rows — Light and Dark — each showing four density columns
(Dense / Compact / Comfortable / Spacious). Row labels sit to the left.

```js
// Resolve collections and modes
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const allVars     = await figma.variables.getLocalVariablesAsync();

const surfaceDefaultVar = allVars.find(v => v.id === 'VariableID:346:4430');
const contentPrimaryVar = allVars.find(v => v.id === 'VariableID:346:4435');

// Intent collection (surface/default lives here — VariableCollectionId:346:...)
const intentCollection = collections.find(c => c.id === surfaceDefaultVar.variableCollectionId);
const lightModeId = intentCollection.modes.find(m => m.name.toLowerCase().includes('light'))?.modeId;
const darkModeId  = intentCollection.modes.find(m => m.name.toLowerCase().includes('dark'))?.modeId;

// Context / density collection
const contextCollection  = collections.find(c => c.id === 'VariableCollectionId:369:31958');
const denseModeId        = contextCollection.modes.find(m => m.name.toLowerCase() === 'dense')?.modeId;
const compactModeId      = contextCollection.modes.find(m => m.name.toLowerCase() === 'compact')?.modeId;
const comfortableModeId  = contextCollection.modes.find(m => m.name.toLowerCase() === 'comfortable')?.modeId;
const spaciousModeId     = contextCollection.modes.find(m => m.name.toLowerCase() === 'spacious')?.modeId;

const INNER_PAD = 24, GAP = 24;
const DENSITIES = [
  { label: 'Dense',       modeId: denseModeId },
  { label: 'Compact',     modeId: compactModeId },
  { label: 'Comfortable', modeId: comfortableModeId },
  { label: 'Spacious',    modeId: spaciousModeId },
];
const THEMES = [
  { label: 'LIGHT', intentModeId: lightModeId },
  { label: 'DARK',  intentModeId: darkModeId  },
];

// Representative component variant (e.g. Tone=default, Citation=with, Size=md)
const representative = compSet.children.find(v =>
  v.name.includes('Size=md') && v.name.includes('Citation=with') && v.name.includes('Tone=default')
);

// Outer frame
const exFrame = figma.createFrame();
exFrame.name = 'ComponentName Example';
exFrame.layoutMode = 'VERTICAL';
exFrame.primaryAxisSizingMode = 'AUTO'; exFrame.counterAxisSizingMode = 'AUTO';
exFrame.paddingTop = INNER_PAD; exFrame.paddingBottom = INNER_PAD;
exFrame.paddingLeft = INNER_PAD; exFrame.paddingRight = INNER_PAD;
exFrame.itemSpacing = GAP;
exFrame.fills = [];
figma.currentPage.appendChild(exFrame);

for (const theme of THEMES) {
  const row = figma.createFrame();
  row.name = theme.label;
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisSizingMode = 'AUTO'; row.counterAxisSizingMode = 'AUTO';
  row.paddingTop = INNER_PAD; row.paddingBottom = INNER_PAD;
  row.paddingLeft = INNER_PAD; row.paddingRight = INNER_PAD;
  row.itemSpacing = GAP;
  row.fills = [{
    type: 'SOLID', color: { r:0,g:0,b:0 },
    boundVariables: { color: figma.variables.createVariableAlias(surfaceDefaultVar) }
  }];
  // Intent mode on the row → surface/default resolves to white (Light) or black (Dark)
  row.setExplicitVariableModeForCollection(intentCollection, theme.intentModeId);
  exFrame.appendChild(row);

  for (const density of DENSITIES) {
    const cell = figma.createFrame();
    cell.name = density.label;
    cell.layoutMode = 'VERTICAL';
    cell.primaryAxisSizingMode = 'AUTO'; cell.counterAxisSizingMode = 'AUTO';
    cell.fills = [];
    row.appendChild(cell);
    cell.appendChild(representative.createInstance());
    // Context mode on the cell → body/md tokens resolve to density-appropriate values
    cell.setExplicitVariableModeForCollection(contextCollection, density.modeId);
  }
}

// Position below the set with gap
exFrame.x = compSet.x;
exFrame.y = compSet.y + compSet.height + 100;

// Row labels to the left
const rows = exFrame.children;
THEMES.forEach((theme, i) => {
  const row = rows[i];
  const t = figma.createText();
  t.fontName = { family: 'Khand', style: 'SemiBold' }; t.fontSize = 11;
  t.characters = theme.label;
  t.fills = [{ type:'SOLID', color:{r:0,g:0,b:0}, boundVariables:{ color: figma.variables.createVariableAlias(contentPrimaryVar) } }];
  figma.currentPage.appendChild(t);
  t.x = exFrame.x - t.width - 12;
  t.y = exFrame.y + INNER_PAD + row.y + (row.height - t.height) / 2;
});
```

**Notes:**
- `setExplicitVariableModeForCollection(collection, modeId)` requires the
  **VariableCollection object** (not the ID string). Resolve it from a known
  variable's `.variableCollectionId` or search `getLocalVariableCollectionsAsync()`.
- Intent mode goes on the **row** (Light/Dark rows each set their own theme).
  Context mode goes on the **cell** (each density cell overrides context separately).
- The `surface/default` fill token on the row resolves to white in Light mode and
  black in Dark mode — no hardcoded hex values needed.
- Row labels are TEXT nodes on the page (not inside the frame), positioned after
  the frame is fully built so sizes are accurate.

---

## 10. Pull Quote layout pattern

Pull quote: centred heading-scale quote with optional decorative mark. No left
bar, no attribution. 2 × 5 = 10 variants: **Marks × Size**.

```
PullQuote (VERTICAL auto-layout, FIXED 480px, HUG height, padding 24px all)
  [Mark]  INSTANCE of `Pull Quote / Mark` (matching Size); Marks=with only
  Quote   TEXT, heading/{h1–h5}, content/primary, textAlignHorizontal=CENTER, FILL width
```

Size → heading slot mapping:

| Size | Slot | fontFamily ID | fontSize ID | lineHeight ID | fontStyle ID |
|------|------|--------------|------------|--------------|-------------|
| xs | h5 | `VariableID:369:32024` | `369:32026` | `369:32027` | `369:32028` |
| sm | h4 | `VariableID:369:32019` | `369:32021` | `369:32022` | `369:32023` |
| md | h3 | `VariableID:369:32014` | `369:32016` | `369:32017` | `369:32018` |
| lg | h2 | `VariableID:369:32009` | `369:32011` | `369:32012` | `369:32013` |
| xl | h1 | `VariableID:369:32004` | `369:32006` | `369:32007` | `369:32008` |

### Decorative mark — `Pull Quote / Mark` subcomponent

The mark is **not** a live font glyph (Khand's `"` looked poor) and **not**
hand-rolled beziers (every attempt drifted into a blob/flame). It is the
opening-quote glyph **`“` (U+201C) from Hoefler Text Black**, outlined to a
vector and recoloured — a refined, real typographic quote chosen by the human
from a five-font comparison (Playfair Display Black, Hoefler Text Black, Georgia
Bold, Lora Bold, PT Serif Bold).

Separate component set `Pull Quote / Mark` with 5 `Size` variants. Each variant
holds a single flattened `VECTOR` (named `mark`), fill bound to `content/muted`.
Build per variant:

```js
const t = figma.createText();
t.fontName = { family: "Hoefler Text", style: "Black" };
t.fontSize = 200;                 // large for a crisp outline
t.characters = "“";               // U+201C, renders as the paired 66 quote
comp.appendChild(t);
const flat = figma.flatten([t], comp);
flat.rescale(H / flat.height);    // H = mark height for the size (below)
flat.fills = [{ type:'SOLID', color:{r:0,g:0,b:0},
  boundVariables:{ color: figma.variables.createVariableAlias(mutedVar) } }];
comp.resize(Math.round(flat.width), Math.round(flat.height));
```

Mark height `H` per size (frame width follows the ~1.18:1 glyph aspect):

| Size | xs | sm | md | lg | xl |
|------|----|----|----|----|----|
| H    | 18 | 22 | 28 | 32 | 38 |

The `Marks=with` variants embed an **instance** of the matching mark size as
`children[0]`, so editing the mark set propagates to every Pull Quote. (Gotcha:
the set lives on the **Pull quote** page named `Pull Quote / Mark` — if stray
keystrokes land on it while selected in Figma it gets silently renamed; find it
by its 5 `Size=` children, not only by name.)

display/lg: `369:32034` / `369:32036` / `369:32037` / `369:32038`

Mark→quote `itemSpacing` (hardcoded, not a variable — not a density concern):

| xs | sm | md | lg | xl |
|----|----|----|----|----|
| 8px | 8px | 12px | 16px | 20px |

For the Marks=without variants, set `comp.itemSpacing = 0` and omit the Mark
node entirely — each variant is a separate `ComponentNode` in the set.

Grid layout: 2 rows (with / without) × 5 columns (xs/sm/md/lg/xl). Grid labels
group: column headers xs…xl above; row labels WITH / WITHOUT to the left.
Example frame: Light + Dark × Dense/Compact/Comfortable/Spacious (representative
variant: `Marks=with, Size=md`).

## 11. Inline code / leaf-chip pattern

Inline code (`<code>`), and later `<kbd>` / `<samp>`, are **leaf chips**, not
list-like components: a single styled text node in a tinted box. The slot
strategy (§1–2) and the 8-item rule do **not** apply. Single `Size` axis
(xs–xl); each variant is a HORIZONTAL auto-layout, HUG × HUG, centred.

```
InlineCode/Size=md  (HORIZONTAL auto-layout, HUG × HUG, items centred)
  paddingLeft/Right → space/space-4   ·  paddingTop/Bottom → space/space-2
  4 corner radii → radii/4
  fills → surface/subtle  ·  strokes → border/subtle (1px, INSIDE)
  Code text (TEXT):
    fontFamily → font-family/mono primitive (VariableID:601:9479)
    fontSize + fontStyle → body/{size} Context (density-aware)
    lineHeight → fixed 130% (PERCENT, NOT bound)
    fill → content/primary
```

**Type sourcing — the one wrinkle.** `fontFamily` binds to the **mono
primitive** (in the Primitives collection), while `fontSize`/`fontStyle` bind to
**`body/{size}`** (Context collection). Mixed-collection binding on one text
node is fine — there is no `code/{size}` Context typography namespace yet (that
arrives with the emitter / new-typography session).

**Line-height is the design call (D15).** Do NOT bind `lineHeight` to
`body/{size}/line-height` — body's 150% makes a standalone chip read pill-like.
100% clips JetBrains Mono descenders (`g`/`j`/`p`). **130%** clears descenders,
gives a snug box, and — set as a PERCENT (not a fixed px) — still scales with the
density-bound `fontSize`. Unbind first if a body line-height was set earlier:
`t.setBoundVariable('lineHeight', null); t.lineHeight = { unit:'PERCENT', value:130 }`.

The 130% literal was **tokenised** in the Code block session (D16): inline code's
`lineHeight` now binds to **`code/{size}/line-height`** (Context, density-aware),
which aliases the nearest line-height primitive to 1.3× the font-size. The
primitive scale was coarse (no 17/18), so **`line-height/18` was added** as a
primitive, pulling every size into a consistent 1.2–1.33×. Block code does *not*
use this — it stays on `body/{size}/line-height` (looser, for multi-line
readability). See RFC 0012 D16.

Build the 5 components, then `figma.combineAsVariants(variants, page)` and lay
them out in a single row (left→right, vertically centred on the tallest). Grid
labels: just column headers xs…xl (no rotated section / per-row labels — single
axis). Example frame: the standard Light + Dark × four-density grid,
representative `Size=md`. No new Context/Intent tokens to back up — it reuses
`body/*` + existing primitives + `font-family/mono`.

## 12. Code block pattern

Code block (`<pre>`) — a monospace container with an optional header and gutter.
5 `Size` variants (xs–xl); the header and gutter are **boolean visibility
properties** (`Show Header`, `Show Line Numbers`), not variant axes. Single-
colour code text — syntax highlighting is the consuming tool's job, not Figma's.

```
CodeBlock/Size=md  (VERTICAL, FIXED ~440 default, HUG height, clip)
  radii/8 · fills surface/subtle · strokes border/subtle 1px INSIDE
  Header  (HORIZONTAL, FILL, SPACE_BETWEEN, padding code/padding × space-8)
    bottom border: border/subtle (strokeBottomWeight=1, others 0)
    Filename  (mono, body/{size}, content/secondary)
    Copy      (Icon Button instance — secondary, size-matched, `copy` icon)
  Code area  (HORIZONTAL, FILL, counterAxisAlignItems=MIN, padding code/padding, itemSpacing code/padding)
    Gutter (named "Gutter")  — mono, body/{size}, content/muted, textAlignHorizontal=RIGHT
    Code   (named "Code", FILL) — mono, body/{size}, content/primary
```

Key points:

- **Gutter + Code must share `fontSize` + `lineHeight`** (both `body/{size}`) so
  line numbers align with code rows. Block line-height is `body/{size}/line-height`
  (the body 1.5 — readable for multi-line), *not* the snug inline `code/*` value.
- **Header scales with Size**: bind the filename to `body/{size}` and use an Icon
  Button of the matching `Size`, with the size-matched `copy` icon variant. The
  copy→check swap on click is runtime behaviour (React/tooling), not a Figma state.
- **Copy = Icon Button** (`secondary`), `setProperties({ "Icon#…": <copyIconNodeId> })`.
  Find `icon=copy, size=<n>` node IDs in the Icon set.
- **Booleans after `combineAsVariants`**: `set.addComponentProperty('Show Header',
  'BOOLEAN', true)` → bind each variant's `Header` and `Gutter` via
  `node.componentPropertyReferences = { visible: propKey }` (node must already be in
  the set). Hidden nodes collapse to zero height in auto-layout.
- **New `code/*` tokens** (Context, density-aware): `code/padding` (12/12/16/16) and
  `code/{size}/line-height` (inline-code snug value; block reuses body). Back both up
  to `context.json`; `line-height/18` to `primitives.json`. See RFC 0012 D16.

Grid: single row of 5 fixed-width variants. Grid labels: column headers xs…xl.
Example frame: standard Light + Dark × four-density grid, representative `Size=md`.
