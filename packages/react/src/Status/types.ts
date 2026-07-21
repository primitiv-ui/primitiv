import { ComponentProps, ReactNode } from "react";

/**
 * Props for {@link Status} — all native `<div>` attributes plus the
 * `asChild` escape hatch.
 */
export type StatusProps = ComponentProps<"div"> & {
  /**
   * Renders the child element instead of a native `<div>`, merging
   * `role="status"` and all other props onto it via {@link Slot}.
   * Event handlers compose with the child's own handlers (child runs
   * first). Use this to apply the live-region role to a semantically
   * appropriate element (e.g. `<output>`).
   * @default false
   */
  asChild?: boolean;
  /** Content to announce. A live region announces changes that occur
   * after the region is already present in the DOM. */
  children?: ReactNode;
};
