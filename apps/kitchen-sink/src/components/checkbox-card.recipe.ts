/*
 * CheckboxCard styled-surface recipe.
 *
 * Maps to the contract's modifier classes; the styling lives in the copied
 * stylesheet (RFC 0006 §6.1). Hand-authored — like `alert`, this entry
 * composes a headless primitive but the indicator/title/description
 * anatomy has no generator-emitted shape — so it carries no drift-guard
 * test; the shape still mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const checkboxCard = cva("primitiv-checkbox-card", {
  variants: {
    size: {
      xs: "primitiv-checkbox-card--xs",
      sm: "primitiv-checkbox-card--sm",
      md: "primitiv-checkbox-card--md",
      lg: "primitiv-checkbox-card--lg",
      xl: "primitiv-checkbox-card--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type CheckboxCardVariants = VariantProps<typeof checkboxCard>;
