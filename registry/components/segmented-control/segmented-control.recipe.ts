/*
 * SegmentedControl styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/segmented-control/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const segmentedControl = cva("primitiv-segmented-control", {
  variants: {
    size: {
      xs: "primitiv-segmented-control--xs",
      sm: "primitiv-segmented-control--sm",
      md: "primitiv-segmented-control--md",
      lg: "primitiv-segmented-control--lg",
      xl: "primitiv-segmented-control--xl",
    },
    justify: {
      content: "",
      justified: "primitiv-segmented-control--justified",
    },
  },
  defaultVariants: {
    size: "md",
    justify: "content",
  },
});

export type SegmentedControlVariants = VariantProps<typeof segmentedControl>;

export const segmentedControlItem = cva("primitiv-segmented-control__item");

export type SegmentedControlItemVariants = VariantProps<typeof segmentedControlItem>;
