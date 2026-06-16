import { Portal } from "../Portal/index.ts";
import { Slot, composeRefs } from "../Slot/index.ts";

import {
  TooltipProvider,
  TooltipProviderProvider,
  useTooltipContext,
} from "./TooltipContext";
import {
  useTooltipContent,
  useTooltipProvider,
  useTooltipRoot,
  useTooltipTrigger,
} from "./hooks/index.ts";
import type {
  TooltipArrowProps,
  TooltipContentProps,
  TooltipPortalProps,
  TooltipProviderProps,
  TooltipRootProps,
  TooltipTriggerProps,
} from "./types";

/**
 * Wraps one or more `Tooltip.Root` instances and provides shared
 * delay configuration. Required ancestor — rendering `Tooltip.Root`
 * without a Provider throws a context error.
 *
 * @example
 * ```tsx
 * <Tooltip.Provider delayDuration={400}>
 *   <App />
 * </Tooltip.Provider>
 * ```
 */
function TooltipProviderComponent({
  children,
  delayDuration = 700,
  skipDelayDuration = 300,
}: TooltipProviderProps) {
  const { contextValue } = useTooltipProvider({ delayDuration, skipDelayDuration });
  return (
    <TooltipProviderProvider value={contextValue}>
      {children}
    </TooltipProviderProvider>
  );
}

TooltipProviderComponent.displayName = "TooltipProvider";

/**
 * The state boundary for a single tooltip. Owns the open/closed
 * state and wires it down to all sub-components via context.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass `defaultOpen` or omit for closed-on-mount.
 * - **Controlled** — pass `open` (and optionally `onOpenChange`).
 *
 * @example
 * ```tsx
 * <Tooltip.Root>
 *   <Tooltip.Trigger>Save</Tooltip.Trigger>
 *   <Tooltip.Content>Save your changes</Tooltip.Content>
 * </Tooltip.Root>
 * ```
 */
function TooltipRoot({
  children,
  defaultOpen,
  open,
  onOpenChange,
  delayDuration,
  disableHoverableContent,
}: TooltipRootProps) {
  const { contextValue } = useTooltipRoot({
    defaultOpen,
    open,
    onOpenChange,
    delayDuration,
    disableHoverableContent,
  });

  return <TooltipProvider value={contextValue}>{children}</TooltipProvider>;
}

TooltipRoot.displayName = "TooltipRoot";

/**
 * The element that triggers the tooltip on hover and focus. Renders a
 * `<button type="button">` by default; use `asChild` to wrap a custom
 * element.
 *
 * ARIA wiring:
 * - `aria-describedby` points at `Tooltip.Content`'s id.
 * - `data-state="open" | "closed"` mirrors the tooltip state.
 *
 * @example
 * ```tsx
 * <Tooltip.Trigger>Save</Tooltip.Trigger>
 *
 * <Tooltip.Trigger asChild>
 *   <a href="/help">Help</a>
 * </Tooltip.Trigger>
 * ```
 */
function TooltipTrigger({
  ref,
  asChild = false,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onKeyDown,
  type,
  ...rest
}: TooltipTriggerProps) {
  const { getTriggerProps } = useTooltipTrigger({
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    onKeyDown,
    ...rest,
  });

  if (asChild) {
    return <Slot ref={ref} {...getTriggerProps()} />;
  }

  return <button ref={ref} type={type ?? "button"} {...getTriggerProps()} />;
}

TooltipTrigger.displayName = "TooltipTrigger";

/**
 * Renders its children through `React.createPortal` so the tooltip
 * content is detached from wherever `Tooltip.Root` lives in the tree
 * and becomes a direct child of `container` (default `document.body`).
 *
 * By default the portal only renders while the tooltip is open. Pass
 * `forceMount` to keep the subtree mounted when closed — useful for
 * CSS exit animations driven by `data-state="closed"`.
 *
 * @example
 * ```tsx
 * <Tooltip.Portal>
 *   <Tooltip.Content>…</Tooltip.Content>
 * </Tooltip.Portal>
 * ```
 */
function TooltipPortal({ children, container, forceMount }: TooltipPortalProps) {
  const { open } = useTooltipContext();

  if (!open && !forceMount) return null;

  return <Portal container={container}>{children}</Portal>;
}

TooltipPortal.displayName = "TooltipPortal";

/**
 * The tooltip panel. Renders a `<div role="tooltip">` with the shared
 * `contentId` so `Tooltip.Trigger`'s `aria-describedby` resolves correctly.
 *
 * - Unmounts when the tooltip closes unless `forceMount` is set.
 * - `data-state="open" | "closed"` is always present for CSS animation hooks.
 * - Pointer events on the content cancel the grace-period close timer,
 *   letting users move the cursor from the trigger into the content without
 *   the tooltip dismissing (unless `disableHoverableContent` is set on Root).
 *
 * **Escape hatches:**
 * - `onEscapeKeyDown` — fires when Escape is pressed while the tooltip is
 *   open; call `event.preventDefault()` to keep it open.
 * - `onPointerDownOutside` — fires on a pointer-down outside the content;
 *   call `event.preventDefault()` to keep it open.
 *
 * CSS anchor positioning is the consumer's responsibility. Apply
 * `anchor-name` to the trigger and `position-anchor` / `position-area`
 * to the content in your own stylesheet.
 *
 * @example
 * ```tsx
 * <Tooltip.Content className="tooltip__content">
 *   Save your changes
 *   <Tooltip.Arrow className="tooltip__arrow" />
 * </Tooltip.Content>
 * ```
 */
function TooltipContent({
  ref,
  forceMount,
  onEscapeKeyDown,
  onPointerDownOutside,
  onPointerEnter,
  onPointerLeave,
  ...rest
}: TooltipContentProps) {
  const { open } = useTooltipContext();
  const { getContentProps, internalRef } = useTooltipContent({
    onEscapeKeyDown,
    onPointerDownOutside,
    onPointerEnter,
    onPointerLeave,
    ...rest,
  });

  if (!open && !forceMount) return null;

  return <div ref={composeRefs(internalRef, ref)} {...getContentProps()} />;
}

TooltipContent.displayName = "TooltipContent";

/**
 * An optional visual pointer that connects the tooltip content to its
 * trigger. Renders a `<span>` by default; use `asChild` for a custom
 * element such as an SVG.
 *
 * All positioning and styling is the consumer's responsibility via CSS.
 *
 * @example
 * ```tsx
 * <Tooltip.Content>
 *   Save your changes
 *   <Tooltip.Arrow className="tooltip__arrow" />
 * </Tooltip.Content>
 * ```
 */
function TooltipArrow({ ref, asChild = false, ...rest }: TooltipArrowProps) {
  if (asChild) {
    return <Slot ref={ref} {...rest} />;
  }

  return <span ref={ref} {...rest} />;
}

TooltipArrow.displayName = "TooltipArrow";

type TooltipCompound = typeof TooltipRoot & {
  Provider: typeof TooltipProviderComponent;
  Root: typeof TooltipRoot;
  Trigger: typeof TooltipTrigger;
  Portal: typeof TooltipPortal;
  Content: typeof TooltipContent;
  Arrow: typeof TooltipArrow;
};

const TooltipCompound: TooltipCompound = Object.assign(TooltipRoot, {
  Provider: TooltipProviderComponent,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Content: TooltipContent,
  Arrow: TooltipArrow,
});

TooltipCompound.displayName = "Tooltip";

export { TooltipCompound as Tooltip };
