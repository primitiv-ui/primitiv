import { ComponentProps } from "react";

/**
 * Props for {@link Divider} — all native `<span>` attributes plus an
 * `orientation` that controls both the visual axis and the `aria-orientation`
 * value announced to assistive technology.
 */
export type DividerProps = ComponentProps<"span"> & {
  /**
   * Axis the separator runs along. Sets `aria-orientation` on the rendered
   * `<span role="separator">` so screen readers announce the correct
   * orientation. Use `"horizontal"` for row-dividing rules and
   * `"vertical"` for column-dividing rules.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
};
