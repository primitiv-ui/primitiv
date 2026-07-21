import type { ReactElement } from "react";

import { DividerProps } from "./types";

/**
 * A headless `<span role="separator">` that marks a visual and semantic
 * boundary between content sections.
 *
 * Renders a native `<span>` with `role="separator"` and the matching
 * `aria-orientation` attribute. Screen readers announce it as a separator,
 * which is appropriate when the divider conveys genuine structural meaning
 * (e.g. separating navigation groups or distinct content areas).
 *
 * **Decorative use.** When the divider is purely visual and carries no
 * semantic meaning, pass `aria-hidden="true"` to remove it from the
 * accessibility tree entirely:
 *
 * ```tsx
 * <Divider aria-hidden="true" />
 * ```
 *
 * **Styling hooks.** No styles ship with the component. Because Divider
 * emits no `data-*` attributes, target the rendered element via the
 * `aria-orientation` attribute selector or a `className`:
 *
 * ```css
 * [role="separator"][aria-orientation="horizontal"] { height: 1px; width: 100%; background: currentColor; }
 * [role="separator"][aria-orientation="vertical"]   { width: 1px; height: 100%; background: currentColor; }
 * ```
 *
 * ```tsx
 * <Divider className="my-divider" />
 * <Divider orientation="vertical" className="my-divider--vertical" />
 * ```
 *
 * @extends HTMLSpanElement
 *
 * @example Horizontal (default)
 * ```tsx
 * <Divider />
 * ```
 *
 * @example Vertical
 * ```tsx
 * <Divider orientation="vertical" />
 * ```
 *
 * @example Decorative — hidden from screen readers
 * ```tsx
 * <Divider aria-hidden="true" />
 * ```
 *
 * @example With a className
 * ```tsx
 * <Divider className="my-section-rule" />
 * ```
 */
export function Divider({
  orientation = "horizontal",
  className = "",
  ...rest
}: DividerProps): ReactElement {
  return (
    <span
      role="separator"
      aria-orientation={orientation}
      className={className}
      {...rest}
    />
  );
}

/** @internal */
Divider.displayName = "Divider";
