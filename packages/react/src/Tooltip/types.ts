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
 * Props for {@link Tooltip.Provider} — sets the delay timings shared by every
 * tooltip in the subtree.
 */
export type TooltipProviderProps = {
  /** The tooltips (and other markup) that share this Provider's timings. */
  children?: ReactNode;
  /**
   * How long, in milliseconds, a pointer must rest on a trigger before the
   * tooltip opens on hover. Focus always opens immediately regardless of this.
   * Overridable per tooltip via {@link TooltipRootProps.delayDuration}.
   * @default 700
   */
  delayDuration?: number;
  /**
   * The grace window, in milliseconds, after a tooltip in this group closes
   * during which hovering *another* trigger in the same Provider opens it
   * instantly (no `delayDuration` wait). Rest longer than this and the next
   * hover pays the full delay again.
   * @default 300
   */
  skipDelayDuration?: number;
};

/**
 * Uncontrolled variant of {@link TooltipRootProps}: the component owns the
 * open state. Pass `defaultOpen` (or omit it); `onOpenChange` is optional
 * and `open` is forbidden.
 */
export type UncontrolledTooltipRootProps = {
  /**
   * Whether the tooltip is open on first render. The component owns the flag
   * from then on (hover/focus/blur/Escape drive it internally).
   * @default false
   */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultOpen` instead. */
  open?: never;
  /** Called with the new open state after every transition. Optional in
   * uncontrolled mode; use it to observe (not drive) open/close. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link TooltipRootProps}: the parent owns the open
 * state. Pass `open` (with an optional `onOpenChange`); `defaultOpen` is
 * forbidden.
 */
export type ControlledTooltipRootProps = {
  /** The current open state. The delay and grace timers still run and call
   * `onOpenChange`, but the tooltip only moves when the parent updates this. */
  open: boolean;
  /** Called with the requested open state whenever the tooltip wants to open
   * or close. Optional even in controlled mode. */
  onOpenChange?: (open: boolean) => void;
  /** Forbidden in controlled mode — use `open` instead. */
  defaultOpen?: never;
};

/**
 * Props for {@link Tooltip.Root}. Combines the per-tooltip timing /
 * hoverable-content options with one of the two state modes
 * ({@link UncontrolledTooltipRootProps} | {@link ControlledTooltipRootProps}),
 * so TypeScript accepts exactly one mode.
 */
export type TooltipRootProps = {
  /** The tooltip's {@link TooltipTriggerProps | `Tooltip.Trigger`},
   * {@link TooltipContentProps | `Tooltip.Content`} (usually inside a
   * {@link TooltipPortalProps | `Tooltip.Portal`}), and optional
   * {@link TooltipArrowProps | `Tooltip.Arrow`}. */
  children?: ReactNode;
  /**
   * Overrides {@link TooltipProviderProps.delayDuration} for this tooltip only
   * — the hover open delay in milliseconds. Falls back to the Provider's value
   * when omitted.
   */
  delayDuration?: number;
  /**
   * When `true`, removes the pointer-leave grace period: the tooltip closes the
   * instant the pointer leaves the trigger, so the user cannot move into the
   * content. Leave `false` for tooltips whose content is meant to be hovered.
   * @default false
   */
  disableHoverableContent?: boolean;
} & (UncontrolledTooltipRootProps | ControlledTooltipRootProps);

/**
 * Props for {@link Tooltip.Trigger} — all native `<button>` attributes plus
 * the `asChild` escape hatch. The `aria-describedby`, `data-state`, and the
 * hover/focus/blur/Escape open-close handlers are added by the component
 * (consumer handlers compose and run first).
 */
export type TooltipTriggerProps = ComponentProps<"button"> & {
  /**
   * Render the single child element (a link, icon button, etc.) instead of the
   * default `<button>`, merging the trigger's ARIA and event handlers onto it
   * via the {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link Tooltip.Portal} — the `container` to render the content
 * into and `forceMount` to keep the content in the DOM while closed for exit
 * animations.
 */
export type TooltipPortalProps = {
  /** The content to portal — typically a single
   * {@link TooltipContentProps | `Tooltip.Content`}. */
  children?: ReactNode;
  /**
   * The element to portal the content into.
   * @default document.body
   */
  container?: HTMLElement;
  /**
   * Keep the content mounted while the tooltip is closed (instead of removing
   * it), so a CSS exit animation on `data-state="closed"` can play.
   * @default false
   */
  forceMount?: boolean;
};

/**
 * Props for {@link Tooltip.Content} — all native `<div>` attributes plus
 * `forceMount` and the dismissal escape hatches. The component adds
 * `role="tooltip"`, the shared `id` (for the trigger's `aria-describedby`),
 * the `data-state` hook, and the pointer handlers that cancel/allow the grace
 * period close.
 */
export type TooltipContentProps = ComponentProps<"div"> & {
  /**
   * Keep the content mounted while the tooltip is closed (instead of removing
   * it), so a CSS exit animation on `data-state="closed"` can play.
   * @default false
   */
  forceMount?: boolean;
  /**
   * Fires when `Escape` is pressed while the tooltip is open. Call
   * `event.preventDefault()` to keep the tooltip open; otherwise it closes.
   */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /**
   * Fires on a pointer-down outside the content. Call `event.preventDefault()`
   * to keep the tooltip open; otherwise it closes.
   */
  onPointerDownOutside?: (event: PointerEvent) => void;
};

/**
 * Props for {@link Tooltip.Arrow} — all native `<span>` attributes plus the
 * `asChild` escape hatch. Purely presentational; position and size it with CSS.
 */
export type TooltipArrowProps = ComponentProps<"span"> & {
  /**
   * Render the single child element (e.g. an `<svg>`) instead of the default
   * `<span>` via the {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
};
