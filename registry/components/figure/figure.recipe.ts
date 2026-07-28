/*
 * Figure styled-surface recipe.
 *
 * Maps `captionPosition` to the contract's modifier classes; the styling
 * lives in the copied stylesheet (RFC 0006 §6.1). Hand-authored — this entry
 * has no headless `@primitiv-ui/react` primitive to generate from (RFC 0015
 * decided against one) — so it carries no drift-guard test; the shape still
 * mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const figure = cva("primitiv-figure", {
  variants: {
    captionPosition: {
      below: "primitiv-figure--below",
      above: "primitiv-figure--above",
      overlay: "primitiv-figure--overlay",
    },
  },
  defaultVariants: {
    captionPosition: "below",
  },
});

export type FigureVariants = VariantProps<typeof figure>;
