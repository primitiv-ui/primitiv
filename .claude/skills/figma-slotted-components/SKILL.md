---
name: figma-slotted-components
description: How to build Figma composition components with INSTANCE_SWAP slots — the full workflow including the plugin API limitation, the manual user step, the componentPropertyReferences wiring, and the required slot table output. TRIGGER whenever building or updating a Figma composition component that contains nested sub-component instances a designer should be able to swap. SKIP for simple components with no nested instances.
---

# Figma slotted components

A **slotted component** is a Figma composition component whose nested
sub-component instances are exposed as named INSTANCE_SWAP properties in the
designer's property panel. When a designer instances the composition they see
e.g. "Row 1 — Item ▾" in the right panel and can swap it to any sub-component
in the preferred-values list — without detaching.

This is the standard approach for all dropdown, menu, and container
compositions in Primitiv.

---

## Plugin API limitation — why it is a two-step process

`ComponentNode.addComponentProperty('Row 1', 'INSTANCE_SWAP', key)` requires
`key` to resolve via `figma.importComponentByKeyAsync`. That function only
works for **published library** components. For local (unpublished) components
it returns `{}`, causing `addComponentProperty` to throw:

```
Property value is incompatible with component property type
```

This means **INSTANCE_SWAP properties must be created manually in the Figma
UI** — the plugin API cannot create them for local components. Claude then
wires `componentPropertyReferences` programmatically once the properties exist.

---

## The four-step workflow

### Step 1 — Build the composition (Claude)

Build the COMPONENT_SET with the correct size variants. Each variant is an
auto-layout COMPONENT containing nested instances (one per slot), all set to
`layoutSizingHorizontal = 'FILL'` **after** appending to the parent.

Use size-matched variant instances — the xs variant gets xs sub-component
instances, md gets md, etc.

### Step 2 — Print the slot table (Claude, required every time)

Before handing off to the user, always print a table to the terminal:

| Slot name | Default instance to select | Preferred values |
|---|---|---|
| Row 1 | Item — State=default, Size=md | Item, SubTrigger, … |
| Divider 1 | Separator — default | Separator, Label |
| … | … | … |

**Never skip this step.** The user uses this table directly in the Figma UI
to configure each property. Print it even if the slots seem obvious.

### Step 3 — User manually adds INSTANCE_SWAP properties (Figma UI)

The user performs this in Figma (one-time per component):

1. Select the composition COMPONENT_SET on its page.
2. Right-click → "Edit component".
3. In the Properties panel click **+** → **Instance swap**.
4. Name the property (e.g. `Row 1`), set the **default** from the table
   (search local components in the picker).
5. Click **Preferred values** → add each component set from the table.
6. Repeat for all slots.

The property name becomes the key prefix used in step 4 (e.g.
`Row 1#669:811`).

### Step 4 — Wire componentPropertyReferences (Claude)

Once the user confirms the properties are added, read the property definitions
from the component set and wire each nested instance:

```js
// 1. Read property IDs from the component set
const propDefs = compSet.componentPropertyDefinitions;
// → { 'Row 1#669:811': { type: 'INSTANCE_SWAP' }, … }

// 2. Map slot index → property key
const slotProps = [
  'Row 1#669:811',
  'Row 2#669:817',
  'Divider 1#669:823',
  // … one entry per slot, in child order
];

// 3. Wire every variant × every slot
for (const variant of compSet.children) {
  for (let i = 0; i < variant.children.length; i++) {
    const child = variant.children[i];
    if (child.type !== 'INSTANCE') continue;
    child.componentPropertyReferences = { mainComponent: slotProps[i] };
  }
}
```

Setting `componentPropertyReferences` causes Figma to apply the slot's default
value to that instance — so the composition will show all defaults after
wiring. This is expected; the designer overrides slots when they instance it.

Also remove any test properties added during development (e.g. `_testBool`)
using `compSet.deleteComponentProperty(key)` before wiring.

---

## Slot naming conventions

| Child type | Slot name |
|---|---|
| Row sub-component | Row 1, Row 2, Row 3, … |
| Separator / Label divider | Divider 1, Divider 2, … |
| Header label | Label |
| Panel / wrapper | Panel |

Name slots by position and role, not by what they currently contain — a slot
called "Row 3" is correct even if it defaults to a SubTrigger.

---

## Preferred values — standard sets

**Row slots (full dropdown context):**
Item, SubTrigger, CheckboxItem, RadioItem, Label, Group, RadioGroup

**Row slots (radio group context):**
RadioItem, Label

**Divider slots:**
Separator, Label

Group and RadioGroup are container sub-components — they must appear in row
slot preferred values so designers can insert them via the property panel.
Excluding them forces a detach to add a RadioGroup section, defeating the
purpose of slots.

---

## Key API facts

- `layoutSizingHorizontal = 'FILL'` must be set **after** `appendChild` —
  not before. Setting it before throws "FILL can only be set on children of
  auto-layout frames".
- `primaryAxisSizingMode = 'AUTO'` is the correct string for hug-height
  (not `'HUG'`, which is invalid in newer API versions).
- `figma.combineAsVariants(comps, page)` converts an array of top-level
  COMPONENT nodes into a COMPONENT_SET. Variant x/y positions within the set
  are inherited from their pre-combine page positions, so space them out
  before combining.
- After `combineAsVariants`, call `compSet.resize(w, h)` explicitly — the
  set does not auto-resize when children are repositioned.
- `figma.getNodeByIdAsync` is required (not `figma.getNodeById`) when
  `documentAccess: dynamic-page` is in effect.
- `await figma.setCurrentPageAsync(page)` is required to navigate pages —
  not the sync `figma.currentPage = page` setter.
