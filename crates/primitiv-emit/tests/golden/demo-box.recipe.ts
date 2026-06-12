/*
 * DemoBox styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/r/demo-box/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const demoBox = cva("primitiv-demo-box", {
  variants: {
    variant: {
      primary: "primitiv-demo-box--primary",
      ghost: "primitiv-demo-box--ghost",
    },
    size: {
      sm: "primitiv-demo-box--sm",
      md: "primitiv-demo-box--md",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export type DemoBoxVariants = VariantProps<typeof demoBox>;
