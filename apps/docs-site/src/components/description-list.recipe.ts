/*
 * Description List styled-surface recipe.
 *
 * Maps `size` to the contract's modifier classes; the styling lives in the
 * copied stylesheet (RFC 0006 §6.1). Hand-authored — this entry has no
 * headless `@primitiv-ui/react` primitive to generate from — so it carries no
 * drift-guard test; the shape still mirrors the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const descriptionList = cva("primitiv-description-list", {
  variants: {
    size: {
      xs: "primitiv-description-list--xs",
      sm: "primitiv-description-list--sm",
      md: "primitiv-description-list--md",
      lg: "primitiv-description-list--lg",
      xl: "primitiv-description-list--xl",
    },
    layout: {
      stacked: "primitiv-description-list--stacked",
      inline: "primitiv-description-list--inline",
    },
  },
  defaultVariants: {
    size: "md",
    layout: "stacked",
  },
});

export type DescriptionListVariants = VariantProps<typeof descriptionList>;
