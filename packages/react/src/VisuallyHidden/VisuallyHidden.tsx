import { VisuallyHiddenProps } from "./types";

export function VisuallyHidden({ children, ...rest }: VisuallyHiddenProps) {
  return <span {...rest}>{children}</span>;
}

VisuallyHidden.displayName = "VisuallyHidden";
