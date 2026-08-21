/*
 * Card styled-surface recipe.
 *
 * Maps to the contract's modifier classes; the styling lives in the copied
 * stylesheet (RFC 0006 §6.1). Hand-authored — Card composes no headless
 * primitive (it is structure and styling only, with no keyboard model or
 * focus management of its own), so like `badge`/`tag`/`chip` it carries no
 * drift-guard test; the shape still mirrors the generated recipes.
 *
 * Three exports because three parts carry their own modifiers: the root
 * (layout/size/elevation/scrim), the media region (inset), and the footer
 * (justify). Header, title, description and content have a single class
 * each and so need no recipe.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const card = cva("primitiv-card", {
  variants: {
    layout: {
      vertical: "primitiv-card--vertical",
      horizontal: "primitiv-card--horizontal",
      cover: "primitiv-card--cover",
    },
    size: {
      xs: "primitiv-card--xs",
      sm: "primitiv-card--sm",
      md: "primitiv-card--md",
      lg: "primitiv-card--lg",
      xl: "primitiv-card--xl",
    },
    elevation: {
      flat: "primitiv-card--flat",
      raised: "primitiv-card--raised",
    },
    scrim: {
      soft: "primitiv-card--scrim-soft",
      medium: "primitiv-card--scrim-medium",
      strong: "primitiv-card--scrim-strong",
    },
  },
  defaultVariants: {
    layout: "vertical",
    size: "md",
    elevation: "flat",
    scrim: "medium",
  },
});

export const cardMedia = cva("primitiv-card__media", {
  variants: {
    inset: {
      true: "primitiv-card__media--inset",
      false: "",
    },
  },
  defaultVariants: {
    inset: false,
  },
});

export const cardFooter = cva("primitiv-card__footer", {
  variants: {
    justify: {
      start: "primitiv-card__footer--start",
      center: "primitiv-card__footer--center",
      end: "primitiv-card__footer--end",
    },
  },
  defaultVariants: {
    justify: "end",
  },
});

export type CardVariants = VariantProps<typeof card>;
export type CardMediaVariants = VariantProps<typeof cardMedia>;
export type CardFooterVariants = VariantProps<typeof cardFooter>;
