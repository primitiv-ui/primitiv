# `carousel` — registry entry

The artefacts `primitiv add carousel` resolves and copies into a consumer repo.
Carousel is a **primitive-backed structural compound** (like `tabs`): a root plus
consumer-composed subcomponents — `Viewport` / `Slide` / `PreviousTrigger` /
`NextTrigger` / `IndicatorGroup` / `Indicator` — flowing through the *same*
`primitiv-emit` generators, over the headless `@primitiv-ui/react` `Carousel`
(native CSS scroll-snap, WAI-ARIA Carousel pattern).

The styled surface is **container-adaptive by default**: the root fills its inline
space and each slide holds its shape with `aspect-ratio`, so the carousel is
responsive without media queries, and it mirrors under RTL because layout is
expressed in logical properties.

> **Scope.** The single-slide surface plus cross-cutting options landed so far:
> **vertical orientation** (`orientation="vertical"` on the headless Root →
> `data-orientation`, a column-scroll viewport with the controls in a column
> beside it), **peek** (the `peek` modifier), **slide spacing** (the `gap` modifier
> — the inter-slide gap on a t-shirt scale), **viewport padding** (the `padding`
> modifier — a padded, framed viewport track), a **composable control-placement
> framework** — a **`placement`** axis (`external` default · `overlay`) crossed
> with a **`cluster`** axis (`split` default · `joined`), plus three shared layout
> axes, **`side`** (`before` / `after` — which cross-axis edge),
> **`distribution`** (`group` / `stretch`) and **`align`** (`start` / `center` /
> `end`), that compose on top of the 2×2 and orientation, an
> **`indicators`** modifier whose `thumbnails` option swaps the dots for image
> thumbnails, and a slide **`ratio`** modifier (square / standard / wide /
> ultrawide) for the slide aspect ratio (all — see below). Multi-slide and autoplay
> land in later iterations (see `docs/carousel-development-log.md`).

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (scroll-snap track, circular controls, dot indicators). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `carousel.recipe.ts` | generated | One `cva` per styled part (from `contract.json`). |
| `carousel.tsx` | generated | The styled wrappers — `Carousel` / `CarouselViewport` / `CarouselSlide` / … (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**; the
SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned to
their source by drift-guard tests (`crates/primitiv-emit/src/{recipe,wrapper,scss}_tests.rs`),
so they can't fall out of sync.

## The contract (`contract.json`)

- **`dataAttributes`** (`source: "auto"`) — the state hooks the headless layer
  emits: `data-state` (`"active"` / `"inactive"`) on the `slide` and `indicator`,
  which the stylesheet styles (the active dot); `data-orientation` and
  `data-transition` on the root (see the transition note below).
- **`root` / `subcomponents` / `modifiers` / `customProperties`** — the authored
  styling conventions: the `.primitiv-carousel` root and the `__viewport` /
  `__slide` / `__controls` / `__prev` / `__next` / `__indicator-group` /
  `__indicator` BEM parts, the modifiers, and the `--primitiv-carousel-*`
  custom-property API. `__controls` is a **presentational subcomponent** —
  `<CarouselControls>`, a plain styled `<div>` (no headless backing) the consumer
  puts prev / indicators / next in; it centres them and spaces the buttons from
  the dots via `--primitiv-carousel-controls-gap` (distinct from the tight
  dot-to-dot `--primitiv-carousel-indicator-gap`, and from the
  `--primitiv-carousel-block-gap` between the viewport and the controls).
- **Modifiers.** A root **`peek`** modifier (`none` default · `sm` · `md` · `lg`)
  re-points `--primitiv-carousel-peek` to reveal a sliver of the adjacent slides;
  it works in **both** orientations (the viewport maps the peek to the inline
  edges when horizontal, the block edges when vertical). A root **`gap`** modifier
  (`none` · `sm` · `md` default · `lg`) re-points `--primitiv-carousel-gap` — the
  spacing between slides — on a t-shirt scale; it runs on the scroll axis in either
  orientation and composes with everything (the slide flex-basis subtracts the gap,
  so multi-slide recomputes automatically). **`peek`, `gap` and `padding` all draw
  from one shared content-spacing ramp** (`--primitiv-carousel-content-space-1…4`,
  the density-scoped `carousel-{slot}-content-space-*` tokens), so their resolved
  steps **breathe with `size` and ambient density** just like the control chrome —
  `gap` picks rungs 1/2/3, `peek`/`padding` rungs 2/3/4 (peek sits one rung above
  gap). At `size="md"` / comfortable the steps are unchanged (gap `8`/`16`/`32`,
  peek/padding `16`/`32`/`48`); the *content dimensions* (viewport/slide fill,
  aspect ratio) stay container-driven — only the spacing steps scale.
  Note the `padding` modifier couples the gap to its inset for a clean framed track,
  so it overrides `gap` inside a padded track. A root **`padding`**
  modifier (`none` default · `sm` · `md` · `lg`) makes the **viewport a padded,
  framed track**: it re-points `--primitiv-carousel-viewport-padding` (inner inset
  on every edge) *and* draws the track **outline** (the
  `--primitiv-carousel-viewport-border-width` / `-border-color` / `-radius` knobs),
  so the viewport is a bordered, rounded box with the slides inset inside it. The
  inter-slide gap is coupled to the padding so the resting track shows clean inset
  breathing room, not an accidental peek; adding `peek` on top reveals a neighbour
  sliver *within* the track. The background **fill is opt-in** via a separate root
  **`surface`** modifier (`none` default · `subtle`, re-pointing
  `--primitiv-carousel-viewport-surface`) — `padding` alone is an outlined track,
  `padding` + `surface="subtle"` a filled one. `padding` `none` (the default) is a
  bare, frameless scroll box. It maps to the scroll axis in either orientation.

  **Control placement is a composable 2×2 plus three shared layout axes.** Two
  orthogonal root modifiers pick the structure: **`placement`** (`external` default ·
  `overlay`) is purely *off vs on the imagery* — `external` keeps the controls in the
  space around the viewport (a CSS grid places them in tracks), `overlay` insets them
  on the slide (absolute); **`cluster`** (`split` default · `joined`) is how they're
  *arranged* — `split` sends prev/next to the viewport's two scroll-axis edges
  (flanking it) and leaves the indicators as a separate cluster, while `joined`
  bundles prev + indicators + next into **one `<CarouselControls>` bar** that travels
  together. Together they are the full matrix — external/overlay × split/joined. On
  top, three **shared control-layout axes** compose (learn them once — they mean the
  same everywhere): **`side`** (`after` default · `before`) — which cross-axis edge
  the indicator cluster (or the joined bar) sits on, *orientation-relative* (`after` =
  below when horizontal, the end/right side when vertical; `before` = above / start),
  so it composes with `orientation` to reach all four physical edges and mirrors under
  RTL; **`distribution`** (`group` default · `stretch`) — how the controls spread
  along their edge (`group` bunches them with a fixed gap; `stretch` is `space-between`
  across the whole edge); and **`align`** (`start` · `center` default · `end`) — where
  a *grouped* cluster sits along its edge (moot under `stretch`). `distribution` /
  `align` position the whole bar for `joined` and the indicator cluster for `split`;
  the defaults (`external` · `split` · `after` · `group` · `center`) put prev/next
  flanking the viewport with a centred dot row below. **Compose the parts inside
  `<CarouselControls>` for `joined`, as direct children of the root for `split`.**

  For **`overlay`**, prev/next absolutely flank the slide edges on a translucent
  `neutral-alpha` scrim and the dots ride a pill overlaid on the slide (no
  `<CarouselControls>` wrapper; the parts are direct children of the root, which
  becomes the positioning context). It re-points the shared control/indicator
  colour knobs to the on-imagery scrim palette via the `--primitiv-carousel-overlay-*`
  knobs, and **composes with `orientation`**: a vertical overlay puts every control
  in a lane on the **inline-end** side — the up control at the top, the dots pill
  centred, the down control at the bottom (the whole lane mirrors to inline-start
  under RTL). The insets clear the viewport-padding frame and the peek gutter on
  whichever axis is the scroll axis, so overlay sits on the slide in both
  orientations, with or without `padding` / `peek`. Because the overlay indicator
  tray is the one indicator context with a visible background, it is **capped to the
  slide** so a long indicator run can't overflow the imagery (or, vertically,
  collide with the up/down controls): both dots (fixed hit area) and thumbnails
  hold their set size and **wrap** onto further rows/columns rather than shrinking.

  For **`external` + `split`**, the prev/next sit **outside** the viewport's two
  scroll-axis edges (left/right when horizontal, top/bottom when vertical) with the
  indicators on a perpendicular side (`side` picks below/above when horizontal,
  right/left when vertical). Like `overlay`, the parts are direct children of the
  root (no `<CarouselControls>` wrapper): the root becomes a grid that places each
  part by area, and the logical templates swap prev/next and the indicators under
  RTL with no extra CSS. The controls keep the default secondary-action fill
  (they're off the imagery). It composes with `indicators="thumbnails"` (the
  external-split + thumbnails cell), `peek`, the slide `ratio`, and **both
  orientations**. A root
  **`indicators`** modifier (`dots` default · `thumbnails`) chooses
  what the indicators look like: `dots` is the compact dot row, while `thumbnails`
  reshapes each indicator button into a rounded-rect image **thumbnail** — the
  gallery pattern — with the active one ringed in the primary colour (the rest
  dimmed until hovered/active). Supply the thumbnail content as children of each
  `<CarouselIndicator>` (an `<img>` or a background element); it re-points the
  group gap to `--primitiv-carousel-thumbnail-gap` and sizes each frame off the
  `--primitiv-carousel-thumbnail-*` knobs. It composes with every placement and
  orientation — under `vertical` the thumbnails stack into a rail beside the
  viewport, under `overlay` they ride a rounded-rect scrim tray (the dots' full pill
  reshapes to match the thumbnail corners) that holds the thumbnails at their set
  size rather than shrinking. **Overlay thumbnails are a size step smaller than
  external's at every slot** (a dedicated `carousel-{slot}-overlay-thumbnail-size`
  ramp) — they sit directly on the slide, so a bigger tray can meaningfully obscure
  the image; external's filmstrip sits in its own chrome track, so it can afford to
  stay bigger. A long **horizontal** overlay strip wraps onto further rows (capped
  to the slide width); a long **vertical** overlay rail deliberately does *not* wrap
  into a second column — width is the scarce axis there (a wrapped column visibly
  eats into the slide), so it stays a single column and **scrolls internally**
  instead, keeping the tray's footprint pinned to one thumbnail wide no matter the
  count.

- **Thumbnails + `slidesPerPage > 1` (grouped indicators).** `<CarouselIndicator
  index={N}>` is **page**-indexed, not slide-indexed — clicking it calls `goTo(N)`
  and its active state is `N === currentPage`. With one slide per page this is
  invisible (slide index === page index); with `slidesPerPage > 1`, map each
  slide's thumbnail through `pageForSlideIndex(slideIndex)` (read off
  `CarouselContext`, the same page-offset/end-alignment math the auto
  `<CarouselIndicators>` dots already use) instead of the raw slide index. Several
  thumbnails then naturally share one `index` value, so they already highlight
  together (the ring above needs no change) and clicking any one of them jumps to
  their shared page. A CSS-only **group border** frames the whole run of
  same-page thumbnails as one unit — built from `:has(+ …)`/adjacent-sibling
  selectors (no JS, no new data attribute), continuous across the group and
  absent entirely for a lone thumbnail (the `slidesPerPage=1` case, unchanged). An
  uneven last page (e.g. 8 slides ÷ 3 per page → groups of 3/3/2) is handled for
  free, since it's the identical page math the dots use. See
  `apps/kitchen-sink/src/pages/CarouselPage.tsx`'s `ThumbnailIndicators` helper for
  the reference wiring.
- The slide **`radius`**
  modifier (`md` default · `none` squares the slide off) and the slide **`ratio`**
  modifier (`square` 1:1 · `standard` 4:3 · `wide` 16:9 default · `ultrawide`
  21:9, re-pointing `--primitiv-carousel-slide-aspect-ratio`) both live on the
  `slide`, not the root — which is why `CarouselSlide` gets the `radius` and
  `ratio` props while `Carousel` gets `peek`, `padding`, `placement`, `side`,
  `distribution`, `align` and `indicators`. (`ratio` is read in the horizontal
  layout; the vertical viewport
  owns its own ratio, so the slide aspect stands down there.)
- **Scaling (`size` + density).** A root **`size`** modifier (`xs` · `sm` · `md`
  default · `lg` · `xl`) scales the **control chrome** while the viewport and slides
  stay container-driven. The prev/next controls track the shared
  `--primitiv-framed-control-{size}-*` ramp, so a carousel control matches a
  same-size `Button` (its box grows 32→40 at `md`) and inherits that ramp's
  per-density values — pick the slot with `size`, and the ambient `data-density`
  shifts every slot. The **whole control chrome scales as a unit**: the dots, their
  WCAG hit area, the active pill, the thumbnails (external and overlay on their own,
  overlay-smaller ramp — see above), the chrome gaps and the overlay pill's inner
  padding all track a bespoke density-scoped `carousel-{slot}-*` ramp,
  the **content-spacing steps** (`peek` / `gap` / `padding`) scale off the shared
  content-space ramp above, and the **corner radius** (slides + the opt-in container
  rounding) scales off a shared `carousel-{slot}-radius` ramp (`md` = `radii-12`). Only
  the viewport/slide **dimensions** (fill + aspect ratio) stay container-driven.
- **Container rounding (`radius`).** A root **`radius`** modifier (`none` default ·
  `md`) opts into rounding the **viewport track** (the scroll box around the slides) to
  the shared scaled radius, so its corners match the slides — independent of the
  `padding` frame (which also rounds to the same scaled radius when on). It rounds the
  track only, not the whole root, so the prev/next focus rings and overlay controls are
  never clipped. Distinct from the per-slide `radius` modifier (which rounds each slide);
  this rounds the track that clips them.
- **Multi-slide (`slidesPerPage` / `slidesPerMove`).** These are **not**
  modifiers — they are **`styleProps`**: numeric props forwarded straight to the
  headless page model *and* written onto `--primitiv-carousel-slides-per-page`
  inline, so **one number drives both** the slide flex-basis (the visible count)
  and the headless maths (indicator count, boundary clamp, active window). This is
  what keeps the dot count honest — a 6-slide carousel at `slidesPerPage={2}`
  renders 3 page-dots (auto) or 5 (with `slidesPerMove={1}`), never 6. `slidesPerMove`
  defaults to `"auto"` (advance a full page); a numeric value slides the window,
  is clamped to `[1, slidesPerPage]`, and end-aligns the last page so no slide is
  orphaned. Any count works (they're plain numbers). Pair them with the auto
  **`<CarouselIndicators>`** (below) so the dot count follows the page model with
  no per-slide wiring.
- **Snap scoping (`data-snap-align`).** `scroll-snap-align` is **not** applied to
  every slide — only to a page's leading slide (the headless primitive publishes
  `data-snap-align="start" | "center"` on it, mirroring the resolved root
  `snapAlign`; every slide carries it at `slidesPerPage={1}`). An interior slide
  of a multi-slide page has no page of its own, so letting the browser's
  mandatory snap stop there would leave the viewport showing a straddled mix of
  two pages while `currentPage`/the indicators still claim one clean page — the
  desync a mouse-wheel notch or a drag release most readily exposes. Scoping the
  CSS to the attribute's *value*, not just its presence, also means a user's own
  scroll settles wherever `snapAlign` targets rather than always the leading edge.

`subcomponents` marks this a **structural compound**: the styled surface is N thin
per-part wrappers the consumer composes. Two indicator surfaces ship: **`<CarouselIndicators>`**
(auto — renders exactly one dot per *page*, the count-correct default for
multi-slide) and the lower-level **`<CarouselIndicatorGroup>` + `<CarouselIndicator>`**
(manual — for custom dot content). The default dot styling targets the group's
child `<button>`s, so both surfaces are styled identically.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API knobs + resting look in
`primitiv.base`, the slide `radius` modifier + control `:hover` / `:active` in
`primitiv.variants`, the active dot + focus ring + disabled controls in
`primitiv.states`.

- **Viewport** — a flex track with native scroll-snap (`x mandatory`, or
  `y mandatory` under `data-orientation="vertical"`, where it becomes a column
  with a landscape `aspect-ratio` and the controls sit beside it),
  `overscroll-behavior` containment, and hidden scrollbars; the headless layer
  syncs React state off `scrollsnapchange`. Click-and-drag scrolling is
  **opt-in** (`<Carousel allowMouseDrag>`, off by default): `cursor: grab`
  only applies under `[data-mouse-drag]` (present only when enabled — a
  grab-cursor affordance would be misleading otherwise), swapping to
  `grabbing` (+ `user-select: none`) while `[data-dragging]` is set (the
  headless layer flips it for the duration of an active drag — pointer
  tracked at a 2× sensitivity multiplier, no momentum). It is also the
  **framed box** — the
  surface / border / radius knobs (off by default) draw the track and
  `box-sizing: border-box` + `overflow` clip the scrolling slides to the rounded
  corners. **Peek** pads the leading/trailing edges (inline or block per
  orientation) and sets a matching `scroll-padding` so the active slide snaps
  inside the padding, revealing the neighbours. **Viewport padding** adds to that
  padding on the scroll axis (plus the cross axis for the frame inset) and draws the
  track outline (border + radius) — a padded track — while coupling the gap so it
  doesn't itself reveal a neighbour; the two compose (padding frames, peek reveals
  within). The **`surface`** modifier opts the track's background fill in (off by
  default, so a framed track is an outline until you add it).
- **Slide** — a `flex-basis` of the viewport's *content* box divided by
  `--primitiv-carousel-slides-per-page` (minus the inter-slide gaps), so it is one
  per view by default and an equal share for a 2-/3-/4-up gallery; the % is of the
  content box, so peek padding narrows it and the neighbours show through. The
  count comes from the `slidesPerPage` prop, which the wrapper writes onto that
  custom property inline (the same number it hands the headless page model).
  `aspect-ratio` for proportional sizing as the container resizes, rounded by
  default (`--primitiv-radii-12`), `overflow: hidden` so imagery clips to the radius.
  It is also a **positioning context** (`position: relative`), so a caption / CTA /
  scrim drops in as an absolutely-positioned child with no extra wrapper.
- **Slide media (real `<img>` / `<picture>` / `<video>`).** The slide *box* is
  always sized by the layout, but a real image is a replaced element with its own
  intrinsic size and ratio — so a **direct media child** is stretched to fill the box
  and `object-fit` decides how it conforms. A **`fit`** slide modifier picks it:
  **`cover`** (default) fills and crops to keep the ratio (best for photography);
  **`contain`** fits the whole image and letterboxes the remainder (best for logos /
  art that must not be cropped). The letterbox backdrop is **opt-in** via a slide
  **`surface`** modifier (`none` default · `subtle`), which fills the slide with the
  same `--primitiv-surface-subtle` token as the root track — off by default so a cover
  image is never tinted. `--primitiv-carousel-slide-object-position` (default
  `center`) is the crop's **focal point**, set per slide (e.g. `object-position: top`).
  The rule targets `> img, > video, > picture (> img)` specifically, so layered
  content (a caption sibling) is left untouched.
  **Consumer's side** (by nature, not the surface's): supplying the asset itself,
  `srcset` / `sizes` for responsive loading, `loading` / `fetchpriority` (eager the
  first slide — it's usually the LCP element — and lazy the rest), and `alt` text.
- **Controls** — **circular** (`50%`), `space-32` square, filled with
  `action-secondary` (matching the design's external-context control); hover /
  active re-point the fill knob.
- **Indicators** — a centred row; each button carries a 44×44-min hit area
  (WCAG 2.5.8) while the visible dot stays small via `::before`; the active dot
  re-points to `action-primary`. The rules target both the manual `__indicator`
  part **and** the group's child `<button>`s, so the auto `<CarouselIndicators>`
  dots (headless buttons with no part class) get the same styling.

- **Transition (`data-transition`)** — the headless `transition` prop
  (`slide` default · `fade` · `none`) publishes `data-transition` on the root.
  Under `[data-transition="fade"]` the stylesheet stops the viewport scrolling,
  stacks every slide in one grid cell, and cross-fades the active slide in over
  the others off its `data-state` hook (timing from the
  `--primitiv-carousel-fade-*` knobs — `motion-duration-overlay` /
  `motion-easing-default` by default). `<Carousel transition="fade">` reaches the
  headless Root directly (a passthrough prop — no modifier), so no extra wiring is
  needed; swipe/drag and peek don't apply in fade mode (there's no scroll), but
  controls, indicators, and keyboard paging still work. `none` behaves the same
  behaviourally but ships no default visual — bring your own CSS.

Focus draws the **shared two-layer ring** (surface gap + brand ring) on the
tabbable viewport and the button parts, restyleable system-wide via the
`--primitiv-focus-ring*` tokens.

**It is yours to edit.** The stable surface is the *contract* (classes, `data-*`,
custom-property names), not these values (RFC 0006 Principle 2). Requires the
token layer (`primitiv tokens`) for the `--primitiv-*` custom properties it
resolves.

## The styled surface (`carousel.recipe.ts` + `carousel.tsx`)

Flat, shadcn-shaped exports the consumer composes over the headless compound:

```tsx
<Carousel ariaLabel="Featured products">
  <CarouselViewport>
    <CarouselSlide><img src="/a.jpg" alt="…" /></CarouselSlide>
    <CarouselSlide radius="none"><img src="/b.jpg" alt="…" /></CarouselSlide>
  </CarouselViewport>
  <CarouselControls>
    <CarouselPreviousTrigger><ChevronLeft /></CarouselPreviousTrigger>
    <CarouselIndicatorGroup label="Choose slide">
      <CarouselIndicator index={0} />
      <CarouselIndicator index={1} />
    </CarouselIndicatorGroup>
    <CarouselNextTrigger><ChevronRight /></CarouselNextTrigger>
  </CarouselControls>
</Carousel>
```

`class-variance-authority` is a **styled-surface** dependency
(`registry.json` → `styles.packages`); the format only selects which stylesheet
defines the rules behind the classes. Drift guards assert each generated artifact
equals the generator's output for the committed contract.
