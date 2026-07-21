import type { ReactElement } from "react";

import { Modal } from "../Modal/index.ts";
import type {
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerOverlayProps,
  DrawerPortalProps,
  DrawerRootProps,
  DrawerTitleProps,
  DrawerTriggerProps,
} from "./types";

/**
 * The root of a Drawer — owns open state, registers the dialog's id,
 * title id, and description id, and exposes an imperative handle for
 * opening / closing from outside the React subtree.
 *
 * A Drawer *is* a {@link Modal | Modal} that slides in from a screen edge, so
 * `Drawer.Root` delegates its entire behaviour to `Modal.Root`: the two
 * state modes (uncontrolled `defaultOpen` vs. controlled `open` +
 * `onOpenChange`, statically discriminated at the type level) and the
 * imperative open/close API are identical.
 *
 * @example Uncontrolled
 * ```tsx
 * <Drawer.Root defaultOpen>
 *   <Drawer.Content>…</Drawer.Content>
 * </Drawer.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Drawer.Root open={open} onOpenChange={setOpen}>
 *   <Drawer.Trigger>Open</Drawer.Trigger>
 *   <Drawer.Portal>
 *     <Drawer.Overlay />
 *     <Drawer.Content side="right">…</Drawer.Content>
 *   </Drawer.Portal>
 * </Drawer.Root>
 * ```
 */
function DrawerRoot(props: DrawerRootProps): ReactElement {
  return <Modal.Root {...props} />;
}

DrawerRoot.displayName = "DrawerRoot";

/**
 * A button that toggles the drawer open. Renders a
 * `<button type="button">` with full ARIA wiring inherited from
 * `Modal.Trigger`:
 *
 * - `aria-haspopup="dialog"`
 * - `aria-expanded` tracks open state
 * - `aria-controls` points at the `Drawer.Content` dialog's id
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied
 * element (e.g. a router `<Link>`) with the trigger's ARIA attributes,
 * composed event handlers, and ref merged in.
 *
 * @extends HTMLButtonElement
 *
 * @example
 * ```tsx
 * <Drawer.Trigger>Open menu</Drawer.Trigger>
 *
 * <Drawer.Trigger asChild>
 *   <Link to="/cart">Cart</Link>
 * </Drawer.Trigger>
 * ```
 */
function DrawerTrigger(props: DrawerTriggerProps): ReactElement {
  return <Modal.Trigger {...props} />;
}

DrawerTrigger.displayName = "DrawerTrigger";

/**
 * Renders its children through `React.createPortal` so the drawer is
 * detached from wherever `Drawer.Root` lives in the React tree and becomes
 * a direct child of `container` (default `document.body`).
 *
 * By default the portal only renders while the drawer is open. Pass
 * `forceMount` to keep the subtree in the DOM after `open` flips false —
 * useful for the CSS slide-out animation driven by `data-state="closed"`.
 *
 * @example
 * ```tsx
 * <Drawer.Portal container={document.getElementById("drawer-root")!}>
 *   <Drawer.Overlay />
 *   <Drawer.Content>…</Drawer.Content>
 * </Drawer.Portal>
 * ```
 */
function DrawerPortal(props: DrawerPortalProps): ReactElement {
  return <Modal.Portal {...props} />;
}

DrawerPortal.displayName = "DrawerPortal";

/**
 * A decorative, animation-friendly backdrop rendered as a **sibling** of
 * `Drawer.Content`. Like `Modal.Overlay` it is **not** the click-outside
 * event surface — opening the native `<dialog>` via `showModal()` promotes
 * it to the top layer with a browser-painted `::backdrop` above this
 * overlay, so click-outside-to-close is wired on the dialog itself via
 * `onPointerDownOutside`.
 *
 * - `aria-hidden="true"` (the backdrop is decorative).
 * - `data-state="open" | "closed"` follows the drawer's open state.
 *
 * **`asChild` prop.** Pass `asChild` to render a consumer-supplied element
 * (e.g. a motion wrapper) with the overlay's ARIA and data-state merged in.
 *
 * **`forceMount` prop.** Pass `forceMount` to keep the overlay in the DOM
 * while `open` is false so a CSS fade-out can play.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Drawer.Overlay />
 * ```
 */
function DrawerOverlay(props: DrawerOverlayProps): ReactElement {
  return <Modal.Overlay {...props} />;
}

DrawerOverlay.displayName = "DrawerOverlay";

/**
 * The native `<dialog>` element — the sliding panel. Behaviour is
 * `Modal.Content`'s: React drives `showModal()` / `close()` in response to
 * open state, so the browser owns the inert background, the top layer, and
 * the `Esc` key, while the same JS `Tab`-wrap focus trap (last ⇄ first)
 * applies — inherited from `Modal.Content`. `aria-labelledby` /
 * `aria-describedby` are wired automatically from `Drawer.Title` /
 * `Drawer.Description`, and the `onEscapeKeyDown` / `onPointerDownOutside`
 * escape hatches pass straight through.
 *
 * **The one drawer-specific addition —
 * {@link DrawerContentProps.side | `side`}.** Which edge the panel slides in
 * from (`"top" | "right" | "bottom" | "left"`, default `"right"`). It is
 * emitted verbatim as `data-side` on the dialog for the styled layer to
 * position and animate against; it changes no behaviour, focus, or ARIA.
 *
 * **`asChild` is intentionally not supported** (as with `Modal.Content`) —
 * the native dialog is what provides the inert background and top layer (and
 * hosts the inherited Tab-wrap focus trap).
 *
 * **Styling hooks.** `data-state="open" | "closed"` and
 * `data-side="top|right|bottom|left"` on the dialog.
 *
 * @extends HTMLDialogElement
 *
 * @example Right-hand drawer (default)
 * ```tsx
 * <Drawer.Content>…</Drawer.Content>
 * ```
 *
 * @example Bottom sheet
 * ```tsx
 * <Drawer.Content side="bottom">…</Drawer.Content>
 * ```
 */
function DrawerContent({
  side = "right",
  ...rest
}: DrawerContentProps): ReactElement {
  // `side` is stripped from the props and re-emitted as `data-side` on the
  // native <dialog> (Modal.Content forwards unrecognised props through its own
  // `...rest`), giving the styled layer its positioning hook.
  return <Modal.Content {...rest} data-side={side} />;
}

DrawerContent.displayName = "DrawerContent";

/**
 * The drawer's accessible name. Renders an `<h2>` by default and
 * auto-registers its generated id so `Drawer.Content` can wire it up as
 * `aria-labelledby` (via `Modal.Title`).
 *
 * Pass `asChild` to render the consumer's own heading element; the id is
 * still registered.
 *
 * @extends HTMLHeadingElement
 *
 * @example
 * ```tsx
 * <Drawer.Title>Filters</Drawer.Title>
 * ```
 */
function DrawerTitle(props: DrawerTitleProps): ReactElement {
  return <Modal.Title {...props} />;
}

DrawerTitle.displayName = "DrawerTitle";

/**
 * The drawer's accessible description. Renders a `<p>` by default and
 * auto-registers its generated id so `Drawer.Content` can wire it up as
 * `aria-describedby` (via `Modal.Description`).
 *
 * Pass `asChild` to render any consumer-supplied element; the id is still
 * registered.
 *
 * @extends HTMLParagraphElement
 *
 * @example
 * ```tsx
 * <Drawer.Description>Narrow the results below.</Drawer.Description>
 * ```
 */
function DrawerDescription(props: DrawerDescriptionProps): ReactElement {
  return <Modal.Description {...props} />;
}

DrawerDescription.displayName = "DrawerDescription";

/**
 * A button that closes the drawer. Renders a `<button type="button">`
 * whose `onClick` is composed with the close action (via `Modal.Close`) —
 * consumer handlers run first and can `event.preventDefault()` to veto.
 *
 * **`asChild` prop.** Pass `asChild` to render any element (e.g. an
 * icon-only button of your own) with the close behaviour merged in.
 *
 * @extends HTMLButtonElement
 *
 * @example
 * ```tsx
 * <Drawer.Close>Done</Drawer.Close>
 *
 * <Drawer.Close asChild>
 *   <IconButton aria-label="Close" icon={<XIcon />} />
 * </Drawer.Close>
 * ```
 */
function DrawerClose(props: DrawerCloseProps): ReactElement {
  return <Modal.Close {...props} />;
}

DrawerClose.displayName = "DrawerClose";

/** @internal */
type DrawerCompound = typeof DrawerRoot & {
  Root: typeof DrawerRoot;
  Trigger: typeof DrawerTrigger;
  Portal: typeof DrawerPortal;
  Overlay: typeof DrawerOverlay;
  Content: typeof DrawerContent;
  Title: typeof DrawerTitle;
  Description: typeof DrawerDescription;
  Close: typeof DrawerClose;
};

/**
 * Headless, accessible **Drawer** — a Modal dialog that slides in from a
 * screen edge. It reuses {@link Modal | Modal}'s native-`<dialog>` machinery
 * wholesale (focus trap, inert background, top layer, `Esc`, click-outside,
 * controlled / uncontrolled state, the imperative API), adding a single
 * presentational axis: {@link DrawerContentProps.side | `side`} on
 * `Drawer.Content`, emitted as `data-side` for the styled layer to slide the
 * panel from `top` / `right` / `bottom` / `left`.
 *
 * `Drawer` is both callable (an alias of {@link DrawerRoot | `Drawer.Root`})
 * and carries its sub-components as static properties.
 *
 * - {@link DrawerRoot | `Drawer.Root`} — state owner, context provider, imperative API holder.
 * - {@link DrawerTrigger | `Drawer.Trigger`} — `<button>` that opens the drawer.
 * - {@link DrawerPortal | `Drawer.Portal`} — `createPortal` wrapper with `container` + `forceMount`.
 * - {@link DrawerOverlay | `Drawer.Overlay`} — click-outside backdrop sibling of the dialog.
 * - {@link DrawerContent | `Drawer.Content`} — native `<dialog>` with the `side` axis and auto-ARIA.
 * - {@link DrawerTitle | `Drawer.Title`} — accessible name; auto-wires `aria-labelledby`.
 * - {@link DrawerDescription | `Drawer.Description`} — auto-wires `aria-describedby`.
 * - {@link DrawerClose | `Drawer.Close`} — `<button>` that closes the drawer.
 *
 * @example Minimal usage
 * ```tsx
 * import { Drawer } from "@primitiv-ui/react";
 *
 * <Drawer.Root>
 *   <Drawer.Trigger>Open</Drawer.Trigger>
 *   <Drawer.Portal>
 *     <Drawer.Overlay />
 *     <Drawer.Content side="right">
 *       <Drawer.Title>Filters</Drawer.Title>
 *       <Drawer.Description>Narrow the results below.</Drawer.Description>
 *       <Drawer.Close>Done</Drawer.Close>
 *     </Drawer.Content>
 *   </Drawer.Portal>
 * </Drawer.Root>;
 * ```
 *
 * @see {@link Modal} for the shared dialog behaviour, state modes, and imperative API.
 * @see {@link DrawerContent} for the `side` axis and the styling hooks.
 */
const DrawerCompound: DrawerCompound = Object.assign(DrawerRoot, {
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Portal: DrawerPortal,
  Overlay: DrawerOverlay,
  Content: DrawerContent,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Close: DrawerClose,
});

DrawerCompound.displayName = "Drawer";

export { DrawerCompound as Drawer };
