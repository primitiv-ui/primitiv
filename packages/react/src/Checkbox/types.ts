import { ChangeEventHandler, ComponentProps, ReactNode, Ref } from "react";

/** The checked value of a checkbox — `true`, `false`, or `"indeterminate"` (the tri-state). */
export type CheckedState = boolean | "indeterminate";

/**
 * Props for {@link Checkbox.Indicator} — the decorative mark. All `<span>`
 * attributes plus the `asChild` escape hatch. The indicator is always mounted;
 * its visibility is a CSS concern, revealed off the input's native `:checked` /
 * `:indeterminate` state.
 */
export type CheckboxIndicatorProps = ComponentProps<"span"> & {
  children?: ReactNode;
  asChild?: boolean;
};

/**
 * Shared base for both {@link CheckboxRootProps} variants — the native
 * `<input type="checkbox">` attributes (minus the ones the component owns) plus
 * the `onCheckedChange` convenience callback. `className` / `style` here style
 * the **box** (the visible control), not the hidden input; everything else
 * spreads onto the input, because semantically the Root *is* the checkbox.
 */
export type CheckboxRootBaseProps = Omit<
  ComponentProps<"input">,
  "type" | "checked" | "defaultChecked"
> & {
  /** Fired with the new boolean checked value on every user toggle. */
  onCheckedChange?: (checked: boolean) => void;
  children?: ReactNode;
  /** Forwarded to the underlying native `<input type="checkbox">`. */
  ref?: Ref<HTMLInputElement>;
};

/**
 * Uncontrolled variant of {@link CheckboxRootProps}: the component owns the
 * checked value. Pass `defaultChecked` (or omit it); `checked` is forbidden.
 * `defaultChecked` may be `"indeterminate"` for a mixed-on-mount checkbox.
 */
export type CheckboxRootUncontrolledProps = CheckboxRootBaseProps & {
  defaultChecked?: CheckedState;
  checked?: never;
};

/**
 * Controlled variant of {@link CheckboxRootProps}: the parent owns the checked
 * value. Pass `checked` and `onCheckedChange` together; `defaultChecked` is
 * forbidden.
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

/** Internal: the native `onChange` shape the Root composes with its own. */
export type CheckboxChangeHandler = ChangeEventHandler<HTMLInputElement>;
