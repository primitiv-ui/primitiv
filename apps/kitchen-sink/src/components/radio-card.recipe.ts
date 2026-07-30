/*
 * RadioCard styled-surface recipe.
 *
 * Maps to the contract's modifier classes; the styling lives in the copied
 * stylesheet (RFC 0006 §6.1). Hand-authored — like `checkbox-card`, this
 * entry composes a headless primitive but the indicator/title/description
 * anatomy has no generator-emitted shape — so it carries no drift-guard
 * test; the shape still mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const radioCard = cva("primitiv-radio-card", {
  variants: {
    size: {
      xs: "primitiv-radio-card--xs",
      sm: "primitiv-radio-card--sm",
      md: "primitiv-radio-card--md",
      lg: "primitiv-radio-card--lg",
      xl: "primitiv-radio-card--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type RadioCardVariants = VariantProps<typeof radioCard>;
