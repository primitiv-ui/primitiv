/*
 * EmptyState — styled wrapper, HAND-AUTHORED (composes the headless
 * EmptyState compound).
 *
 * Not generated: the media + title + description + actions anatomy has no
 * generator-emitted shape (unlike a single-primitive wrapper), so — like
 * `alert`/`chip`/`code-block` — this file carries no drift-guard test. Keep
 * contract.json + the stylesheet + this file in sync by hand.
 *
 * Compound (like `card`), NOT props-based (like `alert`). The rule is that the
 * registry surface mirrors the headless surface's shape: `alert`/`chip` take
 * props because their headless primitive is a single element, whereas this
 * one's headless primitive is a five-part compound, so every part is exposed.
 * That keeps the things a props API would quietly forbid: promoting the title
 * to a real heading with `asChild`, putting something between the description
 * and the actions, reordering parts, or omitting the title entirely.
 *
 * Every part is a thin class-applying pass-through — all behaviour, `asChild`,
 * and the `role`/`aria-hidden` defaults stay in the headless primitive.
 *
 * `EmptyStateActions` takes real registry `Button`s as children, so there is no
 * "Action Button" alias — the slot is open-ended, the way Card's Footer treats
 * its buttons. Nothing here imports the registry `button`, so this component
 * has no `dependsOn.components`.
 */
import { EmptyState as EmptyStatePrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { emptyState, type EmptyStateVariants } from "./empty-state.recipe";

/**
 * Explicit literal unions (not derived from `EmptyStateVariants`, which
 * `class-variance-authority`'s inference can widen to a bare `string`
 * depending on how the recipe was declared).
 */
type Orientation = "vertical" | "horizontal";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const cx = (...names: (string | undefined)[]) => names.filter(Boolean).join(" ");

export type EmptyStateProps = ComponentPropsWithRef<typeof EmptyStatePrimitive.Root> &
  Omit<EmptyStateVariants, "orientation" | "size"> & {
    /**
     * Layout axis. `vertical` stacks the media above centred text — the
     * canonical empty state. `horizontal` places the media beside
     * inline-start-aligned text, for a compact/inline empty region.
     * @default "vertical"
     */
    orientation?: Orientation;
    /**
     * Empty-state size; `data-density` scales each size further.
     * @default "md"
     */
    size?: Size;
  };

/**
 * The placeholder shown when a collection, search, or view has no content — a
 * decorative media slot, a headline, supporting copy, and recovery actions,
 * centred in the space it fills. Composes the headless `EmptyState` primitive
 * (`role="status"`, so it is announced politely when it replaces absent
 * content).
 *
 * The root fills and centres inside whatever box it is given — it carries no
 * padding of its own, because padding is the container's job.
 *
 * @example
 * ```tsx
 * <EmptyState>
 *   <EmptyStateMedia><SearchIcon /></EmptyStateMedia>
 *   <EmptyStateTitle>No results found</EmptyStateTitle>
 *   <EmptyStateDescription>Try adjusting your filters.</EmptyStateDescription>
 *   <EmptyStateActions>
 *     <Button onClick={clearFilters}>Clear filters</Button>
 *   </EmptyStateActions>
 * </EmptyState>
 * ```
 *
 * @example Promote the title to a real heading, and opt out of the live region
 * ```tsx
 * <EmptyState role={undefined} orientation="horizontal" size="sm">
 *   <EmptyStateTitle asChild>
 *     <h2>No projects yet</h2>
 *   </EmptyStateTitle>
 * </EmptyState>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/empty-state
 */
export function EmptyState({ orientation, size, className, ...props }: EmptyStateProps) {
  return (
    <EmptyStatePrimitive.Root
      className={cx(emptyState({ orientation, size }), className)}
      {...props}
    />
  );
}

export type EmptyStateMediaProps = ComponentPropsWithRef<typeof EmptyStatePrimitive.Media>;

/**
 * The decorative icon or illustration. Renders the headless
 * `EmptyState.Media`, which is `aria-hidden` — the title and description carry
 * the meaning. An `<svg>` child is scaled to the size's `media-size` box
 * automatically, so it needs no sizing props of its own.
 */
export function EmptyStateMedia({ className, ...props }: EmptyStateMediaProps) {
  return (
    <EmptyStatePrimitive.Media
      className={cx("primitiv-empty-state__media", className)}
      {...props}
    />
  );
}

export type EmptyStateTitleProps = ComponentPropsWithRef<typeof EmptyStatePrimitive.Title>;

/**
 * The headline — a short summary of why the view is empty (e.g. "No results
 * found"). Renders a `<p>`; pass `asChild` with a real heading when the empty
 * state stands in for a titled section, so it joins the document outline.
 */
export function EmptyStateTitle({ className, ...props }: EmptyStateTitleProps) {
  return (
    <EmptyStatePrimitive.Title
      className={cx("primitiv-empty-state__title", className)}
      {...props}
    />
  );
}

export type EmptyStateDescriptionProps = ComponentPropsWithRef<
  typeof EmptyStatePrimitive.Description
>;

/**
 * Supporting copy explaining the situation or suggesting a next step. Capped to
 * the size's `max-inline-size` so it stays a readable column however wide the
 * container is.
 */
export function EmptyStateDescription({ className, ...props }: EmptyStateDescriptionProps) {
  return (
    <EmptyStatePrimitive.Description
      className={cx("primitiv-empty-state__description", className)}
      {...props}
    />
  );
}

export type EmptyStateActionsProps = ComponentPropsWithRef<typeof EmptyStatePrimitive.Actions>;

/**
 * The recovery controls — pass real registry `Button`s. Laid out as a hugging
 * row that never stretches to the container width, wrapping instead of
 * overflowing when the container is narrow.
 */
export function EmptyStateActions({ className, ...props }: EmptyStateActionsProps) {
  return (
    <EmptyStatePrimitive.Actions
      className={cx("primitiv-empty-state__actions", className)}
      {...props}
    />
  );
}
