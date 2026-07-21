import {
  ComponentProps,
  HTMLAttributes,
  ReactNode,
  Ref,
  RefObject,
} from "react";

/**
 * Imperative handle exposed on `Modal.Root`'s `ref`, letting callers open
 * and close the modal programmatically from outside the React subtree.
 *
 * In controlled mode these methods defer to `onOpenChange` rather than
 * flipping any internal state — the parent stays the source of truth.
 */
export type ModalImperativeApi = {
  /** Opens the modal (uncontrolled: sets open; controlled: calls `onOpenChange(true)`). */
  open: () => void;
  /** Closes the modal (uncontrolled: clears open; controlled: calls `onOpenChange(false)`). */
  close: () => void;
};

/**
 * Optional escape-hatch callbacks accepted by
 * {@link ModalContentProps | `Modal.Content`} for intercepting the two
 * dismissal gestures the browser drives on a native `<dialog>`. Both receive
 * the raw native event (not a synthetic React event).
 */
export type ModalContentCallbacks = {
  /**
   * Fires on the dialog's native `cancel` event when the user presses
   * Escape. Call `event.preventDefault()` to veto closing and keep the
   * modal open (e.g. to confirm unsaved changes first).
   */
  onEscapeKeyDown?: (event: Event) => void;
  /**
   * Fires on a `pointerdown` whose coordinates land outside the dialog's
   * bounding rect — i.e. on the browser-painted `::backdrop`. Call
   * `event.preventDefault()` to veto closing and keep the modal open.
   */
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

/**
 * Props for `Modal.Content` — every native `<dialog>` attribute plus the
 * two {@link ModalContentCallbacks | dismissal callbacks}. `asChild` is
 * intentionally absent: the native `<dialog>` is what supplies the inert
 * background, top-layer stacking, and the Tab-wrap focus trap, so it cannot
 * be swapped for another element.
 */
export type ModalContentProps = ComponentProps<"dialog"> &
  ModalContentCallbacks;

/**
 * `Modal.Root` props for the **uncontrolled** (self-managed) open state.
 * The component owns the open flag internally. Mutually exclusive with
 * {@link ControlledModalRootProps}.
 */
export type UncontrolledModalRootProps = {
  /**
   * Whether the modal is open on first render. The component owns the flag
   * from then on. Omit for closed-on-mount.
   * @default false
   */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultOpen` instead. */
  open?: never;
  /**
   * Called with the new open state whenever it changes (open or close).
   * Optional in uncontrolled mode — useful purely to observe transitions.
   */
  onOpenChange?: (open: boolean) => void;
};

/**
 * `Modal.Root` props for the **controlled** open state. The parent owns the
 * flag and must keep it in sync via `onOpenChange`. Mutually exclusive with
 * {@link UncontrolledModalRootProps}.
 */
export type ControlledModalRootProps = {
  /** The current open state. Must be kept in sync by the parent via `onOpenChange`. */
  open: boolean;
  /**
   * Called with the requested open state whenever the modal wants to open or
   * close (trigger click, Close button, Esc, click-outside, imperative API).
   * Required in controlled mode.
   */
  onOpenChange: (open: boolean) => void;
  /** Forbidden in controlled mode — use `open` instead. */
  defaultOpen?: never;
};

/**
 * Props for {@link ModalRoot | `Modal.Root`}, in either the controlled or
 * uncontrolled mode — resolves to
 * {@link UncontrolledModalRootProps} | {@link ControlledModalRootProps}, so
 * TypeScript accepts only one shape at a time.
 */
export type ModalRootProps = {
  /** The modal's sub-components (Trigger, Portal, Overlay, Content, …). */
  children?: ReactNode;
} & (UncontrolledModalRootProps | ControlledModalRootProps) & {
    /** Ref receiving the imperative {@link ModalImperativeApi | open/close handle}. */
    ref?: Ref<ModalImperativeApi>;
  };

/** Props for `Modal.Trigger` — a `<button>` that opens the modal. */
export type ModalTriggerProps = ComponentProps<"button"> & {
  /**
   * Render into the consumer's own element (e.g. a router `<Link>`) instead
   * of the default `<button>`, merging the trigger's ARIA wiring, composed
   * event handlers, and ref onto it via the Slot pattern.
   * @default false
   */
  asChild?: boolean;
};

/** Props for `Modal.Close` — a `<button>` that closes the modal. */
export type ModalCloseProps = ComponentProps<"button"> & {
  /**
   * Render into the consumer's own element (e.g. an icon-only button)
   * instead of the default `<button>`, merging the close behaviour in. The
   * consumer's `onClick` runs first and can `event.preventDefault()` to veto.
   * @default false
   */
  asChild?: boolean;
};

/** Props for `Modal.Portal` — renders its children into `container`. */
export type ModalPortalProps = {
  /** The dialog subtree to portal — typically `Modal.Overlay` + `Modal.Content`. */
  children?: ReactNode;
  /**
   * Target element to portal into.
   * @default document.body
   */
  container?: HTMLElement;
  /**
   * Keep the portalled subtree mounted after `open` flips false, so a CSS
   * exit animation keyed off `data-state="closed"` can play. Without it the
   * portal unmounts as soon as the modal closes.
   * @default false
   */
  forceMount?: boolean;
};

/** Props for `Modal.Overlay` — the animation-friendly backdrop sibling. */
export type ModalOverlayProps = ComponentProps<"div"> & {
  /**
   * Render into the consumer's own element (e.g. a motion wrapper) instead of
   * the default `<div>`, merging the overlay's `aria-hidden` and `data-state`
   * onto it via the Slot pattern.
   * @default false
   */
  asChild?: boolean;
  /**
   * Keep the overlay mounted after `open` flips false so a CSS fade-out can
   * play. Without it the overlay unmounts as soon as the modal closes.
   * @default false
   */
  forceMount?: boolean;
};

/** Props for `Modal.Title` — supplies the dialog's accessible name (`aria-labelledby`). */
export type ModalTitleProps = HTMLAttributes<HTMLElement> & {
  /**
   * Render into the consumer's own heading element (e.g. an `<h3>` for a
   * nested dialog) instead of the default `<h2>`; the generated id is still
   * registered for `aria-labelledby`.
   * @default false
   */
  asChild?: boolean;
};

/** Props for `Modal.Description` — supplies the dialog's accessible description (`aria-describedby`). */
export type ModalDescriptionProps = HTMLAttributes<HTMLElement> & {
  /**
   * Render into the consumer's own element instead of the default `<p>`; the
   * generated id is still registered for `aria-describedby`.
   * @default false
   */
  asChild?: boolean;
};
