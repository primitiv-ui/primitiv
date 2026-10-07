/*
 * Input styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/input/contract.json and regenerate instead.)
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const input = cva("primitiv-input", {
  variants: {
    size: {
      xs: "primitiv-input--xs",
      sm: "primitiv-input--sm",
      md: "primitiv-input--md",
      lg: "primitiv-input--lg",
      xl: "primitiv-input--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type InputVariants = VariantProps<typeof input>;
