/*
 * Pull Quote styled-surface recipe.
 *
 * Maps `size` to the contract's modifier classes; the styling lives in the
 * copied stylesheet (RFC 0006 §6.1). Hand-authored — this entry has no
 * headless `@primitiv-ui/react` primitive to generate from — so it carries no
 * drift-guard test; the shape still mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const pullQuote = cva("primitiv-pull-quote", {
  variants: {
    size: {
      xs: "primitiv-pull-quote--xs",
      sm: "primitiv-pull-quote--sm",
      md: "primitiv-pull-quote--md",
      lg: "primitiv-pull-quote--lg",
      xl: "primitiv-pull-quote--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type PullQuoteVariants = VariantProps<typeof pullQuote>;
