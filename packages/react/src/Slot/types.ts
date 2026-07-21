import { HTMLAttributes, ReactNode } from "react";

/**
 * Props for {@link Slot} — all native `HTMLAttributes` (event handlers,
 * `style`, `className`, `aria-*`, `data-*`, …), merged onto the single
 * child element rather than rendered onto an element `Slot` creates
 * itself. See {@link Slot} for the exact prop-merging rules (event
 * handlers compose child-first, `style` shallow-merges child-wins,
 * `className` concatenates, everything else defaults to the child).
 *
 * @extends HTMLElement
 */
export type SlotProps = HTMLAttributes<HTMLElement> & {
  /**
   * The element to clone `Slot`'s props onto. Must be exactly one valid
   * React element that accepts a `ref` — passing zero children, more than
   * one, or a non-element (e.g. a plain string) throws
   * `"Slot requires exactly one React element child."`.
   */
  children?: ReactNode;
};
