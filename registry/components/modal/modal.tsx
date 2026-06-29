/*
 * Modal — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: unlike every other registry wrapper, Modal.Root and Modal.Portal
 * are pure pass-throughs that take no className (Root is a context provider with
 * no DOM; Portal is a createPortal wrapper), so the className-on-every-part
 * generator would emit invalid props. The styled parts (Overlay, Content, Title,
 * Description, Close) follow the generated shape against modal.recipe.ts; Root,
 * Trigger, and Portal forward their props unchanged. Keep contract.json + the
 * stylesheet + this file in sync by hand.
 */
import { Modal as ModalPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { modal, modalOverlay, modalTitle, modalDescription, modalClose } from "./modal.recipe";

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

export type ModalTitleProps = ComponentPropsWithRef<typeof ModalPrimitive.Title>;

export function ModalTitle({ className, ...props }: ModalTitleProps) {
  return <ModalPrimitive.Title className={[modalTitle(), className].filter(Boolean).join(" ")} {...props} />;
}

export type ModalDescriptionProps = ComponentPropsWithRef<typeof ModalPrimitive.Description>;

export function ModalDescription({ className, ...props }: ModalDescriptionProps) {
  return <ModalPrimitive.Description className={[modalDescription(), className].filter(Boolean).join(" ")} {...props} />;
}

export type ModalCloseProps = ComponentPropsWithRef<typeof ModalPrimitive.Close>;

export function ModalClose({ className, ...props }: ModalCloseProps) {
  return <ModalPrimitive.Close className={[modalClose(), className].filter(Boolean).join(" ")} {...props} />;
}
