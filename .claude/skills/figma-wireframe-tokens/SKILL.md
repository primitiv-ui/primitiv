---
name: figma-wireframe-tokens
description: Reference for using design tokens when creating or styling Figma wireframes — font families, font weight mapping, spacing values, colour tokens, Button component structure and variant/property names. TRIGGER when creating wireframes, placing or replacing components in Figma, looking up token values for fills/typography/radii, styling a Figma node to match the design system, or working with the Button component in Figma (variants, slots, properties). SKIP for token export/backup work (see figma-token-sync), plugin UI code, and React/Rust work.
---

# Design tokens in Figma wireframe work

## Token file locations

All three files live in `packages/tokens/src/` and are DTCG JSON:

| File              | Contents                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `primitives.json` | Raw values: colours, spacing, sizing, font families, font weights, font sizes, line heights, radii, border widths, opacity, letter spacing |
| `semantic.json`   | Typography scales (compact / comfortable / spacious) with body, heading, display, and ui (label + button) variants                         |
| `components.json` | Per-component token decisions wired to primitive aliases                                                                                   |

These are the repo copy. The Figma variables are the live source of truth, but these files are the fastest way to look up resolved hex values without opening Figma.

## Typography — font families

| Token                  | Family        | Use for                                     |
| ---------------------- | ------------- | ------------------------------------------- |
| `font-family.heading`  | **Khand**     | Headings, UI labels, overlines, button text |
| `font-family.text`     | **Asta Sans** | Body text, descriptive copy, sub-labels     |

> Renamed from `sans`/`serif` on 2026-05-31 — neither face is a serif. Khand is
> the condensed heading/label/display face; Asta Sans is the body/UI text face.

**Never use Inter in wireframes.** Inter is not in the design system.

### Font weight mapping

| Token                  | Weight | Khand style | Asta Sans style |
| ---------------------- | ------ | ----------- | --------------- |
| `font-weight.regular`  | 400    | Regular     | Regular         |
| `font-weight.medium`   | 500    | Medium      | —               |
| `font-weight.semibold` | 600    | SemiBold    | —               |

### Semantic role → font mapping

When creating text in wireframes, pick the role first, then the family:

| Role                                     | Family    | Weight   | Token ref                          |
| ---------------------------------------- | --------- | -------- | ---------------------------------- |
| Section overlines (NEUTRAL, BRAND, etc.) | Khand     | Medium   | `typography.compact.body.overline` |
| Headings / app name                      | Khand     | SemiBold | `typography.compact.heading.*`     |
| Hex values / UI data labels              | Khand     | Medium   | `typography.compact.ui.label`      |
| Button labels                            | Khand     | SemiBold | `typography.compact.ui.button`     |
| Descriptive body text                    | Asta Sans | Regular  | `typography.compact.body.sm`       |
| Sub-labels (White, Black, etc.)          | Asta Sans | Regular  | `typography.compact.body.xs`       |

### Remapping Inter → design system fonts (bulk script)

Use this pattern when converting an existing wireframe that used Inter:

```js
await Promise.all([
  figma.loadFontAsync({ family: "Khand", style: "SemiBold" }),
  figma.loadFontAsync({ family: "Khand", style: "Medium" }),
  figma.loadFontAsync({ family: "Khand", style: "Regular" }),
  figma.loadFontAsync({ family: "Asta Sans", style: "Regular" }),
]);

const textNodes = frame.findAll((n) => n.type === "TEXT");
for (const node of textNodes) {
  const fn = node.fontName;
  if (fn === figma.mixed || fn.family !== "Inter") continue;
  if (fn.style === "Bold")
    node.fontName = { family: "Khand", style: "SemiBold" };
  else if (fn.style === "Medium")
    node.fontName = { family: "Khand", style: "Medium" };
  else node.fontName = { family: "Asta Sans", style: "Regular" };
}
```

Keep font sizes as-is when converting — applying token sizes to a pre-built wireframe will break the layout.

## Spacing tokens

Spacing and sizing use the same scale (`space-*` / `size-*`). Common values:

| Token      | Value |
| ---------- | ----- |
| `space-8`  | 8     |
| `space-12` | 12    |
| `space-16` | 16    |
| `space-20` | 20    |
| `space-24` | 24    |
| `space-32` | 32    |

Use these for auto-layout padding and item spacing. When new wireframes are built from scratch, always snap to a token value rather than an arbitrary number.

## Key colour tokens (resolved hex)

**Neutral**

| Token                    | Hex       |
| ------------------------ | --------- |
| `color.neutral.white`    | `#ffffff` |
| `color.neutral.black`    | `#000000` |
| `color.neutral.grey.50`  | `#e5e5e5` |
| `color.neutral.grey.300` | `#8f8f8f` |
| `color.neutral.grey.600` | `#3b3b3b` |
| `color.neutral.grey.700` | `#222222` |

## Icons

Always use icons from the **Icons** page in the current Figma file. Never use emoji, Unicode symbols, or placeholder glyphs as stand-ins.

At the start of any wireframe session that needs icons, search for them with `figma_search_components` so node IDs are fresh for the session, then instantiate from the result.
