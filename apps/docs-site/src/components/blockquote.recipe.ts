/*
 * Blockquote styled-surface recipe.
 *
 * Maps `tone` and `size` to the contract's modifier classes; the styling
 * lives in the copied stylesheet (RFC 0006 §6.1). Hand-authored — this entry
 * has no headless `@primitiv-ui/react` primitive to generate from — so it
 * carries no drift-guard test; the shape still mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const blockquote = cva("primitiv-blockquote", {
  variants: {
    tone: {
      default: "primitiv-blockquote--default",
      accent: "primitiv-blockquote--accent",
    },
    size: {
      xs: "primitiv-blockquote--xs",
      sm: "primitiv-blockquote--sm",
      md: "primitiv-blockquote--md",
      lg: "primitiv-blockquote--lg",
      xl: "primitiv-blockquote--xl",
    },
  },
  defaultVariants: {
    tone: "default",
    size: "md",
  },
});

export type BlockquoteVariants = VariantProps<typeof blockquote>;
