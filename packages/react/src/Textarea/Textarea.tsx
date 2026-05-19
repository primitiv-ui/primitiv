import { Slot } from "../Slot";
import { TextareaProps } from "./types";

export function Textarea({
  asChild = false,
  children,
  ref,
  ...rest
}: TextareaProps) {
  if (asChild) {
    return (
      <Slot {...rest} ref={ref}>
        {children}
      </Slot>
    );
  }

  return <textarea {...rest} ref={ref} />;
}

Textarea.displayName = "Textarea";
