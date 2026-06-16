import type { ReactElement } from "react";

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
export function TooltipProviderComponent({
  children,
  delayDuration = 700,
  skipDelayDuration = 300,
}: TooltipProviderProps): ReactElement {
  const { contextValue } = useTooltipProvider({
    delayDuration,
    skipDelayDuration,
  });
  return (
    <TooltipProviderProvider value={contextValue}>
      {children}
    </TooltipProviderProvider>
  );
}

/** @internal */
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
export function TooltipRoot({
  children,
  defaultOpen,
  open,
  onOpenChange,
  delayDuration,
  disableHoverableContent,
}: TooltipRootProps): ReactElement {
  const { contextValue } = useTooltipRoot({
    defaultOpen,
    open,
    onOpenChange,
    delayDuration,
    disableHoverableContent,
  });

  return <TooltipProvider value={contextValue}>{children}</TooltipProvider>;
}

/** @internal */
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
export function TooltipTrigger({
  ref,
  asChild = false,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onKeyDown,
  type,
  ...rest
}: TooltipTriggerProps): ReactElement {
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

/** @internal */
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
export function TooltipPortal({
  children,
  container,
  forceMount,
}: TooltipPortalProps): ReactElement | null {
  const { open } = useTooltipContext();

  if (!open && !forceMount) return null;

  return <Portal container={container}>{children}</Portal>;
}

/** @internal */
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
export function TooltipContent({
  ref,
  forceMount,
  onEscapeKeyDown,
  onPointerDownOutside,
  onPointerEnter,
  onPointerLeave,
  ...rest
}: TooltipContentProps): ReactElement | null {
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

/** @internal */
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
export function TooltipArrow({
  ref,
  asChild = false,
  ...rest
}: TooltipArrowProps): ReactElement {
  if (asChild) {
    return <Slot ref={ref} {...rest} />;
  }

  return <span ref={ref} {...rest} />;
}

/** @internal */
TooltipArrow.displayName = "TooltipArrow";

/** Type of the {@link Tooltip} compound: the root callable plus its attached sub-components. */
export type TooltipCompound = typeof TooltipRoot & {
  Provider: typeof TooltipProviderComponent;
  Root: typeof TooltipRoot;
  Trigger: typeof TooltipTrigger;
  Portal: typeof TooltipPortal;
  Content: typeof TooltipContent;
  Arrow: typeof TooltipArrow;
};

/**
 * Headless, accessible **Tooltip** — a compound component implementing the
 * [WAI-ARIA tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/):
 * a deferred, hoverable label anchored to a trigger, with a shared
 * {@link Tooltip.Provider} governing open / skip delays across a group. Zero
 * styles ship.
 *
 * The default export is the `Root`; sub-components are attached as static
 * properties (`Tooltip.Provider`, `Tooltip.Trigger`, `Tooltip.Content`, …).
 */
const TooltipCompound: TooltipCompound = Object.assign(TooltipRoot, {
  Provider: TooltipProviderComponent,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Content: TooltipContent,
  Arrow: TooltipArrow,
});

/** @internal */
TooltipCompound.displayName = "Tooltip";

export { TooltipCompound as Tooltip };
