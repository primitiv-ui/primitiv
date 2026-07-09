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
> beside it), **peek** (the `peek` modifier), **viewport padding** (the `padding`
> modifier — a padded, framed viewport track), a **`placement`** modifier whose
> `overlay` option insets the controls on the imagery, and an **`indicators`**
> modifier whose `thumbnails` option swaps the dots for image thumbnails (both —
> see below). The remaining placements (external-flank, controls-on-top),
> multi-slide, and autoplay land in later iterations (see
> `docs/carousel-development-log.md`).

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
  edges when horizontal, the block edges when vertical). A root **`padding`**
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
  bare, frameless scroll box. It maps to the scroll axis in either orientation. A
  root **`placement`**
  modifier (`row` default · `overlay`) chooses where the controls sit: `row`
  keeps prev / dots / next in a flow row below (composed in a `<CarouselControls>`
  wrapper), while `overlay` insets the controls on the imagery — prev/next
  absolutely flanking the slide edges on a translucent `neutral-alpha` scrim and
  the dots in a pill overlaid on the slide (no `<CarouselControls>` wrapper; the parts are
  direct children of the root, which becomes the positioning context). It
  re-points the shared control/indicator colour knobs to the on-imagery scrim
  palette via the `--primitiv-carousel-overlay-*` knobs, and **composes with
  `orientation`**: a vertical overlay puts every control in a lane on the
  **inline-end** side — the up control at the top, the dots pill centred, the down
  control at the bottom — so they don't sit over the middle of the imagery (the
  whole lane mirrors to inline-start under RTL). The insets clear the
  viewport-padding frame and the peek gutter on whichever axis is the scroll axis,
  so overlay sits on the slide in both orientations, with or without `padding` /
  `peek`. A root **`indicators`** modifier (`dots` default · `thumbnails`) chooses
  what the indicators look like: `dots` is the compact dot row, while `thumbnails`
  reshapes each indicator button into a rounded-rect image **thumbnail** — the
  gallery pattern — with the active one ringed in the primary colour (the rest
  dimmed until hovered/active). Supply the thumbnail content as children of each
  `<CarouselIndicator>` (an `<img>` or a background element); it re-points the
  group gap to `--primitiv-carousel-thumbnail-gap` and sizes each frame off the
  `--primitiv-carousel-thumbnail-*` knobs. It composes with every placement and
  orientation — under `vertical` the thumbnails stack into a rail beside the
  viewport, under `overlay` they ride the scrim pill. The slide **`radius`**
  modifier (`md` default · `none` squares the slide off) lives on the `slide`,
  not the root — which is why `CarouselSlide` gets the `radius` prop while
  `Carousel` gets `peek`, `padding`, `placement` and `indicators`.
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
  syncs React state off `scrollsnapchange`. It is also the **framed box** — the
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
