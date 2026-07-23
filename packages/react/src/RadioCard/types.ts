import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Which arrow keys navigate the group. `"both"` (default) accepts all
 * four; `"horizontal"` only Arrow Left/Right; `"vertical"` only Arrow
 * Up/Down.
 */
export type RadioCardOrientation = "horizontal" | "vertical" | "both";

/** Reading direction — swaps the horizontal arrow pair when `"rtl"`. */
export type RadioCardReadingDirection = "ltr" | "rtl";

/**
 * Shared base for both {@link RadioCardRootProps} variants — the native
 * `<div>` attributes (minus the component-owned `role` and the narrowed
 * `dir`) plus the `asChild` escape hatch, orientation, reading direction,
 * and a typed `ref`.
 */
export type RadioCardRootBaseProps = Omit<
  ComponentProps<"div">,
  "role" | "dir" | "defaultValue"
> & {
  /** The group's cards — typically {@link RadioCardItemProps | `RadioCard.Item`}
   * elements, each optionally wrapping a {@link RadioCardIndicatorProps | `RadioCard.Indicator`}. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
  /**
   * When `true`, Root delegates rendering to a single consumer-supplied
   * element via the {@link Slot} pattern instead of the default `<div>`;
   * `role="radiogroup"`, `aria-orientation`, `dir`, and remaining props
   * are merged onto it.
   * @default false
   */
  asChild?: boolean;
  /**
   * Which arrow keys move focus and selection through the group.
   * `"both"` enables all four arrows; `"horizontal"` only Arrow
   * Left/Right; `"vertical"` only Arrow Up/Down. When not `"both"`, the
   * value is also reflected as `aria-orientation` on the root.
   * @default "both"
   */
  orientation?: RadioCardOrientation;
  /**
   * Reading direction. In `"rtl"` the horizontal arrow pair is swapped so
   * Arrow Left moves forward. When omitted, it is inherited from the
   * nearest {@link DirectionProvider}, falling back to `"ltr"`.
   */
  dir?: RadioCardReadingDirection;
};

/**
 * Uncontrolled variant of {@link RadioCardRootProps}: the component owns
 * the selected value. Pass `defaultValue` (or omit it); `onValueChange` is
 * optional and `value` is forbidden.
 */
export type RadioCardRootUncontrolledProps = RadioCardRootBaseProps & {
  /** Value of the card selected on first render. Omit for nothing selected
   * on mount. */
  defaultValue?: string;
  /** Forbidden in uncontrolled mode — use `defaultValue` instead. */
  value?: never;
  /** Called with the new value whenever the selection changes. Optional in
   * uncontrolled mode. */
  onValueChange?: (value: string) => void;
};

/**
 * Controlled variant of {@link RadioCardRootProps}: the parent owns the
 * selected value. Pass `value` and `onValueChange` together; `defaultValue`
 * is forbidden.
 */
export type RadioCardRootControlledProps = RadioCardRootBaseProps & {
  /** Forbidden in controlled mode — use `value` instead. */
  defaultValue?: never;
  /** The currently selected value. Must be kept in sync by the parent via
   * `onValueChange`. */
  value: string;
  /** Called with the new value whenever the user selects a card. Required
   * in controlled mode. */
  onValueChange: (value: string) => void;
};

/**
 * Props for {@link RadioCard.Root}. A discriminated union of
 * {@link RadioCardRootUncontrolledProps} and
 * {@link RadioCardRootControlledProps}, so TypeScript accepts exactly one
 * state mode.
 */
export type RadioCardRootProps =
  | RadioCardRootUncontrolledProps
  | RadioCardRootControlledProps;

/**
 * Props for {@link RadioCardItem | `RadioCard.Item`} — a selectable card
 * rendered as a `role="radio"` button. `value` identifies the option; all
 * native `<button>` attributes (minus the component-owned `type`, `role`,
 * `aria-checked`, and `value`) plus the `asChild` escape hatch and a typed
 * `ref` are passed through.
 */
export type RadioCardItemProps = Omit<
  ComponentProps<"button">,
  "type" | "role" | "aria-checked" | "value"
> & {
  /** Uniquely identifies this card within the group and is reported to
   * `onValueChange` / matched against Root's `value` when selected. Required. */
  value: string;
  /** The card's content — the whole surface is the interactive control,
   * and typically includes a {@link RadioCardIndicatorProps | `RadioCard.Indicator`}. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLButtonElement`. */
  ref?: Ref<HTMLButtonElement>;
  /**
   * When `true`, renders the single child element via the {@link Slot}
   * pattern instead of the default `<button>`; ARIA, `data-state`,
   * `tabIndex`, `onClick`, `onKeyDown`, `disabled`, and `ref` are merged
   * onto it. A non-focusable child must be made focusable by the consumer.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link RadioCardIndicator | `RadioCard.Indicator`} — the visual
 * marker rendered inside the selected card. All native `<span>` attributes
 * plus `forceMount` and the `asChild` escape hatch.
 */
export type RadioCardIndicatorProps = ComponentProps<"span"> & {
  /** The visual mark shown while the parent Item is selected. */
  children?: ReactNode;
  /**
   * When `true`, keeps the indicator mounted while unchecked so a CSS exit
   * animation can play against `data-state="unchecked"`. Consumers who set
   * it own the exit lifecycle.
   * @default false
   */
  forceMount?: boolean;
  /**
   * When `true`, renders the single child element via the {@link Slot}
   * pattern instead of the default `<span>`; `aria-hidden` and `data-state`
   * are merged onto it.
   * @default false
   */
  asChild?: boolean;
};
