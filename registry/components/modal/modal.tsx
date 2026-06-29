/*
 * Modal — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: unlike every other registry wrapper, Modal.Root and Modal.Portal
 * are pure pass-throughs that take no className (Root is a context provider with
 * no DOM; Portal is a createPortal wrapper), so the className-on-every-part
 * generator would emit invalid props. The styled parts (Overlay, Content, Title,
 * Description, Close) follow the generated shape against modal.recipe.ts; Root,
 * Trigger, and Portal forward their props unchanged. Header, Body, and Footer are
 * styled-surface-only layout containers (plain <div>s, no headless equivalent) —
 * they mirror the Figma anatomy and carry no behaviour. Keep contract.json + the
 * stylesheet + this file in sync by hand.
 */
import { Modal as ModalPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import {
  modal,
  modalOverlay,
  modalHeader,
  modalBody,
  modalFooter,
  modalTitle,
  modalDescription,
  modalClose,
} from "./modal.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * An accessible modal dialog built on the native `<dialog>` element (WAI-ARIA Modal Dialog pattern).
 *
 * @see https://primitiv-ui.dev/docs/components/modal
 */
export type ModalProps = ComponentPropsWithRef<typeof ModalPrimitive.Root>;

export function Modal(props: ModalProps) {
  return <ModalPrimitive.Root {...props} />;
}

export type ModalTriggerProps = ComponentPropsWithRef<typeof ModalPrimitive.Trigger>;

export function ModalTrigger(props: ModalTriggerProps) {
  return <ModalPrimitive.Trigger {...props} />;
}

export type ModalPortalProps = ComponentPropsWithRef<typeof ModalPrimitive.Portal>;

export function ModalPortal(props: ModalPortalProps) {
  return <ModalPrimitive.Portal {...props} />;
}

export type ModalOverlayProps = ComponentPropsWithRef<typeof ModalPrimitive.Overlay>;

export function ModalOverlay({ className, ...props }: ModalOverlayProps) {
  return <ModalPrimitive.Overlay className={[modalOverlay(), className].filter(Boolean).join(" ")} {...props} />;
}

export type ModalContentProps = DistributiveOmit<ComponentPropsWithRef<typeof ModalPrimitive.Content>, "size"> & {
  /**
   * Dialog width; `data-density` scales the padding within each size.
   * - `sm` — Small (360px).
   * - `md` — Medium (520px, the default).
   * - `lg` — Large (640px).
   * - `xl` — Extra large (800px).
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/modal
   */
  size?: "sm" | "md" | "lg" | "xl";
};

export function ModalContent({ size, className, ...props }: ModalContentProps) {
  return <ModalPrimitive.Content className={[modal({ size }), className].filter(Boolean).join(" ")} {...props} />;
}

/**
 * The dialog's top region — a `<div>` holding the {@link ModalTitle} and the
 * close affordance, with a divider beneath it. Lay out `ModalTitle` then the
 * close (a ghost `Button` wrapping a `Close` icon via `ModalClose asChild`); the
 * row spaces them apart.
 *
 * @see https://primitiv-ui.dev/docs/components/modal
 */
export type ModalHeaderProps = ComponentPropsWithRef<"div">;

export function ModalHeader({ className, ...props }: ModalHeaderProps) {
  return <div className={[modalHeader(), className].filter(Boolean).join(" ")} {...props} />;
}

/**
 * The dialog's content region — a padded `<div>` for the {@link ModalDescription}
 * and the body content (forms, copy, etc.). Stacks its children with the modal gap.
 *
 * @see https://primitiv-ui.dev/docs/components/modal
 */
export type ModalBodyProps = ComponentPropsWithRef<"div">;

export function ModalBody({ className, ...props }: ModalBodyProps) {
  return <div className={[modalBody(), className].filter(Boolean).join(" ")} {...props} />;
}

/**
 * The dialog's action region — a `<div>` with a divider above it that
 * right-aligns its children. Place the dismiss action (a secondary `Button`
 * wrapped in `ModalClose asChild`) then the confirm action (a primary `Button`).
 *
 * @see https://primitiv-ui.dev/docs/components/modal
 */
export type ModalFooterProps = ComponentPropsWithRef<"div">;

export function ModalFooter({ className, ...props }: ModalFooterProps) {
  return <div className={[modalFooter(), className].filter(Boolean).join(" ")} {...props} />;
}

export type ModalTitleProps = ComponentPropsWithRef<typeof ModalPrimitive.Title>;

export function ModalTitle({ className, ...props }: ModalTitleProps) {
  return <ModalPrimitive.Title className={[modalTitle(), className].filter(Boolean).join(" ")} {...props} />;
}

export type ModalDescriptionProps = ComponentPropsWithRef<typeof ModalPrimitive.Description>;

export function ModalDescription({ className, ...props }: ModalDescriptionProps) {
  return <ModalPrimitive.Description className={[modalDescription(), className].filter(Boolean).join(" ")} {...props} />;
}

/**
 * Closes the modal. A bare `<ModalClose>text</ModalClose>` renders a frameless
 * button, but the canonical header close — matching the Figma design — composes a
 * ghost `Button` wrapping a `Close` icon via `asChild`, with an `aria-label`:
 *
 * ```tsx
 * <ModalClose asChild>
 *   <Button variant="ghost" size="sm" aria-label="Close">
 *     <Close />
 *   </Button>
 * </ModalClose>
 * ```
 *
 * Size the close one step below the dialog so it stays subordinate to the title:
 * `sm → xs`, `md → sm`, `lg → md`, `xl → lg`. The footer's dismiss action is the
 * same `ModalClose asChild` pattern around a `secondary` `Button`.
 *
 * @see https://primitiv-ui.dev/docs/components/modal
 */
export type ModalCloseProps = ComponentPropsWithRef<typeof ModalPrimitive.Close>;

export function ModalClose({ className, ...props }: ModalCloseProps) {
  return <ModalPrimitive.Close className={[modalClose(), className].filter(Boolean).join(" ")} {...props} />;
}
