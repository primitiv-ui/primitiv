import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Which arrow keys navigate the group. `"both"` (default) accepts all
 * four; `"horizontal"` only Arrow Left/Right; `"vertical"` only Arrow
 * Up/Down.
 */
export type RadioGroupOrientation = "horizontal" | "vertical" | "both";

/** Reading direction — swaps the horizontal arrow pair when `"rtl"`. */
export type RadioGroupReadingDirection = "ltr" | "rtl";

/**
 * Shared base for both {@link RadioGroupRootProps} variants — the native
 * `<div>` attributes (minus `role`) plus the `asChild` escape hatch,
 * orientation, reading direction, and a typed `ref`.
 */
export type RadioGroupRootBaseProps = Omit<ComponentProps<"div">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  asChild?: boolean;
  orientation?: RadioGroupOrientation;
  dir?: RadioGroupReadingDirection;
};

/**
 * Uncontrolled variant of {@link RadioGroupRootProps}: the component owns
 * the selected value. Pass `defaultValue` (or omit it); `onValueChange` is
 * optional and `value` is forbidden.
 */
export type RadioGroupRootUncontrolledProps = RadioGroupRootBaseProps & {
  defaultValue?: string;
  value?: never;
  onValueChange?: (value: string) => void;
};

/**
 * Controlled variant of {@link RadioGroupRootProps}: the parent owns the
 * selected value. Pass `value` and `onValueChange` together; `defaultValue`
 * is forbidden.
 */
export type RadioGroupRootControlledProps = RadioGroupRootBaseProps & {
  defaultValue?: never;
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * Props for {@link RadioGroup.Root}. A discriminated union of
 * {@link RadioGroupRootUncontrolledProps} and
 * {@link RadioGroupRootControlledProps}, so TypeScript accepts exactly one
 * state mode.
 */
export type RadioGroupRootProps =
  | RadioGroupRootUncontrolledProps
  | RadioGroupRootControlledProps;

/**
 * Props for {@link RadioGroup.Item} — the radio button. `value` identifies
 * the option; all native `<button>` attributes (minus the component-owned
 * ones) plus the `asChild` escape hatch and a typed `ref` are passed through.
 */
export type RadioGroupItemProps = Omit<
  ComponentProps<"button">,
  "type" | "role" | "aria-checked" | "value"
> & {
  value: string;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  asChild?: boolean;
};

/**
 * Props for {@link RadioGroup.Indicator} — all `<span>` attributes plus
 * `forceMount` (keep mounted while unselected for exit animations) and the
 * `asChild` escape hatch.
 */
export type RadioGroupIndicatorProps = ComponentProps<"span"> & {
  children?: ReactNode;
  forceMount?: boolean;
  asChild?: boolean;
};
