/*
 * EmptyState styled-surface recipe.
 *
 * Maps to the contract's modifier classes; the styling lives in the copied
 * stylesheet (RFC 0006 §6.1). Hand-authored — like `alert`, this entry
 * composes the headless `EmptyState` primitive but has no generator-emitted
 * shape (the media/title/description/actions anatomy has no generated
 * equivalent) — so it carries no drift-guard test; the shape still mirrors
 * the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const emptyState = cva("primitiv-empty-state", {
  variants: {
    orientation: {
      vertical: "primitiv-empty-state--vertical",
      horizontal: "primitiv-empty-state--horizontal",
    },
    size: {
      xs: "primitiv-empty-state--xs",
      sm: "primitiv-empty-state--sm",
      md: "primitiv-empty-state--md",
      lg: "primitiv-empty-state--lg",
      xl: "primitiv-empty-state--xl",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    size: "md",
  },
});

export type EmptyStateVariants = VariantProps<typeof emptyState>;
