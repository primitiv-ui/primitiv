import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Props for {@link Radio.Indicator} — all `<span>` attributes plus
 * `forceMount` (keep mounted while unchecked for exit animations) and the
 * `asChild` escape hatch.
 */
export type RadioIndicatorProps = ComponentProps<"span"> & {
  children?: ReactNode;
  forceMount?: boolean;
  asChild?: boolean;
};

/**
 * Shared base for both {@link RadioRootProps} variants — the native
 * `<button>` attributes (minus the ones the component owns) plus the
 * `asChild` escape hatch and a typed `ref`.
 */
export type RadioRootBaseProps = Omit<
  ComponentProps<"button">,
  "type" | "role" | "aria-checked" | "defaultChecked"
> & {
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * Uncontrolled variant of {@link RadioRootProps}: the component owns the
 * checked value. Pass `defaultChecked` (or omit it); `onCheckedChange` is
 * optional and `checked` is forbidden.
 */
export type RadioRootUncontrolledProps = RadioRootBaseProps & {
  defaultChecked?: boolean;
  checked?: never;
  onCheckedChange?: (checked: boolean) => void;
};

/**
 * Controlled variant of {@link RadioRootProps}: the parent owns the checked
 * value. Pass `checked` and `onCheckedChange` together; `defaultChecked` is
 * forbidden.
 */
export type RadioRootControlledProps = RadioRootBaseProps & {
  defaultChecked?: never;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Props for {@link Radio.Root}. A discriminated union of
 * {@link RadioRootUncontrolledProps} and {@link RadioRootControlledProps},
 * so TypeScript accepts exactly one state mode.
 */
export type RadioRootProps =
  | RadioRootUncontrolledProps
  | RadioRootControlledProps;
