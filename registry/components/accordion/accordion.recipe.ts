/*
 * Accordion styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/accordion/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const accordion = cva("primitiv-accordion", {
  variants: {
    size: {
      xs: "primitiv-accordion--xs",
      sm: "primitiv-accordion--sm",
      md: "primitiv-accordion--md",
      lg: "primitiv-accordion--lg",
      xl: "primitiv-accordion--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type AccordionVariants = VariantProps<typeof accordion>;

export const accordionItem = cva("primitiv-accordion__item");

export type AccordionItemVariants = VariantProps<typeof accordionItem>;

export const accordionHeader = cva("primitiv-accordion__header");

export type AccordionHeaderVariants = VariantProps<typeof accordionHeader>;

export const accordionTrigger = cva("primitiv-accordion__trigger");

export type AccordionTriggerVariants = VariantProps<typeof accordionTrigger>;

export const accordionContent = cva("primitiv-accordion__content");

export type AccordionContentVariants = VariantProps<typeof accordionContent>;

export const accordionTriggerIcon = cva("primitiv-accordion__trigger-icon");

export type AccordionTriggerIconVariants = VariantProps<typeof accordionTriggerIcon>;
