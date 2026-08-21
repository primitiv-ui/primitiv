/*
 * Alert styled-surface recipe.
 *
 * Maps to the contract's modifier classes; the styling lives in the copied
 * stylesheet (RFC 0006 §6.1). Hand-authored — like `tag`, this entry
 * composes the headless `Alert` primitive but has no generator-emitted
 * shape (the icon/title/dismiss anatomy has no generated equivalent) — so
 * it carries no drift-guard test; the shape still mirrors the generated
 * recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const alert = cva("primitiv-alert", {
  variants: {
    tone: {
      info: "primitiv-alert--info",
      success: "primitiv-alert--success",
      warning: "primitiv-alert--warning",
      danger: "primitiv-alert--danger",
    },
    size: {
      xs: "primitiv-alert--xs",
      sm: "primitiv-alert--sm",
      md: "primitiv-alert--md",
      lg: "primitiv-alert--lg",
      xl: "primitiv-alert--xl",
    },
  },
  defaultVariants: {
    tone: "info",
    size: "md",
  },
});

export type AlertVariants = VariantProps<typeof alert>;
