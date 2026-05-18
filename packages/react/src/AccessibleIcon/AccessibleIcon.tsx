import { Children, cloneElement } from "react";
import { AccessibleIconProps } from "./types";

export function AccessibleIcon({ children }: AccessibleIconProps) {
  const icon = Children.only(children);

  return <>{cloneElement(icon, { "aria-hidden": "true" })}</>;
}

AccessibleIcon.displayName = "AccessibleIcon";
