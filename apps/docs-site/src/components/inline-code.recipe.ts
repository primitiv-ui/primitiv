/*
 * Inline Code styled-surface recipe.
 *
 * Maps the `size` variant to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1). Hand-authored — like `prose`, this
 * entry has no headless `@primitiv-ui/react` primitive to generate from — so it
 * carries no drift-guard test; the shape still mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const inlineCode = cva("primitiv-inline-code", {
  variants: {
    size: {
      xs: "primitiv-inline-code--xs",
      sm: "primitiv-inline-code--sm",
      md: "primitiv-inline-code--md",
      lg: "primitiv-inline-code--lg",
      xl: "primitiv-inline-code--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type InlineCodeVariants = VariantProps<typeof inlineCode>;
