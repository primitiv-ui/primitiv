import { Slot } from "../Slot";
import { InputProps } from "./types";

export function Input({
  asChild = false,
  type = "text",
  disabled,
  children,
  ref,
  ...rest
}: InputProps) {
  const rootProps = {
    ...rest,
    ref,
    disabled,
    "data-disabled": disabled ? "" : undefined,
  };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <input type={type} {...rootProps} />;
}

Input.displayName = "Input";
