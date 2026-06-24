---
name: figma-prose-component
description: Conventions for building prose/content Figma components (List, DescriptionList, Blockquote, Table, Figure, Divider…) — slot strategy, boolean-item expansion, variant axes, layout patterns, and API gotchas specific to content components. TRIGGER when building or extending a typography-library content component. SKIP for framed controls (Button, Input, Switch — see figma-framed-control-component), token value lookups (see figma-variable-architecture), and pure React/Rust work.
---

# Building a prose component in Figma

Playbook for content components in the RFC 0012 typography library: List,
DescriptionList, Blockquote, Table, Figure, Divider, and similar. These
components differ from framed controls (Button, Input) in that their primary
concern is **flexible content slots** rather than interaction states.

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
  Quote text (FILL, body/lg, content/secondary)
  Citation text (FILL, body/sm, content/muted, textAlignHorizontal='RIGHT')
    — visible=false when Citation=without
```

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
