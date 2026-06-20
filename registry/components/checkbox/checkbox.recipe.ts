/*
 * Checkbox styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/checkbox/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const checkbox = cva("primitiv-checkbox", {
  variants: {
    size: {
      xs: "primitiv-checkbox--xs",
      sm: "primitiv-checkbox--sm",
      md: "primitiv-checkbox--md",
      lg: "primitiv-checkbox--lg",
      xl: "primitiv-checkbox--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type CheckboxVariants = VariantProps<typeof checkbox>;
