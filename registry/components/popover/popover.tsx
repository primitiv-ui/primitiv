/*
 * Popover — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: Popover.Root is a context provider with no DOM, and Trigger /
 * Anchor are positioning references the consumer wires (anchor-name /
 * position-anchor) — so they are pure pass-throughs that take no className. The
 * styled parts (Content, Title, Description, Close) follow the generated shape
 * against popover.recipe.ts. Content carries the size + placement modifiers; the
 * pointer arrow is a ::after pseudo-element on the panel (the headless has no
 * Arrow part). Keep contract.json + the stylesheet + this file in sync by hand.
 */
import { Popover as PopoverPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import {
  popover,
  popoverTitle,
  popoverDescription,
  popoverClose,
} from "./popover.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type PopoverSize = "sm" | "md" | "lg" | "xl";

type PopoverPlacement =
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
 * A non-modal floating panel anchored to a trigger (native HTML Popover API).
 *
 * @see https://primitiv-ui.dev/docs/components/popover
 */
export type PopoverProps = ComponentPropsWithRef<typeof PopoverPrimitive.Root>;

export function Popover(props: PopoverProps) {
  return <PopoverPrimitive.Root {...props} />;
}

export type PopoverTriggerProps = ComponentPropsWithRef<typeof PopoverPrimitive.Trigger>;

export function PopoverTrigger(props: PopoverTriggerProps) {
  return <PopoverPrimitive.Trigger {...props} />;
}

export type PopoverAnchorProps = ComponentPropsWithRef<typeof PopoverPrimitive.Anchor>;

export function PopoverAnchor(props: PopoverAnchorProps) {
  return <PopoverPrimitive.Anchor {...props} />;
}

export type PopoverContentProps = DistributiveOmit<
  ComponentPropsWithRef<typeof PopoverPrimitive.Content>,
  "size" | "placement"
> & {
  /**
   * Panel size; `data-density` scales the padding within each size.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/popover
   */
  size?: PopoverSize;
  /**
   * Which side of the anchor the panel sits on, and how it aligns — sets the CSS
   * `position-area` and points the arrow at the anchor. Wire `anchor-name` on the
   * trigger (or `Popover.Anchor`) and a matching `position-anchor` on this panel.
   * @default "bottom"
   * @see https://primitiv-ui.dev/docs/components/popover
   */
  placement?: PopoverPlacement;
};

export function PopoverContent({ size, placement, className, ...props }: PopoverContentProps) {
  return (
    <PopoverPrimitive.Content
      className={[popover({ size, placement }), className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export type PopoverTitleProps = ComponentPropsWithRef<typeof PopoverPrimitive.Title>;

export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return <PopoverPrimitive.Title className={[popoverTitle(), className].filter(Boolean).join(" ")} {...props} />;
}

export type PopoverDescriptionProps = ComponentPropsWithRef<typeof PopoverPrimitive.Description>;

export function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <PopoverPrimitive.Description
      className={[popoverDescription(), className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

/**
 * Closes the popover and returns focus to the trigger. A bare
 * `<PopoverClose>text</PopoverClose>` renders a frameless button; the canonical
 * header close composes a ghost `Button` wrapping a `Close` icon via `asChild`:
 *
 * ```tsx
 * <PopoverClose asChild>
 *   <Button variant="ghost" size="sm" aria-label="Close">
 *     <Close />
 *   </Button>
 * </PopoverClose>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/popover
 */
export type PopoverCloseProps = ComponentPropsWithRef<typeof PopoverPrimitive.Close>;

export function PopoverClose({ className, ...props }: PopoverCloseProps) {
  return <PopoverPrimitive.Close className={[popoverClose(), className].filter(Boolean).join(" ")} {...props} />;
}
