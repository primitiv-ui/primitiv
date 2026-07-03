/*
 * Code Block styled-surface recipe.
 *
 * Maps the `size` variant to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1). Hand-authored — Code Block carries
 * real behaviour (Prism highlighting + copy-to-clipboard), so it has no headless
 * primitive to generate from and no drift-guard test.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const codeBlock = cva("primitiv-code-block", {
  variants: {
    size: {
      xs: "primitiv-code-block--xs",
      sm: "primitiv-code-block--sm",
      md: "primitiv-code-block--md",
      lg: "primitiv-code-block--lg",
      xl: "primitiv-code-block--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type CodeBlockVariants = VariantProps<typeof codeBlock>;
