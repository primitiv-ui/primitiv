/*
 * Modal styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Unlike the generated registry components, Modal's wrapper is hand-authored
 * (modal.tsx) because Modal.Root / Modal.Portal take no className. This recipe
 * still follows the generated shape: it maps the variant props to the contract's
 * modifier classes; the styling lives in the copied stylesheet (RFC 0006 §6.1 /
 * D53). Change registry/components/modal/contract.json + this file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const modal = cva("primitiv-modal", {
  variants: {
    size: {
      sm: "primitiv-modal--sm",
      md: "primitiv-modal--md",
      lg: "primitiv-modal--lg",
      xl: "primitiv-modal--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type ModalVariants = VariantProps<typeof modal>;

export const modalOverlay = cva("primitiv-modal__overlay");

export type ModalOverlayVariants = VariantProps<typeof modalOverlay>;

export const modalHeader = cva("primitiv-modal__header");

export type ModalHeaderVariants = VariantProps<typeof modalHeader>;

export const modalBody = cva("primitiv-modal__body");

export type ModalBodyVariants = VariantProps<typeof modalBody>;

export const modalFooter = cva("primitiv-modal__footer");

export type ModalFooterVariants = VariantProps<typeof modalFooter>;

export const modalTitle = cva("primitiv-modal__title");

export type ModalTitleVariants = VariantProps<typeof modalTitle>;

export const modalDescription = cva("primitiv-modal__description");

export type ModalDescriptionVariants = VariantProps<typeof modalDescription>;

export const modalClose = cva("primitiv-modal__close");

export type ModalCloseVariants = VariantProps<typeof modalClose>;
