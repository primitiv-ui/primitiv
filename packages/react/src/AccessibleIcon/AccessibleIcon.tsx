import { Children, cloneElement, ReactElement } from "react";
import { VisuallyHidden } from "../VisuallyHidden/index.ts";
import { AccessibleIconProps } from "./types";

type DecorativeIconProps = { "aria-hidden": string; focusable: string };

/**
 * Gives an icon-only control an accessible name.
 *
 * Wraps a single decorative icon: the icon element is cloned with
 * `aria-hidden="true"` (removing it from the accessibility tree) and
 * `focusable="false"` (so legacy browsers skip the `<svg>` in the tab
 * order), and a {@link VisuallyHidden} text label is rendered alongside
 * it. The label is announced by assistive technology while the icon
 * stays the only thing on screen.
 *
 * Place it inside an interactive element — the visually hidden label
 * becomes that element's accessible name:
 *
 * @example Icon-only button
 * ```tsx
 * <button>
 *   <AccessibleIcon label="Close dialog">
 *     <CloseIcon />
 *   </AccessibleIcon>
 * </button>
 * ```
 */
export function AccessibleIcon({
  label,
  children,
}: AccessibleIconProps): ReactElement {
  const icon = Children.only(children) as ReactElement<DecorativeIconProps>;

  return (
    <>
      {cloneElement(icon, { "aria-hidden": "true", focusable: "false" })}
      <VisuallyHidden>{label}</VisuallyHidden>
    </>
  );
}

/** @internal */
AccessibleIcon.displayName = "AccessibleIcon";
