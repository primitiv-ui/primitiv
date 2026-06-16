import { ComponentProps, ReactNode } from "react";

/**
 * Context published by {@link Tooltip.Provider} — the shared open / skip
 * delays and the group-wide open coordination callbacks used to suppress
 * the open delay while another tooltip in the group is already showing.
 */
export type TooltipProviderContextValue = {
  delayDuration: number;
  skipDelayDuration: number;
  isOpenGlobally: boolean;
  onOpenGlobally: () => void;
  onCloseGlobally: () => void;
};

/**
 * Context published by {@link Tooltip.Root} to its descendants — the live
 * `open` state, the content `id` for ARIA wiring, and the timing callbacks
 * the trigger and content use to open / close with the correct delays.
 */
export type TooltipContextValue = {
  open: boolean;
  contentId: string;
  disableHoverableContent: boolean;
  openWithDelay: () => void;
  openImmediate: () => void;
  closeImmediate: () => void;
  closeWithGrace: () => void;
  cancelGrace: () => void;
};

/**
 * Props for {@link Tooltip.Provider} — sets the `delayDuration` and
 * `skipDelayDuration` shared by every tooltip in the subtree.
 */
export type TooltipProviderProps = {
  children?: ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
};

/**
 * Uncontrolled variant of {@link TooltipRootProps}: the component owns the
 * open state. Pass `defaultOpen` (or omit it); `onOpenChange` is optional
 * and `open` is forbidden.
 */
export type UncontrolledTooltipRootProps = {
  defaultOpen?: boolean;
  open?: never;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link TooltipRootProps}: the parent owns the open
 * state. Pass `open` (with an optional `onOpenChange`); `defaultOpen` is
 * forbidden.
 */
export type ControlledTooltipRootProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: never;
};

/**
 * Props for {@link Tooltip.Root}. Combines the per-tooltip timing /
 * hoverable-content options with one of the two state modes
 * ({@link UncontrolledTooltipRootProps} | {@link ControlledTooltipRootProps}),
 * so TypeScript accepts exactly one mode.
 */
export type TooltipRootProps = {
  children?: ReactNode;
  delayDuration?: number;
  disableHoverableContent?: boolean;
} & (UncontrolledTooltipRootProps | ControlledTooltipRootProps);

/**
 * Props for {@link Tooltip.Trigger} — all native `<button>` attributes plus
 * the `asChild` escape hatch.
 */
export type TooltipTriggerProps = ComponentProps<"button"> & {
  asChild?: boolean;
};

/**
 * Props for {@link Tooltip.Portal} — the `container` to render the content
 * into (defaults to `document.body`) and `forceMount` to keep the content
 * in the DOM while closed for exit animations.
 */
export type TooltipPortalProps = {
  children?: ReactNode;
  container?: HTMLElement;
  forceMount?: boolean;
};

/**
 * Props for {@link Tooltip.Content} — all native `<div>` attributes plus
 * `forceMount` and the dismissal callbacks fired on Escape
 * (`onEscapeKeyDown`) and outside pointer-down (`onPointerDownOutside`).
 */
export type TooltipContentProps = ComponentProps<"div"> & {
  forceMount?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
};

/**
 * Props for {@link Tooltip.Arrow} — all native `<span>` attributes plus the
 * `asChild` escape hatch.
 */
export type TooltipArrowProps = ComponentProps<"span"> & {
  asChild?: boolean;
};
