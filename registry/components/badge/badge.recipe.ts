/*
 * Badge styled-surface recipe.
 *
 * Maps to the contract's modifier classes; the styling lives in the copied
 * stylesheet (RFC 0006 §6.1). Hand-authored — like `kbd`, this entry has no
 * headless `@primitiv-ui/react` primitive to generate from — so it carries
 * no drift-guard test; the shape still mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const badge = cva("primitiv-badge", {
  variants: {
    tone: {
      success: "primitiv-badge--success",
      warning: "primitiv-badge--warning",
      info: "primitiv-badge--info",
      danger: "primitiv-badge--danger",
    },
    variant: {
      label: "primitiv-badge--label",
      counter: "primitiv-badge--counter",
    },
    size: {
      xs: "primitiv-badge--xs",
      sm: "primitiv-badge--sm",
      md: "primitiv-badge--md",
      lg: "primitiv-badge--lg",
      xl: "primitiv-badge--xl",
    },
  },
  defaultVariants: {
    tone: "success",
    variant: "label",
    size: "md",
  },
});

export type BadgeVariants = VariantProps<typeof badge>;
