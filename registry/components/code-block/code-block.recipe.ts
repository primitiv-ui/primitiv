/*
 * Code Block styled-surface recipe.
 *
 * Maps the `variant` and `size` axes to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1). Hand-authored — Code Block carries
 * real behaviour (Prism highlighting + copy-to-clipboard), so it has no headless
 * primitive to generate from and no drift-guard test.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const codeBlock = cva("primitiv-code-block", {
  variants: {
    /* `block` adds no class — the base rule IS the block presentation, so only
       the deviation needs one. Same shape as List's `marker` axis. */
    variant: {
      block: "",
      inline: "primitiv-code-block--inline",
    },
    size: {
      xs: "primitiv-code-block--xs",
      sm: "primitiv-code-block--sm",
      md: "primitiv-code-block--md",
      lg: "primitiv-code-block--lg",
      xl: "primitiv-code-block--xl",
    },
    /* Wrapping is the default, so — like `variant` above — only the deviation
       carries a class. */
    wrap: {
      true: "",
      false: "primitiv-code-block--nowrap",
    },
  },
  defaultVariants: {
    variant: "block",
    size: "md",
    wrap: true,
  },
});

export type CodeBlockVariants = VariantProps<typeof codeBlock>;
