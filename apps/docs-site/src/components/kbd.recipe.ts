/*
 * Kbd styled-surface recipe.
 *
 * Maps to the contract's modifier classes; the styling lives in the copied
 * stylesheet (RFC 0006 §6.1). Hand-authored — like `inline-code`, this entry
 * has no headless `@primitiv-ui/react` primitive to generate from — so it
 * carries no drift-guard test; the shape still mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const kbd = cva("primitiv-kbd", {
  variants: {
    size: {
      xs: "primitiv-kbd--xs",
      sm: "primitiv-kbd--sm",
      md: "primitiv-kbd--md",
      lg: "primitiv-kbd--lg",
      xl: "primitiv-kbd--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type KbdVariants = VariantProps<typeof kbd>;
