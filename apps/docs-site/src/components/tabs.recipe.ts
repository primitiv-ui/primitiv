/*
 * Tabs styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/tabs/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const tabs = cva("primitiv-tabs", {
  variants: {
    size: {
      xs: "primitiv-tabs--xs",
      sm: "primitiv-tabs--sm",
      md: "primitiv-tabs--md",
      lg: "primitiv-tabs--lg",
      xl: "primitiv-tabs--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type TabsVariants = VariantProps<typeof tabs>;

export const tabsList = cva("primitiv-tabs__list", {
  variants: {
    justify: {
      start: "primitiv-tabs__list--start",
      center: "primitiv-tabs__list--center",
      end: "primitiv-tabs__list--end",
    },
  },
  defaultVariants: {
    justify: "start",
  },
});

export type TabsListVariants = VariantProps<typeof tabsList>;

export const tabsTrigger = cva("primitiv-tabs__trigger");

export type TabsTriggerVariants = VariantProps<typeof tabsTrigger>;

export const tabsContent = cva("primitiv-tabs__panel");

export type TabsContentVariants = VariantProps<typeof tabsContent>;
