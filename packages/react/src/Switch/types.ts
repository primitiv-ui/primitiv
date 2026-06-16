import { ButtonHTMLAttributes, ComponentProps, ReactNode, Ref } from "react";

/** Props common to both controlled and uncontrolled `Switch.Root` modes. */
export type SwitchRootBaseProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "role" | "aria-checked"
> & {
  /** Render the child element instead of the default `<button>`. */
  asChild?: boolean;
  /** Ref to the rendered `<button>` element. */
  ref?: Ref<HTMLButtonElement>;
};

/**
 * Props for `Switch.Root` in uncontrolled mode — the component owns the checked
 * state. Pass `defaultChecked` to set the initial value; `checked` is forbidden.
 */
export type SwitchRootUncontrolledProps = SwitchRootBaseProps & {
  /** Initial checked state when uncontrolled. */
  defaultChecked?: boolean;
  /** Forbidden in uncontrolled mode. */
  checked?: never;
  /** Called whenever the checked state changes. */
  onCheckedChange?: (checked: boolean) => void;
};

/**
 * Props for `Switch.Root` in controlled mode — the parent owns the checked
 * value. Pass `checked` and `onCheckedChange` together.
 */
export type SwitchRootControlledProps = SwitchRootBaseProps & {
  /** Forbidden in controlled mode. */
  defaultChecked?: never;
  /** The controlled checked state. */
  checked: boolean;
  /** Called whenever the component requests a checked-state change. */
  onCheckedChange: (checked: boolean) => void;
};

/** Props for `Switch.Root` — discriminated controlled/uncontrolled union. */
export type SwitchRootProps =
  | SwitchRootUncontrolledProps
  | SwitchRootControlledProps;

/**
 * The Switch's props, named to the `<Component>Props` convention the generated
 * styled wrapper imports (mirrors {@link ButtonProps}). An alias of the Root's
 * props, since `Switch` is callable as {@link SwitchRootProps | `Switch.Root`}.
 */
export type SwitchProps = SwitchRootProps;

/** Props for `Switch.Thumb`, the sliding indicator inside the track. */
export type SwitchThumbProps = ComponentProps<"span"> & {
  /** Optional thumb content. */
  children?: ReactNode;
  /** Render the child element instead of the default `<span>`. */
  asChild?: boolean;
};
