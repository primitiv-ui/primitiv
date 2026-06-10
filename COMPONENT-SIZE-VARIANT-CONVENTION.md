# Component Size Variant Convention

The Primitiv Design System has a typographic scale with 4 density contexts (Dense / Compact / Comfortable / Spacious). Each context already carries size-keyed UI label typography — `label.{xs|sm|md|lg|xl}` in `packages/tokens/src/context.json`. Components like Button need multiple size variants, and this document establishes the convention for deriving those variants consistently across all components.

> **Status — design intent, not yet wired up.** The typography size tiers exist (as `label.*` per context), but no component yet consumes them through a `size` prop, and the component-token layer described below has not been built. The concrete token-emission shape is being settled by the token-pipeline RFCs (`docs/rfcs/0001`, `docs/rfcs/0006`); treat the JSON below as illustrative of the intended pattern, not the current file layout.

---

## The Core Insight: Two Orthogonal Axes

**Density context** (Compact → Spacious) = how the *entire layout* responds to screen/container size. It scales the whole type ramp. This is a *responsive* axis — the same component at `size="md"` renders differently in Compact vs Spacious.

**Component size** (xs → xl) = the *intrinsic* size of the component, chosen at authoring time. A `lg` button stays `lg` regardless of density.

These multiply together. Density contexts are the top-level namespace; size tiers now exist for UI label typography (`label.{xs..xl}`), and the per-component size dimension below builds on them.

---

## Convention

### 1. Size-keyed UI typography per context

UI typography is semantically distinct from reading typography (`body`, `heading`, `display`) and is where size tiers live. They are already authored per density context as:

```
label.xs
label.sm
label.md   ← the canonical default tier
label.lg
label.xl
```

All tiers share font-family (sans / Khand) and font-weight (semibold / 600). Only font-size changes per tier:

| Size | font-size | line-height |
|------|-----------|-------------|
| xs   | 12        | 16          |
| sm   | 14        | 20          |
| md   | 16        | 24          |
| lg   | 18        | 28          |
| xl   | 20        | 28          |

Validate visually in Figma across all 4 density contexts before committing values.

### 2. The same pattern propagates to every other UI component

Every text-bearing component maps its `size` onto this tier set (badge sm–lg, tag sm–lg, tab sm–lg, button xs–xl, …). Not every component needs all 5 tiers — each component's README declares which subset it supports.

### 3. Canonical 5-tier scale: `xs | sm | md | lg | xl`

Add `2xs` / `2xl` only when a specific component genuinely needs them. Button needs xs → xl. Most other components will need sm → lg only.

### 4. Component size tokens reference the typography tiers

A component-token layer (not yet built — see Status) maps each size to its typography tier:

```json
"button": {
  "size": {
    "xs": { "typography": "{label.xs}" },
    "sm": { "typography": "{label.sm}" },
    "md": { "typography": "{label.md}" },
    "lg": { "typography": "{label.lg}" },
    "xl": { "typography": "{label.xl}" }
  }
}
```

Height and padding-x tokens for each size tier belong here too (see below).

---

## Height and Padding: Harmonious Spatial Scaling

### Vertical trim

Button typography uses **vertical trim** (`text-box-trim: both; text-edge: cap alphabetic` / Figma's "Vertical trim"). This strips above-cap and below-baseline spacing so text sits flush to its cap-height. Line-height is irrelevant to layout — it gets clipped. Only **font-size** (which determines cap-height) and **padding-y** drive the visual height.

### The governing formula

```
height = cap-height + (2 × padding-y)   [visual model]
height = size-* token                    [what gets set in CSS/Figma]
padding-x = 2 × padding-y
```

Because cap-height varies by typeface, the height tokens are arrived at visually in Figma and then snapped to the nearest `size-*` token. The formula is the validation test, not the generation method.

The **2:1 padding-x:padding-y ratio** keeps button proportions visually consistent at every size.

### Mapping to existing primitive tokens

Using font sizes 12→14→16→18→20 (+2 arithmetic step):

| Size | font-size | padding-y (visual) | height → size token | padding-x → space token |
|------|-----------|--------------------|---------------------|-------------------------|
| xs   | 12        | ~6                 | **28** → `size-28`  | 12 → `space-12`         |
| sm   | 14        | ~6                 | **32** → `size-32`  | 12 → `space-12`         |
| md   | 16        | ~8                 | **40** → `size-40`  | 16 → `space-16`         |
| lg   | 18        | ~10                | **48** → `size-48`  | 20 → `space-20`         |
| xl   | 20        | ~12                | **56** → `size-56`  | 24 → `space-24`         |

Every height lands exactly on an existing `size-*` token. Every padding-x lands on an existing `space-*` token. No new primitive tokens are needed.

Because line-height is trimmed, the `label.*` tokens only need to specify font-family, font-weight, and font-size — line-height is included for non-trimmed contexts (accessibility tools, fallback rendering) but does not drive the height calculation.

### Density context interaction

Height and padding are **fixed per size tier** — they do not scale with density context. Only the typography (font-size) scales. A `lg` button is always 48px tall regardless of whether it appears in a Compact or Spacious layout; the text inside it simply uses the Compact or Spacious `label.lg` type style.

### Full component-token shape (illustrative)

```json
"button": {
  "size": {
    "xs": {
      "typography": "{label.xs}",
      "height": "{size.size-28}",
      "padding-x": "{space.space-12}"
    },
    "sm": {
      "typography": "{label.sm}",
      "height": "{size.size-32}",
      "padding-x": "{space.space-12}"
    },
    "md": {
      "typography": "{label.md}",
      "height": "{size.size-40}",
      "padding-x": "{space.space-16}"
    },
    "lg": {
      "typography": "{label.lg}",
      "height": "{size.size-48}",
      "padding-x": "{space.space-20}"
    },
    "xl": {
      "typography": "{label.xl}",
      "height": "{size.size-56}",
      "padding-x": "{space.space-24}"
    }
  }
}
```

The three properties (`typography`, `height`, `padding-x`) are the repeating pattern for every component that carries text and has a size tier. The ratio and formula stay the same; only which subset of tiers the component exposes differs.

---

## Implementation Order

1. ✅ **Typography tiers** — size-keyed UI label typography (`label.{xs..xl}`) is authored per density context in `packages/tokens/src/context.json` (4 contexts × 5 tiers).

2. **Component-token layer** — add a `button.size` group mapping each tier to `typography`, `height`, and `padding-x` references. The home for this layer is being settled by the token-pipeline RFCs (`docs/rfcs/0001`, `docs/rfcs/0006`).

3. **`packages/react` Button component** — add a `size` prop (`"xs" | "sm" | "md" | "lg" | "xl"`, default `"md"`) mapping each value to the corresponding CSS custom property. Proves the convention end to end.

4. **Propagate** — every subsequent component picks from the established tier set and documents which subset it supports in its README.
