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
| Select | ✓ built (rich + native) | ✓ | Workspace picker and Collection dropdown; the rich Popover-API listbox is the default (`native` opts back into the `<select>` wrapper). The separately-deferred Combobox is tracked in [`docs/select-future-work.md`](docs/select-future-work.md) |

"Figma design" = a Figma component set exists for the component. All six base
components now have Figma component sets. The Field wrapper
(label + nested control + helper) also has a Figma set, though it is not one of
the six base components above.

Build priority: ~~Select (native)~~ → ~~Input~~ → ~~InputGroup~~ → ~~Field~~ → ~~Figma design for Select~~.

## Component coverage — Figma · headless · registry

Quad-state status per component: a **Figma** component set, a **Headless**
component in `packages/react/src`, a **Registry** (styled, copy-in) component
in `registry/components`, and a **Kitchen Sink** demo in `apps/kitchen-sink`
(an `App.tsx` section, or a dedicated page — Carousel). The kitchen-sink installs
*every* registry component via `add --all`, so the Kitchen Sink column tracks a
hand-built **demo**, not mere installation — a `Registry ✓ / Kitchen Sink —` row
flags a styled surface that still needs a demo (the kitchen-sink is the ultimate
reference, so every registry surface should earn a ✓ here). Utility-only
primitives (AccessibleIcon, DirectionProvider, Portal, SkipNav, Slot,
VisuallyHidden) are headless-only and omitted. The three registry-only rows
(Code Block, Inline Code, Prose) are the hand-authored **prose family** — no
standalone headless component. Inline Code and Prose have no Figma set; Code Block
is the exception (Figma set `601:9607`, whose tabbed Type composes Tabs + Button).

| Component | Figma | Headless | Registry | Kitchen Sink | Node ID / notes |
|---|---|---|---|---|---|
| Accordion | ✓ | ✓ | ✓ | ✓ | 416:6729 (Item), 417:6881 (Panel) |
| Alert | — | ✓ | — | — | |
| Avatar | ✓ | ✓ | ✓ | ✓ | 433:7944 (Size xs-xl × Type Image\|Initials\|Placeholder × Shape Circle\|Square, 30 variants). Headless `Avatar.Root`/`.Image`/`.Fallback` (image load-status compound). Registry `avatar` = fixed-size clipping frame (`.primitiv-avatar` root, `overflow: hidden` + `border-radius`) with the image/fallback absolutely stacked and only one shown per `data-status`; sizing/icon-size reuse `framed-control/*` directly (matches Figma's own binding), radius is the avatar-specific `avatar/radius/*` family (pre-existing token, circle = `full` regardless of size, square = size-scaled); one flagged Figma drift (Placeholder's icon uses `content/secondary`, Initials' text uses `action/secondary/foreground/default` — registry uses the latter for both via `currentColor`). Kitchen-sink = working image, broken-image→error-fallback, square shape, icon-only fallback |
| Breadcrumb | ✓ | ✓ | ✓ | ✓ | 436:12220 (Item), 436:12221 (Separator), 436:12911 (composition). Design change (2026-07-27): Item gained a `State` variant (`link`\|`current`, was a single undifferentiated style) so the current page reads `content/primary` against a `content/muted` trail (tuned live from an initial `content/secondary` guess — muted reads with a bigger gap against primary); Separator recoloured to match. Registry `breadcrumb` = flex `<ol>` row (unbound flat `space-4` gap, matching Figma's own unscaled `itemSpacing`), Link/Separator on `content-muted`, Page on `content-primary`, body/{size} type throughout; Link's hover reveals an always-in-layout underline (`text-decoration-color` transparent→`currentColor`) fading in with the muted→primary colour lift, so the affordance is a pure colour transition with no reflow. Kitchen-sink = default "/" separator trail + a custom chevron-icon separator trail |
| Button | ✓ | ✓ | ✓ | ✓ | 347:14161 |
| Carousel | 🟡 | ✓ | ✓ | ✓ | Figma set in progress — `CarouselSlide` + parts, full set not yet assembled |
| Checkbox | ✓ | ✓ | ✓ | ✓ | 369:30652 |
| CheckboxCard | — | ✓ | — | — | |
| Code Block | ✓ | — | ✓ | ✓ | 601:9607 (Size×Type=default\|tabbed; tabbed = Tabs/Trigger strip + text Copy Button, Copy one size below block); registry-only React surface (Prism highlighting via prism-react-renderer); tabbed composes headless Tabs + registry Button |
| Collapsible | ✓ | ✓ | ✓ | ✓ | New "Collapsible" page (`1207:42772`): `Collapsible / Trigger` set (`1207:43048`, 30 variants — Variant[plain\|card\|inline] × State[closed\|open] × Size[xs-xl], md first/default) + composed `Collapsible` set (`1207:43244`, 30 variants) instancing the size-matched Trigger; `Content` SLOT property (20 open/inline variants) + exposed `Label` TEXT property (RFC 0019 dep); headless `collapsedHeight` + fade-shadow landed; registry `collapsible` (grid open/close shared with Accordion, plain/card/inline dressings, card gets a hairline seam instead of a gap once open); kitchen-sink = one collapsible per dressing, inline demonstrating `collapsedHeight` |
| ContextMenu | ✓ | ✓ | — | — | 1142:25899 (reuses Dropdown/* rows via slots — no ContextMenu-specific sub-components) |
| Divider | ✓ | ✓ | ✓ | ✓ | |
| Drawer | ✓ | ✓ | ✓ | ✓ | 1142:26332 (Side×Size; reuses Modal/Header·Body·Footer + Backdrop); headless = thin composition over Modal + `side` axis; registry = standalone `.primitiv-drawer` (edge-docked Modal, `data-side` slide + `width` cross-axis off the `size/*` scale, density-driven padding via `modal/*` tokens); kitchen-sink = one drawer per edge |
| Dropdown | ✓ | ✓ | ✓ | ✓ | 668:42210 (Panel set) + Item/CheckboxItem/RadioItem/SubTrigger/Label/Separator/Group/RadioGroup sets on canvas 317:362; registry `dropdown` (anchor-positioned menu, menu checkmark/dot indicator model — RFC 0019 dep) + the `__item-leading` / `__item-label` / `__item-trailing` row slots mirroring the Figma Show leading / Show trailing properties; kitchen-sink = 3-level nested menu |
| EmptyState | — | ✓ | — | — | |
| Field | ✓ | ✓ | ✓ | ✓ | 394:7449 |
| Fieldset | — | ✓ | — | — | |
| Icon Button | ✓ | — | — | — | 433:8386 (icon-only Button — no separate headless/registry) |
| Inline Code | — | — | ✓ | ✓ | registry-only (dedicated `code/*` font-size ramp) |
| Input | ✓ | ✓ | ✓ | ✓ | 393:6159 |
| InputGroup | — | ✓ | ✓ | ✓ | input-group |
| MillerColumns | — | ✓ | — | — | |
| Modal | ✓ | ✓ | ✓ | ✓ | 435:10250 (Modal), 435:9450 (Header), 435:10108 (Body), 435:10161 (Footer) |
| NavigationMenu | ✓ | ✓ | ✓ | ✓ | Five sets on page "Navigation Menu" (`1333:50772`), all **md-first** (md variants built before the other sizes, so the Size dropdown genuinely leads with md — the reorder Collapsible and Select couldn't get retroactively): `Trigger` (1333:50847, Size×State[closed\|open]×Interaction, chevron flips glyph via Icon rather than rotating), `Bar Link` (1333:51136) + `Panel Link` (1333:51304) — the two placements of the single headless `Link` part (bar = one-line entry; panel = two-line title+description with optional leading/trailing swaps), `Indicator` (1334:51727, Style[arrow\|underline] — the arrow reuses `Tooltip / Arrow` Tone=inverted, the underline binds `border-width/2`), and composed `Navigation Menu` (1334:51944, Variant[closed\|open]×Size) = transparent bar + a `Dropdown / Panel` instance with its stroke and own shadow overridden off, `elevation/overlay` moved to a transparent wrapper so the shadow wraps arrow + panel as ONE silhouette (the Tooltip/Popover model — a border would seam across the arrow base). Geometry adopts the previously-unconsumed `nav-item/*` Context family, extended for this build with an `xl` slot + `padding-block`, `text-gap` and `panel-offset`. Registry `navigation-menu` = anchor-positioned Viewport panel projection, trigger chevron flip, arrow/underline `Indicator` modifiers; kitchen-sink = desktop five-panel disclosure nav (two-column, single-column, and a four-column brand-callout panel) **and** the composed mobile presentation (`Drawer` + `Collapsible` + shared `NavigationMenuLink`) |
| Popover | ✓ | ✓ | ✓ | ✓ | 1168:36142 (composition), 1140:25762 (Content), 1168:35023 (Arrow); registry = borderless panel + `::after` arrow + 12 placements (CSS anchor positioning) |
| Progress | ✓ | ✓ | — | — | 443:7839 |
| Prose | — | — | ✓ | ✓ | registry-only (`.primitiv-flow` + `<Prose>` wrapper) |
| RadioCard | — | ✓ | — | — | |
| RadioGroup | ✓ | ✓ | ✓ | ✓ | 401:17958 (registry `radio`) |
| Segmented Control | ✓ | ✓ | ✓ | ✓ | Figma 1216:44224 (track set, Size×Count 2-5) + 1216:43507 (Item set, Size×Selected×Interaction) on page "Segmented Control" — Tabs-model split (track composes Item). Headless = `SegmentedControl.Root`/`.Item` on RadioGroup single-select semantics (role=radiogroup/radio, roving tabindex, horizontal-default orientation, group + item disabled; 100% mutation). Registry `segmented-control` = transparent bordered track (concentric `calc(item-radius + track-padding)` radius) + framed primary/secondary segments via shared tokens (own styles.css like Tabs/Trigger + ToggleGroup Item, not composing Button). Kitchen-sink = controlled React/Vue/Svelte picker with leading logos + a justified example. Sliding indicator deferred |
| Select | ✓ | ✓ | ✓ | ✓ | `Select / Trigger` (403:1883, renamed) + composed `Select` set (1282:46193, Variant[closed\|open] × Size[xs-xl], stacks a real Dropdown/Panel instance with a working Slot for free row composition — RFC 0019 dep). Headless = one compound, two render paths behind `native` (rich Popover-API listbox by default; 100% mutation), `Select.Value` mirroring the selected item's content into the trigger via a `data-placeholder` hook. Registry `select` = framed trigger on Input's geometry + a panel/rows resolving the shared `dropdown/*` tokens (so a listbox and a menu are one surface, with no `dropdown` dependency), `mode` rich\|native modifier, 4 placements. Kitchen-sink = 7 rich demos (leading marks, leading+trailing slots, groups, top-end, invalid, disabled) + 3 native. Combobox still deferred, see `docs/select-future-work.md` |
| Slider | ✓ | ✓ | — | — | 392:5196 (track), 392:4353 (thumb) |
| Status | — | ✓ | — | — | |
| Switch | ✓ | ✓ | ✓ | ✓ | 315:5884 |
| Table | ✓ | ✓ | ✓ | ✓ | 605:13524 (Table), 604:9802 (Cell), 604:9991 (Header Cell), 604:10228 (Row) |
| Tabs | ✓ | ✓ | ✓ | ✓ | 425:5528 (Trigger), 425:5539 (Panel) |
| Textarea | ✓ | ✓ | — | — | 439:14511 |
| Toggle | — | ✓ | — | — | standalone Figma set (385:1418) deleted 2026-07-01 when ToggleGroup decoupled from it — no dedicated Figma component currently; rebuild from the workbench reference if needed |
| ToggleGroup | ✓ | ✓ | ✓ | ✓ | 389:3372 (Toggle Group track) + 733:239 (ToggleGroup Item) — redesigned 2026-07-01 as a recessed pill track + floating pill thumb, decoupled from the deleted standalone Toggle set |
| Tooltip | ✓ | ✓ | ✓ | ✓ | 1168:35600 (composition), 1142:25897 (Content), 1168:34990 (Arrow); registry = flat bubble + `__arrow`, `tone` (default dark / inverted surface) × `size` × 12 placements (CSS anchor positioning), `data-state` exit (no overlay, needs `forceMount`) |
| Tree | — | ✓ | — | — | |

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
- [x] Segmented Control
- [x] Select (Native)
- [x] Slider
- [x] Switch
- [ ] Tags Input
- [x] Textarea

### Collections & Selection

- [ ] Combobox — see [`docs/select-future-work.md`](docs/select-future-work.md)
- [ ] Listbox
- [x] Select (`native={false}`, the rich Popover-API listbox)
- [x] Tree
- [x] Miller Columns
- [ ] Date & Time
- [ ] Calendar
- [ ] Date Picker

### Overlays

- [x] Action Bar
- [ ] Alert Dialog
- [x] Context Menu
- [x] Drawer
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
- [x] Navigation Menu — headless + Figma desktop set (5 sets, 150 variants) + registry styles + kitchen-sink demo (desktop and composed mobile). See [`docs/rfcs/0019-navigation-menu.md`](docs/rfcs/0019-navigation-menu.md)
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

**Closed as a backlog (2026-07-25): new component examples go in the
kitchen-sink, not the workbench.** `apps/workbench` keeps the 40 pages it
already has — one per component that predates the change, alongside
specimen pages for the Design-System test, Elevation, and the Harmoni
plugin frame — but it is no longer extended. Examples for new components
are built in `apps/kitchen-sink` against the registry styling surface.

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
