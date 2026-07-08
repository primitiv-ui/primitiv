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

> **Scope (iteration 1).** This is the *basic responsive single-slide* surface:
> one slide per view, circular external prev/next controls, and dot indicators.
> Placement variants (overlay / flank / row / top), multi-slide, thumbnails,
> autoplay, and **vertical orientation** land in later iterations (see
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
  which the stylesheet styles (the active dot).
- **`root` / `subcomponents` / `modifiers` / `customProperties`** — the authored
  styling conventions: the `.primitiv-carousel` root and the `__viewport` /
  `__slide` / `__prev` / `__next` / `__indicator-group` / `__indicator` BEM parts,
  the slide **`radius`** modifier (`md` default · `none` squares the slide off),
  and the `--primitiv-carousel-*` custom-property API.

`subcomponents` marks this a **structural compound**: the styled surface is N thin
per-part wrappers the consumer composes. The `radius` modifier lives on the
`slide`, not the root — which is why `CarouselSlide` gets the `radius` prop.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API knobs + resting look in
`primitiv.base`, the slide `radius` modifier + control `:hover` / `:active` in
`primitiv.variants`, the active dot + focus ring + disabled controls in
`primitiv.states`.

- **Viewport** — a flex track with native horizontal scroll-snap
  (`scroll-snap-type: x mandatory`), `overscroll-behavior-x: contain`, and hidden
  scrollbars; the headless layer syncs React state off `scrollsnapchange`.
- **Slide** — `flex: 0 0 100%` (one per view), `aspect-ratio` for proportional
  sizing as the container resizes, rounded by default (`--primitiv-radii-12`),
  `overflow: hidden` so slide imagery clips to the radius.
- **Controls** — **circular** (`50%`), `space-32` square, filled with
  `action-secondary` (matching the design's external-context control); hover /
  active re-point the fill knob.
- **Indicators** — a centred row; the button carries a 44×44-min hit area
  (WCAG 2.5.8) while the visible dot stays small via `::before`; the active dot
  re-points to `action-primary`.

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
  <div>
    <CarouselPreviousTrigger><ChevronLeft /></CarouselPreviousTrigger>
    <CarouselIndicatorGroup label="Choose slide">
      <CarouselIndicator index={0} />
      <CarouselIndicator index={1} />
    </CarouselIndicatorGroup>
    <CarouselNextTrigger><ChevronRight /></CarouselNextTrigger>
  </div>
</Carousel>
```

`class-variance-authority` is a **styled-surface** dependency
(`registry.json` → `styles.packages`); the format only selects which stylesheet
defines the rules behind the classes. Drift guards assert each generated artifact
equals the generator's output for the committed contract.
