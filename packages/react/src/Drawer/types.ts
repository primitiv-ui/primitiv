import type { Ref } from "react";

import type {
  ModalCloseProps,
  ModalContentProps,
  ModalDescriptionProps,
  ModalImperativeApi,
  ModalOverlayProps,
  ModalPortalProps,
  ModalRootProps,
  ModalTitleProps,
  ModalTriggerProps,
} from "../Modal/types";

/**
 * Which edge the drawer slides in from.
 *
 * - `"top"` / `"bottom"` — a horizontal sheet spanning the viewport width.
 * - `"left"` / `"right"` — a vertical panel spanning the viewport height.
 */
export type DrawerSide = "top" | "right" | "bottom" | "left";

/**
 * Imperative handle exposed on `Drawer.Root`'s `ref`, letting callers open
 * and close the drawer programmatically. Behaviour is inherited from
 * {@link ModalImperativeApi | Modal} — a drawer is a Modal that slides from an edge.
 */
export type DrawerImperativeApi = ModalImperativeApi;

/** Props for `Drawer.Root`, in either the controlled or uncontrolled mode. */
export type DrawerRootProps = ModalRootProps;

/** Props for `Drawer.Trigger` — a `<button>` that opens the drawer. */
export type DrawerTriggerProps = ModalTriggerProps;

/** Props for `Drawer.Portal` — renders its children into `container`. */
export type DrawerPortalProps = ModalPortalProps;

/** Props for `Drawer.Overlay` — the click-outside backdrop. */
export type DrawerOverlayProps = ModalOverlayProps;

/** Props for `Drawer.Title` — supplies the drawer's accessible name. */
export type DrawerTitleProps = ModalTitleProps;

/** Props for `Drawer.Description` — supplies the drawer's accessible description. */
export type DrawerDescriptionProps = ModalDescriptionProps;

/** Props for `Drawer.Close` — a `<button>` that closes the drawer. */
export type DrawerCloseProps = ModalCloseProps;

/**
 * Props for `Drawer.Content` — the native `<dialog>` props plus the
 * drawer-specific {@link DrawerContentProps.side | `side`} axis.
 */
export type DrawerContentProps = ModalContentProps & {
  /** Ref to the underlying native `<dialog>` element. */
  ref?: Ref<HTMLDialogElement>;
  /**
   * Which edge the drawer slides in from. Emitted verbatim as `data-side`
   * on the `<dialog>`, which the styled layer keys off to position and
   * animate the panel against that edge. Purely presentational — it does
   * not change any behaviour, focus, or ARIA.
   * @default "right"
   */
  side?: DrawerSide;
};
