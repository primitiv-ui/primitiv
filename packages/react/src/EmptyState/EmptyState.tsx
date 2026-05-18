import { Slot } from "../Slot";
import {
  EmptyStateDescriptionProps,
  EmptyStateMediaProps,
  EmptyStateRootProps,
  EmptyStateTitleProps,
} from "./types";

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

/**
 * The headline of an Empty State — renders a `<p>` with the short summary of
 * why the view is empty (e.g. "No results found").
 *
 * A `<p>` is the safe default: a headless primitive cannot know the correct
 * heading level for the surrounding document outline. When the empty state
 * stands in for a titled section, promote the title to a real heading with
 * `asChild` so it joins the page's heading hierarchy.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<p>`, merging all props in via the {@link Slot} utility.
 *
 * @example Promote to a heading
 * ```tsx
 * <EmptyState.Title asChild>
 *   <h2>No results found</h2>
 * </EmptyState.Title>
 * ```
 */
function EmptyStateTitle({
  asChild = false,
  children,
  ...rest
}: EmptyStateTitleProps) {
  if (asChild) {
    return <Slot {...rest}>{children}</Slot>;
  }

  return <p {...rest}>{children}</p>;
}

EmptyStateTitle.displayName = "EmptyStateTitle";

/**
 * The supporting copy of an Empty State — renders a `<p>` with the secondary
 * text that explains the situation or suggests a next step (e.g. "Try
 * adjusting your filters").
 *
 * Keep it to guidance the user can act on; the actionable controls themselves
 * belong in {@link EmptyStateActions | `Actions`}.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<p>`, merging all props in via the {@link Slot} utility.
 *
 * @example
 * ```tsx
 * <EmptyState.Description>Try adjusting your filters.</EmptyState.Description>
 * ```
 */
function EmptyStateDescription({
  asChild = false,
  children,
  ...rest
}: EmptyStateDescriptionProps) {
  if (asChild) {
    return <Slot {...rest}>{children}</Slot>;
  }

  return <p {...rest}>{children}</p>;
}

EmptyStateDescription.displayName = "EmptyStateDescription";

type EmptyStateCompound = typeof EmptyStateRoot & {
  Root: typeof EmptyStateRoot;
  Media: typeof EmptyStateMedia;
  Title: typeof EmptyStateTitle;
  Description: typeof EmptyStateDescription;
};

const EmptyState: EmptyStateCompound = Object.assign(EmptyStateRoot, {
  Root: EmptyStateRoot,
  Media: EmptyStateMedia,
  Title: EmptyStateTitle,
  Description: EmptyStateDescription,
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
 * - {@link EmptyStateTitle | `EmptyState.Title`} — `<p>`, the headline.
 * - {@link EmptyStateDescription | `EmptyState.Description`} — `<p>`, the
 *   supporting copy.
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
