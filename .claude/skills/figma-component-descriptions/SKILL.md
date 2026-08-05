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

**Pre-description check — text typography bindings.** Before writing the
description, verify that every TEXT node in the component set has its typography
bound inline to Context collection variables (`fontSize`, `fontStyle`,
`fontFamily`, `lineHeight` — all four fields in `node.boundVariables`). A text
style applied instead looks correct in the panel but silently ignores density
mode overrides. If any text node is missing bindings, fix it first — then write
the description.

**Pre-description check — vertical trim on button/pill shapes.** If the
component reads as a button or pill (Button, ToggleGroup Item, Tabs/Trigger,
and future siblings), verify its label TEXT node has vertical trim applied
(`text-box-edge: cap alphabetic` + `text-box-trim: trim-both` in the Dev Mode
code snippet). The registry CSS for these components already trims the label
span (see the `registry-stylesheet-conventions` skill) — an untrimmed Figma
node drifts from what code renders. Fix it before writing the description; see
`figma-framed-control-component` → step 1 "Label text" for the full rule.

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
Interactive action trigger; five visual intents and five interaction states.

Type: framed-control

Axes: Variant primary|secondary|danger|ghost|link · Size xs|sm|md|lg|xl · State default|hover|active|focus|disabled

Tokens: fill/stroke/fg → action/{variant}/* per state
        sizing → framed-control/{size}/height|padding-inline|gap|radius
        elevation → elevation/raised effect style on State=hover (framed variants only)

Properties: Label (TEXT "Button text") · Leading Icon (BOOL true) · Leading Icon Instance (SWAP) · Trailing Icon (BOOL true) · Trailing Icon Instance (SWAP)

Density: Context mode override on parent frame
Notes: link variant has no fill or stroke; focus ring is brand teal on all variants; disabled uses action/*/disabled tokens.
  ghost variant: frameless (transparent fill + border) reusing action/secondary/* — neutral foreground, secondary hover/active background tint, no hover lift; for low-emphasis and close/dismiss actions.
  Elevation (RFC 0017) — primary/secondary/danger lift to the elevation/raised effect style on hover; the resting state is flat (no shadow), and the frameless ghost and link variants stay flat on hover too. Mirrors the web: box-shadow transitions via the motion tokens.
```

### Switch — `315:5884`

```
Binary on/off toggle — thumb slides within a pill-shaped track — with an optional inline label that scales with the control.

Type: framed-control

Axes: Size xs|sm|md|lg|xl · State unchecked|checked · Interaction default|hover|focus|disabled

Tokens: track fill → action/secondary/* (unchecked) · action/primary/* (checked)
        sizing → switch/{size}/track-width|track-height|thumb-size|thumb-margin (Context collection)
        thumb shadow → shadow/1 effect style (all variants)
        label → label/{size}/* (Khand SemiBold, cap-trimmed) · fill content/primary
        control↔label gap → choice-control/{size}/gap (Context collection)

Properties: Show label (BOOL true) · Label (TEXT "Label") · Focus ring (BOOL false)

Density: Context mode override on parent frame
Pairs with: Checkbox, Radio (shared choice-control gap + label scale; matched control height)
Notes: root is a [Control, Label] auto-layout row — the track is the Control child (holds the thumb + focus rings). thumb position driven by primaryAxisAlignItems MIN + paddingLeft (unchecked) / MAX + paddingRight (checked) on the Control auto-layout; the Label is cap-height trimmed so it centres against the track. Show label toggles Label visibility.
  Height (2026-07) — track-height now equals the checkbox/radio box-size at every size/density, with thumb + track-width scaled proportionally so the three choice controls share one height; the static focus-ring frames were swept to hug the smaller track (gap = track+4 @ −2, ring = track+8 @ −4).
  focus ring is circular (radius 9999); disabled uses 50% frame opacity.
  Elevation (RFC 0017) — the Thumb carries the raw shadow/1 (xs hairline) effect style in every state to lift it off the track; this is the one place the primitive shadow ramp is used directly rather than a semantic elevation role.
```

### Checkbox — `369:30652`

```
Three-state selection control — unchecked, checked, indeterminate — with an optional inline label that scales with the control.

Type: framed-control

Axes: Size xs|sm|md|lg|xl · State unchecked|checked|indeterminate · Interaction default|hover|focus|disabled

Tokens: box fill → action/secondary/* (unchecked) · action/primary/* (checked/indeterminate)
        sizing → checkbox/{size}/box-size|box-radius|mark-size (Context collection)
        label → label/{size}/* (Khand SemiBold, cap-trimmed) · fill content/primary
        control↔label gap → choice-control/{size}/gap (Context collection)

Properties: Show label (BOOL true) · Label (TEXT "Label")

Density: Context mode override on parent frame
Pairs with: Radio, Switch (shared choice-control gap + label scale), Field (wrapper), Dropdown/CheckboxItem (embeds the box)
Notes: root is a [Control, Label] auto-layout row — the box is the Control child (holds the tick/minus Icon instances + focus rings); the Label is cap-height trimmed (leadingTrim CAP_HEIGHT) so it optically centres against the box. Show label toggles Label visibility; off = box-only. check/minus marks are Icon instances (fill → action/primary/foreground/*), auto-layout-centred in the Control so they stay centred across densities. Label + choice-control gap added 2026-07.
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
Single-selection radio button — circular framed control — with an optional inline label that scales with the control.

Type: framed-control (circular — box-radius = box-size / 2)

Axes: Size md|xs|sm|lg|xl · State unchecked|checked · Interaction default|hover|focus|disabled

Tokens: circle fill → action/secondary/* (unchecked) · action/primary/* (checked)
        sizing → radio/{size}/box-size (Context collection)
        label → label/{size}/* (Khand SemiBold, cap-trimmed) · fill content/primary
        control↔label gap → choice-control/{size}/gap (Context collection)

Properties: Show label (BOOL true) · Label (TEXT "Label")

Density: Context mode override on parent frame
Pairs with: Checkbox, Switch (shared choice-control gap + label scale); use with a Radio Group for mutual exclusion; Dropdown/RadioItem (embeds the circle)
Notes: root is a [Control, Label] auto-layout row — the circle is the Control child (holds the dot + focus rings); the Label is cap-height trimmed so it centres against the circle. Show label toggles Label visibility. Dot is auto-layout-centred in the Control (density-responsive). No indeterminate state (unlike Checkbox). Label + choice-control gap added 2026-07.
```

### CheckboxCard — `1417:34712` — page "CheckboxCard"

```
A card/tile-shaped checkbox — the whole bordered surface is the interactive element (a real "button", not Checkbox's small-control-plus-label row). Independent tri-state (unchecked/checked/indeterminate); no grouping with siblings.

Type: framed-control (a large one — the whole card, not just the indicator)

Axes: State unchecked|checked|indeterminate · Interaction default|hover|focus|disabled · Size xs|sm|md|lg|xl

Tokens: card fill/border → surface/default + border/default (unchecked) · choice-card/selected/background + choice-card/selected/border (checked/indeterminate) — a dedicated family, decoupled from ToggleGroup's surface/selected
        card sizing → choice-card/{size}/padding (new) + framed-control/{size}/radius (reused) + choice-control/{size}/gap (reused)
        indicator → cloned directly from the Checkbox component set at the matching Size/State/Interaction, so it inherits Checkbox's own box-size/box-radius/mark-size bindings automatically
        indicator optical alignment → choice-card/{size}/indicator-offset-top (new, same derivation as Alert's icon-offset-top — a function of the shared label/* scale, independent of indicator size)
        hover → unselected border → border/strong; whole card → elevation/raised effect style
        focus → card-level two-frame focus ring cloned from Button's own focus-ring/focus-ring-gap at the matching size
        disabled → whole card opacity 0.5

Properties: Title (TEXT "Label") · Description (TEXT "Helper text describing this option.") · Show description (BOOL true)

Density: Context mode override on parent frame
Pairs with: Checkbox (indicator cloned from it — re-clone on any Checkbox update), Button (focus-ring cloned from it), RadioCard/Item (shares the whole choice-card/* token family + card anatomy)
Notes: Layout (row/column/grid stacking, the indented "select all" nested-list pattern) is deliberately NOT baked in — composes with Stack/a grid wrapper in the registry. See the "CheckboxCard, RadioCard — exploration" page for the full design record. Focus ring is card-level, not indicator-level (Interaction=focus always sources the indicator from Interaction=default to avoid a doubled ring).
```

### RadioCard/Item — `1417:35178` — page "RadioCard"

```
A card/tile-shaped radio item — the individual selectable card in a RadioCard group. RadioCard.Root (role="radiogroup") carries no visual anatomy of its own in the headless layer, so there is no separate group/track component set — only Item.

Type: framed-control (a large one — the whole card, not just the indicator)

Axes: State unchecked|checked · Interaction default|hover|focus|disabled · Size xs|sm|md|lg|xl

Tokens: identical family to CheckboxCard — card fill/border, sizing, hover/focus/disabled treatment all shared (choice-card/*); indicator cloned from the Radio component set instead of Checkbox (circular dot, no indeterminate); indicator optical alignment shares choice-card/{size}/indicator-offset-top with CheckboxCard

Properties: Title (TEXT "Label") · Description (TEXT "Helper text describing this option.") · Show description (BOOL true)

Density: Context mode override on parent frame
Pairs with: Radio (indicator cloned from it), Button (focus-ring cloned from it), other RadioCard/Item instances inside a RadioCard.Root group, CheckboxCard (shares the choice-card/* family)
Notes: Indicator is at inline-start (leading), matching CheckboxCard and the plain Radio/Checkbox components' own leading-control convention — deliberately not trailing, unlike the rougher exploration mockup's plan-picker-style trailing dot. RadioCard.Root's own `orientation` prop (the arrow-key nav axis) is a headless concern, not visual — whatever Stack/grid layout Items are composed into, Root's `orientation` must be passed to match so keyboard behaviour tracks what's on screen.
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

### Toggle — removed 2026-07-01

The standalone Toggle Figma component set (and its `Toggle` page) was **deleted**.
The ToggleGroup redesign decoupled from it (it now uses a dedicated `ToggleGroup
Item`, not the shared Toggle), and the old Toggle styling was superseded by the
workbench reference. The React / registry Toggle component is unaffected —
rebuild a Figma spec from the workbench if one is needed again.

### Toggle Group — `389:3372`

```
Segmented control — a recessed pill track holding borderless item thumbs; single-select shows one raised thumb, multi-select a thumb per pressed item. Redesigned 2026-07-01 from the welded button-group strip to an inset track + floating thumb.

Type: non-framed composition (the track)

Axes: Count 2|3|4|5 · Size xs|sm|md|lg|xl

Tokens: track fill → surface/sunken; padding + gap → toggle-group/track-padding (Context); radius → radii/full (pill)
        nested items → ToggleGroup Item (borderless pill; surface/selected + shadow/1 when on); sizing → framed-control/{size}/* via the items

Properties: Count · Size only. Per-item text is edited on each nested ToggleGroup Item instance (its Label TEXT property); the selected item is that item's State variant (on|off). No group-level passthrough props.

Density: Context mode override on parent frame
Pairs with: ToggleGroup Item (nested — the track holds Count of them)
Notes: items are independent pills — no Position axis; the group owns the track + radius. The standalone Toggle component was decoupled and deleted 2026-07-01 — do not reuse it here. Motion (thumb slide) is a web concern; the set shows resting states.
```

### ToggleGroup Item — `733:239`

```
Borderless pill segment for a ToggleGroup track; becomes the raised thumb when pressed.

Type: framed-control (borderless — no stroke; the group owns the track surface)

Axes: Size xs|sm|md|lg|xl · State off|on · Interaction default|hover|focus|disabled

Tokens: off → transparent fill, content/secondary label (hover → content/primary)
        on  → surface/selected fill + shadow/1 effect style, content/on-selected label
        sizing → framed-control/{size}/height|padding-inline|gap; radius → radii/full (pill); typography → label/{size}/*
        focus ring → focus/ring + focus/ring/width at radii/full

Properties: Label (TEXT "Week")

Density: Context mode override on parent frame
Pairs with: Toggle Group (nested — the track holds Count of these)
Notes: no borders/dividers and no Position axis (pills are independent); no distinct 'active' interaction (matches the redesign CSS). surface/selected + content/on-selected are light-in-both-themes so the thumb + label read on the (dark-in-dark) track. Focus ring is the standard 2-frame anatomy at pill radius with STRETCH constraints. Leading-icon slot deferred.
```

### Segmented Control — `1216:44224` (track) + `1216:43507` (Item) — page "Segmented Control"

Two sets, mirroring the Toggle Group (track) + ToggleGroup Item split. The track
composes Item instances. Redesigned 2026-07-23 from the initial single-component
(Button-instance) mock into this Tabs-model pair so per-segment text/icon
properties are editable at the top level.

**Segmented Control / Item — `1216:43507`**

```
Single segment for a Segmented Control track — a framed control that mirrors Button's look (brand fill when selected, secondary when not), authoring its own text/icon properties like Tabs/Trigger.

Type: framed-control

Axes: Size xs|sm|md|lg|xl · Selected true|false · Interaction default|hover|focus|disabled

Tokens: Selected=true → action/primary/* (fill/stroke/foreground per Interaction — the brand-filled "you are here")
        Selected=false → action/secondary/* (fill/stroke/foreground per Interaction)
        sizing → framed-control/{size}/height|padding-inline|gap|radius; typography → label/{size}/* (Khand SemiBold, cap-trimmed)
        focus ring → framed-control/{size}/focus-ring-* (standard 2-frame anatomy, carried on Interaction=focus)

Properties: Label (TEXT "Segment") · Leading Icon (BOOL false) · Leading Icon Instance (SWAP) · Trailing Icon (BOOL false) · Trailing Icon Instance (SWAP)

Density: Context mode override on parent frame
Pairs with: Segmented Control (the track — nests Count of these); Button (shares its primary/secondary token families + anatomy)
Notes: built by cloning Button's primary (Selected=true) and secondary (Selected=false) variants across sizes/states, then re-authoring the content properties on its own child nodes (like Tabs/Trigger) so Label + icons are editable at the top level — the plugin API can't expose a nested Button instance's properties, so a standalone item set is the scriptable path. "active" interaction dropped (matches Tabs). Headless (packages/react) semantics should follow RadioGroup (single-select role=radio), not ToggleGroup.
```

**Segmented Control (track) — `1216:44224`**

```
Segmented control — a recessed track holding a row of Segmented Control / Item segments; exactly one segment is selected (brand-filled), the rest secondary. Single-select value picker (the RadioGroup analog), not a toolbar toggle.

Type: non-framed composition (the track)

Axes: Size xs|sm|md|lg|xl · Count 2|3|4|5

Tokens: track fill → none (transparent — segments carry their own surface, so the control sits on any background: card, toolbar, coloured hero)
        track stroke → border/subtle @ framed-control/border-width (the grouping outline)
        track radius → segmented-control/{size}/radius (Context, per density — concentric: framed-control/{size}/radius + segmented-control/track-padding, snapped to the radii scale; Spacious/xl off-scale, ideal 18 → radii/16)
        track padding + gap → segmented-control/track-padding | segmented-control/track-gap (Context collection, per density, size-agnostic — mirrors toggle-group/track-padding)
        segments → nested Segmented Control / Item instances at the matching Size; first Item Selected=true, the rest Selected=false

Properties: Size · Count only. Per-segment text/icons are edited on each nested Item instance (its Label TEXT + Leading/Trailing Icon props). The selected segment is that item's Selected=true variant. No group-level passthrough props (nested-instance properties don't forward).

Density: Context mode override on parent frame (track padding/gap + radius + nested item sizing all scale across Dense/Compact/Comfortable/Spacious)
Pairs with: Segmented Control / Item (nested — the track holds Count of them); modelled on Toggle Group (track) + ToggleGroup Item, but single-select (Selected axis) rather than pressed-toggle
Notes: Selected=primary / unselected=secondary reuse Button's token families — no new colour tokens. Transparent fill (not surface/sunken) so the control reads on any background — filled pills provide structure, the border groups them. Concentric container radius = item radius + track padding. Verified across all 4 densities + Intent Light/Dark 2026-07-23. ToggleGroup stays the toolbar-toggle primitive; this is the single-select segmented control. Headless/registry not yet built (Figma design only).
```

### Dropdown/Item — `401:18180`

```
Plain-text menu row inside a Dropdown panel.

Type: surface component (child of Dropdown/Panel)

Axes: Size xs|sm|md|lg|xl · State default|hover|disabled

Tokens: bg → action/secondary/default (hover) · color/transparent (default/disabled)
        text → content/primary; typography → body/sm/* (Asta Sans Regular)
        sizing → dropdown/{size}/item/height|padding-inline|gap|radius (Context collection)
        leading/trailing icon → content/primary; size → dropdown/{size}/item/icon-size

Properties: Label (TEXT "Menu item") · Inset gutter (BOOL false) · Show leading (BOOL false) · Leading (SWAP image) · Show trailing (BOOL false) · Trailing (SWAP check)

Density: Context mode override on parent frame
Pairs with: Dropdown/Panel (parent), Dropdown/Label (group header), Dropdown/Separator (divider)
Notes: Inset gutter reveals a leading spacer sized to dropdown/{size}/item/icon-size so text aligns with the indicator column (web `:has()` gutter, RFC 0019).
  Content slots (2026-07-24) — Show leading / Show trailing reveal general slots either side of the label, layout [gutter][leading][label (FILL)][trailing]; both hidden by default (backward-compatible). Swap via Leading / Trailing — INSTANCE_SWAP wired via the plugin API (no manual step, per Button, since the defaults are the published Icon set); preferredValues curates Icon + Avatar + Kbd but is only a shortlist — any component (a future Tag/Chip/Badge) swaps in. Sizing is icon-tuned (square, per-size); non-square content keeps its natural width. Row stays swappable in Panel's row slots → composition nests Panel → row → content slot.
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
Menu row with a check indicator for multi-select dropdown menus.

Type: surface component (child of Dropdown/Panel)

Axes: Size xs|sm|md|lg|xl · State default|hover|disabled · Checked false|true|indeterminate

Tokens: sizing → dropdown/{size}/item/*; indicator (check/minus glyph) sized to dropdown/{size}/item/icon-size, content/primary; gutter reserved when unchecked
        leading/trailing icon → content/primary; size → dropdown/{size}/item/icon-size

Model: menu checkmark indicator (Radix / macOS convention) — NOT an embedded Checkbox control. Mirrors headless Dropdown.CheckboxItem + Dropdown.ItemIndicator.

Properties: Label (TEXT "Option") · Show leading (BOOL false) · Leading (SWAP image) · Show trailing (BOOL false) · Trailing (SWAP check)

Density: Context mode override on parent frame
Pairs with: Dropdown/Panel
Notes: Content slots (2026-07-24) — layout [check indicator][leading][label (FILL)][trailing]; the built-in checkmark stays leading (identity), the leading slot is an additional icon after it, trailing a decoration/badge/Kbd. Both hidden by default. This is the row the composed Select set uses for its rich listbox. Swap via Leading / Trailing (INSTANCE_SWAP, no manual step); preferredValues curates Icon + Avatar + Kbd but is only a shortlist — any component swaps in. Non-square content (a Kbd shortcut) keeps its natural width.
```

### Dropdown/RadioItem — `401:18312`

```
Menu row with a dot indicator for single-select dropdown menus.

Type: surface component (child of Dropdown/Panel)

Axes: Size xs|sm|md|lg|xl · State default|hover|disabled · Selected false|true

Tokens: sizing → dropdown/{size}/item/*; indicator (filled dot) sized within dropdown/{size}/item/icon-size, content/primary; gutter reserved when unselected
        leading/trailing icon → content/primary; size → dropdown/{size}/item/icon-size

Model: menu dot indicator (Radix / macOS convention) — NOT an embedded Radio control. Mirrors headless Dropdown.RadioItem + Dropdown.ItemIndicator.

Properties: Label (TEXT "Option") · Show leading (BOOL false) · Leading (SWAP image) · Show trailing (BOOL false) · Trailing (SWAP check)

Density: Context mode override on parent frame
Pairs with: Dropdown/Panel
Notes: Content slots (2026-07-24) — layout [dot indicator][leading][label (FILL)][trailing]; the built-in dot stays leading (identity), the leading slot is an additional icon after it, trailing a decoration/badge/Kbd. Both hidden by default. Swap via Leading / Trailing (INSTANCE_SWAP, no manual step); preferredValues curates Icon + Avatar + Kbd but is only a shortlist — any component swaps in.
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

### Select / Trigger — `403:1883` (renamed 2026-07-24, was plain "Select")

```
Framed trigger control that opens a select panel; no intent axis.

Type: framed-control

Axes: Size xs|sm|md|lg|xl · State default|hover|focused|disabled|error · Filled false|true

Tokens: fill → surface/default (disabled: surface/subtle)
        stroke → border/default (all states incl. focused) · hover: border/strong · error: border/invalid
        text → content/muted (Filled=false) · content/primary (Filled=true) · content/disabled
        sizing → framed-control/{size}/*; typography → body/{size}/* (Asta Sans Regular)
        chevron → content/secondary|content/disabled; size → framed-control/{size}/icon-size
        leading icon → content/primary; size → framed-control/{size}/icon-size (matches chevron)

Properties: Value (TEXT "Select option") · Show leading (BOOL false) · Leading (SWAP image)

Density: Context mode override on parent frame
Pairs with: Dropdown (panel + items), Field (wrapper)
Notes: focused keeps border/default — ring is sole focus indicator; trailing chevron-down always present.
  Content states (2026-07-24) — Filled × Show leading give placeholder (Filled=false), filled (Filled=true), filled+leading-icon (both on). Leading slot sits before the value text; swap via Leading (INSTANCE_SWAP, no manual step) — preferredValues curates Icon + Avatar + Kbd but any component swaps in. Trigger half of Select.Value's rich display.
  Composed 'Select' set on the Select page instances this per size/state.
```

### Breadcrumb/Item — `436:12220`

```
Single entry in a breadcrumb trail — plain text label, muted for an ancestor link and primary for the current page.

Type: surface component (child of the composed Breadcrumb trail)

Axes: Size xs|sm|md|lg|xl · State link|current

Tokens: text → content/muted (State=link) · content/primary (State=current); typography → body/{size}/* (Asta Sans Regular, weight 400 in both states)

Properties: Label (TEXT "Home")

Density: Context mode override on parent frame
Pairs with: Breadcrumb/Separator (sits between two Items), composed Breadcrumb (the trail)
Notes: State added 2026-07-27 — previously link and current-page items were visually identical (both content/secondary). Mirrors headless Breadcrumb.Link (State=link, an <a>) vs Breadcrumb.Page (State=current, a <span aria-current="page">). State=current is a real VARIANT rather than a boolean because it recolours the label — Figma booleans can only toggle visibility, not rebind a fill.
```

### Breadcrumb/Separator — `436:12221`

```
Decorative divider between two Breadcrumb/Item entries — a chevron glyph or a literal character.

Type: surface component (child of the composed Breadcrumb trail)

Axes: Size xs|sm|md|lg|xl · Type icon|text

Tokens: glyph/character fill → content/muted (matches the link/ancestor foreground, 2026-07-27 — was content/secondary)
        icon sizing → breadcrumb/{size}/icon-size (Context collection, component-specific namespace); text uses the shared body/{size}/* scale

Properties: Character (TEXT "/") — Type=text only; Type=icon uses a fixed chevron-right Icon instance

Density: Context mode override on parent frame
Pairs with: Breadcrumb/Item (sits between two of these), composed Breadcrumb (the trail)
Notes: mirrors headless Breadcrumb.Separator (role="presentation" aria-hidden, defaults to "/", children override entirely). Icon-mode's outer frame is the density-scaled token; the nested Icon instance's own size property is set inconsistently relative to it (a cosmetic mismatch, not a second sizing axis — the outer frame governs rendered size).
```

### Breadcrumb (composed) — `436:12911`

```
Composed breadcrumb trail — an ordered row of Breadcrumb/Item entries divided by Breadcrumb/Separators, ending with the current page. The WAI-ARIA Breadcrumb pattern.

Type: non-framed composition

Axes: Size xs|sm|md|lg|xl · Separator icon|text · Overflow false|true

Tokens: resolves entirely through nested Breadcrumb/Item + Breadcrumb/Separator instances (content/muted for the trail, content/primary for the current page)
        gap between entries → hardcoded 4px, unbound to any token, uniform across every size (a genuine gap versus the Context scale — flag to design if it should scale)

Properties: Size · Separator · Overflow only. Per-entry text is edited on each nested Breadcrumb/Item instance's Label property; the current-page item is that instance's State=current variant. No group-level passthrough props.

Density: Context mode override on parent frame (via the nested Item/Separator instances)
Pairs with: Breadcrumb/Item, Breadcrumb/Separator (both nested), Dropdown/Panel + Dropdown/Item (the open overflow menu, unmodeled here — see below)
Notes: fixed 3-item sample trail (Home / Section / Page) at every Size×Separator combination. State=current wired onto the trailing item across all 10 non-overflow variants 2026-07-27, alongside the Item State axis itself.
  Overflow menu pattern (RFC 0021 Tier 1 composite) — a REAL variant, not just a documented pattern: Overflow=true swaps the middle crumb for the trigger, keeping first 1 + last 1 (the settled default collapse). No new anatomy — the trigger IS a Breadcrumb/Item (State=link, label "…") nested exactly like every other crumb, inheriting hover/focus/colour/sizing for free (no icon in the library reads as an overflow glyph; "menu" is a hamburger, not an ellipsis).
  Overflow=true shows the CLOSED state only (the trigger, not an open panel) — opening it is a real interaction (Dropdown's own open/close), not a static Figma variant. See the "Overflow pattern — example" composition lower on this page for the open-panel illustration: Dropdown/Panel + Dropdown/Item at the SAME Size as the breadcrumb (Breadcrumb and Dropdown already share one Size axis, so no size-mapping table is needed — contrast Avatar Group).
  LANDED (2026-08-01): headless Breadcrumb.Ellipsis (a decorative role=presentation/aria-hidden glyph, asChild-capable) is the composition seam; the registry `breadcrumb-overflow` compound collapses via keepStart/keepEnd props (settled directly — independent control of both ends, not a single maxVisible/max-style count), re-rendering hidden crumbs unmodified as real DropdownItem asChild menu entries. Its trigger is a bare <button> (not the registry Button — Button's padding read as "a secondary button" against this set's own zero-padding/zero-fill spec), styled to match this set's Overflow=true trigger exactly at rest.
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

Tokens: fill    surface/default
        stroke  action/secondary/border/default (INSIDE, all 4 edges = 1px — matches trigger stroke family)
        padding panel/padding/block (top/bottom) · panel/padding/inline (left/right)
        radius  TL/TR = 0; BL/BR = framed-control/{size}/radius
        text    body/{size}/* (Asta Sans Regular) · content/primary

Properties: Content (TEXT "Panel content")

Density: Context mode override on parent frame (panel/* tokens scale across all 4 modes)
Pairs with: Tabs/Trigger (placed immediately below a trigger strip)
Notes: TL/TR always 0 — connects flush to the trigger strip above. BL/BR rounded using the same size slot as the triggers above. Stroke family matches Tabs/Trigger to prevent a visible seam at the junction. All 4 edges = 1px stroke (panel is always terminal). minHeight=80px gives substance when empty; no preferred nested instance — content slot is open. panel/padding/* tokens shared with Accordion/Panel.
```

### Icon Button — `433:8386`

```
Square icon-only framed control; use when the action is self-evident from the icon alone (e.g. close, search, add).

Type: framed-control

Axes: Variant primary|secondary|danger|ghost|link · Size xs|sm|md|lg|xl · State default|hover|active|focus|disabled

Tokens: fill/stroke/fg → action/{variant}/* per state (same families as Button)
        sizing → framed-control/{size}/height bound to BOTH width and height (always square)
        radius → framed-control/{size}/radius
        icon fill → action/{variant}/foreground/default (disabled: foreground/disabled)

Properties: Icon (SWAP — grid icon default; swap to any glyph from the icon set)

Density: Context mode override on parent frame
Pairs with: Button (when a label is needed), Modal.Close (uses the ghost variant), Toolbar, ActionBar
Notes: width = height = framed-control/{size}/height — always square, no padding-inline binding needed.
  link variant: no fill or stroke; disabled link uses 50% root opacity.
  ghost variant: frameless (transparent fill + border) reusing action/secondary/* — icon foreground neutral, secondary hover/active background tint; the close-affordance default (Modal.Close).
  Focus ring: two-frame anatomy (focus-ring-gap + focus-ring); ring dimensions = comp.width+4/+8, re-swept after arrange to fix constraint offset computed against initial resize(32,32). STRETCH constraints maintain correct offsets across density modes after the sweep.
```

### Modal — `435:10250`

```
Floating dialog overlay — fixed-width surface with header, body, and optional footer.

Type: surface component (overlay)

Axes: Size sm|md|lg|xl

Tokens: fill → surface/default (Intent Light mode set on Modal page)
        header divider → border/subtle (border-bottom 1px); footer divider → border/subtle (border-top 1px)
        title → label/md/* Khand SemiBold; color → content/primary
        description → body/sm/* Asta Sans Regular; color → content/secondary
        sizing → modal/{size}/radius|padding-inline|padding-block|gap (Context collection)
        shadow → elevation/modal effect style (RFC 0017)

Fixed widths: sm=360px · md=520px · lg=640px · xl=800px (hardcoded, not token-driven)

Properties: Title (TEXT "Dialog title") · Description (TEXT "Supporting description text") · Show description (BOOL true) · Show footer (BOOL true) · Show close (BOOL true)

Density: Context mode override on parent frame (modal/* tokens scale across Dense/Compact/Comfortable/Spacious)
Pairs with: Modal/Header · Modal/Body · Modal/Footer (parallel sub-component documentation sets)
            Modal/Backdrop (the dim scrim placed full-bleed behind the dialog)
            Icon Button xs/secondary (close), Button md/primary + md/secondary (footer)
Notes: no intent axis; no focus ring — display surface; open/close is Portal/Overlay concern in React.
  Footer buttons right-aligned; labels "Cancel"/"Confirm" with icons off.
  Close button is Icon Button Size=xs, Variant=secondary.
  Direct-frame-children (not nested instances) — API blocks componentPropertyReferences on instance sublayers.
  Shadow → elevation/modal effect style (RFC 0017); was a hardcoded y=8 blur=24 rgba(0,0,0,0.16) drop shadow before the elevation styles landed. Light mode set explicitly on Modal page for surface/default.
  Backdrop — the dimmed page behind an open modal is the separate Modal/Backdrop component (scrim token); the Modal Example frames show the composed stack.
```

### Modal/Header — `435:9450`

```
Header bar for a Modal dialog — title text with optional close button.

Type: surface component (sub-component of Modal)

Axes: Size sm|md|lg|xl

Tokens: title text → label/md/* Khand SemiBold; color → content/primary
        close button → action/secondary/* (Icon Button, Variant=secondary, Size=xs)
        divider → border/subtle (border-bottom, 1px INSIDE)
        sizing → modal/{size}/padding-inline|padding-block|gap (Context collection)

Properties: Title (TEXT "Dialog title") · Show close (BOOL true)

Density: Context mode override on parent frame
Pairs with: Modal, Modal/Body, Modal/Footer
Notes: Close button is Icon Button Size=xs (not md) — fits better across all Modal sizes.
  Use Size matching the parent Modal's Size for correct token resolution and typography.
```

### Modal/Body — `435:10108`

```
Content area for a Modal dialog — padded slot for arbitrary content.

Type: surface component (sub-component of Modal)

Axes: Size sm|md|lg|xl

Tokens: sizing → modal/{size}/padding-inline|padding-block|gap (Context collection)

Fixed widths: sm=360px · md=520px · lg=640px · xl=800px

Properties: (none — content slot is open; drag content into the slot frame)

Density: Context mode override on parent frame
Pairs with: Modal, Modal/Header, Modal/Footer
Notes: Inner "slot" frame is FILL width, 80px FIXED height — provides substance when empty.
  Replace with actual content (Field, form layout, etc.) for usage.
  Use Size matching the parent Modal's Size for correct padding token resolution.
```

### Modal/Footer — `435:10161`

```
Footer action bar for a Modal dialog — Cancel and Confirm buttons, right-aligned.

Type: surface component (sub-component of Modal)

Axes: Size sm|md|lg|xl

Tokens: divider → border/subtle (border-top, 1px INSIDE)
        sizing → modal/{size}/padding-inline|padding-block|gap (Context collection)
        buttons → action/secondary/* (Cancel) · action/primary/* (Confirm); both Button Size=md, icons off

Fixed widths: sm=360px · md=520px · lg=640px · xl=800px

Properties: (none — Cancel/Confirm labels and sizes are static)

Density: Context mode override on parent frame (modal/* padding/gap tokens scale; button height follows framed-control/md/* within density context)
Pairs with: Modal, Modal/Header, Modal/Body
Notes: primaryAxisAlignItems=MAX (right-aligned). Use Size matching the parent Modal's Size.
  Button labels are static — replace instances for different action labels.
```

### Modal/Backdrop — `659:41299`

```
Dim page scrim rendered behind a Modal dialog — the backdrop layer of the modal anatomy.

Type: surface component (overlay backdrop)

Single variant — no axes.

Tokens: fill → scrim (Intent — absolute-black @ 0.5α, identical Light/Dark so it never inverts; mirrors shadow/color/*)

Properties: (none)

Density: not density-sensitive (full-bleed dim layer)
Pairs with: Modal (placed behind, full-bleed, dialog centred on top). Mirrors React's Modal.Overlay div + the native <dialog> ::backdrop, both styled from the scrim token.
Notes: full-bleed scrim — resize to fill the viewport / containing frame (STRETCH constraints). The alpha lives in the scrim variable itself (paint opacity stays 1), so the dim is theme-token-driven, not a hardcoded fill opacity. See the Modal Example frames for the composed stack (backdrop + dialog).
```

### Textarea — `439:14511`

```
Multi-line text entry; no intent axis — neutral surface/border/content styling.

Type: framed-control (multi-line variant of Input)

Axes: Size xs|sm|md|lg|xl · State default|hover|focus|disabled|invalid · Filled filled|empty

Tokens: fill → surface/default (disabled: surface/subtle)
        stroke → border/default · hover: border/strong · focus: border/default (ring is sole focus indicator) · disabled: border/subtle · invalid: border/invalid
        text → content/muted (empty) · content/primary (filled) · content/disabled
        sizing → textarea/{size}/min-height; padding all 4 sides → framed-control/{size}/padding-inline; radius → framed-control/{size}/radius

Properties: Value (TEXT "Placeholder text") — shared across all variants; empty/filled distinction is colour only

Density: Context mode override on parent frame
Pairs with: Field (wrapper for label + helper text), Input (single-line counterpart)
Notes: no icon slots; height fixed per size/density (textarea/{size}/min-height token — ~3 body lines + padding);
  text fills the full area top-left aligned; focus ring is standard 2-frame anatomy with STRETCH constraints.
  Focus follows Select pattern (ring-only, no border colour change) — NOT Input pattern (border/focus).
  Grid layout: Filled as major axis (empty | filled) × State sub-columns, unlike Input which uses State as major axis.
```

### Table / Cell — `604:9802`

```
Table data cell (<td>) — a single body cell; the leaf of the Table family.

Type: surface component (table leaf — nested in Table / Row)

Axes: Size xs|sm|md|lg|xl · Align start|center|end

Tokens: text → content/primary; typography → body/{size}/* (Asta Sans Regular)
        padding → table/cell/padding-inline (L/R) · table/cell/padding-block (T/B) (Context)
        right border → border/subtle (1px, absolute, right edge)

Properties: Text (TEXT "Cell") · Right Border (BOOL false)

Density: Context mode override on parent frame
Pairs with: Table / Row (parent), Table / Header Cell, Table (top-level)
Notes: Align drives primaryAxisAlignItems + text alignment (end = numeric columns). Text surfaces on the parent Table instance panel. colSpan/rowSpan are data-structure props with no Figma signature — resize/merge an instance. Set layoutSizingHorizontal=FILL when placed in a Row.
```

### Table / Header Cell — `604:9991`

```
Table header cell (<th>) — a column header with an optional sort affordance.

Type: surface component (table leaf — nested in a Table / Row, Section=head)

Axes: Size xs|sm|md|lg|xl · Align start|center|end · Sort none|sortable|ascending|descending

Tokens: text → content/primary; typography → body/{size}/* but fontStyle → font-style/semibold (SemiBold at every density)
        padding → table/cell/padding-inline · table/cell/padding-block (shared with Cell)
        sort icon → Icon instance, end-aligned, sized ~0.8x label type (xs10 sm11 md13 lg16 xl18): sortable=sort/content-muted · ascending=chevron-up · descending=chevron-down (content/primary)

Properties: Text (TEXT "Header") · Right Border (BOOL false)

Density: Context mode override on parent frame
Pairs with: Table / Row (Section=head), Table / Cell, Icon
Notes: Sort is design guidance only — the headless React Table ships NO sort logic / no data-state; consumers wire aria-sort + a button in <th>. Label takes FILL width and aligns per Align (start/center/end); the sort icon is ALWAYS pinned to the cell end (right edge), subordinate to the type.
```

### Table / Row — `604:10228`

```
Table row (<tr>) — a horizontal band of cells; expresses thead/tbody/tfoot via the Section axis.

Type: non-framed composition (nests Cell / Header Cell instances; itemSpacing 0)

Axes: Section head|body|footer · State default|striped|hover|selected
  Sparse — head & footer only at State=default; striped/hover/selected for body only.

Tokens: fill → striped: table/row/stripe · hover: table/row/hover · selected: table/row/selected (default: none)
        rule → head: border/strong bottom · footer: border/strong top · body: border/subtle bottom

Properties: Bottom Border (BOOL true) — horizontal rule (top rule for footer); off for Borders=none

Density: Context mode override on parent frame (via nested cells)
Pairs with: Table (parent), Table / Cell, Table / Header Cell
Notes: NO Size axis — height follows the nested cells. State=hover/selected are Figma design guidance only — React emits no data-state. Set layoutSizingHorizontal=FILL when placed in a Table.
```

### Table — `605:13524`

```
Composed data table (<table>) — a drop-in 4-column demo grid with header, body, optional footer and caption.

Type: non-framed composition (VERTICAL stack of Table / Row instances; FIXED 640px, HUG height)

Axes: Size xs|sm|md|lg|xl · Borders none|horizontal|grid
  Size sets every nested cell's Size (variant switch cascades). Borders flips nested booleans —
  none: all off · horizontal: Row Bottom Border on · grid: Bottom Border + Cell Right Border on.

Tokens: resolve through nested Row / Cell / Header Cell (table/row/*, table/cell/*, border/*, body/{size}/*).

Properties: Show Caption (BOOL false) · Show Footer (BOOL false) · Show Row 5 (BOOL false) · Show Row 6 (BOOL false) · Show Row 7 (BOOL false) · Show Row 8 (BOOL false)

Density: Context mode override on parent frame
Pairs with: Table / Row, Table / Cell, Table / Header Cell
Notes: rows 1-4 always visible; 5-8 collapse when off (8-slot rule). Body rows alternate default/striped. Caption is a bottom node (body/sm, content/muted) — React captionSide="bottom"; for a top caption drag the layer above Head (no Caption Side axis — D2 fixes 15 Size×Borders variants). ScrollArea = a documented wrapping frame with horizontal overflow (nothing to bind). Sort indicators and hover/selected row states are design guidance only — the headless Table is static.
```

### Badge — `1387:32589` — page "Badge"

```
Small status/count indicator — attached to another element or beside a heading. Read-only, never interactive.

Type: non-framed composition (leaf chip — decorative, not a control)

Axes: Tone success|warning|info|danger · Variant label|counter · Size xs|sm|md|lg|xl

Tokens: fill/foreground → feedback/{tone}/{variant-style}/background|foreground (Intent — internally still soft/solid at the token level; see Notes)
        sizing → badge/{size}/height|padding-inline|font-size|gap (Context collection)

Properties: Label (TEXT "Label") — drives Variant=label nodes only · Counter (TEXT "1") — drives Variant=counter nodes only. Two separate properties, not one shared across the set: a single shared property couldn't carry two different per-Variant defaults (Figma properties don't support a variant-conditional default), so Variant=label's text node binds to Label and Variant=counter's binds to Counter. Both fields always show in the panel regardless of which Variant is selected — only the one matching the current Variant actually affects the rendered instance. Short/numeric content (1-2 chars) renders as a true circle, longer content grows into a pill.

Density: Context mode override on parent frame
Pairs with: any host element (icon, avatar, heading) it overlaps or sits beside — no dedicated host component; positioning is the consumer's concern
Notes: circularity is structural, not a variant — minWidth is bound to the same badge/{size}/height token as height, so short Label content (a notification count) forces a true circle regardless of font metrics, while longer content (a status word) naturally widens into a pill. This is independent of the Variant axis — either label or counter can render as either shape, purely by content length (verified: Variant=label with a 1-char Label renders as a circle too). Label text node uses leadingTrim=CAP_HEIGHT so short digit content sits exactly centred — critical at this scale, since default line-box leading reads as visibly off-centre in a small circle.
  Variant=label is the low-emphasis status-word treatment (bg=100, fg=700 in Light; bg=800, fg=200 in Dark — Intent picks a different Palette step per mode, Palette itself stays on Light). Variant=counter is the high-emphasis count treatment (bg=500 in both modes; foreground is absolute-black for success/warning/info, absolute-white for danger — verified per-tone via a real WCAG contrast check against harmoni-generated ramps: black clears AA at step 500 for success/warning/info (4.74:1 / 8.28:1 / 5.34:1) but fails for danger (4.29:1); white is the reverse, failing for success/warning/info but passing for danger (4.89:1)). The underlying token family is still named feedback/{tone}/{soft,solid}/* (soft=label, solid=counter) — renamed only at the component-property level to describe intended use rather than the fill treatment.
  success/info briefly used white instead (it read clearer at badge scale, a real visual observation) but that traded away AA compliance (4.43:1 / 3.93:1, both under 4.5:1), so it was reverted back to black. Better fix, deferred to future palette generation: choose success/warning/info/danger anchors so a single foreground policy (e.g. "always white at step 500") clears AA for every tone from the start, rather than needing this kind of per-tone exception at all.
  No border on either variant for v1 — the tinted/solid fill alone provides definition at this size; revisit if a design need surfaces.
  Two-property split (Label vs Counter) landed 2026-07-29 after the original single shared "Label" property (default "1") was found to make every variant — including label ones — default to the same numeric text, defeating the point of having distinct label/counter treatments. Fixing it live surfaced a real API gotcha: writing a bound TEXT node's .characters while it is still bound to a shared property propagates to the property's defaultValue (and so to every other node sharing that binding) — the fix is to detach componentPropertyReferences first, write .characters, then rebind. (Before that, Label had been made a real exposed TEXT property in the first place — componentPropertyReferences on each variant's Label node — after an earlier build had only set `.characters` directly per variant, which doesn't create a real, panel-editable property.)
  feedback/* and badge/* are new families (this component); Chip reuses framed-control/* directly instead of a dedicated family, since it is genuinely interactive.
```

### Tag — `1390:32648` — page "Tag"

```
Small label chip — tags content by category, topic, or status; typically shown in a group. Read-only, never interactive (contrast with Chip, which is interactive and reuses framed-control/* instead).

Type: non-framed composition (leaf chip — decorative, not a control)

Axes: Tone neutral|success|warning|info|danger · Size xs|sm|md|lg|xl

Tokens: fill/foreground → feedback/{tone}/soft/background|foreground (Intent — the same soft family Badge's Variant=label uses)
        sizing → tag/{size}/height|padding-inline|gap (Context collection; no font-size — typography reuses body/{size}/* directly, Asta Sans Regular)

Properties: Label (TEXT "Tag") — a single shared property across every variant

Density: Context mode override on parent frame
Pairs with: often shown in a horizontal group (a "Tags" row); no dedicated host component
Notes: single visual treatment only — no Variant axis (Badge's label/counter split doesn't apply; Tag is always the low-emphasis tinted pill). No circularity trick — unlike Badge, minWidth is left unbound, so Tag simply hugs its content width regardless of length. Tone gains a neutral entry (feedback/neutral/soft/*, bg=neutral.100/fg=neutral.700 in Light, bg=neutral.800/fg=neutral.200 in Dark) that Badge doesn't have — Tag's most common real-world use is a plain grey label ("Design", "Rust"), with the four semantic tones reserved for status ("Shipped" in success). Label text node uses leadingTrim=CAP_HEIGHT and is a real exposed TEXT property (componentPropertyReferences), built correctly from the start this time rather than retrofitted (a gap caught on Badge).
```

### Chip — `1390:32827` — page "Chip"

```
Interactive, removable label chip — filter bars, multi-select fields, inputs. The trailing × is core to the anatomy, not optional; a leading icon or avatar is optional.

Type: framed-control

Axes: Size xs|sm|md|lg|xl · Interaction default|hover|active|focus|disabled

Tokens: fill/stroke/foreground → action/secondary/* per Interaction (the same neutral bordered family Button's secondary variant and ToggleGroup Item's off state use — the "genuinely interactive" reason Chip earns real interaction states where Badge/Tag don't)
        sizing → framed-control/{size}/height|padding-inline|gap|icon-size (Context collection) — reused directly, no dedicated chip/* family (unlike badge/* and tag/*)
        radius → radii/full (pill) — overrides framed-control's own {size}/radius, the same override ToggleGroup Item uses for its pill shape
        border → framed-control/border-width
        focus ring → focus/ring + focus/ring/width, Button's exact offset anatomy: focus-ring-gap outset 2px (transparent, color/transparent) then focus-ring outset a further 2px (4px total, focus/ring blue), both strokeAlign INSIDE — corner radius stays radii/full on both (not framed-control/{size}/focus-ring-radius|focus-ring-gap-radius, which hold small px values sized for Button's rounded-rect and would visibly mismatch a pill)
        label → label/{size}/* (Khand Regular, cap-trimmed)

Properties: Label (TEXT "Chip") · Show leading icon (BOOL false) · Leading Icon (SWAP, default icon=user) · Remove Icon (SWAP, default icon=close) — always visible, no BOOL toggle, since removability is core to the anatomy per the rough-exploration decision, not an optional affordance

Density: Context mode override on parent frame
Pairs with: often shown in a horizontal group (a filter bar / multi-select field); Icon (both swap slots — Leading Icon and Remove Icon)
Notes: no Selected/active-filter treatment in v1 — the rough exploration only showed the resting removable chip; add a Selected axis later if a real design need surfaces (same "deferred, not designed yet" posture as Badge's border-on-solid question).
  Interaction=focus keeps the resting Interaction=default fill/border (the ring overlays on top, it doesn't replace the resting look) — verified live: a first attempt left the focus variants rendering with a stale near-black literal paint despite being correctly bound to the same action/secondary/default variable as the resting state (a real Console-MCP gotcha — figma_capture_screenshot's export can render a just-rebound paint's last literal fallback rather than live-resolving the bound variable, so a fill re-bind that changes only which variable is *referenced* isn't enough; re-set the paint with a literal that actually matches, then screenshot again to confirm).
  Focus ring construction was corrected 2026-07-29: the first pass cloned ToggleGroup Item's focus ring (both frames sized to match the control exactly, no outset), which reads as an odd flush/merged edge on a bordered control — ToggleGroup Item's borderless track item can get away with that, a bordered pill can't. Rebuilt to Button's actual construction instead: both ring frames outset outward from the control (2px / 4px) with strokeAlign INSIDE, so there's a visible gap between the chip's own border and the accent ring, exactly like Button.
  Icon sizing follows Button's convention exactly: both the leading and remove Icon instances stay on their "size=md" source variant and get resized via width/height bound to framed-control/{size}/icon-size, rather than swapping the Icon component's own internal size variant.
  feedback/* and badge/*|tag/* don't apply here — Chip is the one member of the trio that reuses framed-control/* + action/secondary/* wholesale, exactly as flagged when Badge/Tag first recorded the split (see the Badge and Tag entries' Notes).
```

### Alert — `1400:33113` — page "Alert"

```
An assertive banner for high-priority, time-sensitive messages — icon + title + description + dismiss. Composes the existing headless `Alert` primitive (a `<div role="alert">`, implicit aria-live="assertive"+aria-atomic="true"); the headless layer intentionally owns no visual opinion, so this component supplies all of it.

Type: non-framed composition (a banner)

Axes: Tone info|success|warning|danger · Size xs|sm|md|lg|xl

Tokens: fill/foreground → feedback/{tone}/soft/background|foreground (Intent — reused directly from Badge/Tag, the same soft tint family)
        sizing → framed-control/{size}/padding-inline|gap|icon-size|radius (Context, reused directly — a bordered, icon-led box, like Chip) + alert/{size}/padding-block (Context, block padding a single-row framed control doesn't need) + alert/{size}/icon-offset-top (Context, the icon's optical-alignment nudge — see Notes)
        title → label/{size}/* (Khand SemiBold)
        description → body/{size}/* (Asta Sans Regular)

Properties: Title (TEXT "Heads up") · Description (TEXT "A short, clear message describing what happened and what to do next.") · Show title (BOOL true) · Show dismiss (BOOL true) · Info Icon / Success Icon / Warning Icon / Danger Icon (SWAP, one property per Tone, defaulting to that tone's matching glyph)

Density: Context mode override on parent frame
Pairs with: Icon Button (the Dismiss anatomy is derived from its ghost variant — see Notes); no dependency required to use standalone; composes into Confirm/Alert Dialog (Modal) and Notification/inbox popover (Popover) per RFC 0021's composite backlog
Notes: fixed 480px width in this Figma set is a representative canvas width, not a design constraint — the registry component is block-level and fills its container, matching a banner's real usage (unlike Badge/Tag/Chip, which hug their own content).
  Icon is exposed as a real swappable INSTANCE_SWAP property, one per Tone (Info Icon / Success Icon / Warning Icon / Danger Icon) rather than one shared property — a single shared property can't carry four different per-Tone defaults (the same constraint Badge's Label/Counter split hit), so each Tone's five Size variants reference their own property, defaulting to that tone's matching glyph (info circle / success check / warning triangle / danger x-circle) but overridable per instance. A first attempt used one shared "Icon" property and every variant silently rendered the info glyph regardless of Tone — caught immediately via a live check, not assumed correct.
  Icon optical alignment: the icon sits inside an "Icon Wrapper" frame whose paddingTop is bound to alert/{size}/icon-offset-top, nudging the icon down so its visual top aligns with the title's cap-height rather than the title text node's full line-box top (which includes leading space the icon's own tight bounding box doesn't have) — the classic icon-vs-heading optical-alignment issue. Values are (title line-height − title font-size) × 0.4 per size×density, rounded to the nearest space/* step and verified visually at the md/Comfortable anchor (4px, at 3x zoom) before deriving the rest — a pure half-leading split read as slightly too much compensation.
  Root uses counterAxisAlignItems=MIN (top-aligned), so the icon and dismiss button stay level with the first line of the title/description even when the description wraps to multiple lines.
  Title is optional (Show title) — the headless Alert's own simplest usage is a single message with no title (`<Alert>{error}</Alert>`); Description is always present and is the required message.
  Context tokens (alert/{size}/padding-block, alert/{size}/icon-offset-top) were created directly in Figma via the Desktop Bridge after being added code-side first (code-first order per the figma-bridge-token-sync skill) — the code-side values are mirrored in as VARIABLE_ALIAS references to the same space/space-N primitives, not literals.
  Gotcha hit live: grouping two of the base variant's children (while testing the icon offset visually) reparented them out of the component entirely and silently dropped the Title text node's componentPropertyReferences on reinsertion — figma.group()/figures like it are unsafe to use on component children for this reason; verify every affected node's property bindings after any reparenting operation, not just that it visually looks right afterward. Caught via a real setProperties() test (Title didn't update) rather than assumed fine from a screenshot alone.
  Dismiss anatomy: an instance of Icon Button's ghost/{size}/default variant (matching Modal's close-button convention — same hit target, icon-size, radius, focus-ring geometry), then `detachInstance()`-ed — the live ghost instance's icon carries a hardcoded `action/secondary/foreground/default` fill that doesn't respond to Tone, and detaching frees it while preserving anatomy exactly (outer INSTANCE→FRAME; the nested Icon swap instance stays a live INSTANCE). The Vector's fill is then rebound per-Tone to `feedback/{tone}/soft/foreground` (matches the title/description colour) across all 20 variants; `Show dismiss`'s visibility binding is re-set on the detached frame (detaching drops componentPropertyReferences). Verified structurally against the Icon Button master (identical size/radius/fill/stroke bindings, and the "outer FRAME, inner INSTANCE" fingerprint that only `detachInstance()` produces) rather than assumed from a screenshot.
  Hover background: `feedback/{tone}/soft/hover` (one step darker/more saturated than the alert's own soft background — light mode uses the same step as dark mode's own foreground, and vice versa) exists as an Intent token but is **not** represented as a Figma variant — Alert has no Interaction/State axis. The registry component applies it as a plain CSS `:hover` on the Dismiss button, the same pattern used elsewhere in the system for hover states with no corresponding static Figma variant.
```

### Kbd — `612:35198`

```
Kbd (<kbd>) — a raised monospace key cap for keyboard input within prose; the raised-surface sibling of Inline Code.

Type: surface component (leaf chip)

Axes: Size xs|sm|md|lg|xl

Tokens: fill   surface/raised
        stroke border/default (1px INSIDE)
        radius radii/4
        padding space-4 (inline) · space-2 (block)
        text   content/primary; fontFamily → font-family/mono; fontSize/fontStyle → body/{size}; lineHeight → code/{size}/line-height

Properties: Key (TEXT "Esc") — the key label, editable from the panel

Density: Context mode override on parent frame (body/* + code/* scale across all 4 modes)
Pairs with: Inline Code (tinted code-span sibling), prose body text
Notes: distinct from Inline Code (surface/subtle + border/subtle) — the raised surface + stronger border read as a physical key. Leaf chip — the slot strategy / 8-item rule do not apply. Single Size axis; the Key label is a TEXT property (mirrors Inline Code's Code property).
```

### Em — `613:35644`

```
Em (<em>) — stress emphasis as a synthetic ~10° oblique slant (Asta Sans ships no italic).

Type: surface component (inline mark — leaf chip)

Axes: Size xs|sm|md|lg|xl

Tokens: family/size/line-height/style → body/{size}/* (Asta Sans Regular, density-aware)
        fill → content/primary
        transform → ~10° shear via relativeTransform (Figma normalises to a clean oblique)

Properties: Text (TEXT "emphasis")

Density: Context mode override on parent frame
Pairs with: Strong (bold emphasis), prose body text
Notes: COMPONENT not text style — a skew is a node transform, not a TextStyle property. Slant carries ~1.5% vertical compression (cos 10°), visually negligible. The character-level marks strong/del/ins/abbr/small are instead text styles ({Density} / Inline / {Mark} / {size}).
```

### Mark — `612:35492`

```
Mark (<mark>) — highlighted text on a brand-tint background, as if marked with a highlighter.

Type: surface component (inline span with background)

Axes: Size xs|sm|md|lg|xl

Tokens: fill (background) → highlight/background (Intent — brand/100 Light · brand/800 Dark)
        text fill → content/primary
        family/size/line-height/style → body/{size}/* (Asta Sans Regular, density-aware)
        padding → space-4 (inline) · space-2 (block); radius → radii/2

Properties: Text (TEXT "highlighted")

Density: Context mode override on parent frame
Pairs with: prose body text
Notes: the palette has no yellow, so the highlight is a brand tint (highlight/background, a NEW Intent token) rather than classic highlighter yellow — kept on-palette. content/primary stays legible on both tints.
```

### Sub & Sup — `613:35711`

```
Sub & Sup (<sub> / <sup>) — subscript and superscript scripts beside a base character.

Type: surface component (inline mark)

Axes: Position sub|sup · Size xs|sm|md|lg|xl (10 variants)

Tokens: base → body/{size}/* ; script → body/{down(size)}/* (xs→xs, sm→xs, md→sm, lg→md, xl→lg — one step smaller, density-aware)
        fill → content/primary
        offset → HUG row, counterAxisAlignItems MIN (sup, script rides top) / MAX (sub, script sits bottom)

Properties: Base (TEXT "X") · Script (TEXT "2")

Density: Context mode override on parent frame
Notes: COMPONENT not text style — Figma has no baseline-shift property, so the offset is faked by aligning a one-size-smaller script to the top (sup) or bottom (sub) of the base in an auto-layout row.
```

### Harmoni OKLCH Picker — `708:47245`

```
2-D OKLCH plane picker for the Harmoni plugin — a chart plate with a painted gamut silhouette, crosshair guides and a draggable thumb; one variant per plotted plane (the third channel is held fixed) × colour gamut.

Type: surface component (chart control — Harmoni plugin)

Axes: Parameter Lightness|Chroma|Hue · Gamut sRGB|P3

Tokens: plate fill → surface/default; plate stroke → border/subtle @ framed-control/border-width; plate radius → container/sm/radius
        guide lines → color/absolute-white @ 1px, blend mode DIFFERENCE (legible over any colour)
        boundary curves (P3 variants) → color/absolute-white @ 75% · solid = sRGB limit · dashed [4,4] = P3 limit
        labels → label/sm/* (Khand SemiBold) · fill content/primary
        thumb → nested Harmoni OKLCH Crosshair instance
        gradients → hardcoded engine data (gamut silhouette vectors — the subject, not chrome; exempt from the token rule)

Properties: (none — cursor position is structural; move Guide · x, Guide · y and the Crosshair together)

Density: Context mode override on parent frame (labels, radius, border width)
Theme: Primitives / Palette mode override on parent frame — Palette ONLY. Do not also flip Intent: surface/* tokens alias different neutral steps per Intent mode and double-invert back to light.
Pairs with: Harmoni OKLCH Crosshair (thumb), Harmoni Slider (1-D axis), Harmoni LCH Input (number fields)
Notes: root 232×160; plate 216×144 (3:2 — matches workbench chartAspect 1.5) inset by 16px label gutters (left + bottom).
  Planes: Lightness = L×C at fixed hue · Chroma = H×C at fixed lightness · Hue = H×L at fixed chroma. X label rides the vertical guide in the bottom gutter; Y label rides the horizontal guide in the left gutter.
  Gamut=sRGB paints to the sRGB boundary with a clean edge (no curves). Gamut=P3 expands the painted gamut ~14% (chroma-anchored at C=0 for L×C and H×C; centred for H×L), dashes its edge, and overlays the solid sRGB curve — the band between is the extended region (workbench RFC 0010 §7 treatment).
  Scaling rig: plate STRETCH; silhouette + boundary curves SCALE; guides are SCALE-positioned frames holding STRETCH 1px lines (stay crisp); thumb + labels SCALE — free resize to any size/aspect keeps the anatomy coherent.
  Default cursor sits at the brand point oklch(0.556 0.192 259.9°).
```

### Harmoni OKLCH Crosshair — `708:47232`

```
Thumb marker for the Harmoni OKLCH pickers — a white ring with black halos over a transparent centre, so the colour under the cursor stays visible.

Type: surface component (chart cursor — Harmoni plugin)

Single variant — no axes.

Tokens: ring stroke → color/absolute-white (2px) · halo/inner strokes → color/absolute-black @ 40% (1px)
        shadow → shadow/1 effect style

Properties: (none)

Density: not density-sensitive (16×16; SCALE constraints — scales with the host picker)
Pairs with: Harmoni OKLCH Picker (nested as the thumb)
Notes: absolute-white/black chosen deliberately — legible over any painted colour in both themes, matching the workbench cursor (white ring + black halo). Transparent centre is the colour readout.
```

### Code Block — `601:9607`

```
Code block (<pre>) — a monospace code container with an optional filename/copy header and line numbers. The tabbed Type swaps the filename header for a package-manager tab strip (e.g. npm/pnpm/yarn/bun), each tab a different install command, with a text Copy button.

Type: surface component (code container)

Axes: Size xs|sm|md|lg|xl · Type default|tabbed

Tokens: code + gutter fontFamily → font-family/mono; fontSize/fontStyle/lineHeight → body/{size}. Code content/primary, gutter content/muted, filename content/secondary. Single-colour — syntax highlighting is the consuming tooling's job.
        box → surface/subtle, border/subtle 1px, radii/8, padding code/padding (Context, density-aware).
        header divider (tabbed) → border/subtle 1px, full-width along the header bottom (doubles as the tablist baseline).
        tab strip (tabbed) → nested Tabs / Trigger instances (content/secondary inactive · content/primary label + action/primary ink-bar active); tablist top padding → space/8 (xs, sm) · space/12 (md, lg) · space/16 (xl).

Properties: Show Header (BOOL true) — default header (filename + Copy icon-button); the tabbed header is always shown. · Show Line Numbers (BOOL true) — gutter (default Type only; tabbed has no gutter).

Density: Context mode override on parent frame
Pairs with: Tabs / Trigger (the tab strip, tabbed Type), Button (secondary — the text Copy control, tabbed Type), Icon Button (secondary — the icon Copy control, default Type), Icon (copy glyph)
Notes: The Copy control is one size step below the block (xs→xs, sm→xs, md→sm, lg→md, xl→lg), so it reads as subordinate to the code rather than a peer.
  Type=default — filename left, Copy Icon Button (secondary) right; gutter + line numbers available.
  Type=tabbed — the header is a full-width row: a Tabs/Trigger strip on the left (npm active by default) on a border/subtle baseline the active ink-bar sits on, and a text Button (secondary, "Copy", icons off) centred on the right; the panel is a single command line and the line-number gutter is removed. The tablist carries the top breathing-room padding (space/{8|12|16} by size) so the Copy button centres clear of the baseline while the tabs stay anchored to it.
  Copy success feedback (icon copy→check, or text "Copy"→"Copied") is runtime-only — not a Figma state. React parity: CodeBlock.Tabs composes the headless Tabs primitive and reuses the tabs component's classes; CodeBlock.Copy composes the registry Button component (variant secondary) — so its text label gets the same __label wrap + text-box-trim as any button — with children setting the content (icon default, text when passed).
```

### NavigationMenu — five sets on page "Navigation Menu" (RFC 0019)

Desktop dropdown site nav. Built 2026-07-25, all five sets **md-first** (the `md`
variants were created before the other sizes, so the Size dropdown genuinely
lists md first — the reorder Collapsible and Select could not get retroactively).

**Headless ↔ Figma mapping** (settled 2026-07-25 — descriptive Figma names kept,
with the mapping recorded here and in each description rather than renaming):

| Headless part | Figma |
| --- | --- |
| `Root`, `List`, `Item` | no set — structural (`<nav>`, `<ul>`, `<li>`), as with Tabs' List |
| `Trigger` | `Navigation Menu / Trigger` |
| `Indicator` | `Navigation Menu / Indicator` |
| `Content` + `Viewport` | one panel box in the composed set (a `Dropdown / Panel` instance) — Figma cannot model portal projection; Content → Panel is the existing house convention (Dropdown, Tabs) |
| `Link` | **two** sets — `Bar Link` (bar placement) + `Panel Link` (panel placement); one part, two geometries |

**Navigation Menu / Trigger — `1333:50847`** (50 variants)

```
Top-level disclosure entry in a desktop navigation bar — a label plus a chevron that flips when its panel is open. Mirrors headless NavigationMenu.Trigger.

Type: framed-control (frameless — transparent fill; the ghost tint is the hover/open affordance)

Axes: Size md|xs|sm|lg|xl · State closed|open · Interaction default|hover|active|focus|disabled

Tokens: fill → color/transparent (closed default/focus/disabled) · action/ghost/hover (hover, and State=open) · action/ghost/active (active)
        label → content/secondary → content/primary on hover and whenever State=open · content/disabled
        chevron → matches the label fill; size → nav-item/{size}/icon-size
        sizing → nav-item/{size}/height|padding-inline|gap; radius → framed-control/{size}/radius
        focus ring → framed-control/{size}/focus-ring-gap-radius|focus-ring-radius + focus/ring, focus/ring/width

Properties: Label (TEXT "Menu")

Density: Context mode override on parent frame
Pairs with: Navigation Menu (composed), Navigation Menu / Bar Link, Navigation Menu / Indicator, Icon (the chevron)
Notes: the chevron is the State axis, not a rotation — chevron-down closed, chevron-up open, as size-matched Icon instances.
  Geometry binds to nav-item/* — a nav entry is not a bordered control, so the family deliberately carries no border tokens; only radius and the focus-ring radii come from framed-control/*, since nav-item/* has none.
  State=open keeps the ghost tint at every Interaction except disabled.
  Interaction=disabled is 50% frame opacity over content/disabled, matching Button's link variant.
```

**Navigation Menu / Bar Link — `1333:51136`** (40 variants)

```
Plain link entry in a desktop navigation bar — no panel, no chevron. The bar placement of headless NavigationMenu.Link; Navigation Menu / Panel Link is the panel placement of the same part.

Type: framed-control (frameless — transparent fill; ghost tint on hover)

Axes: Size md|xs|sm|lg|xl · State inactive|active · Interaction default|hover|focus|disabled

Tokens: fill → color/transparent · action/ghost/hover (hover)
        label → content/secondary (inactive) → content/primary on hover · action/primary/default (State=active) · content/disabled
        sizing → nav-item/{size}/height|padding-inline|gap; radius → framed-control/{size}/radius; typography → label/{size}/*

Properties: Label (TEXT "Docs")

Density: Context mode override on parent frame
Notes: State=active is aria-current="page" — the current-page marker, NOT a pressed state. A variant axis rather than a boolean because it changes the label colour (Figma booleans only toggle visibility).
  Active is brand-coloured rather than Tabs' secondary→primary shift, which in a bar would make active/default indistinguishable from inactive/hover.
  Four Interaction values (no pressed 'active'), matching Tabs / Trigger.
```

**Navigation Menu / Panel Link — `1333:51304`** (40 variants)

```
Two-line link row inside an open navigation panel — title plus optional description, with optional leading and trailing slots. The panel placement of headless NavigationMenu.Link.

Type: surface component (child of the composed set's panel)

Axes: Size md|xs|sm|lg|xl · State inactive|active · Interaction default|hover|focus|disabled

Tokens: fill → color/transparent · action/ghost/hover (hover)
        label → content/primary · action/primary/default (State=active) · content/disabled; typography → label/{size}/*
        description → content/secondary; typography → body/{one slot below size}/* (xs→xs, sm→xs, md→sm, lg→md, xl→lg)
        sizing → nav-item/{size}/padding-inline|padding-block|gap; label↔description gap → nav-item/{size}/text-gap
        radius → framed-control/{size}/radius; leading/trailing → nav-item/{size}/icon-size

Properties: Label (TEXT "Components") · Description (TEXT "Every component, per mode") · Show description (BOOL true) · Show leading (BOOL false) · Show trailing (BOOL false) · Leading (SWAP file) · Trailing (SWAP chevron-right)

Density: Context mode override on parent frame
Notes: FIXED width with the text stack FILLing, so a trailing slot right-aligns and the row stretches to its panel column.
  The description sits one size slot BELOW the label — bound to the same slot they were identical at lg/xl and the hierarchy collapsed.
  Show description off collapses the row to a single line (md 52 → 28).
  nav-item/{size}/padding-block + text-gap were added for this row: a two-line row cannot use nav-item/{size}/height.
```

**Navigation Menu / Indicator — `1334:51727`** (10 variants)

```
Marker tracking the open trigger — an arrow pointing up at it from the panel, or an underline beneath it. Mirrors headless NavigationMenu.Indicator.

Type: surface component (marker)

Axes: Style arrow|underline · Size md|xs|sm|lg|xl

Tokens: arrow → nested Tooltip / Arrow instance (Side=top, Tone=inverted — its vector fill is surface/default, matching the panel)
        underline → action/primary/default; thickness → border-width/2

Properties: (none — Style and Size only)

Density: Context mode override on parent frame
Notes: Style=arrow reuses Tooltip / Arrow rather than drawing a triangle. Tone=inverted is the surface-coloured one; Tone=default is the dark tooltip fill.
  Tooltip / Arrow has no xs slot, so nav xs maps onto its sm — xs and sm arrows are identical (12×7).
  Thickness binds straight to the border-width/2 primitive: tabs/indicator-thickness aliases that same value in all four density modes, so re-wrapping it would add nothing.
  Style=underline's width is a placeholder — the headless publishes --primitiv-navigation-menu-indicator-size from the open trigger's offsetWidth. The bar rect is FILL, so resizing an instance stretches it.
```

**Navigation Menu (composed) — `1334:51944`** (10 variants)

```
Desktop dropdown site navigation — a transparent bar of top-level entries with one panel open at a time. The ARIA APG Disclosure Navigation Menu pattern, NOT a menubar.

Type: non-framed composition

Axes: Variant closed|open · Size md|xs|sm|lg|xl

Tokens: bar → no fill (transparent, reads over any background); entries adjacent (itemSpacing 0), their own padding-inline separates them
        bar → panel offset → nav-item/{size}/panel-offset
        panel → a Dropdown / Panel instance with stroke and shadow overridden off; fill surface/default, radius + padding from dropdown/{size}/panel/*
        shadow → elevation/overlay effect style on the transparent Panel wrapper, wrapping arrow + panel as ONE silhouette
        nested → Navigation Menu / Trigger · Bar Link · Panel Link · Indicator at the matching Size

Properties: Variant · Size only. Entry labels and panel rows are edited on the nested instances — nested-instance properties do not forward.

Density: Context mode override on parent frame
Notes: the panel deliberately has NO border. A border would seam across the arrow's base — the registry solves the same problem with filter: drop-shadow on a wrapper ("the shadow wraps the panel + arrow as one silhouette", registry/components/popover/styles.css). Figma's equivalent is a transparent wrapper carrying elevation/overlay, exactly as the composed Tooltip and Popover sets do.
  Arrow overlaps the panel edge by 2px (wrapper itemSpacing -2) — the same -2 the composed Tooltip uses.
  Indicator rail is FILL width with paddingLeft centring the arrow under the open trigger (the Tooltip "Arrow rail" pattern).
  Panel content lives in the Dropdown / Panel Slot — here a 2×2 mega-menu of Panel Links; the Slot takes any content.
  Only the arrow Indicator style is composed here; the underline ships in Navigation Menu / Indicator.
```

**Build gotchas hit while making these** (all cost a cycle; see also
`figma-framed-control-component/references/`):

- **A bound paint carries a resolved RGBA snapshot that `setBoundVariableForPaint` does not fill in.** The literal `color`/`opacity` beside the binding is what renders. A freshly built paint keeps the `{0,0,0}, opacity 1` placeholder, so an alpha token (`color/transparent`, `action/ghost/*`, whose RGB is near-black `#121418`) renders **solid black**. Clones made in the *same script run* as their source inherit the placeholder — a set can look right at one size and be wrong at the other four. Fix: write `resolveForConsumer(node).value` into the paint's `color` and its `.a` into `opacity`.
- **`INSTANCE_SWAP` defaultValue is a node id, not a component key.** Passing `component.key` throws `"Property value is incompatible with component property type"`. The live `Dropdown / Item` swaps use `defaultValue: "153:1825"`.
- **Add component properties AFTER fanning out sizes.** `clone()` on a variant component drops `componentPropertyReferences`, so variants cloned after a TEXT property was wired render the component default while their instances still report the right property value — a silent, confusing failure. (Bar Link and Panel Link avoided it by adding properties last; the Trigger needed 40 references re-wired.)
- **`figma.createFrame()` clips by default.** A cap-height-trimmed label in a clipping inner frame loses its descenders. Set `clipsContent = false` on helper frames.
- **`componentPropertyReferences` takes `{}`, not `null`,** to drop a reference.
- **Figma's undo rolls back plugin operations** — an undo mid-session silently removed an arrange pass and one INSTANCE_SWAP property. Re-verify rather than trusting the last reported state.

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

### Card — five sets on page "Card" (RFC 0021 Tier 1 composite)

Content container. Built 2026-07-31, Figma-first. The live descriptions on the
nodes are the source of truth and are longer than the summaries here — read them
before editing any of these sets.

**Why five sets, not one.** The plugin API cannot bridge a nested instance's
text up to a parent's panel (setting `componentPropertyReferences` on an
instance sublayer errors; so does referencing the nested instance's own property
key). So Header and Footer are their own sets, nested as live instances, and
Card's own panel is deliberately tiny. Their internals resolve that same limit
in *opposite* directions, on purpose: Footer's Buttons are **detached** (its
labels are the whole point, worth losing live-instance status for), Header's
Avatar/Badge are **live** (their own props matter more than bridging).

| Set | Node | Variants |
| --- | --- | --- |
| `Card` | `1444:37322` | 30 — Media None\|Top\|Side\|Top Inset\|Side Inset\|Cover × Size xs–xl |
| `Card / Media` | `1444:36867` | 30 — Treatment Full-bleed\|Inset × Rounded × Show overlay × Size |
| `Card / Header` | `1464:38775` | 10 — Tone default\|inverse × Size |
| `Card / Footer` | `1463:38714` | 15 — Justification Start\|Center\|End × Size |
| `Card / Scrim` | `1466:41396` | 3 — Strength soft\|medium\|strong |

**Things that will look like bugs and are not:**

- **Full-bleed media is square** (`Rounded=false` → `radii/0`). The card's own
  `clipsContent` supplies the outer corners; giving the media its own radius
  also rounds the *inner* seam where it meets the content and leaves a notch.
  `Rounded=true` exists only on `Inset`. The `Rounded` axis still lists
  true\|false on every child because Figma requires uniform property *names*
  across a set — a sparse value matrix is legal, a missing name is not.
- **`Card / Scrim`'s gradient shape comes from stop positions** (0 / 0.25 /
  0.85 / 1), not hand-tuned alphas. Binding a variable to a gradient stop makes
  the stop adopt that variable's alpha, so `color/transparent` supplies a=0 and
  `color/absolute-black` a=1; overall strength is the frame's `opacity` bound to
  `opacity/50|70|90`. Positions were retuned once against real photography —
  the first shape gave only 0.15–0.30 alpha where the title sits, even at
  `strong`.
- **`absolute-black`, not `surface/inverse`** — a scrim sits over photography
  and must not invert with the theme (same reasoning as RFC 0017's
  `shadow.color`).
- **No Elevation axis.** A BOOLEAN binds only `visible`/`characters`/
  `mainComponent`, so it cannot toggle an effect style, and an axis would
  double the set to 60. Elevation is a registry-only prop; a designer needing a
  lifted card detaches and applies `elevation/raised`.
- **A stretched Top/Top Inset card gains dead space below the footer.** Making
  the media absorb it needs hug and fill on the same axis, which collapses the
  frame (measured: bare → 100px; with a `minHeight` floor, hug resolves to the
  *max* of its children rather than the sum). Side layouts are unaffected —
  there the media stretches on the *counter* axis, which is well-defined. This
  is an authoring artifact only; the registry CSS does it correctly via
  `flex-grow`.

### Avatar Group — `1480:44052` — page "Avatar Group" (RFC 0021 Tier 1)

```
Overlapping row of Avatars with an optional "+N" overflow counter — the collaborators/attendees pattern.

Type: non-framed composition

Axes: Size md|xs|sm|lg|xl · Count 2|3|4|5 · Direction ltr|rtl

Tokens: overlap → avatar-group/{size}/overlap (NEGATIVE itemSpacing, ~30% of avatar diameter at every size and density)
        ring    → avatar-group/{size}/ring-width, colour surface/default (a 0-blur drop shadow with spread, not a stroke)
        avatars → nested Avatar instances at the matching Size (framed-control/{size}/height)

Properties: Show counter (BOOL true)

Density: Context mode override on parent frame
Pairs with: Avatar (nested), Card, Tooltip (consumer-wired)
```

**The two-stack structure is load-bearing — do not flatten it.** Both rules have
to hold at once: the *first* face paints on top (a stack you count into), and
the counter paints above *everything*. `itemReverseZIndex` is all-or-nothing, so
a flat list gives one or the other — leading-on-top buries the counter (it is
the last child), trailing-on-top buries the first face. So the faces get their
own stack with leading-on-top, and the ROOT overlaps the counter onto that stack
as a sibling, where ordinary child order puts it above. The registry CSS does
*not* mirror this: it has real z-index, so one flat row with a descending inline
z-index per face suffices. Same behaviour, deliberately different mechanisms.

**The overlap variable is stored NEGATIVE here and POSITIVE in DTCG.** Figma
cannot negate a bound variable and there is no negative primitive to alias, but a
bound *negative* variable does work — which is what keeps this component
density-responsive instead of a hardcoded literal per variant. The code side
stores the positive space step and negates with `calc()`, because a raw negative
number emits unitless from the token pipeline (`avatar-group` is not a
`LENGTH_CATEGORIES` entry) and would be invalid for a margin. The opposite signs
are correct on both sides; do not "fix" either to match the other.

**Other settled decisions** (from the "Avatar Group — exploration" page):

- **The counter is an Avatar, not a Badge.** Badge ships only
  `success | warning | info | danger` with no neutral, so it would force a
  semantic colour onto something that is not a status — and a counter Badge is a
  dot beside a 40px avatar. RFC 0021's "overflow badge" wording is superseded.
- **Circles only** — no Shape axis. Overlapping squares turn the ring into a
  notch and lose the row-of-faces read.
- **No spaced/non-overlapping variant** — positive spacing needs no ring and is
  just a Stack of Avatars.
- **Direction is a real axis, not a boolean** — it reverses child order, which a
  boolean cannot do.
- **Tooltip is consumer-owned.** Naming faces would mean owning member data,
  which NavigationMenu explicitly refused (RFC 0019 §4c).
- The ring is surface-coloured to read as a cutout, so it is wrong by
  construction on any other background; in the registry it is a knob, and it must
  be set **on the group** (the component re-declares its own default, shadowing
  any inherited value).

### EmptyState — `1523:889` — page "EmptyState"

```
Placeholder for a region that has no content yet — media, title, description and recovery actions, centred in the space it fills. Composes the headless `EmptyState` primitive (a `<div role="status">` polite live region).

Type: non-framed composition

Axes: Direction vertical|horizontal · Size xs|sm|md|lg|xl

Tokens: media box -> empty-state/{size}/media-size (~2.8x framed-control/{size}/icon-size)
        media optical offset (horizontal only) -> empty-state/media-offset-top (size-agnostic, density-scoped)
        text measure cap -> empty-state/{size}/max-inline-size (bound to the Text frame's maxWidth)
        region gap -> empty-state/{size}/gap · title<->description -> empty-state/{size}/text-gap
        actions row gap -> framed-control/{size}/gap (reused, as Alert reuses it)
        media icon fill -> content/primary (bound on the Icon instance's Vector)
        title -> heading/{h6|h5|h4|h3|h2}/* by size · content/primary
        description -> body/{size}/* · content/secondary
        root fill -> none

Properties: Title (TEXT "Nothing here yet") · Description (TEXT "When you add your first item it will show up here.") · Show media (BOOL true) · Show actions (BOOL true) · Media (SWAP icon=search) · Actions (SLOT, preferredValues Button)

Density: Context mode override on parent frame
Pairs with: Icon (Media swap), Button (Actions slot), Card / Table / any container whose empty state this is
```

The live description on the node is longer and is the source of truth — read it
before editing. The four things most likely to be "corrected" by mistake:

- **Title binds `heading/*`, not `label/*`** — a deliberate break from Alert.
  `label/{size}` and `body/{size}` resolve to the *same px value* at lg (20/20)
  and xl (22/22), and because Khand is condensed the title then reads as the
  **smaller** of the two — an inverted hierarchy. Alert gets away with `label/*`
  because it is a compact inline banner. Mapping: xs=h6 · sm=h5 · md=h4 · lg=h3
  · xl=h2. See exploration section F.
- **`empty-state/media-offset-top` is size-agnostic on purpose** (one value per
  density, unlike Alert's per-size `icon-offset-top` family). Every heading slot's
  line-height is font-size + 8, so the half-leading is genuinely constant across
  all five sizes — measured 3.2px at every size in Comfortable. Values are
  `(line-height − font-size) × 0.4` snapped to the space scale: Comfortable 3 ·
  Compact 4 · Spacious 4 · Dense 1.
- **`max-inline-size` repeats 344 at lg *and* xl** because the `size/*` primitive
  scale ends at 344. Signed off; only Dense and Compact keep lg < xl distinct.
  Extend the primitive scale rather than hardcoding a literal here.
- **There is no padding token, deliberately.** The root fills and centres inside
  whatever box it is given; padding is the container's job. Adding one would
  double every seam the way an early Card build did.

**Two build facts worth reusing elsewhere:**

- **A genuine multi-child `SLOT` *is* creatable from the plugin API**, despite
  `figma.createSlot` not existing and the dedicated slot MCP tools being blocked.
  `addComponentProperty(name, 'SLOT', '')` is accepted (the earlier `null`
  rejection was `defaultValue` validation, not the type), and a `SLOT` **node** is
  obtained by `clone()`-ing an existing one — `Dropdown / Panel`'s — then
  re-pointing `componentPropertyReferences = { slotContentId: propId }`. This
  supersedes the note in `docs/select-future-work.md` that only pre-existing slots
  can be written to.
- **A cloned `SLOT` inherits the source slot's auto-layout.** `Dropdown / Panel`'s
  stacks **vertically**, so two Buttons stacked and overlapped instead of forming
  a row; the horizontal wrapper around it was irrelevant, because the wrapper held
  only the single slot child. Set the SLOT node itself HORIZONTAL with
  `itemSpacing` bound and HUG on both axes. **Only the definition-of-done
  throwaway instantiation caught this** — every read-back looked correct. Always
  drop *two* children into a new slot and look at it.

Also note: `combineAsVariants` reconciles same-named non-variant properties into
a **single** definition, and `set.appendChild(component)` on an already-combined
set reconciles the same way — the appended variants' refs re-point at the
canonical ids automatically (verified: zero orphans across all 10). So a large set
can be built in batches without hand-fixing property ids.
