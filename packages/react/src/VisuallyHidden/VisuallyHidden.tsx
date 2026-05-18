import { CSSProperties } from "react";
import { VisuallyHiddenProps } from "./types";

const visuallyHiddenStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

export function VisuallyHidden({
  children,
  style,
  ...rest
}: VisuallyHiddenProps) {
  return (
    <span {...rest} style={{ ...visuallyHiddenStyle, ...style }}>
      {children}
    </span>
  );
}

VisuallyHidden.displayName = "VisuallyHidden";
