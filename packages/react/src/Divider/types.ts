import { ComponentProps } from "react";

/**
 * Props for the {@link Divider} component. Extends the native `<span>` props
 * with an optional `orientation`.
 */
export type DividerProps = ComponentProps<"span"> & {
  /** Axis the separator runs along. Defaults to `"horizontal"`. */
  orientation?: "horizontal" | "vertical";
};
