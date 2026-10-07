/*
 * Checkbox styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/checkbox/contract.json and regenerate instead.)
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
