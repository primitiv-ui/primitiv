# Carousel

Headless, accessible **Carousel** built on native CSS scroll-snap. Implements
the [WAI-ARIA Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/),
ships zero styles, and is fully composable.

The component is built incrementally under strict TDD. This README
documents the surface that exists today.

## Status

Currently exposes:

- **`Carousel.Root`** — labelled `<section>` wrapper with
  `aria-roledescription="carousel"`.
- **`Carousel.Viewport`** — slide container, rendered as a `<div>` with
  a `data-carousel-viewport` attribute the recommended scroll-snap CSS
  targets. Must be rendered as a descendant of `Carousel.Root`; rendering
  it elsewhere throws a descriptive error. Also owns mouse click-and-drag
  scrolling — pointerdown/pointermove track the pointer into
  `scrollLeft`/`scrollTop` (amplified by a sensitivity multiplier) once
  past a small movement threshold (so a link/button inside a slide still
  receives a plain click), flipping a `data-dragging` styling hook for
  the duration; release lets the
  existing `scroll-snap-type` settle to the nearest slide, and a
  horizontal (non-`Shift`) mouse-wheel notch translates to horizontal
  scroll — see "JS vs CSS responsibilities" below for both.
- **`Carousel.Slide`** — an individual slide. Renders a `<div role="group"
aria-roledescription="slide">` and self-registers with the Root so each
  slide knows its zero-based `data-index` and the live `data-total`
  count, even as slides mount and unmount. Each slide is auto-labelled
  `"N of M"` (e.g. `"1 of 3"`); pass `ariaLabel` to override with a more
  meaningful description (e.g. `"Hand-picked for you"`). Emits
  `data-state="active" | "inactive"` tracking the active page, plus a
  `data-carousel-slide` CSS hook. Also emits `data-snap-start` on a
  page's leading slide only (every slide, when `slidesPerPage` is 1) —
  the hook consumer CSS should scope `scroll-snap-align` to, so an
  interior slide of a multi-slide page is never a valid scroll-snap
  resting position (see "Multi-slide snap targeting" below).
- **`Carousel.NextTrigger`** — `<button>` that advances the active page
  by one. `disabled` at the last page, and whenever zero or one slides
  are registered. Consumer `onClick` runs before the navigation;
  consumer-supplied `disabled={true}` is honoured alongside the boundary
  check.
- **`Carousel.PreviousTrigger`** — `<button>` that retreats the active
  page by one. `disabled` at the first page, with the same zero/one-slide
  and consumer-`disabled` semantics as `NextTrigger`.
- **`Carousel.IndicatorGroup`** — labelled `<div role="group">`
  wrapping consumer-mapped indicator dots. Pass `label` (becomes
  `aria-label`) or `ariaLabelledBy`; the discriminated union rejects
  both-or-neither at compile time.
- **`Carousel.Indicator`** — individual `<button>` dot. `index` prop
  targets a zero-based page; clicking jumps to it. Auto-labelled
  `"Slide N"`. The dot at the current page carries
  `aria-disabled="true"` (a soft disable per the WAI-ARIA Carousel
  APG); all dots emit `data-state="active" | "inactive"` and a
  `data-carousel-indicator` CSS hook so consumer styles can paint the
  active dot.
- **`Carousel.Indicators`** — convenience wrapper that auto-renders
  one `Carousel.Indicator` per registered slide. Reuses the same
  discriminated `label` / `ariaLabelledBy` shape as `IndicatorGroup`.
  For custom indicator content, drop down to `IndicatorGroup` +
  `Indicator`.
- **`Carousel.PlayPauseTrigger`** — `<button>` that toggles the
  `playing` flag on Root. Auto-labels itself `"Start automatic slide
show"` / `"Stop automatic slide show"` per the WAI-ARIA Carousel
  APG, exposes a `data-state="playing" | "paused"` styling hook, and
  passes `{ playing }` to a function `children` render prop so
  consumers can swap icons or labels per state.

Pass `autoplay` on `Carousel.Root` to advance the active page on a
timer while `playing` is `true`. Hover, focus, and active-touch
suspend the timer per the WAI-ARIA APG (with a user-initiated play
override), and the viewport's `aria-live` region flips between
`"polite"` and `"off"` so assistive tech doesn't announce every
auto-rotation tick.

## JS vs CSS responsibilities

The component ships zero styles, but a few features sit on the line
between JS and CSS. This table is the contract — the rule of thumb
is that JS owns _what is the active page_ and _scrolls the viewport_
(`viewport.scrollTo`, then the browser's CSS snap engine makes the final
correction), and CSS owns _what the user sees_:

| Feature                            | JS owns                                                  | CSS owns                                                                 |
| ---------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| Active page state                  | `page` / `defaultPage`, `onPageChange`, `goTo`           | —                                                                        |
| Boundary clamping                  | `canGoNext` / `canGoPrevious`, trigger `disabled`        | —                                                                        |
| Crossfade / scale / dissolve       | `data-state="active"` flip on slides                     | `position: absolute`, `opacity` + `transition`                           |
| Slide layout & widths              | —                                                        | `flex-basis` / `inline-size`, `gap`, `aspect-ratio`                      |
| Peek of adjacent slides            | `snapAlign` → viewport `scrollTo` alignment              | Viewport `padding-inline`, slide `flex-basis`, `scroll-snap-align`       |
| Gap between slides                 | —                                                        | `gap` on the viewport (no `spacing` prop — pure CSS)                     |
| Variable-size slides               | viewport `scrollTo` the target slide's offset            | Per-slide width / `aspect-ratio`, `scroll-snap-align`                    |
| Snap targeting                     | `snapAlign: "start" \| "center"` (Root only)             | `scroll-snap-type` on viewport, `scroll-snap-align` scoped to `[data-snap-start]` |
| Reduced motion                     | `behavior: "instant"`                                    | Optional `@media (prefers-reduced-motion: reduce)` on consumer animations |
| Keyboard navigation                | Arrow / Home / End on focused viewport                   | `:focus-visible` on viewport                                             |
| Touch / swipe                      | Native scroll + `scrollsnapchange` to sync state         | `overscroll-behavior-x: contain`, `scrollbar-width: none`                |
| Mouse click-and-drag (`allowMouseDrag`, off by default) | `scrollLeft`/`scrollTop` set from the pointer delta × sensitivity | `cursor: grab`, `cursor: grabbing` on `[data-dragging]` |
| Mouse-wheel scroll (horizontal)    | `deltaY` → `scrollLeft` when `deltaX` is negligible       | —                                                                        |
| Indicator state                    | `data-state` on `[data-carousel-indicator]`              | Visual: dot, bar, thumbnail, etc.                                        |

The only JS prop on the visual side is `snapAlign`, and only because it
picks whether the viewport `scrollTo` aligns the target slide's leading
edge (`"start"`) or centres it (`"center"`) so the programmatic scroll
lands where the browser's CSS snap engine will settle. Everything else is
either a state knob (JS) or a visual rule (CSS), with no overlap.

The scroll is issued on the **viewport element itself** (`viewport.scrollTo`),
never `element.scrollIntoView()` — the latter walks every scrollable
ancestor (including the page/window) and would scroll the whole document
when a carousel is off-screen.

The `apps/workbench` workbench at `/carousel` ships worked recipes for
each cell of the matrix (single / multi / multi-step × slide / fade)
plus peek, variable-size, and programmatic-control examples.

## Usage

Every carousel must have an accessible name. Pass exactly one of `ariaLabel`
or `ariaLabelledBy`:

```tsx
import { Carousel } from "@primitiv-ui/react";

<Carousel.Root ariaLabel="Featured products">
  <Carousel.Viewport>
    <Carousel.Slide>
      <img src="/cube.png" alt="Cube" />
    </Carousel.Slide>
    <Carousel.Slide>
      <img src="/sphere.png" alt="Sphere" />
    </Carousel.Slide>
  </Carousel.Viewport>
  <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
  <Carousel.Indicators label="Choose slide" />
  <Carousel.NextTrigger>Next</Carousel.NextTrigger>
</Carousel.Root>;
```

```tsx
<h2 id="promos">Promotions</h2>
<Carousel.Root ariaLabelledBy="promos">…</Carousel.Root>
```

The discriminated union on the props type rejects shapes that supply both
or neither at compile time.

### Wrapping the slide container

Slides go inside `Carousel.Viewport`:

```tsx
<Carousel.Root ariaLabel="Featured products">
  <Carousel.Viewport>
    <Carousel.Slide>First slide</Carousel.Slide>
    <Carousel.Slide>Second slide</Carousel.Slide>
    <Carousel.Slide>Third slide</Carousel.Slide>
  </Carousel.Viewport>
</Carousel.Root>
```

Each `Carousel.Slide` self-registers with the Root, so every slide
exposes its own `data-index="0"`, `data-index="1"`, … and a live
`data-total` reflecting the current slide count. Add or remove slides at
runtime and the indices and totals update automatically.

Slides are also auto-labelled `"N of M"` (e.g. `"1 of 3"`) — the format
the WAI-ARIA Carousel APG example uses. To override the auto-label with
a more meaningful description, pass `ariaLabel`:

```tsx
<Carousel.Slide ariaLabel="Hand-picked for you">…</Carousel.Slide>
```

The override remains stable as siblings mount and unmount around it.

### Navigating between slides

`Carousel.NextTrigger` and `Carousel.PreviousTrigger` advance and retreat
the active page. Each slide's `data-state` flips between `"active"` and
`"inactive"` so consumer CSS can paint the current slide differently.

#### Uncontrolled

Pass `defaultPage` (or omit it for `0`); the Root owns the active page
internally:

```tsx
<Carousel.Root ariaLabel="Featured products" defaultPage={0}>
  <Carousel.Viewport>
    <Carousel.Slide>First</Carousel.Slide>
    <Carousel.Slide>Second</Carousel.Slide>
    <Carousel.Slide>Third</Carousel.Slide>
  </Carousel.Viewport>
  <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
  <Carousel.NextTrigger>Next</Carousel.NextTrigger>
</Carousel.Root>
```

#### Controlled

Pass `page` and `onPageChange` together to lift state into the parent.
The Root defers every state change back through the callback — clicks
on `NextTrigger` / `PreviousTrigger` invoke `onPageChange` with the
proposed page; the visual reflects whatever `page` value the parent
re-renders with. Useful for syncing two carousels (e.g. a thumbnail
strip), persisting the active page to a URL, or reacting to deep links.

```tsx
const [page, setPage] = useState(0);

<Carousel.Root ariaLabel="Featured products" page={page} onPageChange={setPage}>
  …
</Carousel.Root>;
```

The discriminated union on the props type rejects mixed shapes (e.g.
both `defaultPage` and `page`, or `page` without `onPageChange`) at
compile time.

### Runtime validation

`Carousel.PlayPauseTrigger` rendered under a Root with `autoplay`
disabled (omitted, or `autoplay={false}`) throws on mount —
toggling `playing` is meaningless when no autoplay timer is wired,
and the throw surfaces the misuse during development rather than
shipping a no-op control to users.

`Carousel.Root` also throws once slides have registered if the
active `page` (controlled or `defaultPage`-seeded) is negative or
greater than or equal to the live `totalPages` —
otherwise the carousel would render with no active slide. The throw
is gated on `totalPages > 0` so transient zero-slide initial-render
states don't false-alarm.

### Lightbox composition (with `Modal`)

Two `Carousel.Root`s sharing a controlled `page` stay in sync — pair
a thumbnail strip with a fullscreen viewer mounted inside the
in-tree `Modal`. Gate the inner carousel's `playing` flag on the
modal's `open` so autoplay only runs while the modal is visible:

```tsx
const [page, setPage] = useState(0);
const [open, setOpen] = useState(false);

<>
  <Carousel.Root
    ariaLabel="Featured products — thumbnails"
    page={page}
    onPageChange={setPage}
    slidesPerPage={3}
  >
    <Carousel.Viewport>
      <Carousel.Slide>…</Carousel.Slide>…
    </Carousel.Viewport>
  </Carousel.Root>

  <Modal.Root open={open} onOpenChange={setOpen}>
    <Modal.Trigger>Open lightbox</Modal.Trigger>
    <Modal.Portal>
      <Modal.Content>
        <Carousel.Root
          ariaLabel="Featured products — fullscreen"
          page={page}
          onPageChange={setPage}
          autoplay
          playing={open}
          onPlayingChange={() => {}}
        >
          <Carousel.Viewport>
            <Carousel.Slide>…</Carousel.Slide>…
          </Carousel.Viewport>
          <Carousel.Indicators label="Choose slide" />
        </Carousel.Root>
      </Modal.Content>
    </Modal.Portal>
  </Modal.Root>
</>;
```

`Carousel.Root` doesn't focus anything on mount, so the `Modal`'s
focus management isn't disturbed when the inner carousel mounts.

### Imperative API

For programmatic control from outside the component (e.g. a global
keyboard shortcut, a "skip to last slide" button elsewhere on the
page, or restoring a remembered position on mount), `Carousel.Root`
exposes an imperative handle via `ref`:

```tsx
const carouselRef = useRef<CarouselImperativeApi>(null);

<Carousel.Root ref={carouselRef} ariaLabel="Featured products">
  …
</Carousel.Root>;

carouselRef.current?.next();
carouselRef.current?.previous();
carouselRef.current?.goTo(2);
carouselRef.current?.play();
carouselRef.current?.pause();
carouselRef.current?.refresh();
const { page, totalPages, value } = carouselRef.current!.getProgress();
```

`refresh()` re-issues the viewport's `scrollTo` for the current
page — useful when external layout changes (window resize, container
reflow, dynamic content) leave the scroll position misaligned with
React state. `getProgress()` returns a normalised
`value` in `[0, 1]` (`0` when there's at most one page) plus the
live `page` and `totalPages`, intended for custom progress bars.

Every method routes through the same internal state machine the
trigger components use, so controlled-mode `onPageChange` /
`onPlayingChange` callbacks fire just as if the user had clicked.
`play()` also dismisses the hover/focus pause for the lifetime of
that playing session, matching the WAI-ARIA APG semantics for
user-initiated play.

### `asChild` composition

`Carousel.NextTrigger`, `Carousel.PreviousTrigger`,
`Carousel.PlayPauseTrigger`, and `Carousel.Indicator` all accept an
`asChild` prop. When set, the trigger renders the consumer's child
element via the in-tree `Slot` (instead of its default `<button>`)
and merges every trigger prop — `onClick`, `aria-label`,
`aria-disabled`, `data-state`, custom `id`, etc. — onto it. Useful
for routing links and other elements that need trigger semantics:

```tsx
<Carousel.NextTrigger asChild>
  <a href="/products?page=2">Next</a>
</Carousel.NextTrigger>
```

Because `<a>` and other non-button elements don't honour the HTML
`disabled` attribute, the prev/next triggers also short-circuit
their click handler when boundary clamping says "no further" — so
asChild on a non-button still respects the boundary clamp.

### Snap alignment

By default the Viewport scrolls so the **start (left) edge** of the
target slide aligns with the start edge of the scroll container — matching
`scroll-snap-align: start` in consumer CSS. For layouts where slides are
narrower than the Viewport and centred (e.g. Cover Flow), set
`snapAlign="center"` so programmatic navigation lands on the centred
position without the browser snapping-correcting after the scroll:

```tsx
<Carousel.Root ariaLabel="Gallery" snapAlign="center">
  …
</Carousel.Root>
```

Pair with `scroll-snap-align: center` on `Carousel.Slide` in your CSS.
The default is `"start"`; `snapAlign` picks whether the viewport
`scrollTo` aligns the target slide's leading edge (`"start"`) or centres
it (`"center"`), and the browser's CSS snap engine makes the final
correction.

### Orientation

By default the carousel pages along the **inline (horizontal) axis**.
Pass `orientation="vertical"` to page along the **block (vertical)
axis** instead:

```tsx
<Carousel.Root ariaLabel="Featured products" orientation="vertical">
  …
</Carousel.Root>
```

`orientation` is behavioural, not cosmetic — the primitive ships no
layout. It changes three things:

- **Scroll axis.** Programmatic paging scrolls the viewport on the
  `top` (block) axis instead of `left` (inline), leaving the cross axis
  untouched,
  and the user-swipe sync reads `snapTargetBlock` off `scrollsnapchange`
  instead of `snapTargetInline`.
- **Keyboard.** The viewport pages on `ArrowDown` / `ArrowUp` (the
  horizontal arrows go inert). See [Keyboard navigation](#keyboard-navigation).
- **Styling hook.** The resolved value is published as
  `data-orientation="horizontal" | "vertical"` on the rendered
  `<section>`, so a single selector can switch your layout to a column
  viewport with `scroll-snap-type: y mandatory`:

```css
[data-orientation="vertical"] [data-carousel-viewport] {
  flex-direction: column;
  overflow-block: auto;
  overflow-inline: hidden;
  scroll-snap-type: y mandatory;
}
```

The vertical viewport needs a bounded block-size (a height) for the
scroll axis to exist — give the root or viewport an explicit
`block-size` / `aspect-ratio`.

### Transition modes

`Carousel.Root` accepts a `transition` prop that controls how the
viewport handles slide changes visually. The resolved value is
published on the Root as `data-transition` so consumer CSS can switch
the visual off a single hook (mirroring `data-orientation`).

- `transition="slide"` (default) — relies on native CSS scroll-snap.
  The Viewport scrolls programmatically when the page changes and
  listens for `scrollsnapchange` so user swipes update React state.
- `transition="fade"` — installs no scroll wiring (like `"none"`), but
  names the intent so a styled surface can ship a crossfade by default.
  Native swipe/drag and peek don't apply (there's no scroll to swipe);
  controls, indicators, and keyboard paging still work.
- `transition="none"` — the Viewport installs no scroll wiring at
  all and no default visual is implied. Consumer CSS owns the visual
  via the `data-state="active" | "inactive"` hook on each slide, which
  still flips with the active page.

Both `"fade"` and `"none"` are the entry point for crossfade, dissolve,
zoom, or any CSS-only transition pattern — stack the slides and drive
opacity/transform off `data-state`, keyed off the `data-transition`
hook so the scroll-snap layout isn't affected:

```css
[data-transition="fade"] [data-carousel-slide] {
  grid-area: 1 / 1; /* stack every slide in one cell */
  opacity: 0;
  transition: opacity 400ms;
}
[data-transition="fade"] [data-carousel-slide][data-state="active"] {
  opacity: 1;
}
```

### Reduced motion

The Viewport's programmatic `scrollTo` reads
`window.matchMedia("(prefers-reduced-motion: reduce)")` once on
mount. When the user has reduced motion enabled at the OS level,
page changes use `behavior: "instant"` instead of `"smooth"` so the
carousel doesn't fight that preference. Touch-driven scrolling is
unaffected — the browser owns that animation.

### Programmatic scroll sync

When the active page changes for any reason (`Carousel.NextTrigger` /
`Carousel.PreviousTrigger` click, indicator click, autoplay tick),
the viewport `scrollTo`s to the first slide of the new page (by its
measured offset — not `element.scrollIntoView()`, which would scroll the
whole document when the carousel is off-screen) so the visual surface
tracks React state. Consumer CSS owns slide width and gap, and
`scroll-snap-align` makes the final correction. Default `behavior` is
`"smooth"`.

The reverse path is also wired: when the user swipes the viewport,
the browser fires `scrollsnapchange` with the snapped slide as the
target. The Viewport listens for that event, maps the snapped slide
back to its page (grouping by `slidesPerPage` in `"auto"` mode, or
rounding to the nearest window start in numeric `slidesPerMove` mode,
clamped so an end-aligned tail slide lands on the last page), and calls
`goTo` so React state follows the user's scroll. `onPageChange` is only
invoked when the page genuinely changes, so a snap that lands back on
the active page doesn't dispatch a spurious callback.

For browsers without `scrollsnapchange`, the same path runs against
an `IntersectionObserver` (threshold 0.6) on each slide — when the
observer fires, the lowest-index visible slide derives the active
page via the same slide-index-to-page mapping. This
page-drive is **only** a fallback: when `scrollsnapchange` is
supported it is authoritative (it reports the precisely-snapped
slide), so the observer stands down and does not also drive the page.
That matters for `snapAlign="center"` carousels with several slides
visible at once (e.g. a cover flow) — the lowest-index-visible
heuristic would otherwise track the *leftmost* visible slide rather
than the centred one and fight `scrollsnapchange`. The observer still
always feeds `Carousel.Root`'s imperative `isInView(slideIndex)` so
consumers can lazy-load slide content based on actual visibility, not
just the active-page index.

### Custom DOM ids

For SSR / hydration stability or external `aria-controls` linkage,
pin DOM `id`s on the rendered sub-components via the `ids` bag on
`Carousel.Root`:

```tsx
<Carousel.Root
  ariaLabel="Featured products"
  ids={{
    root: "promo-carousel",
    viewport: "promo-viewport",
    previousTrigger: "promo-prev",
    nextTrigger: "promo-next",
    playPauseTrigger: "promo-play-pause",
    indicatorGroup: "promo-indicators",
  }}
>
  …
</Carousel.Root>
```

Any keys you omit leave the corresponding element unidentified. A
direct `id` prop on a sub-component (e.g.
`<Carousel.NextTrigger id="…">`) wins over `ids.*` because it spreads
last.

### Internationalisation

The component owns four user-visible strings: each slide's auto-
generated `aria-label` (`"N of M"`), each indicator's auto-generated
`aria-label` (`"Slide N"`), and the two `Carousel.PlayPauseTrigger`
accessible names (`"Start automatic slide show"` and
`"Stop automatic slide show"`). Override any subset of them via the
`translations` prop on `Carousel.Root`:

```tsx
<Carousel.Root
  ariaLabel="Produits en vedette"
  translations={{
    slideLabel: ({ index, total }) => `${index} sur ${total}`,
    indicatorLabel: ({ index }) => `Diapositive ${index}`,
    startSlideshow: "Démarrer le diaporama",
    stopSlideshow: "Arrêter le diaporama",
  }}
>
  …
</Carousel.Root>
```

`slideLabel` and `indicatorLabel` are functions (they receive
position info), the slideshow names are plain strings. Any keys you
omit fall back to the English defaults. Per-slide `ariaLabel`
overrides on `Carousel.Slide` still take precedence over
`translations.slideLabel`, so a single slide can carry a
domain-meaningful label (e.g. `"Hand-picked for you"`) without
losing the localised `"N of M"` format on the others.

### Multi-slide pages and partial page advance

Pass `slidesPerPage` (default `1`) to make several slides visible per
page — the "image carousel" / "property cards" pattern. By default,
`Carousel.NextTrigger` / `Carousel.PreviousTrigger` advance one
full page at a time (`slidesPerMove="auto"`):

```tsx
<Carousel.Root ariaLabel="Featured products" slidesPerPage={3}>
  <Carousel.Viewport>
    <Carousel.Slide>1</Carousel.Slide>
    <Carousel.Slide>2</Carousel.Slide>
    <Carousel.Slide>3</Carousel.Slide>
    <Carousel.Slide>4</Carousel.Slide>
    <Carousel.Slide>5</Carousel.Slide>
  </Carousel.Viewport>
  <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
  <Carousel.Indicators label="Choose page" />
  <Carousel.NextTrigger>Next</Carousel.NextTrigger>
</Carousel.Root>
```

With `slidesPerPage={3}` and 5 slides:

- Total pages = `ceil(5 / 3) === 2`. `Carousel.Indicators` renders 2
  dots.
- Page 0 contains slides 0–2; page 1 **end-aligns** to slides 2–4 (a
  full window flush with the track end, not a partial `[3,4]`). A
  partial last page's leading slide can't align to the viewport start,
  so it would snap to the previous slide and desync the active page —
  end-aligning keeps every page a full, cleanly-snapping window (7
  slides at `slidesPerPage={3}` → `[0,1,2] [3,4,5] [4,5,6]`).
- Each slide on the active page emits `data-state="active"`; slides
  on other pages emit `"inactive"`.
- `Carousel.NextTrigger` advances one page per click; the boundary
  clamp is at the last page (so Next is disabled while page 1 is
  active).

The slide-level `aria-label="N of M"` continues to count individual
slides (so a 5-slide carousel announces "1 of 5", "2 of 5", … even
when grouped into 3-per-page).

Pass a numeric `slidesPerMove` to advance the visible window by an
arbitrary slide count per click instead of a full page:

```tsx
<Carousel.Root
  ariaLabel="Featured products"
  slidesPerPage={3}
  slidesPerMove={1}
>
  …
</Carousel.Root>
```

With `slidesPerPage=3`, `slidesPerMove=1`, and 5 slides, the active
window slides one slide at a time — pages show `[0,1,2]`, `[1,2,3]`,
`[2,3,4]`, so `Carousel.Indicators` renders 3 dots and the boundary
clamp respects the last full window. The indicator count formula is
`ceil((total - slidesPerPage) / slidesPerMove) + 1` (vs.
`ceil(total / slidesPerPage)` for `"auto"`), so the visible window
always stays full in numeric mode.

**The last window is end-aligned.** When the move doesn't divide the
track evenly, the final page snaps to the track end rather than dropping
the remainder — so every slide is always reachable. With
`slidesPerPage={3}`, `slidesPerMove={2}`, and 6 slides the pages are
`[0,1,2]`, `[2,3,4]`, `[3,4,5]` (the last shifts back by one to include
slide 5) — never `[0,1,2]`, `[2,3,4]` with slide 5 orphaned.

**Bounds are guarded.** `slidesPerPage` is coerced to an integer ≥ 1 and
a numeric `slidesPerMove` to an integer in `[1, slidesPerPage]`, so a
consumer passing `0`, a negative, a fraction, `NaN`, or a move larger
than a page can never divide by zero, skip past a page (orphaning the
slides in the gap), or make the carousel inert — it degrades to the
nearest sane layout.

### Boundary behaviour

The prev/next triggers clamp at the ends: `Carousel.PreviousTrigger` is
`disabled` at the first slide, `Carousel.NextTrigger` at the last. Both
are also `disabled` when zero or one slides are registered, since
there's nowhere to navigate.

### Keyboard navigation

`Carousel.Viewport` is in the tab order so keyboard users can reach the
rotation control without first tabbing through every slide's
interactive content. With the Viewport focused:

| Key                   | Action                                          |
| --------------------- | ----------------------------------------------- |
| `ArrowRight` / `ArrowDown` | Advance by one page (same as `NextTrigger`)     |
| `ArrowLeft` / `ArrowUp`    | Retreat by one page (same as `PreviousTrigger`) |
| `Home`                | Jump to the first page                          |
| `End`                 | Jump to the last page                           |

The paging arrows follow the [orientation](#orientation): `ArrowRight` /
`ArrowLeft` for the default horizontal axis, `ArrowDown` / `ArrowUp` when
`orientation="vertical"` (the off-axis arrows go inert). `Home` / `End`
work in both. Arrow keys clamp at the boundaries, mirroring the trigger
buttons. Keypresses are only intercepted when the Viewport itself is the
focus target — focus inside a slide (e.g. on a link or form control)
keeps its native arrow-key semantics.

```tsx
<Carousel.Root ariaLabel="Featured products">
  <Carousel.Viewport>
    <Carousel.Slide>First</Carousel.Slide>
    <Carousel.Slide>Second</Carousel.Slide>
    <Carousel.Slide>Third</Carousel.Slide>
  </Carousel.Viewport>
  <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
  <Carousel.NextTrigger>Next</Carousel.NextTrigger>
</Carousel.Root>
```

Consumer-supplied `disabled={true}` on either trigger is honoured
regardless of boundary state — useful for momentarily freezing
navigation while another part of the UI takes over.

### Mouse input

Two mouse interactions ship on `Carousel.Viewport` alongside the native
touch/trackpad scroll that already worked with zero custom code (the
scroll-driven `scrollsnapchange` sync doesn't care how the viewport got
scrolled):

- **Click-and-drag** — **opt-in** via `allowMouseDrag` on `Carousel.Root`
  (default `false`; an unconditionally-on drag could conflict with a
  consumer's own drag-sensitive slide content — a nested carousel, a
  draggable card, a canvas). When enabled: click and hold on the viewport,
  drag, and it scrolls like a swipe — `scrollLeft`/`scrollTop` track the
  pointer, amplified by a 2× sensitivity multiplier so a full-slide
  transition doesn't require dragging the slide's full on-screen width
  (still no momentum/flick — the multiplier only scales the tracked
  delta, motion stops dead on release) once the drag clears a small
  (3px) movement threshold — below the threshold nothing happens, so a
  plain click on a
  link or button inside a slide still reaches it. Releasing the pointer
  lets the existing `scroll-snap-type` settle to the nearest slide, exactly
  like a touch swipe — no extra "scroll → state" wiring needed, the
  `scrollsnapchange` sync already covers it. A `data-dragging` attribute is
  set on the viewport for the duration of an active drag (see "Recommended
  CSS" for the `cursor: grab` / `grabbing` pairing). Ignores non-mouse
  pointer types (`touch`, `pen`) even when enabled — native scroll already
  handles those.
- **Mouse-wheel scroll.** A physical wheel's vertical notches
  (`deltaY`) already natively scroll a `orientation="vertical"`
  carousel — nothing needed there. But browsers only auto-translate a
  plain vertical wheel to horizontal scroll when `Shift` is held, so the
  default horizontal orientation gets no scroll at all from a plain
  wheel without help: the Viewport translates `deltaY` into `scrollLeft`
  whenever `deltaX` is negligible. A trackpad or Magic Mouse horizontal
  swipe already produces real `deltaX` and already scrolls a horizontal
  viewport natively (the same mechanism as touch) — the translation
  stands down whenever `deltaX` is non-negligible so it never fights
  that. `deltaY` is normalized from `DOM_DELTA_LINE` / `DOM_DELTA_PAGE`
  units to pixels first, so a physical wheel's larger, fewer ticks feel
  proportional to a trackpad's many small pixel-mode ones.

Both stand down when `transition` isn't `"slide"` (the viewport isn't a
scrolling track in `"fade"` / `"none"` mode).

### Indicator dots (manual)

For full control over indicator content, map them yourself with
`Carousel.IndicatorGroup` + `Carousel.Indicator`. Each dot's `index`
prop targets a zero-based page; clicking jumps to it.

```tsx
<Carousel.IndicatorGroup label="Choose slide">
  <Carousel.Indicator index={0} />
  <Carousel.Indicator index={1} />
  <Carousel.Indicator index={2} />
</Carousel.IndicatorGroup>
```

Indicators are auto-labelled `"Slide N"` (1-indexed). The dot at the
current page carries `aria-disabled="true"` per the WAI-ARIA APG and
`data-state="active"`; non-active dots carry `aria-disabled="false"`
and `data-state="inactive"`. Style them via the
`data-carousel-indicator` attribute and the `data-state` hook:

```css
[data-carousel-indicator][data-state="active"] {
  background: black;
}
```

### Play / pause control

`Carousel.PlayPauseTrigger` toggles a `playing` flag on the Root. The
flag has the same controlled / uncontrolled split as `page`:

```tsx
// Uncontrolled
<Carousel.Root ariaLabel="Featured products" defaultPlaying={false}>
  <Carousel.PlayPauseTrigger />
</Carousel.Root>;

// Controlled
const [playing, setPlaying] = useState(false);
<Carousel.Root
  ariaLabel="Featured products"
  playing={playing}
  onPlayingChange={setPlaying}
>
  <Carousel.PlayPauseTrigger />
</Carousel.Root>;
```

The discriminated union rejects mixed shapes (e.g. `defaultPlaying` +
`playing`, or `playing` without `onPlayingChange`) at compile time.

Pass a function as `children` to swap icons or labels per state:

```tsx
<Carousel.PlayPauseTrigger>
  {({ playing }) => (playing ? <PauseIcon /> : <PlayIcon />)}
</Carousel.PlayPauseTrigger>
```

The trigger is auto-labelled `"Start automatic slide show"` (paused)
or `"Stop automatic slide show"` (playing) for assistive tech, and
emits `data-state="playing" | "paused"` for consumer CSS.

### Autoplay timer

Pass `autoplay` on `Carousel.Root` to advance the active page on a
timer while `playing` is `true`:

```tsx
// Default 4000ms cadence
<Carousel.Root ariaLabel="Featured products" autoplay defaultPlaying>
  …
</Carousel.Root>

// Custom delay
<Carousel.Root
  ariaLabel="Featured products"
  autoplay={{ delay: 6000 }}
  defaultPlaying
>
  …
</Carousel.Root>
```

The timer reads from the live `playing` flag and the active page —
toggling pause via `Carousel.PlayPauseTrigger` (or via the controlled
`onPlayingChange`) cancels the next tick. The timer stops once the
active page reaches the last slide.

The timer also pauses automatically while the user is hovering the
Root or has focus on a descendant element, per WCAG 2.2.2 (Pause,
Stop, Hide). Focus moving between descendants of the Root (e.g.
tabbing from `Previous` to `Next`) keeps the pause active; the timer
only resumes once the pointer leaves and focus has moved out of the
carousel entirely. The `playing` flag is unaffected — it stays
`true` while suspended, so toggling pause-resume via
`PlayPauseTrigger` continues to behave as the consumer expects.

Touch gestures pause the timer too: `pointerdown` with
`pointerType === "touch"` sets the suspension flag, and any
`pointerup` or `pointercancel` releases it. Mouse / pen
`pointerdown` is filtered out so the existing hover/focus path
keeps owning non-touch interaction without double-suspension.

**User-initiated play overrides the hover/focus pause.** Per the
WAI-ARIA Carousel APG example, when the user explicitly clicks
`PlayPauseTrigger` to start the slideshow, the hover/focus pause is
suspended for the lifetime of that playing session — otherwise the
user would fight a pause every time their pointer was already over
the carousel when they pressed play. The override resets when
`playing` flips back to `false` (via another click, or via an
external state change), so a subsequent play that's _not_ user-
initiated falls back to the standard WCAG pause.

**Viewport live region.** `Carousel.Viewport` is also the live region
for slide changes. Its `aria-live` defaults to `"polite"` so paged
manual navigation is announced to assistive tech, and flips to
`"off"` while autoplay is actively rotating (`autoplay` enabled and
`playing=true`) so screen readers aren't spammed with every tick.
The flip is reactive — pausing via `PlayPauseTrigger` returns the
viewport to `"polite"` for the duration of the pause.

### Indicator dots (auto-rendered)

For the common case of one dot per slide with auto-generated labels,
use `Carousel.Indicators` — it reads the live slide count from
context and renders the right number of dots without any mapping
boilerplate:

```tsx
<Carousel.Root ariaLabel="Featured products">
  <Carousel.Viewport>
    <Carousel.Slide>1</Carousel.Slide>
    <Carousel.Slide>2</Carousel.Slide>
    <Carousel.Slide>3</Carousel.Slide>
  </Carousel.Viewport>
  <Carousel.Indicators label="Choose slide" />
</Carousel.Root>
```

The dot count tracks slide count automatically — add or remove a
slide and the indicator row updates on the next render. For custom
indicator content (thumbnails, numbers, mixed icons), drop down to
the manual `IndicatorGroup` + `Indicator` API above.

## Recommended CSS

The component ships zero styles. The recipe below is the minimum
needed to get a working horizontal carousel with snap-aligned slides,
dot indicators, and sane mobile behaviour. Drop it into your stylesheet
and target the `data-carousel-*` attributes:

```css
[data-carousel-viewport] {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  /* Prevent vertical page scroll from "rubber-banding" into the
     carousel and vice-versa on iOS. */
  overscroll-behavior-x: contain;
  /* Hide native scrollbars on mobile while keeping scroll behaviour. */
  scrollbar-width: none;
}
[data-carousel-viewport]::-webkit-scrollbar {
  display: none;
}

[data-carousel-slide] {
  flex: 0 0 100%;
  scroll-snap-align: start;
  /* Stop the OS picking up images for drag/save during a swipe. */
  -webkit-user-drag: none;
}

/* WCAG 2.5.8: 24×24 minimum hit area; 44×44 recommended for comfort
   on phones. The visible dot stays small via ::before so the button's
   hit area can be larger than its visual footprint. */
[data-carousel-indicator] {
  min-width: 44px;
  min-height: 44px;
  display: inline-grid;
  place-items: center;
}
[data-carousel-indicator]::before {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: lightgray;
}
[data-carousel-indicator][data-state="active"]::before {
  background: black;
}
```

For multi-slide pages (`slidesPerPage={3}`, etc.), tune the slide's
`flex-basis` to share the viewport — e.g. `calc(100% / 3)` for three
slides per page, plus a `gap` on the viewport for the inter-slide
spacing. **Scope `scroll-snap-align` to `[data-snap-start]` instead of
every `[data-carousel-slide]`** once `slidesPerPage > 1` — see
"Multi-slide snap targeting" below; the recipe above is correct as-is
for the single-slide-per-page default, where every slide carries the
hook. For a crossfade transition, use `transition="none"` on
`Carousel.Root` and style the slides absolute-positioned with an
opacity transition keyed off `[data-carousel-slide][data-state="active"]`.

### Multi-slide snap targeting

When `slidesPerPage > 1`, only a page's *leading* slide is a valid
scroll-snap resting position — an interior slide has no page of its
own, so letting the browser's mandatory snap stop there leaves the
viewport showing a straddled mix of two pages while `currentPage` (and
any indicators driven from it) still claim a single clean page is
active. This is easy to hit with incremental input — a mouse wheel
notch or a drag release — that lands mid-page rather than jumping a
full page at once. Scope `scroll-snap-align` to the `data-snap-start`
hook (present only on each page's leading slide, and on every slide
when `slidesPerPage` is 1) rather than applying it to every slide:

```css
[data-carousel-slide] {
  flex: 0 0 calc(100% / 3); /* three slides per page, for example */
}
[data-carousel-slide][data-snap-start] {
  scroll-snap-align: start;
}
```

### Cover Flow (scroll-driven 3D)

A "cover flow" — narrow snap units with cards that tilt away in 3D
and stack with depth — can be built entirely in CSS, with no extra JS,
using scroll-driven animations (`view-timeline` + `animation-timeline`).
The full working source is the workbench example at
`apps/workbench/src/pages/CarouselExample/examples/_coverFlow.scss`;
this section documents the design so it can be reused or ported.

**Structure.** Each slide is a narrow snap unit that owns the named
timelines. Inside it, a card-sized `visual` box is centred over the
snap unit (and overflows it so neighbours interleave) and handles the
`translateX`; inside that, a `card` element handles the `rotateY`.
Keep `perspective()` *inside* the keyframe transform — a `overflow-x`
scroll container flattens a `perspective` CSS property, but the
function form is immune.

**Two timelines, one slide.** The rotate/translate run on a tight
centred band (`view-timeline-inset` shrinks the scrollport) over
`animation-range: contain`. The depth order runs on a *second*,
full-scrollport timeline (`inset: 0`) over `animation-range: cover`.
The wide range matters: `z-index` is an animatable integer, so a
`1 → peak → 1` keyframe driven by each slide's own timeline makes the
most-centred card win the stack generically — no per-slide numbers.
A narrow range would clamp every off-centre slide to the boundary
`z-index`, leaving DOM order to (incorrectly) break the ties on one
side.

**Customising.** Drive every dimension from a small set of custom
properties on the root, and derive the rest with `calc()`:

```css
.cover-flow {
  /* Geometry knobs */
  --cf-viewport-w: 38rem;   /* visible carousel width                  */
  --cf-card-w: 180px;       /* rendered card width                     */
  --cf-aspect: 1.168;       /* width ÷ height — 1 = square, >1 = wide   */
  --cf-snap: 90px;          /* centre-to-centre spacing (< card-w → overlap) */
  --cf-track-pad: 0px;      /* grey track shown above/below the cards   */
  --cf-radius: 10px;
  /* Motion knobs */
  --cf-spread: 1.4;         /* tilt band width, in multiples of --cf-snap */
  --cf-tilt: 55deg;         /* max rotateY of the side cards            */
  --cf-perspective: 500px;
  --cf-shift: 30%;          /* translateX of the card toward centre     */
  --cf-lift: 10;            /* peak z-index of the centred card         */

  /* Derived — leave alone */
  --cf-card-h: calc(var(--cf-card-w) / var(--cf-aspect));
  --cf-viewport-h: calc(var(--cf-card-h) + var(--cf-track-pad) * 2);
  --cf-center-pad: calc(50% - var(--cf-snap) / 2); /* centres first/last card */
  --cf-band: calc(var(--cf-snap) * var(--cf-spread));
}
```

With that in place the three common tweaks are one line each:

- **Viewport size** — set `--cf-viewport-w`. The height follows the
  cards automatically (`card-h + 2·track-pad`), so you rarely set it.
- **Padding / spacing** — `--cf-track-pad` adds grey track above and
  below the cards; `--cf-snap` is the centre-to-centre spacing — the
  smaller it is relative to `--cf-card-w`, the more the cards overlap
  (it also sets the centring gutter).
- **Slide shape** — `--cf-aspect` is width ÷ height (`1` = exact
  square, `>1` = landscape, `<1` = portrait); `--cf-card-w` is the
  rendered size. A 240px square is `--cf-card-w: 240px; --cf-aspect: 1`.

Two gotchas:

- `--cf-aspect` must resolve to a *number*, not a fraction token.
  `--cf-aspect: 16 / 9` lands inside `card-w / aspect` and divides
  twice; use `--cf-aspect: calc(16 / 9)` (or a literal like `1.778`).
- The whole recipe relies on `animation-timeline` and `calc()` length
  division. Wrap it in `@supports (animation-timeline: --x)` and keep
  a static `[data-state="active"] { z-index: var(--cf-lift) }` fallback
  plus `@media (prefers-reduced-motion: reduce) { animation: none }` so
  the carousel degrades to a plain scroll-snap row.
