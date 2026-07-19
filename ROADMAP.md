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

## Component coverage — Figma · headless · registry

Tri-state status per component: a **Figma** component set, a **Headless**
component in `packages/react/src`, and a **Registry** (styled, copy-in) component
in `registry/components`. Utility-only primitives (AccessibleIcon,
DirectionProvider, Portal, SkipNav, Slot, VisuallyHidden) are headless-only and
omitted. The three registry-only rows (Code Block, Inline Code, Prose) are the
hand-authored **prose family** — no Figma set, no standalone headless component.

| Component | Figma | Headless | Registry | Node ID / notes |
|---|---|---|---|---|
| Accordion | ✓ | ✓ | ✓ | 416:6729 (Item), 417:6881 (Panel) |
| Alert | — | ✓ | — | |
| Avatar | ✓ | ✓ | — | 433:7944 |
| Breadcrumb | ✓ | ✓ | — | 436:12220 (Item), 436:12221 (Separator), 436:12911 (composition) |
| Button | ✓ | ✓ | ✓ | 347:14161 |
| Carousel | 🟡 | ✓ | ✓ | Figma set in progress — `CarouselSlide` + parts, full set not yet assembled |
| Checkbox | ✓ | ✓ | ✓ | 369:30652 |
| CheckboxCard | — | ✓ | — | |
| Code Block | — | — | ✓ | registry-only (Prism highlighting via prism-react-renderer) |
| Collapsible | — | ✓ | — | |
| ContextMenu | ✓ | ✓ | — | 1142:25899 (reuses Dropdown/* rows via slots — no ContextMenu-specific sub-components) |
| Divider | ✓ | ✓ | ✓ | |
| Drawer | ✓ | — | — | 1142:26332 (Side×Size; reuses Modal/Header·Body·Footer + Backdrop) — **headless + registry pending** |
| Dropdown | ✓ | ✓ | — | 402:18499 |
| EmptyState | — | ✓ | — | |
| Field | ✓ | ✓ | ✓ | 394:7449 |
| Fieldset | — | ✓ | — | |
| Icon Button | ✓ | — | — | 433:8386 (icon-only Button — no separate headless/registry) |
| Inline Code | — | — | ✓ | registry-only (dedicated `code/*` font-size ramp) |
| Input | ✓ | ✓ | ✓ | 393:6159 |
| InputGroup | — | ✓ | ✓ | input-group |
| MillerColumns | — | ✓ | — | |
| Modal | ✓ | ✓ | ✓ | 435:10250 (Modal), 435:9450 (Header), 435:10108 (Body), 435:10161 (Footer) |
| Popover | ✓ | ✓ | — | 1168:36142 (composition), 1140:25762 (Content), 1168:35023 (Arrow) |
| Progress | ✓ | ✓ | — | 443:7839 |
| Prose | — | — | ✓ | registry-only (`.primitiv-flow` + `<Prose>` wrapper) |
| RadioCard | — | ✓ | — | |
| RadioGroup | ✓ | ✓ | ✓ | 401:17958 (registry `radio`) |
| Select | ✓ | ✓ | — | 403:1883 |
| Slider | ✓ | ✓ | — | 392:5196 (track), 392:4353 (thumb) |
| Status | — | ✓ | — | |
| Switch | ✓ | ✓ | ✓ | 315:5884 |
| Table | ✓ | ✓ | ✓ | 605:13524 (Table), 604:9802 (Cell), 604:9991 (Header Cell), 604:10228 (Row) |
| Tabs | ✓ | ✓ | ✓ | 425:5528 (Trigger), 425:5539 (Panel) |
| Textarea | ✓ | ✓ | — | 439:14511 |
| Toggle | ✓ | ✓ | — | 385:1418 |
| ToggleGroup | ✓ | ✓ | ✓ | assembled from Toggle |
| Tooltip | ✓ | ✓ | — | 1168:35600 (composition), 1142:25897 (Content), 1168:34990 (Arrow) |
| Tree | — | ✓ | — | |

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

`apps/workbench` carries one example page per component, and the backlog
is **clear** — every public component in `packages/react/src` now has a
matching `…Example` page under `apps/workbench/src/pages` (40 pages),
alongside specimen pages for the Design-System test, Elevation, and the
Harmoni plugin frame.

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

The section above tracks *example pages*. Component **capability** gaps
against the wider React carousel field — Embla, Swiper, Keen, Splide — from
a survey of their option/method/event/plugin surfaces are tracked in the
carousel dev log's parity section, so the whole parity picture reads as one
list rather than drifting across two docs: see **"Wider field — capability
gaps beyond parity"** in
[`docs/carousel-development-log.md`](./docs/carousel-development-log.md).
Headline items: the scroll-progress signal (recommended first), headless
virtualization, `dragFree`/momentum, auto-resize + richer lifecycle events,
continuous auto-scroll, and auto-height.
