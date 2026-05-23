---
name: figma-wireframe-tokens
description: Reference for using design tokens when placing or styling components in Figma wireframes — token file locations, resolved values, Button component structure and variant/property names. TRIGGER when placing or replacing components in Figma, when looking up token values for fills/typography/radii, when styling a Figma node to match the design system, or when working with the Button component in Figma (variants, slots, properties). SKIP for token export/backup work (see figma-token-sync), plugin UI code, and React/Rust work.
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

## Key resolved values

### Colour palette

**Neutral**

| Token                    | Hex       |
| ------------------------ | --------- |
| `color.neutral.white`    | `#ffffff` |
| `color.neutral.black`    | `#000000` |
| `color.neutral.grey.50`  | `#e5e5e5` |
| `color.neutral.grey.300` | `#8f8f8f` |
| `color.neutral.grey.600` | `#3b3b3b` |
| `color.neutral.grey.700` | `#222222` |
