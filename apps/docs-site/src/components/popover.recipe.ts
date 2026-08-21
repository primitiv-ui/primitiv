/*
 * Popover styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Like Modal, Popover's wrapper is hand-authored (popover.tsx) because
 * Popover.Root takes no className (it is a context provider with no DOM). This
 * recipe still follows the generated shape: it maps the variant props to the
 * contract's modifier classes; the styling lives in the copied stylesheet
 * (RFC 0006 §6.1 / D53). Change contract.json + this file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const popover = cva("primitiv-popover", {
  variants: {
    size: {
      sm: "primitiv-popover--sm",
      md: "primitiv-popover--md",
      lg: "primitiv-popover--lg",
      xl: "primitiv-popover--xl",
    },
    placement: {
      top: "primitiv-popover--top",
      "top-start": "primitiv-popover--top-start",
      "top-end": "primitiv-popover--top-end",
      right: "primitiv-popover--right",
      "right-start": "primitiv-popover--right-start",
      "right-end": "primitiv-popover--right-end",
      bottom: "primitiv-popover--bottom",
      "bottom-start": "primitiv-popover--bottom-start",
      "bottom-end": "primitiv-popover--bottom-end",
      left: "primitiv-popover--left",
      "left-start": "primitiv-popover--left-start",
      "left-end": "primitiv-popover--left-end",
    },
  },
  defaultVariants: {
    size: "md",
    placement: "bottom",
  },
});

export type PopoverVariants = VariantProps<typeof popover>;

export const popoverTitle = cva("primitiv-popover__title");

export type PopoverTitleVariants = VariantProps<typeof popoverTitle>;

export const popoverDescription = cva("primitiv-popover__description");

export type PopoverDescriptionVariants = VariantProps<typeof popoverDescription>;

export const popoverClose = cva("primitiv-popover__close");

export type PopoverCloseVariants = VariantProps<typeof popoverClose>;
