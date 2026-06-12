import { ButtonHTMLAttributes, ComponentProps, ReactNode, Ref } from "react";

type SwitchRootBaseProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "role" | "aria-checked"
> & {
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

type SwitchRootUncontrolledProps = SwitchRootBaseProps & {
  defaultChecked?: boolean;
  checked?: never;
  onCheckedChange?: (checked: boolean) => void;
};

type SwitchRootControlledProps = SwitchRootBaseProps & {
  defaultChecked?: never;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export type SwitchRootProps =
  | SwitchRootUncontrolledProps
  | SwitchRootControlledProps;

/**
 * The Switch's props, named to the `<Component>Props` convention the generated
 * styled wrapper imports (mirrors {@link ButtonProps}). An alias of the Root's
 * props, since `Switch` is callable as {@link SwitchRootProps | `Switch.Root`}.
 */
export type SwitchProps = SwitchRootProps;

export type SwitchThumbProps = ComponentProps<"span"> & {
  children?: ReactNode;
  asChild?: boolean;
};
