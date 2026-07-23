import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Layout axis of the control. `"horizontal"` (default) binds the
 * Arrow Left/Right pair; `"vertical"` binds Arrow Up/Down. Also
 * reflected as `aria-orientation` and `data-orientation` on the root.
 */
export type SegmentedControlOrientation = "horizontal" | "vertical";

/** Reading direction — swaps the horizontal arrow pair when `"rtl"`. */
export type SegmentedControlReadingDirection = "ltr" | "rtl";

/**
 * Shared base for both {@link SegmentedControlRootProps} variants — the
 * native `<div>` attributes (minus the component-owned `role` and the
 * narrowed `dir`) plus the `asChild` escape hatch, orientation, reading
 * direction, group-level `disabled`, and a typed `ref`.
 */
export type SegmentedControlRootBaseProps = Omit<
  ComponentProps<"div">,
  "role" | "dir"
> & {
  /** The control's segments — {@link SegmentedControlItemProps | `SegmentedControl.Item`}
   * elements. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
  /**
   * When `true`, Root delegates rendering to a single consumer-supplied
   * element via the {@link Slot} pattern instead of the default `<div>`;
   * `role="radiogroup"`, `aria-orientation`, `data-orientation`,
   * `data-disabled`, `dir`, and remaining props are merged onto it.
   * @default false
   */
  asChild?: boolean;
  /**
   * Which arrow-key pair moves focus and selection through the segments,
   * and the visual axis. `"horizontal"` binds Arrow Left/Right;
   * `"vertical"` binds Arrow Up/Down. Reflected as `aria-orientation` and
   * `data-orientation` on the root.
   * @default "horizontal"
   */
  orientation?: SegmentedControlOrientation;
  /**
   * Reading direction. In `"rtl"` the horizontal arrow pair is swapped so
   * Arrow Left moves forward. When omitted, it is inherited from the
   * nearest {@link DirectionProvider}, falling back to `"ltr"`.
   */
  dir?: SegmentedControlReadingDirection;
  /**
   * Disables the entire control — every segment is non-interactive and
   * excluded from arrow-key navigation, and `data-disabled=""` is set on
   * the root. Individual segments can also be disabled via the Item's own
   * `disabled` prop.
   * @default false
   */
  disabled?: boolean;
};

/**
 * Uncontrolled variant of {@link SegmentedControlRootProps}: the component
 * owns the selected value. Pass `defaultValue` (or omit it); `onValueChange`
 * is optional and `value` is forbidden.
 */
export type SegmentedControlRootUncontrolledProps =
  SegmentedControlRootBaseProps & {
    /** Value of the segment selected on first render. Omit for nothing
     * selected on mount. */
    defaultValue?: string;
    /** Forbidden in uncontrolled mode — use `defaultValue` instead. */
    value?: never;
    /** Called with the new value whenever the selection changes. Optional
     * in uncontrolled mode. */
    onValueChange?: (value: string) => void;
  };

/**
 * Controlled variant of {@link SegmentedControlRootProps}: the parent owns
 * the selected value. Pass `value` and `onValueChange` together;
 * `defaultValue` is forbidden.
 */
export type SegmentedControlRootControlledProps =
  SegmentedControlRootBaseProps & {
    /** Forbidden in controlled mode — use `value` instead. */
    defaultValue?: never;
    /** The currently selected value. Must be kept in sync by the parent
     * via `onValueChange`. */
    value: string;
    /** Called with the new value whenever the selection changes. Required
     * in controlled mode. */
    onValueChange: (value: string) => void;
  };

/**
 * Props for {@link SegmentedControlRoot | `SegmentedControl.Root`}. A
 * discriminated union of {@link SegmentedControlRootUncontrolledProps} and
 * {@link SegmentedControlRootControlledProps}, so TypeScript accepts exactly
 * one state mode.
 */
export type SegmentedControlRootProps =
  | SegmentedControlRootUncontrolledProps
  | SegmentedControlRootControlledProps;

/**
 * Props for {@link SegmentedControlItem | `SegmentedControl.Item`} — the
 * segment button. `value` identifies the option; all native `<button>`
 * attributes (minus the component-owned `type`, `role`, `aria-checked`, and
 * `value`) plus the `asChild` escape hatch and a typed `ref` pass through.
 */
export type SegmentedControlItemProps = Omit<
  ComponentProps<"button">,
  "type" | "role" | "aria-checked" | "value"
> & {
  /** Uniquely identifies this segment within the control and is reported to
   * `onValueChange` / matched against Root's `value` when selected. Required. */
  value: string;
  /** The segment's visible content — typically its text label. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLButtonElement`. */
  ref?: Ref<HTMLButtonElement>;
  /**
   * Disables just this segment: forwards the native `disabled` attribute,
   * removes it from arrow-key navigation and the roving-tabindex home base,
   * and sets `data-disabled=""`. The whole control can also be disabled via
   * Root's `disabled` prop.
   * @default false
   */
  disabled?: boolean;
  /**
   * When `true`, renders the single child element via the {@link Slot}
   * pattern instead of the default `<button>`; ARIA, `data-state`,
   * `data-disabled`, `tabIndex`, `onClick`, `onKeyDown`, `disabled`, and
   * `ref` are merged onto it. A non-focusable child must be made focusable
   * by the consumer.
   * @default false
   */
  asChild?: boolean;
};
