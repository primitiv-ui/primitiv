/*
 * ConfirmDialog — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC
 * 0004 D53; composed-component precedent — Figma-first per the composite
 * conventions, RFC 0021 §6).
 *
 * Not generated: this is a pre-arranged Modal, not a new primitive — it
 * composes the registry `modal` (Content/Header/Body/Footer/Title/Close) and
 * `button` components directly (hence the modal + button dependencies), the
 * same way `alert` composes `button` for its dismiss affordance. There is no
 * headless `@primitiv-ui/react` primitive: Modal's own native-<dialog>-based
 * focus trap, Escape/backdrop dismissal, and open-state management already
 * cover everything this component needs (verified against
 * packages/react/src/Modal/hooks/useModalContent.ts) — ConfirmDialog is pure
 * composition, so it carries no drift-guard test. Keep contract.json + the
 * stylesheet + this file in sync by hand.
 *
 * `ConfirmDialogContent`'s body is a genuine Modal.Body slot ("up to the
 * consumer to put the content in there", matching Modal/Body's own Figma
 * anatomy) rather than a `message` string prop — see the "Confirm / Alert
 * Dialog — exploration" Figma page for the design record. Portal/Overlay are
 * deliberately not re-exported here: they are visually and behaviourally
 * identical to a plain Modal's, so compose `ModalPortal`/`ModalOverlay` from
 * "./modal" directly (see this file's own usage example).
 */
import { Modal as ModalPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ReactNode } from "react";
import { Button } from "./button";
import { ModalContent, ModalHeader, ModalBody, ModalFooter, ModalTitle, ModalClose } from "./modal";
import { confirmDialog } from "./confirm-dialog.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.06 19 19 20.06 3.94 5 5 3.94z" />
      <path d="M20.06 5 5 20.06 3.94 19 19 3.94z" />
    </svg>
  );
}

type Size = "sm" | "md" | "lg" | "xl";

/** One step below the dialog's own size, matching `ModalClose`'s convention. */
const CLOSE_SIZE = {
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
} as const satisfies Record<Size, "xs" | "sm" | "md" | "lg">;

/**
 * A confirmation dialog for a single action — the sub-components that own
 * open state and the trigger. Compose with {@link ConfirmDialogContent}
 * (wrapped in `ModalPortal`/`ModalOverlay` from `./modal`, exactly like a
 * plain Modal).
 *
 * @see https://primitiv-ui.dev/docs/components/confirm-dialog
 */
export type ConfirmDialogProps = ComponentPropsWithRef<typeof ModalPrimitive.Root>;

export function ConfirmDialog(props: ConfirmDialogProps) {
  return <ModalPrimitive.Root {...props} />;
}

export type ConfirmDialogTriggerProps = ComponentPropsWithRef<typeof ModalPrimitive.Trigger>;

export function ConfirmDialogTrigger(props: ConfirmDialogTriggerProps) {
  return <ModalPrimitive.Trigger {...props} />;
}

export type ConfirmDialogContentProps = DistributiveOmit<
  ComponentPropsWithRef<typeof ModalPrimitive.Content>,
  "children"
> & {
  /** The dialog's title, shown in the header next to the optional close button. */
  title: ReactNode;
  /**
   * The dialog's body — the confirmation message, or any richer content.
   * Rendered inside {@link ModalBody | `ModalBody`}'s own slot.
   */
  children: ReactNode;
  /**
   * Selects the Confirm button's variant — `default` → `primary`, `danger` →
   * `danger` — so the action's own tone drives the dialog, not a separate
   * colour scheme for the dialog itself.
   * @default "default"
   */
  tone?: "default" | "danger";
  /**
   * Dialog width, forwarded to `ModalContent`'s own `size`; `data-density`
   * scales the padding within each size. Defaults smaller than a plain
   * Modal — a confirmation is a short, low-content surface.
   * @default "sm"
   */
  size?: Size;
  /**
   * Confirm button label.
   * @default "Confirm"
   */
  confirmLabel?: string;
  /**
   * Cancel button label. The Cancel button always closes the dialog (it is
   * wrapped in `ModalClose asChild`) — there is no separate `onCancel` prop.
   * @default "Cancel"
   */
  cancelLabel?: string;
  /**
   * Called when the Confirm button is activated. Does **not** close the
   * dialog itself — drive `open`/`onOpenChange` (or the imperative
   * `close()` API) from this callback if confirming should dismiss it.
   */
  onConfirm: () => void;
  /**
   * Shows a close (×) button in the header, in addition to the Cancel/
   * Confirm footer actions. Off by default — the exploration found the
   * footer's Cancel action already covers the "back out" affordance for a
   * short confirmation, and a redundant close reads as noise.
   * @default false
   */
  showClose?: boolean;
};

/**
 * The dialog surface — title, body slot, and a right-aligned Cancel/Confirm
 * footer. A pre-arranged `Modal.Content`; drop it inside `ModalPortal` +
 * `ModalOverlay` exactly like a plain Modal.
 *
 * @example
 * ```tsx
 * <ConfirmDialog open={open} onOpenChange={setOpen}>
 *   <ConfirmDialogTrigger asChild>
 *     <Button variant="danger">Remove member</Button>
 *   </ConfirmDialogTrigger>
 *   <ModalPortal>
 *     <ModalOverlay />
 *     <ConfirmDialogContent
 *       title="Remove member?"
 *       tone="danger"
 *       confirmLabel="Remove"
 *       onConfirm={() => {
 *         removeMember();
 *         setOpen(false);
 *       }}
 *     >
 *       This person will lose access immediately. This can't be undone.
 *     </ConfirmDialogContent>
 *   </ModalPortal>
 * </ConfirmDialog>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/confirm-dialog
 */
export function ConfirmDialogContent({
  title,
  children,
  tone = "default",
  size = "sm",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  showClose = false,
  className,
  ...props
}: ConfirmDialogContentProps) {
  return (
    <ModalContent size={size} className={[confirmDialog(), className].filter(Boolean).join(" ")} {...props}>
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        {showClose && (
          <ModalClose asChild>
            <Button variant="ghost" size={CLOSE_SIZE[size]} aria-label="Close">
              <CloseGlyph />
            </Button>
          </ModalClose>
        )}
      </ModalHeader>
      <ModalBody>{children}</ModalBody>
      <ModalFooter>
        <ModalClose asChild>
          <Button variant="secondary" size={size}>
            {cancelLabel}
          </Button>
        </ModalClose>
        <Button variant={tone === "danger" ? "danger" : "primary"} size={size} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}
