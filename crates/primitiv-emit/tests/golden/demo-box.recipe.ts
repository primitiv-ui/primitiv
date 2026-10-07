/*
 * DemoBox styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/demo-box/contract.json and regenerate instead.)
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
