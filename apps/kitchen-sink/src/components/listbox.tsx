import "../styles/primitiv/listbox/styles.css";
/*
 * Listbox — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: five of the parts (OptionIndicator / OptionCheckbox /
 * OptionLeading / OptionLabel / OptionTrailing) are presentational spans with no
 * headless counterpart — they mirror the `Listbox / Option` row slots in Figma —
 * and Empty is a registry-only presentational row with no primitive at all.
 *
 * Everything is a separately-exported part, so a row is composed rather than
 * configured:
 *
 *   <Listbox type="single" defaultValue="ams" aria-label="Cities">
 *     <ListboxOption value="ams">
 *       <ListboxOptionIndicator><Check /></ListboxOptionIndicator>
 *       <ListboxOptionLabel>Amsterdam</ListboxOptionLabel>
 *     </ListboxOption>
 *   </Listbox>
 *
 * The mark glyph is yours, so nothing here depends on an icon package. Keep
 * contract.json + the stylesheet + this file in sync by hand.
 */
import { Listbox as ListboxPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import {
  listbox,
  listboxOption,
  listboxOptionIndicator,
  listboxOptionCheckbox,
  listboxOptionLeading,
  listboxOptionLabel,
  listboxOptionTrailing,
  listboxGroup,
  listboxGroupLabel,
  listboxEmpty,
} from "./listbox.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const cx = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

type ListboxSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * A persistently-visible list of selectable options — the WAI-ARIA APG listbox
 * pattern. The frame is the tab stop and carries the only focus ring; the cursor
 * inside it is virtual focus, so a separate input can hold DOM focus and drive
 * the list.
 *
 * @see https://primitiv-ui.dev/docs/components/listbox
 */
export type ListboxProps = DistributiveOmit<
  ComponentPropsWithRef<typeof ListboxPrimitive.Root>,
  "size"
> & {
  /**
   * Frame + row scale; `data-density` scales the sizing within each size.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/listbox
   */
  size?: ListboxSize;
};

export function Listbox({ size, className, ...props }: ListboxProps) {
  return <ListboxPrimitive.Root className={cx(listbox({ size }), className)} {...props} />;
}

export type ListboxOptionProps = ComponentPropsWithRef<typeof ListboxPrimitive.Option>;

export function ListboxOption({ className, ...props }: ListboxOptionProps) {
  return (
    <ListboxPrimitive.Option className={cx(listboxOption(), className)} {...props} />
  );
}

/**
 * The selected mark for a single-select row. Put a glyph inside — it is revealed
 * by CSS when the row is selected, and the element stays in the DOM either way so
 * the column it reserves keeps every label on one axis.
 *
 * @see https://primitiv-ui.dev/docs/components/listbox
 */
export type ListboxOptionIndicatorProps = ComponentPropsWithRef<"span">;

export function ListboxOptionIndicator({ className, ...props }: ListboxOptionIndicatorProps) {
  return (
    <span aria-hidden="true" className={cx(listboxOptionIndicator(), className)} {...props} />
  );
}

/**
 * The selected mark for a **multi-select** row: a checkbox drawn in CSS, filled
 * when the row is selected. Presentational only and `aria-hidden` — the row's own
 * `aria-selected` carries the state, since a real `<input type="checkbox">` inside
 * `role="option"` would add a second focusable control inside a row that is not
 * itself focusable. Use this instead of {@link ListboxOptionIndicator} when
 * `type="multiple"`; never both.
 *
 * @see https://primitiv-ui.dev/docs/components/listbox
 */
export type ListboxOptionCheckboxProps = ComponentPropsWithRef<"span">;

export function ListboxOptionCheckbox({ className, ...props }: ListboxOptionCheckboxProps) {
  return (
    <span aria-hidden="true" className={cx(listboxOptionCheckbox(), className)} {...props} />
  );
}

/**
 * Optional leading slot inside a row — an icon or small glyph placed after the
 * mark column and before the label.
 *
 * @see https://primitiv-ui.dev/docs/components/listbox
 */
export type ListboxOptionLeadingProps = ComponentPropsWithRef<"span">;

export function ListboxOptionLeading({ className, ...props }: ListboxOptionLeadingProps) {
  return <span className={cx(listboxOptionLeading(), className)} {...props} />;
}

/**
 * The row's text label. Takes the row's free space and truncates rather than
 * wrapping, so pair it with {@link ListboxOptionTrailing} to keep a trailing
 * affordance on the inline-end edge. Typeahead matches against the option's
 * rendered text, so keep the label here.
 *
 * @see https://primitiv-ui.dev/docs/components/listbox
 */
export type ListboxOptionLabelProps = ComponentPropsWithRef<"span">;

export function ListboxOptionLabel({ className, ...props }: ListboxOptionLabelProps) {
  return <span className={cx(listboxOptionLabel(), className)} {...props} />;
}

/**
 * Optional trailing slot inside a row — a shortcut hint, badge or icon on the
 * inline-end edge. Constrained in the block axis only, so non-icon content keeps
 * its natural width.
 *
 * @see https://primitiv-ui.dev/docs/components/listbox
 */
export type ListboxOptionTrailingProps = ComponentPropsWithRef<"span">;

export function ListboxOptionTrailing({ className, ...props }: ListboxOptionTrailingProps) {
  return <span className={cx(listboxOptionTrailing(), className)} {...props} />;
}

export type ListboxGroupProps = ComponentPropsWithRef<typeof ListboxPrimitive.Group>;

export function ListboxGroup({ className, ...props }: ListboxGroupProps) {
  return <ListboxPrimitive.Group className={cx(listboxGroup(), className)} {...props} />;
}

/**
 * The visible heading for a `ListboxGroup`, which names the group via
 * `aria-labelledby`. APG requires every group to carry a name — render this, or
 * pass `label` on the group for an invisible one. It sticks to the top edge while
 * a grouped list scrolls.
 *
 * @see https://primitiv-ui.dev/docs/components/listbox
 */
export type ListboxGroupLabelProps = ComponentPropsWithRef<typeof ListboxPrimitive.GroupLabel>;

export function ListboxGroupLabel({ className, ...props }: ListboxGroupLabelProps) {
  return (
    <ListboxPrimitive.GroupLabel className={cx(listboxGroupLabel(), className)} {...props} />
  );
}

/**
 * The "no results" row for a filtered list. `role="presentation"`, not an option —
 * only `role="option"` elements may sit inside a listbox, and the headless layer
 * ignores anything that is not an Option for cursor, typeahead and focus-seeding
 * purposes. Roughly two rows tall so the frame does not snap shut while the user
 * keeps typing.
 *
 * @see https://primitiv-ui.dev/docs/components/listbox
 */
export type ListboxEmptyProps = ComponentPropsWithRef<"div">;

export function ListboxEmpty({ className, ...props }: ListboxEmptyProps) {
  return (
    <div role="presentation" className={cx(listboxEmpty(), className)} {...props} />
  );
}
