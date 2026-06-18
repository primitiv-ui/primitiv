/*
 * DemoView styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/demo-view/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const demoView = cva("primitiv-demo-view", {
  variants: {
    size: {
      sm: "primitiv-demo-view--sm",
      md: "primitiv-demo-view--md",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type DemoViewVariants = VariantProps<typeof demoView>;

export const demoViewBar = cva("primitiv-demo-view__bar", {
  variants: {
    align: {
      start: "primitiv-demo-view__bar--start",
      center: "primitiv-demo-view__bar--center",
      end: "primitiv-demo-view__bar--end",
    },
  },
  defaultVariants: {
    align: "start",
  },
});

export type DemoViewBarVariants = VariantProps<typeof demoViewBar>;

export const demoViewItem = cva("primitiv-demo-view__item");

export type DemoViewItemVariants = VariantProps<typeof demoViewItem>;
