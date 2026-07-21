/*
 * Tooltip — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: Tooltip.Root / Provider are context providers with no DOM, and
 * Trigger is a positioning reference the consumer wires (anchor-name /
 * position-anchor) — so they are pure pass-throughs that take no className. The
 * styled parts (Content, Arrow) follow the generated shape against
 * tooltip.recipe.ts. Content carries the tone + size + placement modifiers; the
 * Arrow is a real element the placement modifiers position + point at the anchor.
 * The panel is a plain portalled <div role="tooltip"> (not a top-layer element),
 * so its enter/exit animation keys off `data-state` and needs `forceMount` on the
 * Portal to survive the close (see styles.css). Keep contract.json + the
 * stylesheet + this file in sync by hand.
 */
import { Tooltip as TooltipPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { tooltip, tooltipArrow } from "./tooltip.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type TooltipTone = "default" | "inverted";

type TooltipSize = "sm" | "md" | "lg" | "xl";

type TooltipPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "right"
  | "right-start"
  | "right-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end";

/**
 * Shares a hover open/close delay across the tooltips nested inside it. Optional —
 * a lone `Tooltip` works without one.
 *
 * @see https://primitiv-ui.dev/docs/components/tooltip
 */
export type TooltipProviderProps = ComponentPropsWithRef<typeof TooltipPrimitive.Provider>;

export function TooltipProvider(props: TooltipProviderProps) {
  return <TooltipPrimitive.Provider {...props} />;
}

/**
 * A deferred, non-modal label anchored to a trigger, shown on hover / focus.
 *
 * @see https://primitiv-ui.dev/docs/components/tooltip
 */
export type TooltipProps = ComponentPropsWithRef<typeof TooltipPrimitive.Root>;

export function Tooltip(props: TooltipProps) {
  return <TooltipPrimitive.Root {...props} />;
}

export type TooltipTriggerProps = ComponentPropsWithRef<typeof TooltipPrimitive.Trigger>;

export function TooltipTrigger(props: TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger {...props} />;
}

/**
 * Portals the bubble out to `container` (default `document.body`). Pass
 * `forceMount` so the bubble stays mounted while closed and its slide/fade exit
 * can play — a tooltip is a plain `<div>` driven by `data-state`, so without
 * `forceMount` it unmounts on close and only the enter shows.
 *
 * @see https://primitiv-ui.dev/docs/components/tooltip
 */
export type TooltipPortalProps = ComponentPropsWithRef<typeof TooltipPrimitive.Portal>;

export function TooltipPortal(props: TooltipPortalProps) {
  return <TooltipPrimitive.Portal {...props} />;
}

export type TooltipContentProps = DistributiveOmit<
  ComponentPropsWithRef<typeof TooltipPrimitive.Content>,
  "tone" | "size" | "placement"
> & {
  /**
   * Colour treatment. `default` is a high-contrast dark bubble (inverts with the
   * theme — dark in light mode, light in dark); `inverted` is a surface-coloured
   * bubble for use on dark backgrounds.
   * @default "default"
   * @see https://primitiv-ui.dev/docs/components/tooltip
   */
  tone?: TooltipTone;
  /**
   * Bubble size; `data-density` scales the padding within each size.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/tooltip
   */
  size?: TooltipSize;
  /**
   * Which side of the anchor the bubble sits on, and how it aligns — sets the CSS
   * `position-area` and points the arrow at the anchor. Wire `anchor-name` on the
   * trigger and a matching `position-anchor` on this bubble.
   * @default "top"
   * @see https://primitiv-ui.dev/docs/components/tooltip
   */
  placement?: TooltipPlacement;
};

/**
 * The bubble — a `<div role="tooltip">`. Combines the `tone`, `size`, and
 * `placement` axes; compose a {@link TooltipArrow} inside it for the pointer.
 *
 * @see https://primitiv-ui.dev/docs/components/tooltip
 */
export function TooltipContent({ tone, size, placement, className, ...props }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Content
      className={[tooltip({ tone, size, placement }), className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

/**
 * The pointer that connects the bubble to its trigger — a `<span>` the placement
 * modifiers rotate + position on the anchor-facing edge, tinted to match the
 * bubble. Render it as the last child of {@link TooltipContent}.
 *
 * @see https://primitiv-ui.dev/docs/components/tooltip
 */
export type TooltipArrowProps = ComponentPropsWithRef<typeof TooltipPrimitive.Arrow>;

export function TooltipArrow({ className, ...props }: TooltipArrowProps) {
  return <TooltipPrimitive.Arrow className={[tooltipArrow(), className].filter(Boolean).join(" ")} {...props} />;
}
