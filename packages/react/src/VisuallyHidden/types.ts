import { ComponentProps, ReactNode } from "react";

/**
 * Props for {@link VisuallyHidden} — all native `<span>` attributes plus
 * the `asChild` escape hatch.
 */
export type VisuallyHiddenProps = ComponentProps<"span"> & {
  /**
   * Renders the child element instead of a native `<span>`, merging the
   * clip styles onto it via {@link Slot}. Useful when the hidden content
   * needs specific semantics (e.g. a heading or landmark element). The
   * child must be a single React element. See the `asChild` example on
   * {@link VisuallyHidden}.
   * @default false
   */
  asChild?: boolean;
  /** Content to visually hide. Under `asChild`, becomes the single child element whose clip styles are merged. */
  children?: ReactNode;
};
