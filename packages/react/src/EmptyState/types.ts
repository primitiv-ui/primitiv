import { ComponentProps } from "react";

type WithAsChild = {
  /** Render the consumer's own element instead of the default, via `Slot`. */
  asChild?: boolean;
};

/** Props for {@link EmptyState.Root} — all `<div>` props plus `asChild`. */
export type EmptyStateRootProps = ComponentProps<"div"> & WithAsChild;

/** Props for {@link EmptyState.Media} — all `<div>` props plus `asChild`. */
export type EmptyStateMediaProps = ComponentProps<"div"> & WithAsChild;

/** Props for {@link EmptyState.Title} — all `<p>` props plus `asChild`. */
export type EmptyStateTitleProps = ComponentProps<"p"> & WithAsChild;

/** Props for {@link EmptyState.Description} — all `<p>` props plus `asChild`. */
export type EmptyStateDescriptionProps = ComponentProps<"p"> & WithAsChild;
