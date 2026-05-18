import { Slot } from "../Slot";
import { EmptyStateMediaProps, EmptyStateRootProps } from "./types";

/**
 * The root of an Empty State — renders a `<div role="status">` wrapping the
 * placeholder shown when a collection, search, or view has no content.
 *
 * The `status` role makes the root a polite live region (implicit
 * `aria-live="polite"`, `aria-atomic="true"`). Render the `EmptyState`
 * conditionally — in place of the absent content — so that when it appears
 * after a filter or search returns nothing, assistive technology announces
 * it once the user is idle, without interrupting them.
 *
 * Opt out of the live region by passing `role={undefined}` for an empty
 * state that is part of the initial, static page.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<div>`, merging `role="status"` and all other props in via the
 * {@link Slot} utility.
 *
 * @example
 * ```tsx
 * {results.length === 0 && (
 *   <EmptyState.Root>
 *     <EmptyState.Title>No results</EmptyState.Title>
 *     <EmptyState.Description>Try a different search.</EmptyState.Description>
 *   </EmptyState.Root>
 * )}
 * ```
 */
function EmptyStateRoot({
  asChild = false,
  children,
  ...rest
}: EmptyStateRootProps) {
  const rootProps = { role: "status", ...rest };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <div {...rootProps}>{children}</div>;
}

EmptyStateRoot.displayName = "EmptyStateRoot";

/**
 * The illustration slot of an Empty State — renders a `<div aria-hidden="true">`
 * wrapping a decorative icon or illustration.
 *
 * Empty-state artwork is decorative: the {@link EmptyStateTitle | `Title`} and
 * {@link EmptyStateDescription | `Description`} carry the meaning. `Media` is
 * therefore hidden from assistive technology by default, so screen-reader
 * users are not read a redundant or meaningless image. If the artwork is
 * genuinely informative, pass `aria-hidden={false}` and give it an accessible
 * name yourself.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<div>`, merging `aria-hidden="true"` and all other props in via the
 * {@link Slot} utility.
 *
 * @example
 * ```tsx
 * <EmptyState.Media>
 *   <InboxIcon />
 * </EmptyState.Media>
 * ```
 */
function EmptyStateMedia({
  asChild = false,
  children,
  ...rest
}: EmptyStateMediaProps) {
  const mediaProps = { "aria-hidden": true, ...rest };

  if (asChild) {
    return <Slot {...mediaProps}>{children}</Slot>;
  }

  return <div {...mediaProps}>{children}</div>;
}

EmptyStateMedia.displayName = "EmptyStateMedia";

type EmptyStateCompound = typeof EmptyStateRoot & {
  Root: typeof EmptyStateRoot;
  Media: typeof EmptyStateMedia;
};

const EmptyState: EmptyStateCompound = Object.assign(EmptyStateRoot, {
  Root: EmptyStateRoot,
  Media: EmptyStateMedia,
});

/**
 * Headless, accessible **Empty State** — a stateless compound component for
 * the placeholder shown when a collection, search, or view has no content.
 *
 * `EmptyState` is both callable (an alias of {@link EmptyStateRoot |
 * `EmptyState.Root`}) and carries its sub-components as static properties.
 * Prefer the namespaced form in application code:
 *
 * - {@link EmptyStateRoot | `EmptyState.Root`} — `<div role="status">`, the
 *   polite live region wrapping the placeholder.
 * - {@link EmptyStateMedia | `EmptyState.Media`} — `<div aria-hidden="true">`,
 *   the decorative icon/illustration slot.
 *
 * @example
 * ```tsx
 * import { EmptyState } from "@primitiv/react";
 *
 * {projects.length === 0 && (
 *   <EmptyState.Root>No projects yet</EmptyState.Root>
 * )}
 * ```
 */
EmptyState.displayName = "EmptyState";

export { EmptyState };
