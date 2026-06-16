import { ComponentProps } from "react";

/**
 * Props for {@link VisuallyHidden} — all native `<span>` attributes plus
 * the `asChild` escape hatch.
 */
export type VisuallyHiddenProps = ComponentProps<"span"> & {
  asChild?: boolean;
};
