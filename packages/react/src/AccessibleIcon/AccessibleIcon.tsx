import { Children, cloneElement, ReactElement } from "react";
import { VisuallyHidden } from "../VisuallyHidden/index.ts";
import { AccessibleIconProps } from "./types";

type DecorativeIconProps = { "aria-hidden": string; focusable: string };

/**
 * Gives an icon-only control an accessible name without adding a visible label.
 *
 * Wraps a single decorative icon element and performs two mutations via
 * `cloneElement`:
 *
 * - Sets `aria-hidden="true"` on the icon, removing the purely decorative
 *   graphic from the accessibility tree.
 * - Sets `focusable="false"` on the icon, so legacy browsers (IE/Edge
 *   classic) do not place the `<svg>` in the tab order.
 *
 * The {@link AccessibleIconProps.label | `label`} string is rendered
 * alongside the icon inside a {@link VisuallyHidden} span — invisible on
 * screen but announced by assistive technology. When `AccessibleIcon` is
 * placed inside an interactive element (`<button>`, `<a>`, etc.), the
 * hidden label becomes that element's accessible name. A screen reader
 * will announce, for example, "Close dialog, button" rather than nothing.
 *
 * **Runtime validation.** `children` must be exactly **one** React
 * element. Passing zero, multiple, or a plain string throws a React
 * `Children.only` error. Wrap the glyph in a single `<svg>` or component
 * if your icon library returns a fragment.
 *
 * **Renders no host element.** `AccessibleIcon` returns a React fragment
 * (`<>…</>`), so it adds no DOM node of its own. The icon element and the
 * {@link VisuallyHidden} span are the only nodes emitted.
 *
 * @example Icon-only button
 * ```tsx
 * <button>
 *   <AccessibleIcon label="Close dialog">
 *     <CloseIcon />
 *   </AccessibleIcon>
 * </button>
 * ```
 *
 * @example Icon-only link
 * ```tsx
 * <a href="/home">
 *   <AccessibleIcon label="Go to home page">
 *     <HomeIcon />
 *   </AccessibleIcon>
 * </a>
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
