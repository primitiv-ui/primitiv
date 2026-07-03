/*
 * InputGroup styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/input-group/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const inputGroup = cva("primitiv-input-group", {
  variants: {
    size: {
      xs: "primitiv-input-group--xs",
      sm: "primitiv-input-group--sm",
      md: "primitiv-input-group--md",
      lg: "primitiv-input-group--lg",
      xl: "primitiv-input-group--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type InputGroupVariants = VariantProps<typeof inputGroup>;

export const inputGroupLeadingAdornment = cva("primitiv-input-group__leading");

export type InputGroupLeadingAdornmentVariants = VariantProps<typeof inputGroupLeadingAdornment>;

export const inputGroupTrailingAdornment = cva("primitiv-input-group__trailing");

export type InputGroupTrailingAdornmentVariants = VariantProps<typeof inputGroupTrailingAdornment>;
