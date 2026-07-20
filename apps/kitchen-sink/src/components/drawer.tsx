import "../styles/primitiv/drawer/styles.css";
/*
 * Drawer — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * A Drawer *is* a Modal that slides in from a screen edge, so this wraps the
 * headless Drawer primitive (itself a thin composition over Modal + a `side`
 * axis). Like Modal, Drawer.Root and Drawer.Portal are pure pass-throughs that
 * take no className (Root is a context provider with no DOM; Portal is a
 * createPortal wrapper), so the className-on-every-part generator would emit
 * invalid props — hence hand-authored. The styled parts (Overlay, Content,
 * Title, Description, Close) follow the generated shape against drawer.recipe.ts;
 * Root, Trigger, and Portal forward their props unchanged. Header, Body, and
 * Footer are styled-surface-only layout containers (plain <div>s, no headless
 * equivalent) mirroring the Modal anatomy. The one drawer-specific axis is
 * `side` on Content — it passes straight through to the headless, which emits it
 * as `data-side` for the stylesheet to position + slide against. Keep
 * contract.json + the stylesheet + this file in sync by hand.
 */
import { Drawer as DrawerPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import {
  drawer,
  drawerOverlay,
  drawerHeader,
  drawerBody,
  drawerFooter,
  drawerTitle,
  drawerDescription,
  drawerClose,
} from "./drawer.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * An accessible drawer — a Modal dialog that slides in from a screen edge.
 *
 * @see https://primitiv-ui.dev/docs/components/drawer
 */
export type DrawerProps = ComponentPropsWithRef<typeof DrawerPrimitive.Root>;

export function Drawer(props: DrawerProps) {
  return <DrawerPrimitive.Root {...props} />;
}

export type DrawerTriggerProps = ComponentPropsWithRef<typeof DrawerPrimitive.Trigger>;

export function DrawerTrigger(props: DrawerTriggerProps) {
  return <DrawerPrimitive.Trigger {...props} />;
}

export type DrawerPortalProps = ComponentPropsWithRef<typeof DrawerPrimitive.Portal>;

export function DrawerPortal(props: DrawerPortalProps) {
  return <DrawerPrimitive.Portal {...props} />;
}

export type DrawerOverlayProps = ComponentPropsWithRef<typeof DrawerPrimitive.Overlay>;

export function DrawerOverlay({ className, ...props }: DrawerOverlayProps) {
  return <DrawerPrimitive.Overlay className={[drawerOverlay(), className].filter(Boolean).join(" ")} {...props} />;
}

export type DrawerContentProps = DistributiveOmit<ComponentPropsWithRef<typeof DrawerPrimitive.Content>, "size"> & {
  /**
   * Panel extent along its cross axis — width for a left/right drawer, height for
   * a top/bottom sheet; `data-density` scales the padding within each size.
   * - `sm` — Small (320px cross axis).
   * - `md` — Medium (384px, the default).
   * - `lg` — Large (480px).
   * - `xl` — Extra large (576px).
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/drawer
   */
  size?: "sm" | "md" | "lg" | "xl";
};

/**
 * The sliding panel — the native `<dialog>`. Combines the styled `size` axis
 * (cross-axis extent, applied as a modifier class) with the headless `side` axis
 * (`"top" | "right" | "bottom" | "left"`, default `"right"`), which passes
 * through unchanged and is emitted as `data-side` for the stylesheet to dock the
 * panel to that edge and slide it in from off-screen.
 *
 * @see https://primitiv-ui.dev/docs/components/drawer
 */
export function DrawerContent({ size, className, ...props }: DrawerContentProps) {
  return <DrawerPrimitive.Content className={[drawer({ size }), className].filter(Boolean).join(" ")} {...props} />;
}

/**
 * The drawer's top region — a `<div>` holding the {@link DrawerTitle} and the
 * close affordance, with a divider beneath it. Lay out `DrawerTitle` then the
 * close (a ghost `Button` wrapping a `Close` icon via `DrawerClose asChild`); the
 * row spaces them apart.
 *
 * @see https://primitiv-ui.dev/docs/components/drawer
 */
export type DrawerHeaderProps = ComponentPropsWithRef<"div">;

export function DrawerHeader({ className, ...props }: DrawerHeaderProps) {
  return <div className={[drawerHeader(), className].filter(Boolean).join(" ")} {...props} />;
}

/**
 * The drawer's content region — a padded, scrollable `<div>` for the
 * {@link DrawerDescription} and the body content (forms, lists, copy). It takes
 * the remaining space and scrolls when the content overflows, so the header and
 * footer stay pinned. Stacks its children with the drawer gap.
 *
 * @see https://primitiv-ui.dev/docs/components/drawer
 */
export type DrawerBodyProps = ComponentPropsWithRef<"div">;

export function DrawerBody({ className, ...props }: DrawerBodyProps) {
  return <div className={[drawerBody(), className].filter(Boolean).join(" ")} {...props} />;
}

/**
 * The drawer's action region — a `<div>` with a divider above it that
 * right-aligns its children. Place the dismiss action (a secondary `Button`
 * wrapped in `DrawerClose asChild`) then the confirm action (a primary `Button`).
 *
 * @see https://primitiv-ui.dev/docs/components/drawer
 */
export type DrawerFooterProps = ComponentPropsWithRef<"div">;

export function DrawerFooter({ className, ...props }: DrawerFooterProps) {
  return <div className={[drawerFooter(), className].filter(Boolean).join(" ")} {...props} />;
}

export type DrawerTitleProps = ComponentPropsWithRef<typeof DrawerPrimitive.Title>;

export function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return <DrawerPrimitive.Title className={[drawerTitle(), className].filter(Boolean).join(" ")} {...props} />;
}

export type DrawerDescriptionProps = ComponentPropsWithRef<typeof DrawerPrimitive.Description>;

export function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return <DrawerPrimitive.Description className={[drawerDescription(), className].filter(Boolean).join(" ")} {...props} />;
}

/**
 * Closes the drawer. A bare `<DrawerClose>text</DrawerClose>` renders a frameless
 * button, but the canonical header close — matching the Modal design — composes a
 * ghost `Button` wrapping a `Close` icon via `asChild`, with an `aria-label`:
 *
 * ```tsx
 * <DrawerClose asChild>
 *   <Button variant="ghost" size="sm" aria-label="Close">
 *     <Close />
 *   </Button>
 * </DrawerClose>
 * ```
 *
 * Size the close one step below the drawer so it stays subordinate to the title:
 * `sm → xs`, `md → sm`, `lg → md`, `xl → lg`. The footer's dismiss action is the
 * same `DrawerClose asChild` pattern around a `secondary` `Button`.
 *
 * @see https://primitiv-ui.dev/docs/components/drawer
 */
export type DrawerCloseProps = ComponentPropsWithRef<typeof DrawerPrimitive.Close>;

export function DrawerClose({ className, ...props }: DrawerCloseProps) {
  return <DrawerPrimitive.Close className={[drawerClose(), className].filter(Boolean).join(" ")} {...props} />;
}
