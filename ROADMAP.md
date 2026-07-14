# Roadmap

Planning notes for the `@primitiv-ui/react` headless component library.
Two lists:

1. **Components to build** — the master backlog.
2. **Workbench examples** — components that exist but still need an
   `apps/workbench` example page.

## Harmoni plugin UI — minimum base components

The six base components required to build the Harmoni plugin wireframe screens.
Composite components (PaletteRamp, Swatch, etc.) are out of scope here.

| Component | `@primitiv-ui/react` | Figma design | Notes |
|---|---|---|---|
| Button | ✓ built | ✓ | Primary, secondary, ghost/link, and icon-only variants all appear |
| Slider | ✓ built | ✓ | Horizontal (Padding control) and vertical (curve editors) |
| Switch | ✓ built | ✓ | Step labels and A11y badges on/off toggles |
| Toggle Group | ✓ built | ✓ | Layout, Shape, Naming, and Modes pill selectors |
| Input | ✓ built | ✓ | Hex colour text inputs; pair with `InputGroup` for the leading colour-swatch slot |
| Select | ✓ built (native) | ✓ | Workspace picker and Collection dropdown; Rich Select / Combobox tracked in [`docs/select-future-work.md`](docs/select-future-work.md) |

"Figma design" = a Figma component set exists for the component. All six base
components now have Figma component sets. The Field wrapper
(label + nested control + helper) also has a Figma set, though it is not one of
the six base components above.

Build priority: ~~Select (native)~~ → ~~Input~~ → ~~InputGroup~~ → ~~Field~~ → Figma design for Select.

## Figma design coverage

Which built components have a Figma component set. Utility-only primitives
(AccessibleIcon, DirectionProvider, Portal, SkipNav, VisuallyHidden) are
not visual components and do not need a Figma design.

| Component | Figma design | Node ID |
|---|---|---|
| Accordion | ✓ | 416:6729 (Item), 417:6881 (Panel) |
| Alert | — | |
| Avatar | ✓ | 433:7944 |
| Breadcrumb | ✓ | 436:12220 (Item), 436:12221 (Separator), 436:12911 (composition) |
| Button | ✓ | 347:14161 |
| Carousel | — | |
| Checkbox | ✓ | 369:30652 |
| CheckboxCard | — | |
| Collapsible | — | |
| ContextMenu | — | |
| Divider | ✓ | |
| Dropdown | ✓ | 402:18499 |
| EmptyState | — | |
| Field | ✓ | 394:7449 |
| Fieldset | — | |
| Icon Button | ✓ | 433:8386 |
| Input | ✓ | 393:6159 |
| InputGroup | — | |
| MillerColumns | — | |
| Modal | ✓ | 435:10250 (Modal), 435:9450 (Header), 435:10108 (Body), 435:10161 (Footer) |
| Progress | ✓ | 443:7839 |
| RadioCard | — | |
| RadioGroup | ✓ | 401:17958 |
| Select | ✓ | 403:1883 |
| Slider | ✓ | 392:5196 (track), 392:4353 (thumb) |
| Status | — | |
| Switch | ✓ | 315:5884 |
| Table | ✓ | 605:13524 (Table), 604:9802 (Cell), 604:9991 (Header Cell), 604:10228 (Row) |
| Tabs | ✓ | 425:5528 (Trigger), 425:5539 (Panel) |
| Textarea | ✓ | 439:14511 |
| Toggle | ✓ | 385:1418 |
| ToggleGroup | ✓ | assembled from Toggle |
| Tooltip | — | |
| Tree | — | |

## Components to build

What remains is every component that carries genuine interaction
logic, ARIA behaviour, focus management, or non-trivial accessibility
semantics that CSS alone cannot provide.

### Layout

- [x] Divider

### Buttons

- [x] Button

### Forms

- [x] Checkbox
- [x] Checkbox Card
- [ ] Color Picker
- [ ] Editable
- [x] Field
- [x] Fieldset
- [ ] File Upload
- [ ] Form
- [x] Input
- [x] InputGroup
- [ ] Number Input
- [ ] One-Time Password Field
- [ ] Password Input
- [ ] Pin Input
- [x] Radio
- [x] Radio Group
- [x] Radio Card
- [ ] Rating
- [ ] Segmented Control
- [x] Select (Native)
- [x] Slider
- [x] Switch
- [ ] Tags Input
- [x] Textarea

### Collections & Selection

- [ ] Combobox — see [`docs/select-future-work.md`](docs/select-future-work.md)
- [ ] Listbox
- [ ] Select (Rich) — see [`docs/select-future-work.md`](docs/select-future-work.md)
- [x] Tree
- [x] Miller Columns
- [ ] Date & Time
- [ ] Calendar
- [ ] Date Picker

### Overlays

- [x] Action Bar
- [ ] Alert Dialog
- [x] Context Menu
- [ ] Drawer
- [x] Dropdown
- [ ] Hover Card
- [x] Modal
- [x] Popover
- [x] Tooltip

### Disclosure

- [x] Accordion
- [x] Breadcrumb
- [x] Carousel
- [x] Collapsible
- [ ] Pagination
- [ ] Steps
- [x] Tabs

### Navigation

- [ ] Menubar
- [ ] Navigation Menu
- [x] Toggle
- [x] Toggle Group
- [ ] Toolbar

### Feedback & Status

- [x] Alert
- [x] Empty State
- [x] Progress
- [ ] Progress Circle
- [x] Status

### Data Display

- [x] Avatar
- [ ] Clipboard
- [ ] QR Code
- [ ] Scroll Area
- [ ] Splitter
- [x] Table

### Utilities

- [x] Accessible Icon
- [x] Direction Provider
- [ ] Environment Provider
- [x] Portal
- [ ] Presence
- [x] Skip Nav
- [x] Slot
- [x] Visually Hidden

### Borderline cases

A few entries are worth revisiting — they carry little or no JS
behaviour, but were kept for meaningful ARIA semantics:

- **Alert / Empty State / Status** — no JS behaviour, but meaningful
  ARIA role semantics (`role="alert"`, `role="status"`) that a plain
  `<div>` won't get right by default.
- **Breadcrumb** — minimal JS, but the
  `<nav aria-label="breadcrumb">` + `aria-current="page"` pattern is
  fiddly enough to warrant a primitive.
- **Carousel** — a genuinely complex interaction/a11y problem
  (`role="region"`, live regions, keyboard navigation). Worth keeping.
- **Progress / Progress Circle** — `role="progressbar"` with
  `aria-valuenow/min/max` management. Kept for the ARIA wiring.
- **QR Code** — generates a canvas/SVG from data. Functional logic,
  not styling-coupled.
- **Presence** — animation entry/exit lifecycle management
  (mount/unmount timing). Behavioural, not just styling.

## Workbench examples

`apps/workbench` carries one example page per component. Every public
component now has a workbench example:

- [x] Accessible Icon
- [x] Alert
- [x] Button
- [x] Checkbox
- [x] Direction Provider
- [x] Divider
- [x] Empty State
- [x] Field
- [x] Input
- [x] Input Group
- [x] Portal
- [x] Radio
- [x] Radio Group
- [x] Skip Nav
- [x] Status
- [x] Table
- [x] Tabs
- [x] Visually Hidden

`Slot` is an internal composition utility, not a public component —
it does not need a workbench page.

## Carousel example backlog (Blossom parity)

The Carousel workbench page
(`apps/workbench/src/pages/CarouselExample`) aims to cover the example
set from the [Blossom Carousel library](https://blossom-carousel.com/docs/examples)
plus our own transition variants. Status of each Blossom example
(✅ done · 🟡 feature exists, no dedicated demo · ⬜ missing):

**Basic**

- [x] Simple — Single/MultiSlideScroll
- [x] Buttons — prev/next triggers (+ Programmatic)
- [x] Dots — Indicators
- [x] Thumbnails — Thumbnails
- [ ] Snapping (centred) — 🟡 `snapAlign="center"` exists; no basic demo
- [ ] Masonry — ⬜ grid-based masonry with complex snapping cells
- [ ] Right to Left — 🟡 component supports `dir`; no carousel demo
- [ ] Sticky Slides — ⬜ sticky labels/content inside slides

**Advanced**

- [x] Cover Flow — CoverFlow (with the live `--cf-*` playground)
- [ ] Slideshow — ⬜ parallax slide movement
- [ ] Stories — ⬜ 3D transitions with overscroll behaviour
- [ ] Smart Stack — ⬜ iOS-style stacked cards animated on scroll
- [ ] Cards — ⬜ sticky card stack (chat-app style)
- [ ] Flipbook — ⬜ 3D page-turning effect
- [ ] Timeline — ⬜ video-editor timeline with sticky clip labels

Our own examples with no Blossom counterpart (not gaps): Single/Multi
crossfade, Multi-step (slide + fade), Peek, Variable sizes, Autoplay,
Programmatic.

## Carousel capability backlog (beyond Ark/Blossom parity)

The section above tracks *example pages*. This one tracks *component
capabilities* against the wider React carousel field — Embla, Swiper,
Keen, Splide, Ark — from a survey of their option/method/event/plugin
surfaces (2026-07). It's the "go beyond parity" list: what would make
this the best headless React carousel, not just a complete one.

**Where we already lead** (so we don't regress it): the field's own
comparisons peg accessibility and headless/zero-style as the two axes
nobody wins together — Splide is a11y-first but styled; Embla/Swiper are
headless but "require manual `role` / `aria-label` / keyboard / live-region
work." We already ship Splide-grade a11y (viewport `aria-live` polite/off,
auto slide labels, full WAI-ARIA APG pause semantics, `ProgressText`) *and*
Embla-grade headlessness, plus drag / overscroll / autoplay **status
telemetry** none of them expose. That combination is the moat; every item
below must preserve it.

Legend: ⭐ differentiator (makes us best) · 🎯 table stakes (a reason
teams pick a competitor today) · 🧩 polish / niche.

**Differentiators**

- [ ] ⭐ **Scroll-progress signal** — a continuous global scroll position
  *and* per-slide progress (`-1 → 0 → 1` through centre), surfaced both
  imperatively and as a CSS custom property (`--slide-progress`,
  `--carousel-progress`). Mirrors Embla's `scrollProgress()` + `slidesInView`
  (with enter/leave deltas). Highest leverage: retires most of the Advanced
  example backlog (Slideshow, Smart Stack, Stories, Cards, Flipbook,
  Timeline) in JS *and* gives a progressive-enhancement path for the Cover
  Flow family without `animation-timeline`. On-brand: a state signal CSS
  consumes. **Recommended first — loop and virtualization both build on it.**
- [ ] ⭐ **Headless virtualization** — render only near-viewport slides
  (sized spacers preserve measured offsets + native snap). Swiper/Keen ship
  it; reviewers note Embla makes you build it yourself. Nobody pairs real
  virtualization with real a11y — highest moat.

**Table stakes**

- [ ] 🎯 **Loop / infinite** — Embla, Swiper, Keen, Ark all have it (Ark: a
  plain `loop` boolean); we don't. Hard on native scroll-snap (needs slide
  cloning or seamless mid-scroll repositioning) — deserves its own RFC.
  Includes autoplay wrap-around / ping-pong direction (today autoplay stops
  at the last page).
- [ ] 🎯 **`dragFree` + momentum + `skipSnaps`** — Embla's signature feel:
  inertial flick, optional non-snapping free scroll, skip-snaps on a vigorous
  drag. Ours is deliberately momentum-less; this is the tactile gap.
- [ ] 🎯 **Auto-resize + richer lifecycle events** — internal `ResizeObserver`
  on viewport + slides that auto-re-aligns (Embla `watchResize` / `watchSlides`
  auto-`reInit`), retiring the manual `refresh()` footgun; plus `onSettle` /
  `onSelect` / `onSlidesInView` / `onReInit` to match Embla's event vocabulary
  (today everything routes through `onPageChange`).
- [ ] 🎯 **Responsive per-breakpoint options** — change `slidesPerPage` /
  align / etc. per breakpoint from inside the component (Embla `breakpoints`,
  Swiper responsive, Splide media-query options). Debatable for a headless lib
  (could stay consumer/CSS-owned) — decide the boundary.
- [ ] 🎯 **Continuous auto-scroll / marquee** — a ticker / logo-wall that
  scrolls continuously rather than paging (Embla `AutoScroll`, Splide
  `AutoScroll`). Distinct from our page-and-stop autoplay.
- [ ] 🎯 **Auto-height** — viewport tracks the active slide's measured height
  (Embla `AutoHeight`); natural companion to the ResizeObserver above.

**Polish / niche**

- [ ] 🧩 **Grid / multi-row paging** (masonry) — Swiper/Splide `grid`; also the
  Masonry example above.
- [ ] 🧩 **Pinch-to-zoom** lightbox gesture — Swiper `zoom`, as an opt-in part.
- [ ] 🧩 **URL hash / history sync** helper — Swiper `hash-navigation` /
  `history`; DIY-able today via controlled `page`, but no first-class part.
- [ ] 🧩 **Headless lazy-load part** — mount slide children on near-viewport
  (Splide/Swiper lazy); `isInView` exists but every consumer re-wires it.
- [ ] 🧩 **a11y superset** — auto-wire `aria-controls` (indicators/triggers →
  slide/viewport ids) instead of the manual `ids` bag; the WAI-ARIA APG
  *tabbed* carousel variant (indicators `role="tab"`, slides `role="tabpanel"`)
  for full-APG coverage; optional focus-follow to the newly-active slide.
- [ ] 🧩 **Autoplay countdown / Stories progress** — per-tick progress value
  for segmented Stories bars + hold-to-pause tap zones (not currently exposed).
- [ ] 🧩 **Auto-pause media** in inactive slides (Splide `Video` behaviour).
- [ ] 🧩 **RTL hardening + demo** — `dir` is nominally supported but the
  `scrollLeft` sign flips per browser in RTL; needs an audit + tests (🟡 in the
  example backlog above).

Recommended sequence: scroll-progress signal → virtualization → loop →
`dragFree`/momentum. Sources: Embla
([options](https://www.embla-carousel.com/docs/api/options) ·
[events](https://www.embla-carousel.com/docs/api/events) ·
[plugins](https://www.embla-carousel.com/docs/api/plugins)), Swiper
([API](https://swiperjs.com/swiper-api)), [Keen](https://keen-slider.io/docs),
Splide ([options](https://splidejs.com/guides/options/) ·
[extensions](https://splidejs.com/extensions/)),
[Ark](https://ark-ui.com/docs/components/carousel), and the
[Embla vs Swiper vs Splide 2026](https://www.pkgpulse.com/guides/embla-carousel-vs-swiper-vs-splide-2026)
comparison.
