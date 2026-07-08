# Carousel development log

> **Running journal.** The settled plan and decisions live in
> [`carousel-development-plan.md`](./carousel-development-plan.md). This
> file is the append-only memory between sessions: what landed each
> iteration, headless gaps discovered/filled, QA feedback + resolution,
> Figma-sync status, the live backlog, and open questions. Update it at
> the end of every iteration.

## Decisions (dated, append-only)

The seven locked decisions are in the plan doc's "Locked decisions"
section — read those first. New decisions taken during the cycle are
appended here:

- **2026-07-08 — Kickoff.** Locked decisions 1–7 established (kitchen-sink
  target, `/tweak-component` fast loop, Tabs-style knob+modifier API,
  reactive TDD gap-filling, basic-responsive-single-slide first, Figma
  designs read as the starting point, responsiveness a hard requirement).
  Iteration 1 spec agreed. Push-straight-to-`main` authorised for this
  workstream's fast kitchen-sink feedback loop.
- **2026-07-08 — Read the Figma Carousel page.** Anatomy + exact tokens
  captured (see "Figma design reference" below). Corrected the seed:
  controls are **circular** (`radius 50%`), 32×32 (`space-32`), filled with
  **`action-secondary`** (not the square `surface-default` first drafted).
- **2026-07-08 — Iteration-1 design answers (human).**
  (a) **Slides round by default** at a medium radius
  (`--primitiv-carousel-slide-radius` → `var(--primitiv-radii-12)`), with a
  slide **`radius` modifier** (`md` default · `none` squares it). The
  `CarouselSlide` `cornerRadius:0` was a design-time oversight — **update
  the Figma component to match** during the next bridge/lockstep pass.
  (b) **Iteration-1 control layout = external-row below.**
  (c) **Vertical orientation is driven early** — a conscious override of
  locked decision 4 for the vertical case: after the horizontal base lands,
  test-drive `data-orientation` + a vertical scroll axis into the headless
  primitive (it is core to the design: `CarouselControl` up/down,
  `CarouselIndicators` vertical).

## Figma design reference

Read from the Figma file **"Primitiv Design System" → "Carousel" page**
(page id `941:4508`) via the Desktop Bridge on 2026-07-08. Two frames:
**Parts** (anatomy, `1029:24972`) and **Examples** (composition matrix,
`1033:25214`). Gradients stand in for photos (imagery is a per-slide fill
override). The parts are Figma component sets:

| Part (Figma set) | Axes | Notes → registry mapping |
|---|---|---|
| **CarouselViewport** | view: peek · single · multi | The scroll track. Peek shows adjacent-slide slivers; single fills; multi shows N per page. |
| **CarouselControl** | context: **overlay · external** · direction: **prev · next · up · down** · state: default/hover/active/disabled | **Circular, 32×32.** external fill = **`action/secondary/default`** (`--primitiv-action-secondary-default`); overlay fill = **`color/neutral-alpha/500`** @ 30% (for sitting on imagery). up/down = the **vertical** orientation (headless gap). |
| **CarouselAutoplayButton** | state: paused (▷) · playing (⏸) | Circular, same overlay style. Maps to `PlayPauseTrigger`. |
| **CarouselThumbnail(s)** | state: default/hover/active | Rounded-rect image thumbs; **active = blue ring** (`action-primary`). Strip variant = "bare (no pill)". Custom `IndicatorGroup`+`Indicator` content. |
| **CarouselIndicator** | state: inactive/active/hover/focus | Dots; active = brand blue, inactive = grey, focus = ring. Matches `--primitiv-carousel-indicator-*` knobs. |
| **CarouselIndicators** | orientation: **horizontal · vertical** | Row or column of dots; also a **grey pill container** variant for the overlay context. |
| **CarouselSlide** | ratio (e.g. 1:1, 16:9) | Base component `cornerRadius: 0` — rounding in the rendered examples is applied at instance/viewport level (see open question). |

**Example matrix (the Examples frame — the workbench/kitchen-sink target set):**
Overlay + dots (peek; controls inset on slide, dots+play in a pill) ·
External-flank + dots (peek; circular controls flanking outside) ·
**External-row + dots (single) ← iteration 1** (controls+dots in one row
below) · External-flank + thumbnails (multi) · Slides Per Page (2-up) ·
**Vertical** (up/down controls, vertical dots) · Wide peek (generous side
peek) · **RTL** · **Loop** (no disabled ends) · Slides Per Move · **Mouse
Drag** · Dynamic (add/remove) · Controls on top · Viewport padding
(`space-16` gutter · scroll-padding) · Controls on left (vertical).

**Control-placement is the key composition axis** the styled surface must
support: overlay (inset on the slide) · external-flank (outside, L/R) ·
external-row (below) · on-top (above) · vertical (side). Likely a
`placement` modifier group on the surface once iteration 1 proves the base.

## Iterations

### Iteration 0 — Setup (done)

- [x] Plan + log docs committed to the repo.
- [x] Figma Carousel page read; anatomy + tokens recorded above.
- [x] Registry surface: `contract.json` (7 parts, 17 knobs, 1 slide
      `radius` modifier) + tokenized `styles.css` (design-matched
      circular controls).
- [x] Generated `carousel.recipe.ts` / `carousel.tsx` / `styles.scss`
      from the contract via `primitiv-emit` (throwaway example, deleted).
- [x] Registry drift tests (recipe/wrapper/scss) for carousel — green.
- [x] Registered: `registry.json`, CLI `registry.rs` FILES roster,
      `cli.rs` `add --all` count (16 → 17) + `contains("carousel")`.
- [x] Component `README.md` authored.
- [x] Kitchen-sink hand-sync (`components/carousel.*`, barrel export,
      `styles/primitiv/carousel/styles.css`).
- [x] Dedicated Carousel page: dependency-free `#carousel` hash view
      switch (`Shell.tsx`) → `pages/CarouselPage.tsx`.

Gates green: `cargo test -p primitiv-emit -p primitiv-cli`,
`node scripts/check-registry-types.mjs`. Kitchen-sink can't build in the
sandbox (no `node_modules`) — the human verifies live on `main`.

### Iteration 1 — Basic responsive single-slide (awaiting human QA)

**Built** (`apps/kitchen-sink/src/pages/CarouselPage.tsx`, `#carousel`):
the External-row + dots single-slide composition — circular external
prev/next + dot row below the viewport — across a responsive matrix:
default (fills container), narrow vs wide container side-by-side, RTL
(`dir="rtl"`), and square slides (`radius="none"`). Gradients stand in
for imagery.

**Surface established:** `.primitiv-carousel` + `__viewport`/`__slide`/
`__prev`/`__next`/`__indicator-group`/`__indicator`; 17 `--primitiv-carousel-*`
knobs; slide `radius` modifier (`md`/`none`). Controls circular
`action-secondary`; active dot `action-primary`; shared focus ring.

**No headless gaps needed** this iteration (single-slide horizontal is
fully supported by the primitive).

**Next:** human visual + interaction QA → then Figma lockstep (write the
`--primitiv-carousel-*` variables + fix the `CarouselSlide` radius) →
then the **vertical** headless work (driven early, per the design).

## Backlog (examples still to build)

Seeded from `ROADMAP.md` "Carousel example backlog (Blossom parity)".
Reorder as priorities shift; each is human-approved before it starts.

**Basic**

- Basic responsive single-slide _(iteration 1 — in progress)_
- Multi-slide-per-view (slidesPerPage, gap, peek)
- Dots / indicators variations (below, overlaid, thumbnails)
- Snapping (centred) — `snapAlign="center"`
- Right-to-left — needs explicit RTL confirmation/tests
- Masonry — grid-based with complex snapping cells
- Sticky Slides — sticky labels/content inside slides

**Advanced**

- Cover Flow (scroll-driven 3D, `--cf-*` playground)
- Autoplay + play/pause
- Crossfade / dissolve (`transition="none"`)
- Multi-step (slide + fade)
- Variable-size slides
- Programmatic control (imperative API, progress bar)
- Slideshow (parallax), Stories (3D + overscroll), Smart Stack,
  Cards, Flipbook, Timeline

## Headless gaps (drive reactively, per example)

Tracked so we know what's outstanding; only built when an example needs
it (decision 4).

- [ ] Looping / infinite (next/previous hard-clamp today; autoplay stops
      at last page)
- [ ] Vertical orientation + `data-orientation` (not emitted at all today)
      — **scheduled early** (immediately after the horizontal base), per the
      2026-07-08 design answers
- [ ] Mouse-drag gesture (only native scroll today)
- [ ] Explicit RTL tests (mirrors implicitly via logical properties;
      no dedicated coverage)

## Open questions (for the human)

- ~~**Slide corner radius.**~~ **Resolved 2026-07-08:** round by default
  (`radii-12`) + a `radius` modifier to square it; update the Figma
  `CarouselSlide` (was `cornerRadius:0`) to match in the next lockstep pass.
- **Overlay vs external control fill.** Iteration 1 uses the external
  fill (`action-secondary`). The overlay context (`neutral-alpha-500`
  @ 30%, for controls sitting on imagery) will land as a `placement`/
  `context` modifier in a later placement-focused iteration.
