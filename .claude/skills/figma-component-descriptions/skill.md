---
name: figma-component-descriptions
description: Schema and process for writing the description field on every Figma component set — the primary way an agent learns what a component does, what axes exist, what properties to configure, and what to compose it with, without touching the canvas. Mandatory last step after any component build or update. TRIGGER when finishing a component design, when asked to write or check component descriptions, or when building a layout from existing components and needing to understand them.
---

# Figma component descriptions

The description field is the **declarative contract** for each component. When
an agent needs to build a layout or edit a component, the description is the
first — and ideally only — thing it reads. A missing or stale description forces
canvas analysis, which is slow and error-prone.

**Rule:** no component design is *done* until its description is written.

---

## Schema

Every component set description follows this shape:

```
[One sentence stating what the component is and does.]

Type: framed-control | non-framed composition | surface component | layout | icon set

Axes: AxisName val1|val2|val3 · AxisName val1|val2 · ...

Tokens: fill   [token family or specific token]
        stroke [token family or specific token]
        sizing [token namespace]
        [other relevant bindings]

Properties: Name (TYPE default) · Name (TYPE) · ...

Density: Context mode override on parent frame (Dense/Compact/Comfortable/Spacious)
Pairs with: [related components]
Notes: [non-obvious design decisions, constraints, gotchas]
```

### Field-by-field guide

**Type** — tells an agent what structural role this component plays:
- `framed-control` — bordered, auto-layout, responds to `framed-control/{size}/*` tokens; can be placed directly in any container
- `non-framed composition` — vertical or horizontal assembly of nested components; no outer border; must be given a width
- `surface component` — lives *inside* a panel or overlay (Dropdown items, Tooltip content); not used standalone
- `layout` — purely structural (Divider); no interaction
- `icon set` — icon glyph library; swap via INSTANCE_SWAP

**Axes** — every variant property and its allowed values, verbatim. This is the query contract: an agent uses exactly these strings in `setProperties()` calls. One line, `·` between axes.

**Tokens** — which semantic families drive the fills, strokes, and sizing. Name the family, not the hex value. An agent can look up resolved values; what matters here is the *family* (`surface/*`, `border/*`, `action/{variant}/*`, `framed-control/{size}/*`, a component-specific namespace like `dropdown/item/*`).

**Properties** — component properties exposed at the panel level (TEXT, BOOL, INSTANCE_SWAP). Format: `Name (TYPE default)` — e.g. `Label (TEXT "Button")`, `Show leading icon (BOOL true)`, `Leading icon (SWAP)`.

**Density** — always "Context mode override on parent frame" for components that respond to density. Omit or write "not density-sensitive" for components that don't (e.g. Divider).

**Pairs with** — other component sets this one is commonly composed with or nested inside.

**Notes** — non-obvious decisions that would otherwise require canvas analysis: focus-ring behaviour, disabled strategy, radius formula, which gotchas apply.

---

## Setting a description via figma_execute

```js
// IMPORTANT: navigate to the component's own page first — cross-page writes
// via getNodeByIdAsync alone do NOT persist.
await figma.loadAllPagesAsync();
const page = figma.root.children.find(p => p.name === 'Select');
await figma.setCurrentPageAsync(page);

const set = await figma.getNodeByIdAsync('403:1883');
set.description = `[description text]`;
```

When writing descriptions for multiple components across different pages, group
by page and call `setCurrentPageAsync` before each group. Descriptions live on
the node itself — they survive renames and moves. Use template literals for
multi-line text.

---

## Canonical descriptions — current component set

These are the live descriptions. Update this section whenever a component is
built or significantly changed.

### Button — `347:14161`

```
Interactive action trigger; four visual intents and five interaction states.

Type: framed-control

Axes: Variant primary|secondary|danger|link · Size xs|sm|md|lg|xl · State default|hover|active|focus|disabled

Tokens: fill/stroke/fg → action/{variant}/* per state
        sizing → framed-control/{size}/height|padding-inline|gap|radius

Properties: Label (TEXT "Button text") · Leading Icon (BOOL true) · Leading Icon Instance (SWAP) · Trailing Icon (BOOL true) · Trailing Icon Instance (SWAP)

Density: Context mode override on parent frame
Notes: link variant has no fill or stroke; focus ring is brand teal on all variants; disabled uses action/*/disabled tokens
```

### Switch — `315:5884`

```
Binary on/off toggle; thumb slides within a pill-shaped track.

Type: framed-control

Axes: Size xs|sm|md|lg|xl · State unchecked|checked · Interaction default|hover|focus|disabled

Tokens: track fill → action/secondary/* (unchecked) · action/primary/* (checked)
        sizing → switch/{size}/track-width|track-height|thumb-size|thumb-margin (Context collection)

Properties: Focus ring (BOOL false)

Density: Context mode override on parent frame
Notes: thumb position driven by paddingLeft/Right on auto-layout track; focus ring is circular (radius 9999); disabled uses 50% frame opacity
```

### Checkbox — `369:30652`

```
Three-state selection control — unchecked, checked, indeterminate.

Type: framed-control

Axes: Size xs|sm|md|lg|xl · State unchecked|checked|indeterminate · Interaction default|hover|focus|disabled

Tokens: box fill → action/secondary/* (unchecked) · action/primary/* (checked/indeterminate)
        sizing → checkbox/{size}/box-size|radius|icon-size (Context collection)

Properties: (none — all behaviour via Axes)

Density: Context mode override on parent frame
Notes: check/minus marks are Icon instances (check/minus glyph) with fill → action/primary/foreground/*
```

### Field — `394:7449`

```
Vertical form-field wrapper — label above, nested control, helper text below.

Type: non-framed composition

Axes: State default|invalid|disabled · Size md|xs|sm|lg|xl

Tokens: label fill → content/primary (disabled: content/disabled)
        helper fill → content/secondary → content/error (invalid) → content/disabled
        nested Input: State coordinated to match Field State

Properties: Label (TEXT "Label") · Helper (TEXT "Helper text") · Show helper (BOOL true) · Required (BOOL false)

Density: Context mode override on parent frame (propagates to nested Input)
Pairs with: Input (nested by default), Select (can substitute as the nested control)
Notes: label → Khand SemiBold (label/* tokens); helper → Asta Sans Regular (body/* tokens); single helper-text slot whose colour changes by State
```

### Input — `393:6159`

```
Single-line text entry; no intent axis — neutral surface/border/content styling.

Type: framed-control

Axes: Size md|xs|sm|lg|xl · State default|hover|focus|disabled|invalid · Filled filled|empty

Tokens: fill → surface/default (disabled: surface/subtle)
        stroke → border/default · hover: border/strong · focus: border/focus · invalid: border/invalid
        text → content/muted (empty) · content/primary (filled) · content/disabled
        sizing → framed-control/{size}/*; typography → body/{size}/* (Asta Sans Regular)

Properties: Value (TEXT "Placeholder") · Leading Icon (BOOL true) · Leading Icon Instance (SWAP user) · Trailing Icon (BOOL true) · Trailing Icon Instance (SWAP eye)

Density: Context mode override on parent frame
Pairs with: Field (wrapper), InputGroup (for leading colour-swatch slot)
Notes: icons default ON; glyph not scriptable via API (Expose is UI-only)
```

### Radio — `401:17958`

```
Single-selection radio button; circular framed control.

Type: framed-control (circular — box-radius = box-size / 2)

Axes: Size md|xs|sm|lg|xl · State unchecked|checked · Interaction default|hover|focus|disabled

Tokens: circle fill → action/secondary/* (unchecked) · action/primary/* (checked)
        sizing → radio/{size}/box-size (Context collection)

Properties: (none — all behaviour via Axes)

Density: Context mode override on parent frame
Notes: no indeterminate state (unlike Checkbox); use with a Radio Group for mutual exclusion
```

### Slider — `392:5196`

```
Range-input track; compose with Slider/Thumb for the full control.

Type: framed-control (track only)

Axes: Orientation Horizontal|Vertical · Variant Single|Range · Size xs|sm|md|lg|xl · State default|hover|focus|disabled

Tokens: track fill → action/secondary/* (inactive) · action/primary/* (active/filled portion)
        sizing → slider/{size}/track-height|track-width (Context collection)

Properties: Show fill (BOOL true)

Density: Context mode override on parent frame
Pairs with: Slider/Thumb (always used together)
Notes: Range variant shows two fill regions; value position is fixed at 50% in master (detach to move)
```

### Slider/Thumb — `392:4353`

```
Draggable handle for a Slider track; always composed with a Slider.

Type: framed-control (circular)

Axes: Size xs|sm|md|lg|xl · State default|hover|focus|disabled

Tokens: fill → action/primary/* · sizing → slider/{size}/thumb-size (Context collection)

Properties: (none)

Density: Context mode override on parent frame
Pairs with: Slider (always used together — overlay thumb on track)
Notes: wrap in a thumb-rail auto-layout inside Slider to keep thumb centred across densities
```

### Toggle — `385:1418`

```
Binary pressed-state button with group-position awareness for pill selectors.

Type: framed-control

Axes: Size md|xs|sm|lg|xl · State on|off · Interaction default|hover|active|focus|disabled · Position standalone|start|middle|end

Tokens: off → action/secondary/* (neutral fill/border/fg)
        on  → action/primary/* (brand fill/border/white fg)
        sizing → framed-control/{size}/*

Properties: Label (TEXT "Toggle") · Leading Icon (BOOL true) · Leading Icon Instance (SWAP)

Density: Context mode override on parent frame
Pairs with: Toggle Group (Position=start|middle|end for grouped pill selectors)
Notes: Position controls corner-radius clamping at group edges; standalone has full radius on all corners
```

### Toggle Group — `389:3372`

```
Horizontal group of Toggle buttons for mutually-exclusive or multi-select pill navigation.

Type: non-framed composition

Axes: Count 2|3|4|5 · Size xs|sm|md|lg|xl

Tokens: individual Toggles inherit action/primary/* (on) · action/secondary/* (off); sizing → framed-control/{size}/*

Properties: Item 1 · Label (TEXT "Item 1") · Item 1 · Leading Icon (BOOL false)
            Item 2 · Label (TEXT "Item 2") · Item 2 · Leading Icon (BOOL false)
            Item 3 · Label (TEXT "Item 3") · Item 3 · Leading Icon (BOOL false)
            Item 4 · Label (TEXT "Item 4") · Item 4 · Leading Icon (BOOL false)
            Item 5 · Label (TEXT "Item 5") · Item 5 · Leading Icon (BOOL false)

Density: Context mode override on parent frame
Pairs with: Toggle (nested — Position=start|middle|end set automatically by group)
Notes: all 5 item property slots are always exposed; Count controls how many are visible. Item slots beyond Count are hidden but still present.
```

### Dropdown/Item — `401:18180`

```
Plain-text menu row inside a Dropdown panel.

Type: surface component (child of Dropdown/Panel)

Axes: State default|hover|disabled

Tokens: bg → action/secondary/default (hover) · color/transparent (default/disabled)
        text → content/primary; typography → body/sm/* (Asta Sans Regular)
        sizing → dropdown/item/height|padding-inline|gap|radius (Context collection)

Properties: Label (TEXT "Menu item")

Density: Context mode override on parent frame
Pairs with: Dropdown/Panel (parent), Dropdown/Label (group header), Dropdown/Separator (divider)
```

### Dropdown/SubTrigger — `401:18196`

```
Menu row that opens a nested submenu; trailing chevron-right indicates sub-navigation.

Type: surface component (child of Dropdown/Panel)

Axes: State default|hover|disabled

Tokens: same sizing family as Dropdown/Item; chevron size → dropdown/item/icon-size

Properties: Label (TEXT "Sub menu")

Density: Context mode override on parent frame
Pairs with: Dropdown/Panel (parent), another Dropdown/Panel (child submenu)
```

### Dropdown/CheckboxItem — `401:18278`

```
Menu row with embedded Checkbox for multi-select dropdown menus.

Type: surface component (child of Dropdown/Panel)

Axes: State default|hover|disabled · Checked false|true|indeterminate

Tokens: sizing → dropdown/item/*; nested Checkbox variant coordinated to Checked axis

Properties: Label (TEXT "Option")

Density: Context mode override on parent frame
Pairs with: Dropdown/Panel
```

### Dropdown/RadioItem — `401:18312`

```
Menu row with embedded Radio for single-select dropdown menus.

Type: surface component (child of Dropdown/Panel)

Axes: State default|hover|disabled · Selected false|true

Tokens: sizing → dropdown/item/*; nested Radio variant coordinated to Selected axis

Properties: Label (TEXT "Option")

Density: Context mode override on parent frame
Pairs with: Dropdown/Panel
```

### Dropdown/Label — `401:18181`

```
Section header that groups related items inside a Dropdown panel.

Type: surface component (child of Dropdown/Panel)

Single variant — no axes.

Tokens: height/padding-inline → dropdown/label/*; typography → label/xs/* (Khand SemiBold, uppercase, 1px letter-spacing)

Properties: (none — edit the text node characters directly)

Density: Context mode override on parent frame
Pairs with: Dropdown/Panel, Dropdown/Item
```

### Dropdown/Separator — `401:18374`

```
Thin horizontal rule that divides groups inside a Dropdown panel.

Type: surface component (child of Dropdown/Panel)

Single variant — no axes.

Tokens: line fill → border/subtle; vertical spacing → dropdown/separator/spacing (padding-block)

Properties: (none)

Pairs with: Dropdown/Panel
```

### Dropdown/Panel — `402:18499`

```
Floating surface container for all Dropdown subcomponents.

Type: surface component (overlay)

Single variant — no axes.

Tokens: fill → surface/default; radius → dropdown/panel/radius; padding-block → dropdown/panel/padding-block
        shadow: hardcoded y=4 blur=16 rgba(0,0,0,0.12) — pending elevation/md token

Properties: (none — add children directly as a vertical auto-layout stack)

Density: Context mode override on parent frame
Contains: Dropdown/Item, Dropdown/SubTrigger, Dropdown/CheckboxItem, Dropdown/RadioItem, Dropdown/Label, Dropdown/Separator
Notes: set panel width manually to fit the widest item; shadow will rebind to elevation/md once elevation variables exist
```

### Select — `403:1883`

```
Framed trigger control that opens a select panel; no intent axis.

Type: framed-control

Axes: Size xs|sm|md|lg|xl · State default|hover|focused|disabled|error · Filled false|true

Tokens: fill → surface/default (disabled: surface/subtle)
        stroke → border/default (all states incl. focused) · hover: border/strong · error: border/invalid
        text → content/muted (Filled=false) · content/primary (Filled=true) · content/disabled
        sizing → framed-control/{size}/*; typography → body/{size}/* (Asta Sans Regular)
        chevron → content/secondary|content/disabled; size → framed-control/{size}/icon-size

Properties: Value (TEXT "Select option")

Density: Context mode override on parent frame
Pairs with: Dropdown (panel + items), Field (wrapper)
Notes: focused keeps border/default — ring is sole focus indicator; trailing chevron-down always present
```

### Divider — `401:18380`

```
Visual separator line; horizontal or vertical.

Type: layout

Axes: Orientation horizontal|vertical

Tokens: fill → border/subtle

Properties: (none)

Density: not density-sensitive (fixed 1px line)
Notes: horizontal default 200×1px; vertical 1×32px — resize to fit
```

### Icon — `153:1754`

```
Single icon glyph at a specified size; 39 glyphs across 5 sizes.

Type: icon set

Axes: icon [39 glyphs — see set for full list] · size xs|sm|md|lg|xl

Tokens: inner Vector fill is unbound by default — bind to content/* or action/*/foreground/* at the usage site

Properties: (none at set level — swap to the correct glyph+size variant via INSTANCE_SWAP)

Notes: select glyph via INSTANCE_SWAP popover (not scriptable — Expose is UI-only); icon set key da2000986513297ee3823cf917a294e6a39991f2; always match size to framed-control/{size}/icon-size of the host component
```

### Accordion/Item — `416:6729`

```
Collapsible trigger that toggles an accordion section open or closed.

Type: framed-control

Axes: Size xs|sm|md|lg|xl · Position standalone|first|middle|last · State closed|open · Interaction default|hover|focus|disabled

Tokens: fill   action/secondary/* (all states — open/closed differ only in chevron direction)
        stroke action/secondary/border/*
        fg     action/secondary/foreground/*
        sizing framed-control/{size}/*

Properties: Label (TEXT "Accordion item") · Show leading icon (BOOL false)

Density: Context mode override on parent frame
Pairs with: Accordion/Panel (placed directly below when State=open)
Notes: corner radii — standalone/closed: all 4 bound; standalone/open + first/*: TL/TR bound BL/BR=0; middle/*: all 0; last/closed: BL/BR bound TL/TR=0; last/open: all 0.
  Stroke — bottom stroke removed on all positions/states except standalone/closed and last/closed; the element below provides the single divider via its top stroke.
  Focus rings — ring gap and ring corner radii match the item's per-corner shape: bound corners use focus-ring-gap-radius/focus-ring-radius variables; flat corners are hardcoded 2/4px. Chevron-down closed, chevron-up open.
```

### Accordion/Panel — `417:6881`

```
Content area revealed below an open Accordion/Item trigger.

Type: non-framed composition

Axes: Size xs|sm|md|lg|xl · Position standalone|first|middle|last

Tokens: fill    surface/default
        stroke  action/secondary/border/default (matches item stroke — INSIDE)
                top/left/right always 1px; bottom only for standalone|last
        padding panel/padding/block · panel/padding/inline (Context — density-responsive)
        text    body/{size}/* (Asta Sans Regular) · content/primary

Properties: Content (TEXT "Panel content")

Density: Context mode override on parent frame (panel/* tokens scale across all 4 modes)
Pairs with: Accordion/Item (always placed immediately below an open trigger)
Notes: TL/TR always 0. BL/BR=framed-control/{size}/radius for standalone|last; 0 for first|middle.
Bottom stroke present for standalone|last (closes the group); absent for first|middle (next item's top stroke is the divider). Set Position to match the Position of the Accordion/Item above it. panel/padding/* tokens also used by Tabs/Panel.
```

### Tabs/Trigger — `425:5528`

```
Tab trigger button for horizontal navigation strips; uses primary styling when active, secondary when inactive.

Type: framed-control

Axes: Position standalone|start|middle|end · Size xs|sm|md|lg|xl · State active|inactive · Interaction default|hover|focus|disabled

Tokens: fill   action/primary/* (State=active) · action/secondary/* (State=inactive) per Interaction
        stroke action/primary/border/* (active) · action/secondary/border/* (inactive) per Interaction
        fg     action/primary/foreground/* (active) · action/secondary/foreground/* (inactive)
        sizing framed-control/{size}/height|padding-inline|gap|radius

Properties: Label (TEXT "Tab") · Leading Icon (BOOL false)

Density: Context mode override on parent frame
Pairs with: Tabs/Panel (placed directly below a strip of triggers)
Notes: Position controls corner-radius clamping at strip edges — standalone: all 4 corners bound; start: TL/BL bound TR/BR=0; middle: all 0; end: TL/BL=0 TR/BR bound.
  Bottom stroke removed on all positions (panel's top stroke is the single divider at the trigger-panel junction). Right stroke removed on start and middle (next trigger's left stroke is the divider). State=active maps to data-state="active" in the React component; State=inactive maps to "inactive".
  Focus rings — per-corner radii match Position: bound corners use focus-ring-gap-radius/focus-ring-radius variables; flat corners hardcoded 2/4px.
```

### Tabs/Panel — `425:5539`

```
Content panel placed directly below a strip of Tabs/Trigger controls.

Type: non-framed composition

Axes: Size xs|sm|md|lg|xl

Tokens: fill    none (transparent)
        stroke  action/secondary/border/default (INSIDE, all 4 edges = 1px — matches trigger stroke family)
        padding panel/padding/block (top/bottom) · panel/padding/inline (left/right)
        radius  TL/TR = 0; BL/BR = framed-control/{size}/radius

Properties: Content (TEXT "Panel content")

Density: Context mode override on parent frame (panel/* tokens scale across all 4 modes)
Pairs with: Tabs/Trigger (placed immediately below a trigger strip)
Notes: TL/TR always 0 — connects flush to the trigger strip above. BL/BR rounded using the same size slot as the triggers above. Stroke family matches Tabs/Trigger to prevent a visible seam at the junction. All 4 edges = 1px stroke (panel is always terminal). panel/padding/* tokens shared with Accordion/Panel.
```

---

## Definition of done checklist

After building or significantly updating a component set, verify:

- [ ] Description written and set via `figma_execute` (`node.description = ...`)
- [ ] Axes block lists every valid property name and all allowed values verbatim
- [ ] Tokens block names the semantic families (not hex values)
- [ ] Properties block lists every exposed TEXT/BOOL/SWAP property with its default
- [ ] Notes captures any non-obvious design decisions
- [ ] This skill's "Canonical descriptions" section updated with the new/revised entry
- [ ] **Throwaway component test passed** — instantiate the component using only the description (axes, properties, density), screenshot it, verify it renders correctly, then delete the test frame. This catches stale Properties fields and incorrect axis values that a read-back alone won't reveal.
