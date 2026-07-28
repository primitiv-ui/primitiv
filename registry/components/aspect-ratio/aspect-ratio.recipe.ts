/*
 * AspectRatio styled-surface recipe.
 *
 * Maps `ratio` to the contract's preset modifier classes; the styling lives in
 * the copied stylesheet (RFC 0006 §6.1). A curated preset set rather than a
 * continuous number, so the wrapper writes no inline style (RFC 0022 §9) — a
 * bespoke ratio is an override of --primitiv-aspect-ratio in the consumer's own
 * stylesheet. Hand-authored, so it carries no drift-guard test; the shape still
 * mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const aspectRatio = cva("primitiv-aspect-ratio", {
  variants: {
    ratio: {
      "1/1": "primitiv-aspect-ratio--1-1",
      "4/3": "primitiv-aspect-ratio--4-3",
      "3/2": "primitiv-aspect-ratio--3-2",
      "16/9": "primitiv-aspect-ratio--16-9",
      "21/9": "primitiv-aspect-ratio--21-9",
      "3/4": "primitiv-aspect-ratio--3-4",
      "2/3": "primitiv-aspect-ratio--2-3",
      "9/16": "primitiv-aspect-ratio--9-16",
    },
  },
  defaultVariants: {
    ratio: "1/1",
  },
});

export type AspectRatioVariants = VariantProps<typeof aspectRatio>;
