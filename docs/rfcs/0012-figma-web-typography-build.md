# RFC 0012 — Figma web typography library build

> **Status:** In progress
> **Author:** simonrevill
> **Date:** 2026-06-24
> **Seeds from:** the 2026-06-24 Figma typography build session.
> **Relates to:** RFC 0002 (Harmoni → Intent → Plugin) — the Intent token
> collection that supplies the semantic colour aliases used here; RFC 0006
> (Token & style pipeline) — the text styles and component tokens built here
> map to the CSS typography scale emitted by the pipeline; RFC 0010 (OKLCH
> picker) — establishes the workbench-first, Figma-second pattern this build
> follows. Skills: `figma-wireframe-tokens` (font families, token bindings,
> component conventions), `figma` (session setup, Figma Desktop Bridge plugin).

---

## 0. Summary

Primitiv's Figma file needs a complete **web typography library**: text styles
and interactive components for every HTML prose element (`<p>`, `<lead>`,
`<caption>`, `<a>`, `<ul>`/`<li>`, `<blockquote>`, `<code>`, `<strong>`,
`<em>`, etc.), covering all three density modes (compact, comfortable,
spacious) and bound to Intent tokens throughout.

This RFC records the build checklist, the decisions taken along the way, and
the API conventions that make the Figma components machine-readable (for
future plugin / code-gen work).

---

## 1. Build checklist

The full 27-item checklist lives at
[`../figma-typography-checklist.html`](../figma-typography-checklist.html).

**Status at 2026-06-24:**

| # | Element | Type | Status |
|---|---------|------|--------|
| 1 | Display / hero | Text style | Exists |
| 2 | Headings h1–h6 | Text style | Exists |
| 3 | Paragraph / body | Text style | Exists |
| 4 | Lead paragraph | Text style | Done |
| 5 | Caption / helper | Text style | Done |
| 6 | Overline / eyebrow | Text style | Exists |
| 7 | Address | Text style | Done |
| 8 | Link | Component | Done |
| 9 | List + List Item | Component | Done |
| 10 | Description list | Component | Done |
| 11 | Blockquote | Component | Done |
| 12–27 | Pull quote · Code · Table · kbd · char styles · … | Various | To build |

---

## 2. Conventions

### Text styles

Text styles live on the **TYPOGRAPHY page** in the Figma file. Each style is
named `{role}/{density}` (e.g. `body/compact`, `lead/comfortable`) and bound to
Context-collection font variables (`body/{size}/fontFamily`, `/fontSize`,
`/lineHeight`, `/fontStyle`) so density changes propagate automatically.

### Components — inline font binding

Inside components, text nodes bind font properties via `setBoundVariable`
directly rather than using a named text style. This is required because Figma
text styles cannot carry variable bindings to Context-collection font tokens —
only inline variable assignment survives inside a ComponentSetNode. The bound
variables are: `fontFamily`, `fontSize`, `lineHeight`, `fontStyle`.

### Components — fill binding

Fills are bound to Intent variables using the pattern:

```js
fills = [{
  type: "SOLID",
  color: { r: 0, g: 0, b: 0 },
  boundVariables: { color: figma.variables.createVariableAlias(v) }
}]
```

Never use hardcoded RGB values in a component; everything goes through the
Intent collection.

### Components — naming

Component sets follow the same `Axis=value` convention as the Button:
`Tone=default, Size=md, State=default`. Column headers in the documentation
grid use lowercase state names; row labels use size identifiers; tone section
headers use uppercase.

### Specimen frame

The "Semantic Prose Styles" specimen frame (id: 579:5443) on the TYPOGRAPHY
page is an auto-layout vertical frame. Its text and separator nodes are bound
to Intent tokens. Spacers that visually separate sections use `opacity = 0`
(not `visible = false`) so they remain participants in the auto-layout flow.

---

## 3. Decisions

### D1 — Monospace deferred

No monospace face is in the Primitiv type system yet. Components requiring
mono (`<code>`, `<kbd>`, inline code) are blocked until a face is chosen and
added to the font-family tokens. See `§8` of the checklist for the open
discussion.

### D2 — `<strong>` = Asta Sans SemiBold

`<strong>` emphasis uses **Asta Sans SemiBold** (weight 600). This is a weight
shift within the same body face — no family switch. Asta Sans is a variable
font (Light 300 → ExtraBold 800) so the weight is always available; no
additional token is needed beyond the existing `font-weight.semibold`.

### D3 — `<em>` = synthetic slant

There is no italic axis or italic style in either Khand or Asta Sans. `<em>`
emphasis therefore uses a **synthetic oblique** (CSS `font-style: oblique
12deg` or the Figma equivalent). This is not an ideal typographic solution but
is the only available option until an italic face enters the system.

### D4 — `action/link/foreground/visited` token added

The visited link state required a dedicated semantic alias. `visited?` was
resolved by adding `action/link/foreground/visited` to the Intent collection:

- Light mode → `color/brand/700`
- Dark mode  → `color/brand/300`
- VariableID: `581:6050`

All 15 visited variants in the Link component set are bound to this token.

### D5 — Lead, Caption, Address as text styles only

Lead paragraph, Caption/helper, and Address are implemented as **text styles**
(not components). They have no interactive states and carry no semantic colour
— a text style is the correct Figma primitive. Each style exists across all
three densities.

### D6 — Link component: 3 × 5 × 6 = 90 variants

The Link component set covers:

- **Tones** (3): `default`, `muted`, `inverse`
- **Sizes** (5): `xs`, `sm`, `md`, `lg`, `xl`
- **States** (6): `default`, `hover`, `active`, `visited`, `focus`, `disabled`

Focus state uses a `focus/ring` stroke (`strokeWeight = 1.5`, `strokeAlign =
OUTSIDE`). Disabled state uses `opacity = 0.5`. Visited state is bound to the
`action/link/foreground/visited` alias (D4). All fills are Intent-token bound.

Tone fill mapping:

| Tone | State | Token |
|------|-------|-------|
| default | default | `action/link/foreground/default` |
| default | hover | `action/link/foreground/hover` |
| default | active | `action/link/foreground/active` |
| default | visited | `action/link/foreground/visited` |
| default | focus | `action/link/foreground/default` |
| default | disabled | `action/link/foreground/disabled` |
| muted | default/focus | `content/secondary` |
| muted | hover/active | `content/primary` |
| muted | visited | `content/muted` |
| muted | disabled | `content/disabled` |
| inverse | default/hover/active/visited/focus | `content/inverse` |
| inverse | disabled | `content/disabled` |

### D7 — `layoutSizingHorizontal/Vertical = "HUG"` inside components

Using `primaryAxisSizingMode = "HUG"` on a component inside `combineAsVariants`
throws "Invalid enum value. Expected 'FIXED' | 'AUTO', received 'HUG'". The
correct API is `comp.layoutSizingHorizontal = "HUG"` and
`comp.layoutSizingVertical = "HUG"`. Recorded here to avoid re-discovering
this on future component builds.

### D8 — Auto-layout frame: `resize()` before `primaryAxisSizingMode = "AUTO"`

When building an auto-layout frame programmatically, `resize()` must be called
**before** setting `primaryAxisSizingMode = "AUTO"`. Calling `resize()` after
AUTO is set overrides the mode back to FIXED, collapsing the frame to a fixed
height. Correct order: `resize(w, h)` → `layoutMode = "VERTICAL"` →
`primaryAxisSizingMode = "AUTO"` → `counterAxisSizingMode = "FIXED"`.

### D9 — List + ListItem components: 2 × 5 × 2 = 20 variants + 20 List container variants (Indent × Type × Size)

New Intent token: `list/marker/foreground` (VariableID: `582:6294`) → alias to
`content/secondary` in both Light and Dark modes.

New Context (density-scaling) tokens — three `list/*` spacing variables added to
the Context collection and bound to the components:

| Token | Dense | Compact | Comfortable | Spacious | Bound to |
|-------|-------|---------|-------------|----------|----------|
| `list/item-gap` (VariableID: `586:7247`) | `space-2` | `space-4` | `space-8` | `space-12` | List `itemSpacing` (all variants) |
| `list/marker-gap` (VariableID: `586:7248`) | `space-4` | `space-8` | `space-8` | `space-12` | ListItem `itemSpacing` |
| `list/indent` (VariableID: `586:7249`) | `space-16` | `space-24` | `space-28` | `space-32` | List `paddingLeft` (`Indent=true` variants only) |

The ListItem component set covers:

- **Type** (2): `unordered` (bullet `•`), `ordered` (number `1.`)
- **Sizes** (5): `xs`, `sm`, `md`, `lg`, `xl`
- **States** (2): `default`, `disabled`

Token mapping:

| Part | Token |
|------|-------|
| Marker | `list/marker/foreground` (→ `content/secondary`) |
| Text | `content/primary` |
| Disabled | `opacity = 0.5` on component frame |
| Density | `body/{size}/{font-family · font-size · font-style · line-height}` |
| Item gap | `list/item-gap` (Context collection, density-scaled) |
| Marker → content gap | `list/marker-gap` (Context collection, density-scaled) |
| Left indent | `list/indent` (Context collection, density-scaled) |

The List container set covers **Indent × Type × Size = 2 × 2 × 5 = 20 variants**:
`Indent=true` variants apply `list/indent` as `paddingLeft`; `Indent=false` variants
set `paddingLeft = 0` for flush/inline contexts where the browser or a parent supplies
the indentation. Both still bind `itemSpacing` to `list/item-gap`.

Each List variant has 8 item slots (`Item 1`–`Item 8`). Items 1–4 are always visible;
items 5–8 are hidden by default via boolean component properties (`Show Item 5`–`Show Item 8`,
default `false`). In Figma auto-layout, property-bound hidden nodes collapse to zero height
so the component stays compact until a slot is toggled on. DescriptionList similarly
exposes 4 term/detail pairs with `Show pair 3` and `Show pair 4` boolean properties
controlling the third and fourth pairs.

`createVariable` requires the collection node (not the ID string) in incremental
mode — `figma.variables.createVariable(name, collectionNode, type)`.

After `combineAsVariants`, the ComponentSetNode does not auto-expand when children
are repositioned. Call `set.resize(maxX + pad, maxY + pad)` after manually placing
all children to avoid the set collapsing to a single-variant footprint.

### D11 — `addComponentProperty` INSTANCE_SWAP is restricted to published-library components

`ComponentNode.addComponentProperty('name', 'INSTANCE_SWAP', componentKey)` throws
"Property value is incompatible with component property type" when `componentKey`
belongs to a component that has **not** been published to a team library. TEXT and
BOOLEAN properties are unaffected — only INSTANCE_SWAP fails on local components.

Impact: the `List` component's item slots are exposed as **named nested instances**
(`Item 1` · `Item 2` · `Item 3` · `Item 4`) rather than explicit INSTANCE_SWAP
component properties. In Figma, any nested component instance is implicitly
overridable via right-click → Swap instance. Once the file is published to a
library, INSTANCE_SWAP properties can be added retroactively.

### D10 — DescriptionList component: 5 size variants, no new tokens

`<dl>` is implemented as a **DescriptionList** compound component — one `<dt>` +
one `<dd>` stacked in a vertical auto-layout. Designers compose multiple instances
to form a full description list. No new Intent tokens: both text nodes use
`content/primary`.

| Part | Font style | Token |
|------|-----------|-------|
| `<dt>` | Asta Sans **SemiBold** (fixed — `font-style/semibold`) | `content/primary` |
| `<dd>` | Asta Sans Regular (from `body/{size}/font-style`) | `content/primary` |

`<dt>` binds `fontFamily`, `fontSize`, `lineHeight` to the Context body tokens but
binds `fontStyle` to the fixed `font-style/semibold` primitive (not the
`body/{size}/font-style` alias) — that way it stays SemiBold across all density
modes while size and family still scale. `<dd>` uses all four body token bindings.
The `<dd>` indent is a 16 px `paddingLeft` wrapper frame (not leading spaces).

### D12 — Blockquote: left-stroke bar, no separate bar frame

Blockquote (2 × 2 × 5 = 20 variants: Tone × Citation × Size) uses a 3px left stroke on the
component frame itself as the accent bar rather than a nested child frame. A separate bar child
with `layoutSizingVertical = 'FILL'` inside a `HUG`-height parent creates a circular dependency
in Figma's auto-layout (FILL cannot resolve when the parent HUGs). Left stroke avoids this
entirely — the stroke always matches the component's full rendered height.

Size axis maps to `body/{size}` Context tokens for both the Quote and Citation text nodes —
same pattern as List and DescriptionList. Both text nodes bind to the same size axis (e.g.
Size=lg → both Quote and Citation use `body/lg`). Do **not** use a fixed `body/sm` for
the citation — it was accidentally used in the first build for the `lg` variants and had
to be corrected.

New Context token: `quote/padding-inline` (VariableID: `586:8355`) — the indent between the bar
and the quote text.

| Token | Dense | Compact | Comfortable | Spacious |
|-------|-------|---------|-------------|----------|
| `quote/padding-inline` | `space-12` | `space-16` | `space-20` | `space-24` |

Token bindings:

| Part | Token |
|------|-------|
| Accent bar (default) | `border/strong` |
| Accent bar (accent) | `border/focus` (brand) |
| Quote text fill | `content/secondary` |
| Citation text fill | `content/muted` |
| Quote font | `body/lg/{fontFamily · fontSize · lineHeight · fontStyle}` |
| Citation font | `body/sm/{fontFamily · fontSize · lineHeight · fontStyle}` |
| Padding-inline | `quote/padding-inline` (Context, density-scaled) |
| Quote↔Citation gap | fixed per Size axis (not density-scaled) |

The `itemSpacing` between quote and citation is bound to `quote/body-gap/{size}` Context
variables — one per size. Values are **constant across all density modes** because the
gap is a typographic proportion of the size axis, not a density concern.

| Size | Token | Value | VariableID |
|------|-------|-------|-----------|
| xs | `quote/body-gap/xs` | `space-4` (4px) | `VariableID:588:8720` |
| sm | `quote/body-gap/sm` | `space-4` (4px) | `VariableID:588:8721` |
| md | `quote/body-gap/md` | `space-8` (8px) | `VariableID:588:8722` |
| lg | `quote/body-gap/lg` | `space-12` (12px) | `VariableID:588:8723` |
| xl | `quote/body-gap/xl` | `space-16` (16px) | `VariableID:588:8724` |

Backed up in `packages/tokens/src/context.json` under `quote/body-gap/{size}` in all four
density mode sections (same values in each — density does not vary the gap).

No native italic available in Asta Sans — the accent bar + indentation provide the quote
signal. See D3.

The Blockquote page also ships a **"Blockquote Grid Labels"** group (column headers
xs/sm/md/lg/xl above the set; rotated DEFAULT/ACCENT tone labels; WITH/WITHOUT citation
labels — Khand SemiBold 11px, `content/primary` / `content/secondary`) and a
**"Blockquote Example"** frame (2 rows × 4 density columns: Light + Dark theme, each
showing Dense/Compact/Comfortable/Spacious via `setExplicitVariableModeForCollection`
on the row for intent and on the cell for context density).

---

## 4. Next steps

Work through checklist items 12–27 in order. Priority path:

1. **Pull quote** (12) — no new tokens needed; uses heading/display scale.
2. **Inline code / Code block** (13–14) — blocked on D1 (mono face decision).
3. **Table** (15) — needs `table/*` tokens before building.
4. **Character styles** (19–27) — mostly fast wins once the faces are confirmed.
