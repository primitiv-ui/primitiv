/*
 * ToggleGroup styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/toggle-group/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const toggleGroup = cva("primitiv-toggle-group", {
  variants: {
    size: {
      xs: "primitiv-toggle-group--xs",
      sm: "primitiv-toggle-group--sm",
      md: "primitiv-toggle-group--md",
      lg: "primitiv-toggle-group--lg",
      xl: "primitiv-toggle-group--xl",
    },
    justify: {
      content: "",
      justified: "primitiv-toggle-group--justified",
    },
  },
  defaultVariants: {
    size: "md",
    justify: "content",
  },
});

export type ToggleGroupVariants = VariantProps<typeof toggleGroup>;

export const toggleGroupItem = cva("primitiv-toggle-group__item");

export type ToggleGroupItemVariants = VariantProps<typeof toggleGroupItem>;
