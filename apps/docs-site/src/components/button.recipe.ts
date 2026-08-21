/*
 * Button styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/button/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const button = cva("primitiv-button", {
  variants: {
    variant: {
      primary: "primitiv-button--primary",
      secondary: "primitiv-button--secondary",
      danger: "primitiv-button--danger",
      ghost: "primitiv-button--ghost",
      link: "primitiv-button--link",
    },
    size: {
      xs: "primitiv-button--xs",
      sm: "primitiv-button--sm",
      md: "primitiv-button--md",
      lg: "primitiv-button--lg",
      xl: "primitiv-button--xl",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export type ButtonVariants = VariantProps<typeof button>;
