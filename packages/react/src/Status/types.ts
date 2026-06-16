import { ComponentProps } from "react";

/**
 * Props for {@link Status} — all native `<div>` attributes plus the
 * `asChild` escape hatch.
 */
export type StatusProps = ComponentProps<"div"> & {
  asChild?: boolean;
};
