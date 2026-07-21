import { ComponentProps } from "react";

/** Mixin adding the `asChild` opt-in to a sub-component's props. */
export type WithAsChild = {
  /**
   * When `true`, renders the consumer's own element instead of the
   * sub-component's default host element, merging all props (aria-*, data-*,
   * event handlers) onto it via the `Slot` utility. The child must be a single
   * React element. For `EmptyState.Root` and `EmptyState.Media`, the implicit
   * `role="status"` / `aria-hidden="true"` are also forwarded through `Slot`.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link EmptyStateRoot | `EmptyState.Root`} — all native `<div>`
 * attributes plus the `asChild` escape hatch.
 *
 * The root renders `role="status"` by default, creating a polite ARIA live
 * region. Override with `role={undefined}` for a static empty state that has
 * nothing to announce on appearance.
 */
export type EmptyStateRootProps = ComponentProps<"div"> & WithAsChild;

/**
 * Props for {@link EmptyStateMedia | `EmptyState.Media`} — all native `<div>`
 * attributes plus the `asChild` escape hatch.
 *
 * The media wrapper renders `aria-hidden="true"` by default, hiding decorative
 * artwork from assistive technology. Pass `aria-hidden={false}` and provide an
 * accessible name when the artwork is genuinely informative.
 */
export type EmptyStateMediaProps = ComponentProps<"div"> & WithAsChild;

/**
 * Props for {@link EmptyStateTitle | `EmptyState.Title`} — all native `<p>`
 * attributes plus the `asChild` escape hatch.
 *
 * Renders a `<p>` by default. Use `asChild` to substitute a heading element
 * (`<h2>`, `<h3>`, etc.) when the empty state stands in for a titled section
 * and needs to participate in the document's heading hierarchy.
 */
export type EmptyStateTitleProps = ComponentProps<"p"> & WithAsChild;

/**
 * Props for {@link EmptyStateDescription | `EmptyState.Description`} — all
 * native `<p>` attributes plus the `asChild` escape hatch.
 *
 * Renders a `<p>` for secondary supporting copy that explains the situation or
 * suggests a next step. Actionable controls belong in
 * {@link EmptyStateActionsProps | `EmptyState.Actions`} rather than here.
 */
export type EmptyStateDescriptionProps = ComponentProps<"p"> & WithAsChild;

/**
 * Props for {@link EmptyStateActions | `EmptyState.Actions`} — all native
 * `<div>` attributes plus the `asChild` escape hatch.
 *
 * Renders a plain `<div>` with no ARIA role of its own, so buttons and links
 * placed inside it retain their native semantics. The element is a child of the
 * `role="status"` live region, so its text content is included in the
 * announcement.
 */
export type EmptyStateActionsProps = ComponentProps<"div"> & WithAsChild;
