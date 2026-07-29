/*
 * Chip styled-surface recipe.
 *
 * Maps to the contract's modifier classes; the styling lives in the copied
 * stylesheet (RFC 0006 §6.1). Hand-authored — like `code-block`, this entry
 * has real behaviour (a remove button) but no headless `@primitiv-ui/react`
 * primitive to generate from — so it carries no drift-guard test; the shape
 * still mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const chip = cva("primitiv-chip", {
  variants: {
    size: {
      xs: "primitiv-chip--xs",
      sm: "primitiv-chip--sm",
      md: "primitiv-chip--md",
      lg: "primitiv-chip--lg",
      xl: "primitiv-chip--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type ChipVariants = VariantProps<typeof chip>;
