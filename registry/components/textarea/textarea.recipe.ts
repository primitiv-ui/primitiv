/*
 * Textarea styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/textarea/contract.json and regenerate instead.)
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const textarea = cva("primitiv-textarea", {
  variants: {
    size: {
      xs: "primitiv-textarea--xs",
      sm: "primitiv-textarea--sm",
      md: "primitiv-textarea--md",
      lg: "primitiv-textarea--lg",
      xl: "primitiv-textarea--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type TextareaVariants = VariantProps<typeof textarea>;
