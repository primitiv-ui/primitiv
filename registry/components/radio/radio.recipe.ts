/*
 * Radio styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/radio/contract.json and regenerate instead.)
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const radio = cva("primitiv-radio", {
  variants: {
    size: {
      xs: "primitiv-radio--xs",
      sm: "primitiv-radio--sm",
      md: "primitiv-radio--md",
      lg: "primitiv-radio--lg",
      xl: "primitiv-radio--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type RadioVariants = VariantProps<typeof radio>;
