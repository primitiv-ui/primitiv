/*
 * Center styled-surface recipe.
 *
 * Maps `axis` to the contract's modifier classes; the styling lives in the
 * copied stylesheet (RFC 0006 §6.1). Hand-authored — this entry has no
 * headless `@primitiv-ui/react` primitive to generate from (RFC 0022) — so
 * it carries no drift-guard test; the shape still mirrors the generated
 * recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const center = cva("primitiv-center", {
  variants: {
    axis: {
      both: "primitiv-center--both",
      horizontal: "primitiv-center--horizontal",
      vertical: "primitiv-center--vertical",
    },
  },
  defaultVariants: {
    axis: "both",
  },
});

export type CenterVariants = VariantProps<typeof center>;
