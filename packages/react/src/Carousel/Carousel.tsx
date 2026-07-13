import { forwardRef, MouseEvent, useCallback } from "react";
import type {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  ReactElement,
  RefAttributes,
} from "react";

import { Slot } from "../Slot/index.ts";
import { CarouselProvider } from "./CarouselContext";
import {
  useCarouselContext,
  useCarouselRoot,
  useCarouselSlide,
  useCarouselViewport,
} from "./hooks/index.ts";
import type {
  CarouselImperativeApi,
  CarouselRootProps,
  CarouselViewportProps,
  CarouselSlideProps,
  CarouselNextTriggerProps,
  CarouselPreviousTriggerProps,
  CarouselIndicatorGroupProps,
  CarouselIndicatorProps,
  CarouselIndicatorsProps,
  CarouselPlayPauseTriggerProps,
  CarouselProgressTextProps,
} from "./types";

/**
 * The root of a Carousel widget. Renders a `<section>` with
 * `aria-roledescription="carousel"` so assistive technology announces
 * the widget as a carousel rather than a generic region, per the
 * WAI-ARIA Carousel pattern.
 *
 * Every carousel must have an accessible name. Pass exactly one of:
 *
 * - `ariaLabel` — a short human-readable description (e.g.
 *   `"Featured products"`).
 * - `ariaLabelledBy` — the `id` of an existing heading or label element.
 *
 * The discriminated union on the props type rejects both-or-neither at
 * compile time.
 *
 * **Orientation.** Pass `orientation="vertical"` to page along the block
 * axis instead of the inline axis: the viewport scroll-snaps vertically,
 * the viewport `ArrowDown` / `ArrowUp` keys advance / retreat (the
 * horizontal arrows go inert), and the resolved value is published as
 * `data-orientation` on the rendered `<section>` so consumer CSS can
 * switch layout off a single hook. Defaults to `"horizontal"`.
 *
 * Supports two **page-state modes**, statically discriminated at the type
 * level so only one of the two shapes is accepted by TypeScript:
 *
 * - **Uncontrolled** — pass `defaultPage` (or omit it and start at `0`).
 *   The component owns and updates the active page internally.
 * - **Controlled** — pass `page` *and* `onPageChange` together. The
 *   parent owns the active page; the component defers every state
 *   change back through the callback.
 *
 * @example Labelled inline, uncontrolled
 * ```tsx
 * <Carousel.Root ariaLabel="Featured products" defaultPage={0}>…</Carousel.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [page, setPage] = useState(0);
 *
 * <Carousel.Root
 *   ariaLabel="Featured products"
 *   page={page}
 *   onPageChange={setPage}
 * >
 *   …
 * </Carousel.Root>
 * ```
 *
 * @example Labelled by an existing heading
 * ```tsx
 * <h2 id="promos">Promotions</h2>
 * <Carousel.Root ariaLabelledBy="promos">…</Carousel.Root>
 * ```
 */
export const CarouselRoot: ForwardRefExoticComponent<
  PropsWithoutRef<CarouselRootProps> & RefAttributes<CarouselImperativeApi>
> = forwardRef<CarouselImperativeApi, CarouselRootProps>(function CarouselRoot(
  {
    className = "",
    ariaLabel,
    ariaLabelledBy,
    defaultPage,
    page,
    onPageChange,
    defaultPlaying,
    playing,
    onPlayingChange,
    autoplay,
    onAutoplayStatusChange,
    slidesPerPage,
    slidesPerMove,
    translations,
    ids,
    transition,
    snapAlign,
    orientation,
    allowMouseDrag,
    onDragStatusChange,
    onOverscrollStatusChange,
    inViewThreshold,
    snapType,
    children,
    ...rest
  },
  imperativeRef,
) {
  const { contextValue, rootHandlers } = useCarouselRoot(
    {
      defaultPage,
      page,
      onPageChange,
      defaultPlaying,
      playing,
      onPlayingChange,
      autoplay,
      onAutoplayStatusChange,
      slidesPerPage,
      slidesPerMove,
      translations,
      ids,
      transition,
      snapAlign,
      orientation,
      allowMouseDrag,
      onDragStatusChange,
      onOverscrollStatusChange,
      inViewThreshold,
      snapType,
    },
    imperativeRef,
  );

  return (
    <CarouselProvider value={contextValue}>
      <section
        aria-roledescription="carousel"
        data-orientation={contextValue.orientation}
        data-transition={contextValue.transition}
        className={className}
        {...(ariaLabel !== undefined && { "aria-label": ariaLabel })}
        {...(ariaLabelledBy !== undefined && {
          "aria-labelledby": ariaLabelledBy,
        })}
        {...(contextValue.ids.root !== undefined && {
          id: contextValue.ids.root,
        })}
        {...rootHandlers}
        {...rest}
      >
        {children}
      </section>
    </CarouselProvider>
  );
});

CarouselRoot.displayName = "CarouselRoot";

/**
 * The slide container — the scrollable surface that holds
 * `Carousel.Slide` children. Rendered as a `<div>` with a
 * `data-carousel-viewport` attribute that the recommended scroll-snap
 * CSS targets (see this component's README for the recipe).
 *
 * The viewport must be rendered as a descendant of `Carousel.Root`;
 * rendering it elsewhere throws a descriptive error so misuse surfaces
 * during development rather than as silent ARIA breakage.
 *
 * **Live region.** The viewport is also the live region for slide
 * changes: `aria-live="polite"` so paged navigation is announced to
 * assistive tech, flipping to `aria-live="off"` while autoplay is
 * actively rotating so screen readers don't get spammed with every
 * tick.
 *
 * **Styling hooks.** `data-carousel-viewport` is set on the rendered
 * element. The component ships no styles — apply your own scroll-snap
 * recipe via this attribute. `data-snap-type="mandatory" | "proximity"`
 * mirrors the resolved root {@link CarouselRootProps.snapType | `snapType`}
 * — scope `scroll-snap-type`'s strictness to it. `data-mouse-drag` is
 * present whenever `allowMouseDrag` is `true` (a persistent hook — the
 * natural place for a `cursor: grab` affordance, since showing that cursor
 * when dragging isn't actually enabled would be misleading); `data-dragging`
 * is additionally present only for the duration of an active drag (see
 * below) — pair it with `cursor: grabbing`.
 *
 * **Keyboard navigation.** The Viewport is in the tab order
 * (`tabIndex={0}`) so keyboard users can reach the rotation control
 * without first tabbing through every slide's interactive content.
 * With the Viewport focused:
 *
 * - `ArrowRight` advances by one page (same as `Carousel.NextTrigger`).
 * - `ArrowLeft` retreats by one page (same as `Carousel.PreviousTrigger`).
 * - `Home` jumps to the first page.
 * - `End` jumps to the last page.
 *
 * Arrow keys clamp at the boundaries, mirroring the trigger buttons.
 * Keypresses are only intercepted when the Viewport itself is the focus
 * target — focus inside a slide (e.g. on a link or form control) keeps
 * its native arrow-key semantics.
 *
 * **Mouse click-and-drag** — opt-in via {@link CarouselRootProps.allowMouseDrag |
 * `allowMouseDrag`} on `Carousel.Root` (default `false`; an
 * unconditionally-on drag could conflict with a consumer's own
 * drag-sensitive slide content). When enabled: click and hold, then drag,
 * and the viewport scrolls like a swipe: `scrollLeft`/`scrollTop` track
 * the pointer, amplified by a sensitivity multiplier (no momentum — the
 * multiplier only scales the tracked delta, motion still stops dead on
 * release), once the drag clears a small movement threshold — below it,
 * nothing happens, so a plain click on a link/button inside a slide
 * still reaches it. Release lets `scroll-snap-type` settle to the
 * nearest slide (the same `scrollsnapchange` sync a touch swipe already
 * drives). A `data-dragging` attribute is set for the duration of an
 * active drag. Only `pointerType === "mouse"` is handled — touch/pen
 * already scroll natively regardless of this prop.
 *
 * **Mouse-wheel scroll.** A physical wheel's vertical notches already
 * scroll a `orientation="vertical"` carousel natively. On the default
 * horizontal orientation, a plain vertical wheel notch (`deltaY`)
 * translates into horizontal scroll — browsers only do this
 * automatically when `Shift` is held. Stands down whenever `deltaX` is
 * non-negligible, so a trackpad/Magic Mouse horizontal swipe (which
 * already scrolls a horizontal viewport natively via `deltaX`) is never
 * fought.
 *
 * **Overscroll.** Pushing against a boundary with nowhere further to go —
 * via the keyboard, the wheel, or a mouse drag — fires the root's
 * {@link CarouselRootProps.onOverscrollStatusChange | `onOverscrollStatusChange`}.
 * A mouse drag past a boundary additionally sets a persistent
 * `data-overscroll="start" | "end"` attribute on the Viewport for the
 * duration (removed once the drag stops pushing past it, whether by
 * reversing back within bounds or releasing) — the natural hook for a
 * rubber-band resistance visual. Keyboard/wheel overscroll is a single
 * instantaneous tap with no equivalent sustained DOM state. Native
 * touch/swipe overscroll (OS-level rubber-banding) isn't covered — that's
 * browser-owned scroll physics with no JS hook to observe it from.
 *
 * @example
 * ```tsx
 * <Carousel.Root ariaLabel="Featured products">
 *   <Carousel.Viewport>
 *     <Carousel.Slide>…</Carousel.Slide>
 *   </Carousel.Viewport>
 * </Carousel.Root>
 * ```
 */
export function CarouselViewport({
  className = "",
  children,
  ...rest
}: CarouselViewportProps): ReactElement {
  const { isAutoRotating, ids, allowMouseDrag, snapType } =
    useCarouselContext();
  const {
    viewportRef,
    onKeyDown,
    onDragStart,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
  } = useCarouselViewport();

  return (
    <div
      ref={viewportRef}
      data-carousel-viewport=""
      data-snap-type={snapType}
      tabIndex={0}
      className={className}
      aria-live={isAutoRotating ? "off" : "polite"}
      onKeyDown={onKeyDown}
      onDragStart={onDragStart}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={onClickCapture}
      {...(allowMouseDrag && { "data-mouse-drag": "" })}
      {...(ids.viewport !== undefined && { id: ids.viewport })}
      {...rest}
    >
      {children}
    </div>
  );
}

/** @internal */
CarouselViewport.displayName = "CarouselViewport";

/**
 * An individual slide. Renders a `<div>` with `role="group"` and
 * `aria-roledescription="slide"` per the WAI-ARIA Carousel pattern, so
 * assistive technology announces each slide as a discrete group rather
 * than a generic region.
 *
 * **Self-registration.** On mount, every slide registers itself with
 * `Carousel.Root` via a callback ref. The Root maintains an ordered list
 * of registered slide keys, which is how the slide knows its own
 * zero-based `data-index` and how every slide receives the live
 * `data-total` count. Slides may be added or removed at runtime; the
 * indices and totals update automatically.
 *
 * **Auto-labelling.** Each slide is labelled `"N of M"` (e.g. `"1 of 3"`)
 * using its live index and the live total — the format the WAI-ARIA
 * Carousel APG example uses, and what most screen readers expect. Pass
 * {@link CarouselSlideProps.ariaLabel | `ariaLabel`} to override the
 * auto-label with a more meaningful description (e.g.
 * `"Hand-picked for you"`).
 *
 * **Styling hooks.**
 * - `data-carousel-slide` — CSS-targeting attribute (recommended scroll-snap
 *   recipe targets `[data-carousel-slide]`).
 * - `data-index="N"` — the slide's zero-based position in registration order.
 * - `data-total="N"` — the live total slide count.
 * - `data-snap-align="start" | "center" | "end"` — present only on a page's
 *   leading slide (every slide when `slidesPerPage` is 1), valued from this
 *   slide's own {@link CarouselSlideProps.snapAlign | `snapAlign`} prop if
 *   set, else the root's resolved `snapAlign`. The registry stylesheet
 *   scopes `scroll-snap-align` to this hook, both so an interior slide of a
 *   multi-slide page is never a valid scroll-snap resting position, and so
 *   the native resting position agrees with `snapAlign` rather than always
 *   being `"start"`.
 *
 * Must be rendered as a descendant of `Carousel.Root`; rendering it
 * elsewhere throws a descriptive error.
 *
 * @example Auto-labelled
 * ```tsx
 * <Carousel.Viewport>
 *   <Carousel.Slide>First slide</Carousel.Slide>
 *   <Carousel.Slide>Second slide</Carousel.Slide>
 * </Carousel.Viewport>
 * ```
 *
 * @example Override the auto-label
 * ```tsx
 * <Carousel.Slide ariaLabel="Hand-picked for you">…</Carousel.Slide>
 * ```
 *
 * @example Per-slide snap alignment (overrides the root default)
 * ```tsx
 * <Carousel.Slide snapAlign="end">…</Carousel.Slide>
 * ```
 */
export function CarouselSlide({
  className = "",
  ariaLabel,
  snapAlign: snapAlignOverride,
  children,
  ...rest
}: CarouselSlideProps): ReactElement {
  const { slideRef, index, total, state, snapAlign } =
    useCarouselSlide(snapAlignOverride);
  const { translations } = useCarouselContext();
  const autoLabel =
    index >= 0 && total > 0
      ? translations.slideLabel({ index: index + 1, total })
      : undefined;
  const label = ariaLabel ?? autoLabel;

  return (
    <div
      ref={slideRef}
      role="group"
      aria-roledescription="slide"
      data-carousel-slide=""
      data-index={index}
      data-total={total}
      data-state={state}
      className={className}
      {...(label !== undefined && { "aria-label": label })}
      {...(snapAlign !== undefined && { "data-snap-align": snapAlign })}
      {...rest}
    >
      {children}
    </div>
  );
}

/** @internal */
CarouselSlide.displayName = "CarouselSlide";

/**
 * Advances the active page by one. Renders as
 * `<button type="button">` and dispatches the consumer's `onClick`
 * before invoking the navigation, so analytics handlers and similar
 * still fire when the user advances the carousel.
 *
 * **Boundary clamping.** The trigger is `disabled` once the active page
 * reaches the last slide; the click is also a no-op at boundaries
 * because `next()` short-circuits when there's nowhere to go. The
 * button is always disabled when there are zero or one slides
 * registered. Consumer-supplied `disabled={true}` is also honoured (it
 * OR's with the boundary check).
 *
 * Must be rendered as a descendant of `Carousel.Root`; rendering it
 * elsewhere throws a descriptive error.
 *
 * @example
 * ```tsx
 * <Carousel.NextTrigger>Next</Carousel.NextTrigger>
 * ```
 */
export function CarouselNextTrigger({
  className = "",
  onClick,
  disabled,
  asChild = false,
  children,
  ...rest
}: CarouselNextTriggerProps): ReactElement {
  const { next, canGoNext, ids } = useCarouselContext();
  const isDisabled = disabled === true || !canGoNext;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      // Guard runs in addition to the HTML disabled attribute on the
      // default <button> path. With asChild on a non-button element
      // there's no native disabled to block the click, so this is the
      // only barrier.
      if (isDisabled) return;
      next();
    },
    [next, onClick, isDisabled],
  );

  const triggerProps = {
    className,
    onClick: handleClick,
    disabled: isDisabled,
    "aria-disabled": isDisabled,
    ...(ids.nextTrigger !== undefined && { id: ids.nextTrigger }),
    ...rest,
  };

  if (asChild) {
    return <Slot {...triggerProps}>{children}</Slot>;
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

/** @internal */
CarouselNextTrigger.displayName = "CarouselNextTrigger";

/**
 * Retreats the active page by one. Renders as
 * `<button type="button">` and dispatches the consumer's `onClick`
 * before invoking the navigation, so analytics handlers and similar
 * still fire when the user retreats the carousel.
 *
 * **Boundary clamping.** The trigger is `disabled` while the active
 * page is the first slide; the click is also a no-op at boundaries
 * because `previous()` short-circuits when there's nowhere to go. The
 * button is always disabled when there are zero or one slides
 * registered. Consumer-supplied `disabled={true}` is also honoured.
 *
 * Must be rendered as a descendant of `Carousel.Root`; rendering it
 * elsewhere throws a descriptive error.
 *
 * @example
 * ```tsx
 * <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
 * ```
 */
export function CarouselPreviousTrigger({
  className = "",
  onClick,
  disabled,
  asChild = false,
  children,
  ...rest
}: CarouselPreviousTriggerProps): ReactElement {
  const { previous, canGoPrevious, ids } = useCarouselContext();
  const isDisabled = disabled === true || !canGoPrevious;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (isDisabled) return;
      previous();
    },
    [previous, onClick, isDisabled],
  );

  const triggerProps = {
    className,
    onClick: handleClick,
    disabled: isDisabled,
    "aria-disabled": isDisabled,
    ...(ids.previousTrigger !== undefined && { id: ids.previousTrigger }),
    ...rest,
  };

  if (asChild) {
    return <Slot {...triggerProps}>{children}</Slot>;
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

/** @internal */
CarouselPreviousTrigger.displayName = "CarouselPreviousTrigger";

/**
 * A `<div role="group">` wrapping consumer-mapped `Carousel.Indicator`
 * dots. Use this when you want manual control over how the dots are
 * rendered (e.g. mixing custom content into each one). For the common
 * case of one auto-rendered dot per page, prefer `Carousel.Indicators`.
 *
 * Every group must have an accessible name. Pass exactly one of:
 *
 * - `label` — a short human-readable description of the picker (e.g.
 *   `"Choose slide"`).
 * - `ariaLabelledBy` — the `id` of an existing heading or label element.
 *
 * The discriminated union on the props type rejects both-or-neither at
 * compile time.
 *
 * Must be rendered as a descendant of `Carousel.Root`; rendering it
 * elsewhere throws a descriptive error.
 *
 * @example
 * ```tsx
 * <Carousel.IndicatorGroup label="Choose slide">
 *   <Carousel.Indicator index={0} />
 *   <Carousel.Indicator index={1} />
 *   <Carousel.Indicator index={2} />
 * </Carousel.IndicatorGroup>
 * ```
 */
export function CarouselIndicatorGroup({
  className = "",
  label,
  ariaLabelledBy,
  children,
  ...rest
}: CarouselIndicatorGroupProps): ReactElement {
  const { ids } = useCarouselContext();

  return (
    <div
      role="group"
      className={className}
      {...(label !== undefined && { "aria-label": label })}
      {...(ariaLabelledBy !== undefined && {
        "aria-labelledby": ariaLabelledBy,
      })}
      {...(ids.indicatorGroup !== undefined && { id: ids.indicatorGroup })}
      {...rest}
    >
      {children}
    </div>
  );
}

/** @internal */
CarouselIndicatorGroup.displayName = "CarouselIndicatorGroup";

/**
 * An individual indicator dot — a `<button>` that jumps to the page at
 * `index` (zero-based) when clicked. Auto-labelled `"Slide N"` (where
 * `N = index + 1`) so the page-position is announced to assistive tech.
 *
 * **Active-state ARIA.** The indicator at `currentPage` carries
 * `aria-disabled="true"` per the WAI-ARIA Carousel APG — a soft disable
 * that tells screen readers "you're already on this slide" without
 * removing it from the focus order. Non-active indicators carry
 * `aria-disabled="false"`. Both states also flip `data-state` between
 * `"active"` and `"inactive"` so consumer CSS can paint the active dot.
 *
 * **`readOnly`.** When `true`, the indicator becomes a presentational-only
 * progress dot instead of a navigation control: it renders a `<span>` (no
 * button semantics), carries `aria-hidden="true"` (it's decorative, not
 * announced), and clicking it no longer calls `goTo` — for a carousel whose
 * only navigation is e.g. `allowMouseDrag`, where clickable dots would be a
 * redundant/misleading control. It still tracks `data-state`, so CSS-driven
 * progress display keeps working, and the consumer's own `onClick` (if
 * passed) still fires — only the internal navigation is suppressed.
 *
 * **Styling hooks.**
 * - `data-carousel-indicator` — CSS-targeting attribute.
 * - `data-state="active" | "inactive"` — tracks the current page.
 *
 * Must be rendered as a descendant of `Carousel.Root`; rendering it
 * elsewhere throws a descriptive error.
 *
 * @example
 * ```tsx
 * <Carousel.Indicator index={0} />
 * <Carousel.Indicator index={0} readOnly />
 * ```
 */
export function CarouselIndicator({
  className = "",
  index,
  onClick,
  readOnly = false,
  asChild = false,
  children,
  ...rest
}: CarouselIndicatorProps): ReactElement {
  const { goTo, currentPage, translations } = useCarouselContext();
  const isActive = index === currentPage;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!readOnly) goTo(index);
    },
    [goTo, index, onClick, readOnly],
  );

  const indicatorProps = {
    className,
    "data-carousel-indicator": "",
    "data-state": isActive ? "active" : "inactive",
    onClick: handleClick,
    ...(readOnly
      ? { "aria-hidden": true }
      : {
          "aria-label": translations.indicatorLabel({ index: index + 1 }),
          "aria-disabled": isActive,
        }),
    ...rest,
  };

  if (asChild) {
    return <Slot {...indicatorProps}>{children}</Slot>;
  }

  if (readOnly) {
    return <span {...indicatorProps}>{children}</span>;
  }

  return (
    <button type="button" {...indicatorProps}>
      {children}
    </button>
  );
}

/** @internal */
CarouselIndicator.displayName = "CarouselIndicator";

/**
 * Convenience wrapper that auto-renders one `Carousel.Indicator` per
 * registered slide — the "dots between Prev and Next" you'd reach for
 * in 90% of carousels. Internally renders a `Carousel.IndicatorGroup`
 * containing one `Carousel.Indicator` per entry in the slide-key list,
 * keyed by the slide's stable `useId` so React doesn't shuffle the
 * dots when slides mount or unmount in the middle of the range.
 *
 * For full control over indicator content (e.g. dots that show
 * thumbnail previews on hover), drop down to
 * `Carousel.IndicatorGroup` + `Carousel.Indicator` instead.
 *
 * `readOnly` forwards to every generated indicator — see
 * `Carousel.Indicator`'s own `readOnly` doc.
 *
 * Must be rendered as a descendant of `Carousel.Root`; rendering it
 * elsewhere throws a descriptive error.
 *
 * @example
 * ```tsx
 * <Carousel.Indicators label="Choose slide" />
 * <Carousel.Indicators label="Progress" readOnly />
 * ```
 */
export function CarouselIndicators({
  readOnly,
  ...props
}: CarouselIndicatorsProps): ReactElement {
  const { totalPages } = useCarouselContext();

  return (
    <CarouselIndicatorGroup {...props}>
      {Array.from({ length: totalPages }, (_, index) => (
        <CarouselIndicator key={index} index={index} readOnly={readOnly} />
      ))}
    </CarouselIndicatorGroup>
  );
}

/** @internal */
CarouselIndicators.displayName = "CarouselIndicators";

/**
 * A `<button>` that toggles the carousel's `playing` flag. Renders the
 * accessible name dictated by the WAI-ARIA Carousel APG by default —
 * `"Start automatic slide show"` when paused, `"Stop automatic slide
 * show"` when playing — and exposes the live `playing` flag both as a
 * `data-state="playing" | "paused"` styling hook and to a function
 * `children` render prop, so consumers can swap icons or labels per
 * state without re-implementing the toggle:
 *
 * ```tsx
 * <Carousel.PlayPauseTrigger>
 *   {({ playing }) => (playing ? <PauseIcon /> : <PlayIcon />)}
 * </Carousel.PlayPauseTrigger>
 * ```
 *
 * Static children also work — useful when you want a single icon and
 * style it via `[data-state]` selectors.
 *
 * Must be rendered as a descendant of `Carousel.Root`; rendering it
 * elsewhere throws a descriptive error. The autoplay timer that
 * advances the page when `playing` flips to `true` lands in cycle 12.
 */
export function CarouselPlayPauseTrigger({
  className = "",
  onClick,
  asChild = false,
  children,
  ...rest
}: CarouselPlayPauseTriggerProps): ReactElement {
  const { playing, togglePlaying, translations, ids, autoplayEnabled } =
    useCarouselContext();

  if (!autoplayEnabled) {
    throw new Error(
      "Carousel.PlayPauseTrigger requires autoplay to be enabled on Carousel.Root",
    );
  }

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      togglePlaying();
    },
    [onClick, togglePlaying],
  );

  const renderedChildren =
    typeof children === "function" ? children({ playing }) : children;

  const triggerProps = {
    className,
    "aria-label": playing
      ? translations.stopSlideshow
      : translations.startSlideshow,
    "data-state": playing ? "playing" : "paused",
    onClick: handleClick,
    ...(ids.playPauseTrigger !== undefined && { id: ids.playPauseTrigger }),
    ...rest,
  };

  if (asChild) {
    return <Slot {...triggerProps}>{renderedChildren}</Slot>;
  }

  return (
    <button type="button" {...triggerProps}>
      {renderedChildren}
    </button>
  );
}

/** @internal */
CarouselPlayPauseTrigger.displayName = "CarouselPlayPauseTrigger";

/**
 * A `<span>` rendering the live active-page progress as text — `"1 of
 * 3"` by default, via `translations.progressText`. Closes the gap
 * between the imperative `getProgress()` data and an actual DOM node a
 * consumer can drop in without wiring the announcement themselves.
 *
 * ```tsx
 * <Carousel.ProgressText />
 * ```
 *
 * Pass `children` to render custom content instead of the default
 * translated text (e.g. an icon alongside the count) — the computed
 * text is only used as a fallback.
 *
 * Must be rendered as a descendant of `Carousel.Root`; rendering it
 * elsewhere throws a descriptive error (via the shared Carousel
 * context guard).
 */
export function CarouselProgressText({
  children,
  ...rest
}: CarouselProgressTextProps): ReactElement {
  const { currentPage, totalPages, translations } = useCarouselContext();

  return (
    <span {...rest}>
      {children ??
        translations.progressText({ page: currentPage, totalPages })}
    </span>
  );
}

/** @internal */
CarouselProgressText.displayName = "CarouselProgressText";

/** Static-property shape of the compound {@link Carousel} export: the callable {@link CarouselRoot} plus its namespaced sub-components. */
type CarouselCompound = typeof CarouselRoot & {
  Root: typeof CarouselRoot;
  Viewport: typeof CarouselViewport;
  Slide: typeof CarouselSlide;
  NextTrigger: typeof CarouselNextTrigger;
  PreviousTrigger: typeof CarouselPreviousTrigger;
  IndicatorGroup: typeof CarouselIndicatorGroup;
  Indicator: typeof CarouselIndicator;
  Indicators: typeof CarouselIndicators;
  PlayPauseTrigger: typeof CarouselPlayPauseTrigger;
  ProgressText: typeof CarouselProgressText;
};

/**
 * Headless, accessible **Carousel** — a compound component implementing the
 * WAI-ARIA Carousel pattern with zero styles.
 *
 * `Carousel` is both callable (it's an alias of {@link CarouselRoot |
 * `Carousel.Root`}) and carries its sub-components as static properties.
 * Prefer the namespaced form in application code for readability:
 *
 * - {@link CarouselRoot | `Carousel.Root`} — the labelled `<section>`
 *   that wraps the entire widget.
 * - {@link CarouselViewport | `Carousel.Viewport`} — the slide
 *   container that the recommended scroll-snap CSS targets.
 * - {@link CarouselSlide | `Carousel.Slide`} — an individual slide,
 *   self-registering with the Root for live index / total tracking.
 * - {@link CarouselNextTrigger | `Carousel.NextTrigger`} — advances
 *   the active page by one.
 * - {@link CarouselPreviousTrigger | `Carousel.PreviousTrigger`} —
 *   retreats the active page by one.
 * - {@link CarouselIndicatorGroup | `Carousel.IndicatorGroup`} — a
 *   labelled `<div role="group">` for consumer-mapped dot indicators.
 * - {@link CarouselIndicator | `Carousel.Indicator`} — an individual
 *   `<button>` that jumps to a target page when clicked.
 * - {@link CarouselIndicators | `Carousel.Indicators`} — convenience
 *   wrapper that auto-renders one indicator per registered slide.
 *
 * @example
 * ```tsx
 * import { Carousel } from "@primitiv-ui/react";
 *
 * <Carousel.Root ariaLabel="Featured products">
 *   <Carousel.Viewport>
 *     <Carousel.Slide>First</Carousel.Slide>
 *     <Carousel.Slide>Second</Carousel.Slide>
 *   </Carousel.Viewport>
 *   <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
 *   <Carousel.Indicators label="Choose slide" />
 *   <Carousel.NextTrigger>Next</Carousel.NextTrigger>
 * </Carousel.Root>
 * ```
 */
const CarouselCompound: CarouselCompound = Object.assign(CarouselRoot, {
  Root: CarouselRoot,
  Viewport: CarouselViewport,
  Slide: CarouselSlide,
  NextTrigger: CarouselNextTrigger,
  PreviousTrigger: CarouselPreviousTrigger,
  IndicatorGroup: CarouselIndicatorGroup,
  Indicator: CarouselIndicator,
  Indicators: CarouselIndicators,
  PlayPauseTrigger: CarouselPlayPauseTrigger,
  ProgressText: CarouselProgressText,
});

CarouselCompound.displayName = "Carousel";

export { CarouselCompound as Carousel };
