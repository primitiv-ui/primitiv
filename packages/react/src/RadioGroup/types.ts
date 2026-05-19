import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Which arrow keys navigate the group. `"both"` (default) accepts all
 * four; `"horizontal"` only Arrow Left/Right; `"vertical"` only Arrow
 * Up/Down.
 */
export type RadioGroupOrientation = "horizontal" | "vertical" | "both";

type RadioGroupRootBaseProps = Omit<ComponentProps<"div">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  asChild?: boolean;
  orientation?: RadioGroupOrientation;
};

type RadioGroupRootUncontrolledProps = RadioGroupRootBaseProps & {
  defaultValue?: string;
  value?: never;
  onValueChange?: (value: string) => void;
};

type RadioGroupRootControlledProps = RadioGroupRootBaseProps & {
  defaultValue?: never;
  value: string;
  onValueChange: (value: string) => void;
};

export type RadioGroupRootProps =
  | RadioGroupRootUncontrolledProps
  | RadioGroupRootControlledProps;

export type RadioGroupItemProps = Omit<
  ComponentProps<"button">,
  "type" | "role" | "aria-checked" | "value"
> & {
  value: string;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  asChild?: boolean;
};

export type RadioGroupIndicatorProps = ComponentProps<"span"> & {
  children?: ReactNode;
  forceMount?: boolean;
  asChild?: boolean;
};
