/*
 * SegmentedControl styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/segmented-control/contract.json and regenerate instead.)
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
    justify: "justified",
  },
});

export type SegmentedControlVariants = VariantProps<typeof segmentedControl>;

export const segmentedControlItem = cva("primitiv-segmented-control__item");

export type SegmentedControlItemVariants = VariantProps<typeof segmentedControlItem>;
