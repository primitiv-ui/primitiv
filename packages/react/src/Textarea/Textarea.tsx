import { Slot } from "../Slot";
import { TextareaProps } from "./types";

export function Textarea({
  asChild = false,
  disabled,
  children,
  ref,
  ...rest
}: TextareaProps) {
  const rootProps = {
    ...rest,
    ref,
    disabled,
    "data-disabled": disabled ? "" : undefined,
  };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <textarea {...rootProps} />;
}

Textarea.displayName = "Textarea";
