import type { ReactElement } from "react";

import { DividerProps } from "./types";

/**
 * A visual and semantic separator between content sections.
 *
 * Renders a `<span role="separator">` with the correct `aria-orientation`
 * attribute. Screen readers announce it as a separator element, which is
 * appropriate when the divider conveys structural meaning (e.g. separating
 * navigation groups or distinct content sections).
 *
 * **Decorative use.** When the divider is purely visual and carries no
 * semantic meaning, pass `aria-hidden="true"` to remove it from the
 * accessibility tree:
 *
 * ```tsx
 * <Divider aria-hidden="true" />
 * ```
 *
 * **Styling hooks.** No styles ship with the component. Use the
 * `aria-orientation` attribute selector to apply orientation-specific styles:
 *
 * ```css
 * [role="separator"][aria-orientation="horizontal"] { height: 1px; width: 100%; }
 * [role="separator"][aria-orientation="vertical"]   { width: 1px; height: 100%; }
 * ```
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

Divider.displayName = "Divider";
