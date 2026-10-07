/*
 * Switch styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/switch/contract.json and regenerate instead.)
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const switchRecipe = cva("primitiv-switch", {
  variants: {
    size: {
      xs: "primitiv-switch--xs",
      sm: "primitiv-switch--sm",
      md: "primitiv-switch--md",
      lg: "primitiv-switch--lg",
      xl: "primitiv-switch--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type SwitchVariants = VariantProps<typeof switchRecipe>;
