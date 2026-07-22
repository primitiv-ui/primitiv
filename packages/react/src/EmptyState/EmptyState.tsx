import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";
import {
  EmptyStateActionsProps,
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
 * **Styling hooks.** `EmptyState.Root` emits no `data-*` attributes — it is a
 * static layout component. Target it via `className` or element selectors.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<div>`, merging `role="status"` and all other props in via the
 * {@link Slot} utility.
 *
 * @extends HTMLDivElement
 *
 * @example Conditional empty state (live region)
 * ```tsx
 * {results.length === 0 && (
 *   <EmptyState.Root>
 *     <EmptyState.Title>No results</EmptyState.Title>
 *     <EmptyState.Description>Try a different search.</EmptyState.Description>
 *   </EmptyState.Root>
 * )}
 * ```
 *
 * @example Static empty state (opt out of live region)
 * ```tsx
 * <EmptyState.Root role={undefined}>
 *   <EmptyState.Title>No projects yet</EmptyState.Title>
 * </EmptyState.Root>
 * ```
 *
 * @example asChild — render a `<section>` instead of a `<div>`
 * ```tsx
 * <EmptyState.Root asChild>
 *   <section aria-label="Empty inbox">
 *     <EmptyState.Title>Your inbox is empty</EmptyState.Title>
 *   </section>
 * </EmptyState.Root>
 * ```
 */
export function EmptyStateRoot({
  asChild = false,
  children,
  ...rest
}: EmptyStateRootProps): ReactElement {
  const rootProps = { role: "status", ...rest };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <div {...rootProps}>{children}</div>;
}

// No displayName here: EmptyStateRoot is the object the compound aliases via
// Object.assign (see below), which sets displayName once to "EmptyState". An
// assignment here would be dead — immediately overwritten at module load.

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
 * **Styling hooks.** `EmptyState.Media` emits no `data-*` attributes. Target it
 * via `className` or the `[aria-hidden]` attribute selector.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<div>`, merging `aria-hidden="true"` and all other props in via the
 * {@link Slot} utility.
 *
 * @extends HTMLDivElement
 *
 * @example Decorative icon (default)
 * ```tsx
 * <EmptyState.Media>
 *   <InboxIcon />
 * </EmptyState.Media>
 * ```
 *
 * @example Informative artwork — opt back in to accessibility tree
 * ```tsx
 * <EmptyState.Media aria-hidden={false}>
 *   <img src="/chart.svg" alt="Sales trending to zero" />
 * </EmptyState.Media>
 * ```
 */
export function EmptyStateMedia({
  asChild = false,
  children,
  ...rest
}: EmptyStateMediaProps): ReactElement {
  const mediaProps = { "aria-hidden": true, ...rest };

  if (asChild) {
    return <Slot {...mediaProps}>{children}</Slot>;
  }

  return <div {...mediaProps}>{children}</div>;
}

/** @internal */
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
 * **Styling hooks.** `EmptyState.Title` emits no `data-*` attributes. Target
 * it via `className` or the `p` element selector.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<p>`, merging all props in via the {@link Slot} utility.
 *
 * @extends HTMLParagraphElement
 *
 * @example Default paragraph headline
 * ```tsx
 * <EmptyState.Title>No results found</EmptyState.Title>
 * ```
 *
 * @example Promote to a heading
 * ```tsx
 * <EmptyState.Title asChild>
 *   <h2>No results found</h2>
 * </EmptyState.Title>
 * ```
 */
export function EmptyStateTitle({
  asChild = false,
  children,
  ...rest
}: EmptyStateTitleProps): ReactElement {
  if (asChild) {
    return <Slot {...rest}>{children}</Slot>;
  }

  return <p {...rest}>{children}</p>;
}

/** @internal */
EmptyStateTitle.displayName = "EmptyStateTitle";

/**
 * The supporting copy of an Empty State — renders a `<p>` with the secondary
 * text that explains the situation or suggests a next step (e.g. "Try
 * adjusting your filters").
 *
 * Keep it to guidance the user can act on; the actionable controls themselves
 * belong in {@link EmptyStateActions | `Actions`}.
 *
 * **Styling hooks.** `EmptyState.Description` emits no `data-*` attributes.
 * Target it via `className` or the `p` element selector.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<p>`, merging all props in via the {@link Slot} utility.
 *
 * @extends HTMLParagraphElement
 *
 * @example
 * ```tsx
 * <EmptyState.Description>Try adjusting your filters.</EmptyState.Description>
 * ```
 */
export function EmptyStateDescription({
  asChild = false,
  children,
  ...rest
}: EmptyStateDescriptionProps): ReactElement {
  if (asChild) {
    return <Slot {...rest}>{children}</Slot>;
  }

  return <p {...rest}>{children}</p>;
}

/** @internal */
EmptyStateDescription.displayName = "EmptyStateDescription";

/**
 * The recovery-action slot of an Empty State — renders a `<div>` grouping the
 * controls that let the user move on from the empty state (e.g. a "Clear
 * filters" button or a "Create your first project" link).
 *
 * It is a plain grouping element with no role of its own, so the buttons and
 * links inside keep their native semantics. As a child of
 * {@link EmptyStateRoot | `Root`}'s live region, the control labels are
 * included when the empty state is announced.
 *
 * **Styling hooks.** `EmptyState.Actions` emits no `data-*` attributes. Target
 * it via `className` or the `div` element selector.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<div>`, merging all props in via the {@link Slot} utility.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <EmptyState.Actions>
 *   <button onClick={clearFilters}>Clear filters</button>
 * </EmptyState.Actions>
 * ```
 */
export function EmptyStateActions({
  asChild = false,
  children,
  ...rest
}: EmptyStateActionsProps): ReactElement {
  if (asChild) {
    return <Slot {...rest}>{children}</Slot>;
  }

  return <div {...rest}>{children}</div>;
}

/** @internal */
EmptyStateActions.displayName = "EmptyStateActions";

/** Type of the {@link EmptyState} compound — the Root callable plus its sub-components. */
export type EmptyStateCompound = typeof EmptyStateRoot & {
  /** The `<div role="status">` live region wrapping the placeholder. */
  Root: typeof EmptyStateRoot;
  /** The decorative icon/illustration slot. */
  Media: typeof EmptyStateMedia;
  /** The headline. */
  Title: typeof EmptyStateTitle;
  /** The supporting copy. */
  Description: typeof EmptyStateDescription;
  /** The recovery-action slot. */
  Actions: typeof EmptyStateActions;
};

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
 * - {@link EmptyStateActions | `EmptyState.Actions`} — `<div>`, the
 *   recovery-action slot.
 *
 * All sub-components are stateless and optional — compose only the parts a
 * given empty state needs.
 *
 * @example Full composition
 * ```tsx
 * import { EmptyState } from "@primitiv-ui/react";
 *
 * {results.length === 0 && (
 *   <EmptyState.Root>
 *     <EmptyState.Media>
 *       <SearchIcon />
 *     </EmptyState.Media>
 *     <EmptyState.Title>No results found</EmptyState.Title>
 *     <EmptyState.Description>Try adjusting your filters.</EmptyState.Description>
 *     <EmptyState.Actions>
 *       <button onClick={clearFilters}>Clear filters</button>
 *     </EmptyState.Actions>
 *   </EmptyState.Root>
 * )}
 * ```
 *
 * @example Minimal — title only
 * ```tsx
 * <EmptyState.Root>
 *   <EmptyState.Title>No messages</EmptyState.Title>
 * </EmptyState.Root>
 * ```
 *
 * @see {@link EmptyStateRoot} for the live-region opt-out and `asChild` details.
 * @see {@link EmptyStateMedia} for the `aria-hidden` default and opt-back-in pattern.
 * @see {@link EmptyStateTitle} for the `<p>` default and heading promotion via `asChild`.
 * @see {@link EmptyStateDescription} for secondary copy placement guidance.
 * @see {@link EmptyStateActions} for grouping recovery controls.
 */
const EmptyState: EmptyStateCompound = Object.assign(EmptyStateRoot, {
  Root: EmptyStateRoot,
  Media: EmptyStateMedia,
  Title: EmptyStateTitle,
  Description: EmptyStateDescription,
  Actions: EmptyStateActions,
});

/** @internal */
EmptyState.displayName = "EmptyState";

export { EmptyState };
