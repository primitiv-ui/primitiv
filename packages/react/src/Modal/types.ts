import {
  ComponentProps,
  HTMLAttributes,
  ReactNode,
  Ref,
  RefObject,
} from "react";

/**
 * Imperative handle exposed on `Modal.Root`'s `ref`, letting callers open
 * and close the modal programmatically.
 */
export type ModalImperativeApi = {
  /** Opens the modal. */
  open: () => void;
  /** Closes the modal. */
  close: () => void;
};

/**
 * Optional escape-hatch callbacks accepted by `Modal.Content` for
 * intercepting dismissal gestures.
 */
export type ModalContentCallbacks = {
  /** Fires when the user presses Escape; call `preventDefault` to keep the modal open. */
  onEscapeKeyDown?: (event: Event) => void;
  /** Fires on a pointer-down outside the content; call `preventDefault` to keep the modal open. */
  onPointerDownOutside?: (event: PointerEvent) => void;
};

/**
 * Shared context value published by `Modal.Root` and consumed by every
 * sub-component to coordinate open state, ids, and ARIA wiring.
 */
export type ModalContextValue = {
  /** Whether the modal is currently open. */
  open: boolean;
  /** Sets the open state. */
  setOpen: (open: boolean) => void;
  /** Generated id of the dialog content element. */
  contentId: string;
  /** Mutable ref holding the current content callbacks. */
  contentCallbacksRef: RefObject<ModalContentCallbacks>;
  /** Id of the registered title, or `undefined` when none is rendered. */
  titleId: string | undefined;
  /** Id of the registered description, or `undefined` when none is rendered. */
  descriptionId: string | undefined;
  /** Registers (or clears) the title id for `aria-labelledby`. */
  registerTitle: (id: string | undefined) => void;
  /** Registers (or clears) the description id for `aria-describedby`. */
  registerDescription: (id: string | undefined) => void;
};

/** Props for `Modal.Content` — native `<dialog>` props plus dismissal callbacks. */
export type ModalContentProps = ComponentProps<"dialog"> &
  ModalContentCallbacks;

/** `Modal.Root` props for the uncontrolled (self-managed) open state. */
export type UncontrolledModalRootProps = {
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  open?: never;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
};

/** `Modal.Root` props for the controlled open state. */
export type ControlledModalRootProps = {
  /** Controlled open state. */
  open: boolean;
  /** Called whenever the modal requests an open-state change. */
  onOpenChange: (open: boolean) => void;
  defaultOpen?: never;
};

/** Props for `Modal.Root`, in either the controlled or uncontrolled mode. */
export type ModalRootProps = {
  /** Modal sub-components. */
  children?: ReactNode;
} & (UncontrolledModalRootProps | ControlledModalRootProps) & {
    /** Ref receiving the imperative open/close handle. */
    ref?: Ref<ModalImperativeApi>;
  };

/** Props for `Modal.Trigger` — a `<button>` that opens the modal. */
export type ModalTriggerProps = ComponentProps<"button"> & {
  /** Render into the consumer's own element instead of a `<button>`. */
  asChild?: boolean;
};

/** Props for `Modal.Close` — a `<button>` that closes the modal. */
export type ModalCloseProps = ComponentProps<"button"> & {
  /** Render into the consumer's own element instead of a `<button>`. */
  asChild?: boolean;
};

/** Props for `Modal.Portal` — renders its children into `container`. */
export type ModalPortalProps = {
  /** Content to portal. */
  children?: ReactNode;
  /** Target element to portal into. Defaults to `document.body`. */
  container?: HTMLElement;
  /** Keep the portal mounted even while the modal is closed. */
  forceMount?: boolean;
};

/** Props for `Modal.Overlay` — the click-outside backdrop. */
export type ModalOverlayProps = ComponentProps<"div"> & {
  /** Render into the consumer's own element instead of a `<div>`. */
  asChild?: boolean;
  /** Keep the overlay mounted even while the modal is closed. */
  forceMount?: boolean;
};

/** Props for `Modal.Title` — supplies the dialog's accessible name. */
export type ModalTitleProps = HTMLAttributes<HTMLElement> & {
  /** Render into the consumer's own element instead of an `<h2>`. */
  asChild?: boolean;
};

/** Props for `Modal.Description` — supplies the dialog's accessible description. */
export type ModalDescriptionProps = HTMLAttributes<HTMLElement> & {
  /** Render into the consumer's own element instead of a `<p>`. */
  asChild?: boolean;
};
