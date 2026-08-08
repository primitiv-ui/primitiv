/*
 * Container styled-surface recipe.
 *
 * Maps the `size` and `gutter` variants to the contract's modifier classes;
 * the styling lives in the copied stylesheet (RFC 0006 §6.1). Hand-authored —
 * like `prose`, this entry has no headless `@primitiv-ui/react` primitive to
 * generate from (RFC 0022) — so it carries no drift-guard test; the shape
 * still mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const container = cva("primitiv-container", {
  variants: {
    size: {
      xs: "primitiv-container--xs",
      sm: "primitiv-container--sm",
      md: "primitiv-container--md",
      lg: "primitiv-container--lg",
      xl: "primitiv-container--xl",
      "2xl": "primitiv-container--2xl",
      full: "primitiv-container--full",
    },
    gutter: {
      responsive: "primitiv-container--gutter-responsive",
      none: "primitiv-container--gutter-none",
      sm: "primitiv-container--gutter-sm",
      md: "primitiv-container--gutter-md",
      lg: "primitiv-container--gutter-lg",
    },
  },
  defaultVariants: {
    size: "lg",
    gutter: "responsive",
  },
});

export type ContainerVariants = VariantProps<typeof container>;
