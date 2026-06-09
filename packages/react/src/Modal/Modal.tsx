import { Ref, useEffect, useId } from "react";

import { Portal } from "../Portal";
import { Slot, composeEventHandlers, composeRefs } from "../Slot";

import { ModalProvider } from "./ModalContext";
import {
  useModalContent,
  useModalContext,
  useModalRoot,
  useModalTrigger,
} from "./hooks";
import {
  ModalCloseProps,
  ModalContentProps,
  ModalDescriptionProps,
  ModalOverlayProps,
  ModalPortalProps,
  ModalRootProps,
  ModalTitleProps,
  ModalTriggerProps,
} from "./types";

/**
 * The root of a Modal — owns open state, registers the dialog's id,
 * title id, and description id, and exposes an imperative handle for
 * opening / closing from outside the React subtree.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass {@link ModalRootProps.defaultOpen | `defaultOpen`}
 *   (or omit it for closed-on-mount). The component owns the open flag
 *   internally.
 * - **Controlled** — pass {@link ModalRootProps.open | `open`} *and*
 *   {@link ModalRootProps.onOpenChange | `onOpenChange`} together. The
 *   parent owns the flag; the component defers every state change back
 *   through the callback.
 *
 * The imperative API is exposed via `ref`:
 *
 * ```tsx
 * const ref = useRef<ModalImperativeApi>(null);
 * ref.current?.open();
 * ref.current?.close();
 * ```
 *
 * In controlled mode the imperative methods call `onOpenChange` rather
 * than flipping any internal state — the parent stays in charge.
 *
 * @example Uncontrolled
 * ```tsx
 * <Modal.Root defaultOpen>
 *   <Modal.Content>…</Modal.Content>
 * </Modal.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Modal.Root open={open} onOpenChange={setOpen}>
 *   <Modal.Trigger>Open</Modal.Trigger>
 *   <Modal.Portal>
 *     <Modal.Overlay />
 *     <Modal.Content>…</Modal.Content>
 *   </Modal.Portal>
 * </Modal.Root>
 * ```
 */
function ModalRoot({
  ref,
  children,
  defaultOpen,
  open,
  onOpenChange,
}: ModalRootProps) {
  const { contextValue } = useModalRoot(
    { defaultOpen, open, onOpenChange },
    ref,
  );

  return <ModalProvider value={contextValue}>{children}</ModalProvider>;
}

ModalRoot.displayName = "ModalRoot";

/**
 * A button that toggles the modal open. Renders a
 * `<button type="button">` with full ARIA wiring:
 *
 * - `aria-haspopup="dialog"`
 * - `aria-expanded` tracks open state
 * - `aria-controls` points at the `Modal.Content` dialog's id
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied
 * element (e.g. a router `<Link>`) with the trigger's ARIA attributes,
 * composed event handlers, and ref merged in.
 *
 * @example
 * ```tsx
 * <Modal.Trigger>Open</Modal.Trigger>
 *
 * <Modal.Trigger asChild>
 *   <Link to="/upgrade">Upgrade</Link>
 * </Modal.Trigger>
 * ```
 */
function ModalTrigger({
  onClick,
  type,
  asChild = false,
  ...rest
}: ModalTriggerProps) {
  const { getTriggerProps } = useModalTrigger(onClick, rest);

  if (asChild) {
    return <Slot {...getTriggerProps()} />;
  }

  return <button type={type ?? "button"} {...getTriggerProps()} />;
}

ModalTrigger.displayName = "ModalTrigger";

/**
 * Renders its children through `React.createPortal` so the dialog is
 * detached from wherever `Modal.Root` lives in the React tree and
 * becomes a direct child of {@link ModalPortalProps.container | `container`}
 * (default `document.body`).
 *
 * By default the portal only renders while the modal is open. Pass
 * {@link ModalPortalProps.forceMount | `forceMount`} to keep the
 * subtree in the DOM after `open` flips false — useful for CSS exit
 * animations driven by `data-state="closed"`.
 *
 * @example
 * ```tsx
 * <Modal.Portal container={document.getElementById("modal-root")!}>
 *   <Modal.Overlay />
 *   <Modal.Content>…</Modal.Content>
 * </Modal.Portal>
 * ```
 */
function ModalPortal({ children, container, forceMount }: ModalPortalProps) {
  const { open } = useModalContext();

  if (!open && !forceMount) return null;

  return <Portal container={container}>{children}</Portal>;
}

ModalPortal.displayName = "ModalPortal";

/**
 * A decorative, animation-friendly backdrop rendered as a **sibling**
 * of `Modal.Content`. It is **not** an event surface for
 * click-outside — opening a native `<dialog>` via `showModal()`
 * promotes it to the top layer with a browser-painted `::backdrop`
 * that sits *above* this overlay, so clicks on the visible backdrop
 * never reach the overlay div. Click-outside-to-close is wired on
 * the dialog itself via {@link ModalContentCallbacks.onPointerDownOutside | `onPointerDownOutside`}.
 *
 * - `aria-hidden="true"` (the backdrop is decorative).
 * - `data-state="open" | "closed"` follows the modal's open state.
 * - Consumer `onClick` (and any other event handler) is forwarded
 *   through — the overlay does not compose or intercept them.
 *
 * **`asChild` prop.** Pass `asChild` to render a consumer-supplied
 * element (e.g. a motion wrapper) with the overlay's ARIA and
 * data-state merged in.
 *
 * **`forceMount` prop.** Pass `forceMount` to keep the overlay in the
 * DOM while `open` is false so a CSS exit animation can play.
 *
 * @example
 * ```tsx
 * <Modal.Overlay />
 *
 * <Modal.Overlay asChild forceMount>
 *   <motion.div
 *     initial={{ opacity: 0 }}
 *     animate={{ opacity: 1 }}
 *     exit={{ opacity: 0 }}
 *   />
 * </Modal.Overlay>
 * ```
 */
function ModalOverlay({
  asChild = false,
  forceMount,
  ...rest
}: ModalOverlayProps) {
  const { open } = useModalContext();
  if (!open && !forceMount) return null;
  const overlayProps = {
    ...rest,
    "aria-hidden": "true" as const,
    "data-state": (open ? "open" : "closed") as "open" | "closed",
  };

  if (asChild) {
    return <Slot {...overlayProps} />;
  }

  return <div {...overlayProps} />;
}

ModalOverlay.displayName = "ModalOverlay";

/**
 * The native `<dialog>` element. React drives its `showModal()` and
 * `close()` calls in response to `open` state changes, letting the
 * browser own focus trapping, inert background, top-layer rendering,
 * and the `Esc` key.
 *
 * **ARIA wiring.** `aria-labelledby` and `aria-describedby` are set
 * automatically when `Modal.Title` and `Modal.Description` are rendered
 * as descendants. The dialog has an implicit `role="dialog"` — do not
 * pass one explicitly (WCAG redundancy rule).
 *
 * **Escape hatches.**
 * - {@link ModalContentCallbacks.onEscapeKeyDown | `onEscapeKeyDown`}
 *   fires on the native `cancel` event (Esc). Consumers can
 *   `event.preventDefault()` to keep the modal open.
 * - {@link ModalContentCallbacks.onPointerDownOutside | `onPointerDownOutside`}
 *   fires on a `pointerdown` whose coordinates land outside the
 *   dialog's bounding rect — i.e. on the native `::backdrop`. Consumers
 *   can `event.preventDefault()` to keep the modal open. The native
 *   `PointerEvent` is passed through, not a synthetic React event.
 *
 * **`asChild` is intentionally not supported.** The native dialog
 * primitive is what provides the focus trap and the inert background;
 * swapping it for a `<div>` would break both.
 *
 * **Styling hook.** `data-state="open" | "closed"` on the dialog.
 *
 * @example
 * ```tsx
 * <Modal.Content
 *   onEscapeKeyDown={(event) => {
 *     if (hasUnsavedChanges) event.preventDefault();
 *   }}
 * >
 *   …
 * </Modal.Content>
 * ```
 */
function ModalContent({
  children,
  id,
  onEscapeKeyDown,
  onPointerDownOutside,
  ref: externalRef,
  ...rest
}: ModalContentProps & { ref?: Ref<HTMLDialogElement> }) {
  const { ref: innerRef, open, contentId } = useModalContent();
  const { contentCallbacksRef, titleId, descriptionId } = useModalContext();
  // Keep the ref pointed at the latest callbacks so event handlers wired
  // through context (dialog pointerdown, native cancel) always see the most
  // recent consumer props across re-renders.
  contentCallbacksRef.current = { onEscapeKeyDown, onPointerDownOutside };
  const composedRef = externalRef
    ? composeRefs(innerRef, externalRef)
    : innerRef;

  return (
    <dialog
      ref={composedRef}
      id={id ?? contentId}
      data-state={open ? "open" : "closed"}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      {...rest}
    >
      {children}
    </dialog>
  );
}

ModalContent.displayName = "ModalContent";

/**
 * The dialog's accessible name. Renders an `<h2>` by default and
 * auto-registers its generated id with `Modal.Root` so
 * `Modal.Content` can wire it up as `aria-labelledby`.
 *
 * Pass `asChild` to render the consumer's own heading element (e.g.
 * an `<h3>` for a nested dialog or a styled heading component); the
 * id is still registered.
 *
 * @example
 * ```tsx
 * <Modal.Title>Payment</Modal.Title>
 *
 * <Modal.Title asChild>
 *   <h3>Nested section</h3>
 * </Modal.Title>
 * ```
 */
function ModalTitle({ children, asChild = false, ...rest }: ModalTitleProps) {
  const { registerTitle } = useModalContext();
  const id = useId();

  useEffect(() => {
    registerTitle(id);
    return () => registerTitle(undefined);
  }, [registerTitle, id]);

  if (asChild) {
    return (
      <Slot id={id} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <h2 id={id} {...rest}>
      {children}
    </h2>
  );
}

ModalTitle.displayName = "ModalTitle";

/**
 * The dialog's accessible description. Renders a `<p>` by default and
 * auto-registers its generated id with `Modal.Root` so
 * `Modal.Content` can wire it up as `aria-describedby`.
 *
 * Pass `asChild` to render any consumer-supplied element; the id is
 * still registered.
 *
 * @example
 * ```tsx
 * <Modal.Description>
 *   Enter your card details below. You can change your plan later.
 * </Modal.Description>
 * ```
 */
function ModalDescription({
  children,
  asChild = false,
  ...rest
}: ModalDescriptionProps) {
  const { registerDescription } = useModalContext();
  const id = useId();

  useEffect(() => {
    registerDescription(id);
    return () => registerDescription(undefined);
  }, [registerDescription, id]);

  if (asChild) {
    return (
      <Slot id={id} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <p id={id} {...rest}>
      {children}
    </p>
  );
}

ModalDescription.displayName = "ModalDescription";

/**
 * A button that closes the modal. Renders a `<button type="button">`
 * whose `onClick` is composed with `setOpen(false)` — consumer
 * handlers run first and can `event.preventDefault()` to veto closing.
 *
 * **`asChild` prop.** Pass `asChild` to render any element (e.g. a
 * text link or an icon-only `<button>` of your own) with the close
 * behaviour merged in.
 *
 * @example
 * ```tsx
 * <Modal.Close>Cancel</Modal.Close>
 *
 * <Modal.Close asChild>
 *   <IconButton aria-label="Close" icon={<XIcon />} />
 * </Modal.Close>
 * ```
 */
function ModalClose({ onClick, asChild = false, ...rest }: ModalCloseProps) {
  const { setOpen } = useModalContext();
  const closeProps = {
    ...rest,
    onClick: composeEventHandlers(onClick, () => setOpen(false)),
  };

  if (asChild) {
    return <Slot {...closeProps} />;
  }

  return <button type="button" {...closeProps} />;
}

ModalClose.displayName = "ModalClose";

type ModalCompound = typeof ModalRoot & {
  Root: typeof ModalRoot;
  Trigger: typeof ModalTrigger;
  Portal: typeof ModalPortal;
  Overlay: typeof ModalOverlay;
  Content: typeof ModalContent;
  Title: typeof ModalTitle;
  Description: typeof ModalDescription;
  Close: typeof ModalClose;
};

/**
 * Headless, accessible **Modal** — a compound component built on the
 * native `<dialog>` element and its `showModal()` API. Implements the
 * [WAI-ARIA Modal Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
 * with zero styles.
 *
 * `Modal` is both callable (it's an alias of {@link ModalRoot | `Modal.Root`})
 * and carries its sub-components as static properties. Prefer the
 * namespaced form in application code for readability and grep-ability.
 *
 * - {@link ModalRoot | `Modal.Root`} — state owner, context provider, imperative API holder.
 * - {@link ModalTrigger | `Modal.Trigger`} — `<button>` that opens the modal.
 * - {@link ModalPortal | `Modal.Portal`} — `createPortal` wrapper with `container` + `forceMount`.
 * - {@link ModalOverlay | `Modal.Overlay`} — click-outside backdrop sibling of the dialog.
 * - {@link ModalContent | `Modal.Content`} — native `<dialog>` with escape hatches and auto-ARIA.
 * - {@link ModalTitle | `Modal.Title`} — accessible name; auto-wires `aria-labelledby`.
 * - {@link ModalDescription | `Modal.Description`} — auto-wires `aria-describedby`.
 * - {@link ModalClose | `Modal.Close`} — `<button>` that closes the modal.
 *
 * @example Minimal usage
 * ```tsx
 * import { Modal } from "@primitiv-ui/react";
 *
 * <Modal.Root>
 *   <Modal.Trigger>Open</Modal.Trigger>
 *   <Modal.Portal>
 *     <Modal.Overlay />
 *     <Modal.Content>
 *       <Modal.Title>Payment</Modal.Title>
 *       <Modal.Description>Enter your card details</Modal.Description>
 *       <Modal.Close>Cancel</Modal.Close>
 *     </Modal.Content>
 *   </Modal.Portal>
 * </Modal.Root>;
 * ```
 *
 * @example Scroll lock (CSS only)
 * ```css
 * html:has(dialog[open]) { overflow: hidden; }
 * ```
 *
 * @see {@link ModalRoot} for state modes and the imperative API.
 * @see {@link ModalContent} for the escape hatches and ARIA auto-wiring.
 * @see {@link ModalOverlay} for the click-outside contract.
 */
const ModalCompound: ModalCompound = Object.assign(ModalRoot, {
  Root: ModalRoot,
  Trigger: ModalTrigger,
  Portal: ModalPortal,
  Overlay: ModalOverlay,
  Content: ModalContent,
  Title: ModalTitle,
  Description: ModalDescription,
  Close: ModalClose,
});

ModalCompound.displayName = "Modal";

export { ModalCompound as Modal };
