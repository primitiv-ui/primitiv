import { ComponentProps, ReactNode } from "react";

/**
 * Props for {@link Alert} — all native `<div>` attributes plus the `asChild`
 * escape hatch.
 *
 * The `role` attribute is managed internally and set to `"alert"` regardless
 * of what is passed; there is no need to supply it.
 */
export type AlertProps = ComponentProps<"div"> & {
  /**
   * Renders the child element instead of a native `<div>`, merging
   * `role="alert"` and all other props onto it via {@link Slot}.
   * Useful when you already have a semantic element (e.g. `<section>`,
   * `<aside>`) that should also function as an ARIA alert.
   * @default false
   */
  asChild?: boolean;
  /** The live-region content. Injected after the region is already in the
   * DOM so that assistive technology announces the change. */
  children?: ReactNode;
};
