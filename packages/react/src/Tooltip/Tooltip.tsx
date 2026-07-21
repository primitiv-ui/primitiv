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
 * Wraps one or more {@link TooltipRoot | `Tooltip.Root`} instances and provides
 * the shared delay configuration and group-wide open coordination. Required
 * ancestor — rendering `Tooltip.Root` without a Provider throws a context
 * error. Renders no DOM of its own (a `TooltipProviderContext` provider only).
 *
 * **Delay coordination.** Two timings govern how a group of tooltips feels:
 *
 * - `delayDuration` — how long a pointer must rest on a trigger before its
 *   tooltip opens (hover only; focus always opens immediately).
 * - `skipDelayDuration` — the grace window after a tooltip closes during which
 *   moving to *another* trigger in the same Provider opens that tooltip
 *   instantly, with no `delayDuration` wait. Rest longer than this window and
 *   the next hover pays the full `delayDuration` again. This is what makes a
 *   toolbar of icon buttons feel responsive once the first tip has shown.
 *
 * Place a single Provider high in the tree (typically at the app root) so every
 * tooltip shares one skip window. A per-instance
 * {@link TooltipRootProps.delayDuration | `delayDuration`} on `Tooltip.Root`
 * overrides the Provider's value for that one tooltip.
 *
 * @example App-wide provider
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
 * The state boundary for a single tooltip. Owns the open/closed state, runs the
 * open-delay and grace-period timers, and wires everything down to the
 * sub-components via `TooltipContext`. Renders no DOM of its own. Must be a
 * descendant of {@link TooltipProviderComponent | `Tooltip.Provider`}.
 *
 * **Controlled vs uncontrolled**, statically discriminated at the type level so
 * TypeScript accepts only one shape:
 *
 * - **Uncontrolled** — pass {@link UncontrolledTooltipRootProps.defaultOpen | `defaultOpen`}
 *   (or omit it for closed-on-mount). The component owns the flag; observe
 *   transitions with `onOpenChange`.
 * - **Controlled** — pass {@link ControlledTooltipRootProps.open | `open`}
 *   (with an optional `onOpenChange`). The parent owns the flag; the delay and
 *   grace timers still run and drive `onOpenChange`, but the tooltip only moves
 *   when the parent updates `open`.
 *
 * **Timing overrides.** {@link TooltipRootProps.delayDuration | `delayDuration`}
 * overrides the Provider's open delay for this tooltip only.
 * {@link TooltipRootProps.disableHoverableContent | `disableHoverableContent`}
 * removes the grace period, so the tooltip closes the instant the pointer
 * leaves the trigger (the user cannot move into the content).
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
 * The element that opens the tooltip. Renders a `<button type="button">` by
 * default; pass `asChild` to project the trigger behaviour onto a custom
 * element (a link, an icon button, etc.).
 *
 * **Open / close behaviour.** Pointer-enter opens after the effective
 * `delayDuration` (immediately if the group's skip window is active);
 * pointer-leave closes after a short grace period so the pointer can travel
 * into hoverable content (immediately when `disableHoverableContent` is set on
 * Root). Focus opens immediately and blur closes immediately, and `Escape`
 * while focused closes immediately — matching the WAI-ARIA tooltip pattern.
 * Consumer `onPointerEnter` / `onPointerLeave` / `onFocus` / `onBlur` /
 * `onKeyDown` all compose (they run first).
 *
 * **ARIA wiring.**
 * - `aria-describedby` points at {@link TooltipContent | `Tooltip.Content`}'s id.
 * - `data-state="open" | "closed"` mirrors the tooltip state for CSS.
 *
 * @extends HTMLButtonElement
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
 * CSS exit animations driven by `data-state="closed"`. Renders no wrapper
 * element of its own.
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
 * @extends HTMLDivElement
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
 * @extends HTMLSpanElement
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
 * {@link TooltipProviderComponent | `Tooltip.Provider`} governing open / skip
 * delays across a group. Opens on hover (after a delay) and on focus
 * (immediately); closes on blur, on `Escape`, and after a short grace period on
 * pointer-leave so the pointer can travel into hoverable content. Zero styles
 * ship; visual placement is your CSS concern (CSS anchor positioning).
 *
 * `Tooltip` is both callable (an alias of {@link TooltipRoot | `Tooltip.Root`})
 * and carries its sub-components as static properties. A `Tooltip.Provider`
 * ancestor is required — `Tooltip.Root` throws without one.
 *
 * - {@link TooltipProviderComponent | `Tooltip.Provider`} — shared delay config + group open coordination.
 * - {@link TooltipRoot | `Tooltip.Root`} — per-tooltip state owner and timing.
 * - {@link TooltipTrigger | `Tooltip.Trigger`} — `<button>` that opens on hover/focus.
 * - {@link TooltipPortal | `Tooltip.Portal`} — optional portal to `document.body`.
 * - {@link TooltipContent | `Tooltip.Content`} — the `role="tooltip"` panel.
 * - {@link TooltipArrow | `Tooltip.Arrow`} — optional visual pointer.
 *
 * @example Minimal usage
 * ```tsx
 * import { Tooltip } from "@primitiv-ui/react";
 *
 * <Tooltip.Provider>
 *   <Tooltip.Root>
 *     <Tooltip.Trigger>Save</Tooltip.Trigger>
 *     <Tooltip.Portal>
 *       <Tooltip.Content>
 *         Save your changes
 *         <Tooltip.Arrow />
 *       </Tooltip.Content>
 *     </Tooltip.Portal>
 *   </Tooltip.Root>
 * </Tooltip.Provider>;
 * ```
 *
 * @see {@link TooltipProviderComponent} for delay / skip-delay coordination.
 * @see {@link TooltipRoot} for the controlled/uncontrolled state modes and timing overrides.
 * @see {@link TooltipContent} for the grace period and the Escape / outside-pointer escape hatches.
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
