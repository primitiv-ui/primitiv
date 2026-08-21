/*
 * Collapsible styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/collapsible/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const collapsible = cva("primitiv-collapsible", {
  variants: {
    variant: {
      plain: "primitiv-collapsible--plain",
      card: "primitiv-collapsible--card",
      inline: "primitiv-collapsible--inline",
    },
    size: {
      xs: "primitiv-collapsible--xs",
      sm: "primitiv-collapsible--sm",
      md: "primitiv-collapsible--md",
      lg: "primitiv-collapsible--lg",
      xl: "primitiv-collapsible--xl",
    },
  },
  defaultVariants: {
    variant: "plain",
    size: "md",
  },
});

export type CollapsibleVariants = VariantProps<typeof collapsible>;

export const collapsibleTrigger = cva("primitiv-collapsible__trigger");

export type CollapsibleTriggerVariants = VariantProps<typeof collapsibleTrigger>;

export const collapsibleContent = cva("primitiv-collapsible__content");

export type CollapsibleContentVariants = VariantProps<typeof collapsibleContent>;

export const collapsibleTriggerIcon = cva("primitiv-collapsible__trigger-icon");

export type CollapsibleTriggerIconVariants = VariantProps<typeof collapsibleTriggerIcon>;
