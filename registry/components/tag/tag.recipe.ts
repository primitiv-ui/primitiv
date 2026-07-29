/*
 * Tag styled-surface recipe.
 *
 * Maps to the contract's modifier classes; the styling lives in the copied
 * stylesheet (RFC 0006 §6.1). Hand-authored — like `badge`, this entry has
 * no headless `@primitiv-ui/react` primitive to generate from — so it
 * carries no drift-guard test; the shape still mirrors the generated
 * recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const tag = cva("primitiv-tag", {
  variants: {
    tone: {
      neutral: "primitiv-tag--neutral",
      success: "primitiv-tag--success",
      warning: "primitiv-tag--warning",
      info: "primitiv-tag--info",
      danger: "primitiv-tag--danger",
    },
    size: {
      xs: "primitiv-tag--xs",
      sm: "primitiv-tag--sm",
      md: "primitiv-tag--md",
      lg: "primitiv-tag--lg",
      xl: "primitiv-tag--xl",
    },
  },
  defaultVariants: {
    tone: "neutral",
    size: "md",
  },
});

export type TagVariants = VariantProps<typeof tag>;
