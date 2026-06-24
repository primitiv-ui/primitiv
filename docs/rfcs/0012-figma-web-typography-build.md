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
| 9–27 | List · Blockquote · Code · Table · kbd · char styles · … | Various | To build |

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

---

## 4. Next steps

Work through checklist items 9–27 in order. Priority path:

1. **List + List Item** (9) — the most common prose component after Link.
2. **Blockquote** (11) — needs `quote/*` tokens before building.
3. **Inline code / Code block** (13–14) — blocked on D1 (mono face decision).
4. **Character styles** (19–27) — mostly fast wins once the faces are confirmed.
