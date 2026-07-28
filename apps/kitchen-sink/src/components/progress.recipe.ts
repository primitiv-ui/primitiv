/*
 * Progress styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/progress/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const progress = cva("primitiv-progress", {
  variants: {
    size: {
      xs: "primitiv-progress--xs",
      sm: "primitiv-progress--sm",
      md: "primitiv-progress--md",
      lg: "primitiv-progress--lg",
      xl: "primitiv-progress--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type ProgressVariants = VariantProps<typeof progress>;

export const progressIndicator = cva("primitiv-progress__indicator");

export type ProgressIndicatorVariants = VariantProps<typeof progressIndicator>;
