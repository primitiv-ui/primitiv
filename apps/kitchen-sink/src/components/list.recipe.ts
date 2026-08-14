/*
 * List styled-surface recipe.
 *
 * Maps `type`, `marker`, `indent` and `size` to the contract's modifier classes; the
 * styling lives in the copied stylesheet (RFC 0006 §6.1). Hand-authored —
 * this entry has no headless `@primitiv-ui/react` primitive to generate
 * from — so it carries no drift-guard test; the shape still mirrors the
 * generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const list = cva("primitiv-list", {
  variants: {
    type: {
      unordered: "primitiv-list--unordered",
      ordered: "primitiv-list--ordered",
    },
    /* Inverted relative to `indent`: the base rule already draws the marker, so
       it is `false` that needs a class. */
    marker: {
      true: "",
      false: "primitiv-list--no-marker",
    },
    indent: {
      true: "primitiv-list--indent",
      false: "",
    },
    size: {
      xs: "primitiv-list--xs",
      sm: "primitiv-list--sm",
      md: "primitiv-list--md",
      lg: "primitiv-list--lg",
      xl: "primitiv-list--xl",
    },
  },
  defaultVariants: {
    type: "unordered",
    marker: true,
    indent: true,
    size: "md",
  },
});

export type ListVariants = VariantProps<typeof list>;
