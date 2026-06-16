import { ComponentProps, ReactNode, Ref } from "react";

/** The checked value of a checkbox — `true`, `false`, or `"indeterminate"` (the tri-state). */
export type CheckedState = boolean | "indeterminate";

/**
 * Props for {@link Checkbox.Indicator} — all `<span>` attributes plus
 * `forceMount` (keep mounted while unchecked for exit animations) and the
 * `asChild` escape hatch.
 */
export type CheckboxIndicatorProps = ComponentProps<"span"> & {
  children?: ReactNode;
  forceMount?: boolean;
  asChild?: boolean;
};

/**
 * Shared base for both {@link CheckboxRootProps} variants — the native
 * `<button>` attributes (minus the ones the component owns) plus the
 * `asChild` escape hatch and a typed `ref`.
 */
export type CheckboxRootBaseProps = Omit<
  ComponentProps<"button">,
  "type" | "role" | "aria-checked" | "defaultChecked"
> & {
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * Uncontrolled variant of {@link CheckboxRootProps}: the component owns the
 * checked value. Pass `defaultChecked` (or omit it); `onCheckedChange` is
 * optional and `checked` is forbidden.
 */
export type CheckboxRootUncontrolledProps = CheckboxRootBaseProps & {
  defaultChecked?: CheckedState;
  checked?: never;
  onCheckedChange?: (checked: boolean) => void;
};

/**
 * Controlled variant of {@link CheckboxRootProps}: the parent owns the
 * checked value. Pass `checked` and `onCheckedChange` together;
 * `defaultChecked` is forbidden.
 */
export type CheckboxRootControlledProps = CheckboxRootBaseProps & {
  defaultChecked?: never;
  checked: CheckedState;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Props for {@link Checkbox.Root}. A discriminated union of
 * {@link CheckboxRootUncontrolledProps} and
 * {@link CheckboxRootControlledProps}, so TypeScript accepts exactly one
 * state mode.
 */
export type CheckboxRootProps =
  | CheckboxRootUncontrolledProps
  | CheckboxRootControlledProps;
