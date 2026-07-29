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
VisuallyHidden) are headless-only and omitted. The registry-only rows with no
standalone headless component fall into two families: the **prose family**
(Code Block, Inline Code, Prose, and — landed 2026-07-28 — Blockquote, Pull
Quote, List, DescriptionList, Kbd, Figure; see RFC 0023) and the **layout
primitives** (Box, Stack, Spacer, Center, AspectRatio — build-order steps 1–2,
landed 2026-07-28; see RFC 0022). Inline Code, Prose and the five layout
primitives have no Figma set; every other prose-family entry does — Code
Block's is the composed one (`601:9607`,
whose tabbed Type composes Tabs + Button), the RFC 0023 entries each have a
plain component set from RFC 0012 (Figure's from RFC 0015 — node IDs on its
row; the others' node IDs aren't recorded in RFC 0012, only their variable
IDs).

| Component | Figma | Headless | Registry | Kitchen Sink | Node ID / notes |
|---|---|---|---|---|---|
| Accordion | ✓ | ✓ | ✓ | ✓ | 416:6729 (Item), 417:6881 (Panel) |
| AspectRatio | — | registry only | ✓ | ✓ | RFC 0022 (layout primitives, build-order step 2). Registry-only — constrains content to a width/height ratio via CSS `aspect-ratio` (no padding-bottom hack); `ratio` is a continuous number set inline as `--primitiv-aspect-ratio`, not a modifier class. Kitchen-sink = two ratios in the Layout Primitives section |
| Alert | — | ✓ | — | — | |
| Avatar | ✓ | ✓ | ✓ | ✓ | 433:7944 (Size xs-xl × Type Image\|Initials\|Placeholder × Shape Circle\|Square, 30 variants). Headless `Avatar.Root`/`.Image`/`.Fallback` (image load-status compound). Registry `avatar` = fixed-size clipping frame (`.primitiv-avatar` root, `overflow: hidden` + `border-radius`) with the image/fallback absolutely stacked and only one shown per `data-status`; sizing/icon-size reuse `framed-control/*` directly (matches Figma's own binding), radius is the avatar-specific `avatar/radius/*` family (pre-existing token, circle = `full` regardless of size, square = size-scaled); one flagged Figma drift (Placeholder's icon uses `content/secondary`, Initials' text uses `action/secondary/foreground/default` — registry uses the latter for both via `currentColor`). **Fixed 2026-07-29**: initials weren't optically centred (`text-box-trim` on `.primitiv-avatar__fallback`, a flex container, silently didn't apply) — `fallback` now opts into `wrapTextChildren`, wrapping initials in a `.primitiv-avatar__fallback-label` span that actually carries the trim (same class of bug as Badge/Tag's initial build). Kitchen-sink = working image, broken-image→error-fallback, square shape, icon-only fallback |
| Badge | ✓ | registry only | ✓ | ✓ | RFC 0021. Registry-only — no headless companion (a decorative leaf, no genuine interaction/ARIA logic). 40 variants (Tone×Variant×Size, page "Badge"): `variant="label"` (soft tint, low emphasis) vs `variant="counter"` (solid, high emphasis, per-tone AA-audited foreground); circularity via `min-inline-size` pinned to the same height token, independent of `variant`. New `feedback/{tone}/{soft,solid}/*` Intent + `badge/{size}/*` Context tokens. Kitchen-sink = "Badge, Tag & Chip" section (between Avatar and Breadcrumb) |
| Blockquote | ✓ | registry only | ✓ | ✓ | RFC 0012 D12 / RFC 0023. Registry-only prose family — no headless companion. 3px `border-inline-start` accent bar (`tone` default→`border/strong`, accent→`border/focus`), quote + citation bound to the *same* `body/{size}` axis (D12's explicit correction), `cite` prop narrows the native `<blockquote cite>` URL attribute to a display string. Kitchen-sink = tone pair in the intro article |
| Box | — | registry only | ✓ | ✓ | RFC 0022 (layout primitives, build-order step 1). Registry-only — the escape hatch, a bare polymorphic element (`asChild`) with no visual opinion beyond `box-sizing: border-box`. Kitchen-sink = Layout Primitives section |
| Breadcrumb | ✓ | ✓ | ✓ | ✓ | 436:12220 (Item), 436:12221 (Separator), 436:12911 (composition). Design change (2026-07-27): Item gained a `State` variant (`link`\|`current`, was a single undifferentiated style) so the current page reads `content/primary` against a `content/muted` trail (tuned live from an initial `content/secondary` guess — muted reads with a bigger gap against primary); Separator recoloured to match. Registry `breadcrumb` = flex `<ol>` row (unbound flat `space-4` gap, matching Figma's own unscaled `itemSpacing`), Link/Separator on `content-muted`, Page on `content-primary`, body/{size} type throughout; Link's hover reveals an always-in-layout underline (`text-decoration-color` transparent→`currentColor`) fading in with the muted→primary colour lift, so the affordance is a pure colour transition with no reflow. Kitchen-sink = default "/" separator trail + a custom chevron-icon separator trail |
| Button | ✓ | ✓ | ✓ | ✓ | 347:14161 |
| Carousel | 🟡 | ✓ | ✓ | ✓ | Figma set in progress — `CarouselSlide` + parts, full set not yet assembled |
| Center | — | registry only | ✓ | ✓ | RFC 0022 (layout primitives, build-order step 2). Registry-only — a single- or both-axis Flexbox centring box; each `axis` variant sets both alignment properties explicitly so the uncentred axis reads `flex-start` (content-driven), never stretched. Kitchen-sink = Layout Primitives section |
| Checkbox | ✓ | ✓ | ✓ | ✓ | 369:30652 |
| CheckboxCard | — | ✓ | — | — | |
| Chip | ✓ | registry only | ✓ | ✓ | RFC 0021. Registry-only — genuinely interactive, but still no headless companion (the remove affordance is a plain `<button>`, no bespoke ARIA pattern of its own). 25 variants (Size×Interaction default\|hover\|active\|focus\|disabled, page "Chip"); reuses `framed-control/{size}/*` + `action/secondary/*` directly (no dedicated token family) with a `radii/full` pill-radius override and Button's exact offset focus-ring anatomy; the root `<span>` isn't itself clickable, so Interaction states are driven by CSS `:has()` against the nested remove `<button>` (`:hover` on the root, `:active`/`:focus-visible`/`:disabled` via `:has()`). Kitchen-sink = a real removable-filter-list demo backed by `useState` |
| Code Block | ✓ | registry only | ✓ | ✓ | 601:9607 (Size×Type=default\|tabbed; tabbed = Tabs/Trigger strip + text Copy Button, Copy one size below block); registry-only React surface (Prism highlighting via prism-react-renderer); tabbed composes headless Tabs + registry Button |
| Collapsible | ✓ | ✓ | ✓ | ✓ | New "Collapsible" page (`1207:42772`): `Collapsible / Trigger` set (`1207:43048`, 30 variants — Variant[plain\|card\|inline] × State[closed\|open] × Size[xs-xl], md first/default) + composed `Collapsible` set (`1207:43244`, 30 variants) instancing the size-matched Trigger; `Content` SLOT property (20 open/inline variants) + exposed `Label` TEXT property (RFC 0019 dep); headless `collapsedHeight` + fade-shadow landed; registry `collapsible` (grid open/close shared with Accordion, plain/card/inline dressings, card gets a hairline seam instead of a gap once open); kitchen-sink = one collapsible per dressing, inline demonstrating `collapsedHeight` |
| ContextMenu | ✓ | ✓ | ✓ | ✓ | 1142:25899 (reuses Dropdown/* rows via slots — no ContextMenu-specific sub-components). Registry `context-menu` = same row anatomy as Dropdown, resolving the shared `--primitiv-dropdown-*` panel/row tokens rather than a parallel ramp (the same escape hatch Select's listbox uses); root Content is positioned at the cursor by the headless layer, with a bespoke `@position-try` overflow-flip (no anchor to flip around, unlike Dropdown's `flip-inline`/`flip-block` keywords) — opt-in via `anchor-name` (Trigger) + `position-anchor` (Content). Submenus are unchanged anchor-positioned Dropdown-style subs. Kitchen-sink = a canvas/shape-editor right-click menu (leading-icon items + shortcuts, a disabled row, a tri-state checkbox, a radio group, one-level submenu) |
| DescriptionList | ✓ | registry only | ✓ | ✓ | RFC 0012 D10 / RFC 0023. Registry-only prose family — no headless companion. `<dl>` compound (`DescriptionList.Term`/`.Details`); term fixed `font-weight: font-weight-semibold` across every density (D10) — CSS separates Figma's "fontStyle" instance-naming into `font-weight`, so the term binds weight, not style. `layout` (`stacked` default \| `inline`) matches Figma's `Layout` axis (added after a Figma re-check found the first build was missing it entirely) — `inline` is a two-column CSS Grid, no DOM change. No new *colour* tokens; row-gap/column-gap/details-indent are a density-scaled `description-list/*` Context family; `inline`'s pair-to-pair gap reuses List's item-gap directly (the real Figma binding). Kitchen-sink = styled pair in the intro article, both layouts |
| Divider | ✓ | ✓ | ✓ | ✓ | |
| Drawer | ✓ | ✓ | ✓ | ✓ | 1142:26332 (Side×Size; reuses Modal/Header·Body·Footer + Backdrop); headless = thin composition over Modal + `side` axis; registry = standalone `.primitiv-drawer` (edge-docked Modal, `data-side` slide + `width` cross-axis off the `size/*` scale, density-driven padding via `modal/*` tokens); kitchen-sink = one drawer per edge |
| Dropdown | ✓ | ✓ | ✓ | ✓ | 668:42210 (Panel set) + Item/CheckboxItem/RadioItem/SubTrigger/Label/Separator/Group/RadioGroup sets on canvas 317:362; registry `dropdown` (anchor-positioned menu, menu checkmark/dot indicator model — RFC 0019 dep) + the `__item-leading` / `__item-label` / `__item-trailing` row slots mirroring the Figma Show leading / Show trailing properties; kitchen-sink = 3-level nested menu |
| EmptyState | — | ✓ | — | — | |
| Field | ✓ | ✓ | ✓ | ✓ | 394:7449 |
| Fieldset | — | ✓ | — | — | |
| Figure | ✓ | registry only | ✓ | ✓ | 607:32844 (Figure), 606:32739 (Figcaption) — RFC 0015 / RFC 0023. Registry-only prose family — RFC 0015 decided against a headless companion. `Figure.Media` + `Figure.Caption`, `captionPosition` below\|above\|overlay, `size` xs–xl (drives the caption type only — the media is size-independent, as in Figma) and `Figure.Caption`'s own `align` start\|center\|end; unlike the Figma build (which nests the caption inside the media frame to clip it for the overlay treatment), Media and Caption stay DOM siblings in every position — the stylesheet pins the caption over the media's bottom edge with `position: absolute` and matches its corner radii. Kitchen-sink = below/above/overlay laid out with `Stack` |
| Icon Button | ✓ | — | — | — | 433:8386 (icon-only Button — no separate headless/registry) |
| Inline Code | — | registry only | ✓ | ✓ | registry-only (dedicated `code/*` font-size ramp) |
| Input | ✓ | ✓ | ✓ | ✓ | 393:6159 |
| InputGroup | — | ✓ | ✓ | ✓ | input-group |
| Kbd | ✓ | registry only | ✓ | ✓ | RFC 0012 D17 / RFC 0023. Registry-only prose family — no headless companion, the raised-key sibling of Inline Code (`surface/raised` + `border/default` vs Inline Code's `surface/subtle` + `border/subtle`; every other token shared). No new tokens. Kitchen-sink = sized demo in the intro article |
| List | ✓ | registry only | ✓ | ✓ | RFC 0012 D9 / RFC 0023. Registry-only prose family — no headless companion. Custom `::before` markers (bullet/counter) instead of native `::marker`, so both marker colour (`list/marker/foreground`) and marker↔text gap (`list/marker-gap`) are controllable — the native pseudo-element has no controllable gap. `type` unordered\|ordered, `indent` toggle, `size` scales type only (item-gap/marker-gap/indent are density-scaled, not size-scaled). Kitchen-sink = both types in the intro article |
| MillerColumns | — | ✓ | — | — | |
| Modal | ✓ | ✓ | ✓ | ✓ | 435:10250 (Modal), 435:9450 (Header), 435:10108 (Body), 435:10161 (Footer) |
| NavigationMenu | ✓ | ✓ | ✓ | ✓ | Five sets on page "Navigation Menu" (`1333:50772`), all **md-first** (md variants built before the other sizes, so the Size dropdown genuinely leads with md — the reorder Collapsible and Select couldn't get retroactively): `Trigger` (1333:50847, Size×State[closed\|open]×Interaction, chevron flips glyph via Icon rather than rotating), `Bar Link` (1333:51136) + `Panel Link` (1333:51304) — the two placements of the single headless `Link` part (bar = one-line entry; panel = two-line title+description with optional leading/trailing swaps), `Indicator` (1334:51727, Style[arrow\|underline] — the arrow reuses `Tooltip / Arrow` Tone=inverted, the underline binds `border-width/2`), and composed `Navigation Menu` (1334:51944, Variant[closed\|open]×Size) = transparent bar + a `Dropdown / Panel` instance with its stroke and own shadow overridden off, `elevation/overlay` moved to a transparent wrapper so the shadow wraps arrow + panel as ONE silhouette (the Tooltip/Popover model — a border would seam across the arrow base). Geometry adopts the previously-unconsumed `nav-item/*` Context family, extended for this build with an `xl` slot + `padding-block`, `text-gap` and `panel-offset`. Registry `navigation-menu` = anchor-positioned Viewport panel projection, trigger chevron flip, arrow/underline `Indicator` modifiers; kitchen-sink = desktop five-panel disclosure nav (two-column, single-column, and a four-column brand-callout panel) **and** the composed mobile presentation (`Drawer` + `Collapsible` + shared `NavigationMenuLink`) |
| Popover | ✓ | ✓ | ✓ | ✓ | 1168:36142 (composition), 1140:25762 (Content), 1168:35023 (Arrow); registry = borderless panel + `::after` arrow + 12 placements (CSS anchor positioning) |
| Progress | ✓ | ✓ | ✓ | ✓ | 443:7839. Generated wrapper (contract root + one structural subcomponent, `Indicator`). `intent` primary\|secondary\|danger re-points the fill only — the track is neutral in every intent, per Figma. `value`/`max` are `styleProps` — the generated `<Progress>` writes them onto `--primitiv-progress-value`/`-max` inline on the root, inheriting down to `Indicator`, so one prop pair drives both the ARIA behaviour and the fill (the same mechanism Carousel's `slidesPerPage` uses). The fill transforms with `scaleX`, not an animated `width`; indeterminate swaps to a looping slide animation (guarded under `prefers-reduced-motion`). Sized off the new `progress/{size}/height` Context family. Kitchen-sink = 25%/60%/100%/indeterminate |
| Prose | — | registry only | ✓ | ✓ | registry-only (`.primitiv-flow` + `<Prose>` wrapper) |
| Pull Quote | ✓ | registry only | ✓ | ✓ | RFC 0012 D13 / RFC 0023. Registry-only prose family — no headless companion. Large centred quote riding the existing `heading/h5…h1` scale (xs→xl); `marks` toggles a CSS-generated open-quote glyph (`\201C`) in place of the Figma build's bespoke outlined vector. Deliberately takes no width opinion — Figma's fixed 480px isn't reproduced since `Container`'s max-width scale doesn't exist yet (RFC 0022 §4). No new tokens. Kitchen-sink = in the intro article |
| RadioCard | — | ✓ | — | — | |
| RadioGroup | ✓ | ✓ | ✓ | ✓ | 401:17958 (registry `radio`) |
| Segmented Control | ✓ | ✓ | ✓ | ✓ | Figma 1216:44224 (track set, Size×Count 2-5) + 1216:43507 (Item set, Size×Selected×Interaction) on page "Segmented Control" — Tabs-model split (track composes Item). Headless = `SegmentedControl.Root`/`.Item` on RadioGroup single-select semantics (role=radiogroup/radio, roving tabindex, horizontal-default orientation, group + item disabled; 100% mutation). Registry `segmented-control` = transparent bordered track (concentric `calc(item-radius + track-padding)` radius) + framed primary/secondary segments via shared tokens (own styles.css like Tabs/Trigger + ToggleGroup Item, not composing Button). Kitchen-sink = controlled React/Vue/Svelte picker with leading logos + a justified example. Sliding indicator deferred. **Fixed 2026-07-29**: `justified` was flex-based (`flex: 1 1 0`), which only redistributes leftover growable space — a shrink-to-fit track left segments unequal-width, not matching the widest label as documented. Switched to CSS Grid (`grid-auto-columns: 1fr`), verified live to correctly equalise every segment to the widest one's natural width |
| Select | ✓ | ✓ | ✓ | ✓ | `Select / Trigger` (403:1883, renamed) + composed `Select` set (1282:46193, Variant[closed\|open] × Size[xs-xl], stacks a real Dropdown/Panel instance with a working Slot for free row composition — RFC 0019 dep). Headless = one compound, two render paths behind `native` (rich Popover-API listbox by default; 100% mutation), `Select.Value` mirroring the selected item's content into the trigger via a `data-placeholder` hook. Registry `select` = framed trigger on Input's geometry + a panel/rows resolving the shared `dropdown/*` tokens (so a listbox and a menu are one surface, with no `dropdown` dependency), `mode` rich\|native modifier, 4 placements. Kitchen-sink = 7 rich demos (leading marks, leading+trailing slots, groups, top-end, invalid, disabled) + 3 native. Combobox still deferred, see `docs/select-future-work.md` |
| Slider | ✓ | ✓ | ✓ | ✓ | 392:5196 (track), 392:4353 (thumb). Generated wrapper (four-part structural compound — `Root`/`Track`/`Range`/`Thumb`, no subcomponent carrying its own modifiers). No position math in the stylesheet — the headless layer already computes every `left`/`right`/`top`/`bottom` inline; CSS supplies only geometry/colour, with `Thumb`'s cross axis centred via `inset-*-start: 50%` split per `[data-orientation]` so it never collides with the JS-set inset on the value axis. Sized off the pre-existing `slider/{size}/*` Context family (thumb/ring/track tokens, built ahead of this component landing); the focus ring reuses the `thumb-ring-*` tokens rather than the generic system ring. Kitchen-sink = single thumb, range (two thumbs), disabled |
| Spacer | — | registry only | ✓ | ✓ | RFC 0022 (layout primitives, build-order step 1). Registry-only — a blank `flex: 1 0 0` filler for pushing flex siblings apart, decorative by default (`aria-hidden`). Kitchen-sink = pushes a toolbar's trailing group in the Layout Primitives section |
| Stack | — | registry only | ✓ | ✓ | RFC 0022 (layout primitives, build-order step 1). Registry-only — a Flexbox stack, `direction` column\|row, `gap` resolved against a new density-scaled `stack/gap-{xs,sm,md,lg,xl}` Context family (never a raw px value, continuing RFC 0016's "gap is the tool"; `none` pins the flat `space-space-0` primitive), `align`/`justify` pass through as inline styles (plain Flexbox keywords, not tokens). Kitchen-sink = a toolbar row in the Layout Primitives section, and reused throughout the intro article to lay out the other RFC 0023 demos |
| Status | — | ✓ | — | — | |
| Switch | ✓ | ✓ | ✓ | ✓ | 315:5884 |
| Table | ✓ | ✓ | ✓ | ✓ | 605:13524 (Table), 604:9802 (Cell), 604:9991 (Header Cell), 604:10228 (Row) |
| Tabs | ✓ | ✓ | ✓ | ✓ | 425:5528 (Trigger), 425:5539 (Panel) |
| Tag | ✓ | registry only | ✓ | ✓ | RFC 0021. Registry-only — no headless companion. 25 variants (Tone×Size, no Variant axis, page "Tag"); reuses Badge's `feedback/{tone}/soft/*` tokens directly (soft/tinted is the only treatment — no solid/counter equivalent), plus a `feedback/neutral/soft/*` tone Badge doesn't have; own `tag/{size}/*` Context sizing; typography rides `body/{size}/*` (Asta Sans Regular), not Badge's Khand SemiBold — a Tag reads as a plain label, not a stat. Kitchen-sink = "Badge, Tag & Chip" section |
| Textarea | ✓ | ✓ | ✓ | ✓ | 439:14511. Generated wrapper — a single-element component, the same shape as `input`. `min-block-size` (content can grow it) comes from the new `textarea/{size}/min-height` Context family rather than `framed-control/{size}/height`; block padding reuses `framed-control-{size}-padding-inline` for both axes (a uniform box padding) rather than inventing a second padding family. `resize: vertical` only — width already tracks the Field/form column. Kitchen-sink = empty, filled, disabled |
| Toggle | — | ✓ | — | — | standalone Figma set (385:1418) deleted 2026-07-01 when ToggleGroup decoupled from it — no dedicated Figma component currently; rebuild from the workbench reference if needed |
| ToggleGroup | ✓ | ✓ | ✓ | ✓ | 389:3372 (Toggle Group track) + 733:239 (ToggleGroup Item) — redesigned 2026-07-01 as a recessed pill track + floating pill thumb, decoupled from the deleted standalone Toggle set |
| Tooltip | ✓ | ✓ | ✓ | ✓ | 1168:35600 (composition), 1142:25897 (Content), 1168:34990 (Arrow); registry = flat bubble + `__arrow`, `tone` (default dark / inverted surface) × `size` × 12 placements (CSS anchor positioning), `data-state` exit (no overlay, needs `forceMount`) |
| Tree | — | ✓ | — | — | |

## Composite components (proposed)

With the primitive layer nearing completion, the next roadmap phase is
**composite components** — registry-only surfaces built by composing ≥2
existing primitives, with no new ARIA pattern of their own. Full rationale,
selection criteria, and per-candidate composition notes are in
[`docs/rfcs/0021-composite-components.md`](docs/rfcs/0021-composite-components.md).
None of these are built yet; listed here for backlog visibility.

**Tier 1 — buildable now, no prerequisites:**

- [ ] Confirm / Alert Dialog (`Modal` + `Button`)
- [ ] Breadcrumb overflow menu (`Breadcrumb` + `Dropdown`)
- [ ] Avatar Group (`Avatar` + `Tooltip` + overflow badge)
- [x] Badge / Tag / Chip (primitive-less leaf; unblocks several others). Not itself
      a composition (RFC 0021 §4 own footnote — listed here only because it
      unblocks other Tier 1 composites), so structurally it's a hand-authored,
      primitive-less registry leaf, same shape as `Divider`/`Kbd`/`Blockquote`.
      **Landed 2026-07-29, tokens + Figma + registry, all three components:**
      new `color.{success,warning,info}.*` Palette primitives +
      `feedback.{tone}.{soft,solid}.*` Intent tokens (including a
      `feedback.neutral.soft.*` entry for Tag) + `badge/*`/`tag/*` Context
      sizing (code + Figma, all 4 density modes). Figma: Badge (40 variants —
      Tone × Variant × Size — page "Badge"), Tag (25 variants — Tone × Size,
      no Variant axis — page "Tag"), and Chip (25 variants — Size ×
      Interaction default|hover|active|focus|disabled — page "Chip";
      genuinely interactive, so it reuses `framed-control/*` +
      `action/secondary/*` directly instead of a dedicated token family, with
      a pill radius override, Button's offset focus-ring anatomy, and a real
      Leading Icon / Remove Icon instance-swap pair alongside its Label text
      property) — see the `figma-component-descriptions` skill for all three
      canonical descriptions. **Registry** (hand-authored, no
      `@primitiv-ui/react` primitive — `Badge`/`Tag` mirror `kbd`'s
      zero-behaviour shape; `Chip` mirrors `code-block`'s real-behaviour
      shape, its remove glyph inlined from `@primitiv-ui/icons`' `Close` so
      it installs no extra package): all six files × three components,
      registered in `registry/registry.json`, `crates/primitiv-cli/src/ports/
      registry.rs`, `crates/primitiv-cli/tests/cli.rs` (roster count 45).
      Kitchen-sink: a combined "Badge, Tag & Chip" section between Avatar and
      Breadcrumb, Chip's demo backed by real `useState` so the remove button
      actually removes a filter chip.
- [ ] Card (`Divider` + `Avatar`/`Badge` + `Button` slots)
- [ ] Stepper / Wizard (`Tabs` + `Button` + decorative step row)
- [ ] Pagination (`Button` + `Select`)
- [ ] Data Table (`Table` + `Checkbox` + `Dropdown` + `Select` + Pagination + `InputGroup`)
- [ ] Rating (`RadioGroup` re-skinned — reclassified out of Forms below)
- [ ] Stat / KPI tile (`Progress` + `Badge` + `Prose`)
- [ ] Notification / inbox popover (`Popover` + `Badge` + `Status`)

**Tier 2 — needs one small shared extraction first:**

- [ ] Hover Card (`Popover` + a shared hover-intent hook, extracted from
      Tooltip/NavigationMenu's duplicated logic)
- [ ] Toast / notification stack (`Alert`/`Status` + `Portal` + a new
      `useToastQueue` hook)

**Tier 3 — blocked on a primitive-backlog item landing first:**

- [ ] Command Palette (⌘K) — needs Listbox
- [ ] Search with suggestions — needs Listbox
- [ ] Date Picker — needs Calendar
- [ ] File Upload UI (dropzone + previews) — needs File Upload

## Layout primitives (proposed)

A structural gap flagged separately from the composites above: nothing in
the library today arranges components *on a page* — every entry is a
widget. See
[`docs/rfcs/0022-layout-primitives.md`](docs/rfcs/0022-layout-primitives.md).
Hand-authored/primitive-less, same shape as `prose`. `Container`/`Grid`
raise an open question (no breakpoint token scale exists yet) the RFC
recommends deferring rather than solving inline. **Build-order steps 1 and 2
are landed** (registry + kitchen-sink, 2026-07-28) — Box, Stack, Spacer,
Center, AspectRatio. Step 3 (Container, Grid — blocked on RFC 0025's
breakpoint scale) remains.

- [x] Box
- [x] Stack
- [x] Spacer
- [x] Center
- [x] AspectRatio
- [ ] Container — responsive `size` deferred, see RFC 0022 §4
- [ ] Grid — responsive `columns` deferred, see RFC 0022 §4

## Prose & content components (proposed)

Five components with fully-landed Figma design (RFC 0012/0015) that never
crossed into React + registry — a pure code build, no new design or tokens
needed. See
[`docs/rfcs/0023-prose-content-components.md`](docs/rfcs/0023-prose-content-components.md).
**All six landed** (registry + kitchen-sink, 2026-07-28) — see the
component coverage table above for the per-component notes.

- [x] Kbd
- [x] Blockquote
- [x] Pull Quote
- [x] List
- [x] DescriptionList
- [x] Figure + Figcaption — registry-only wrapper; no headless companion (RFC 0015)

## App-shell & marketing patterns (proposed, exploratory)

No existing Figma design behind any of these — needs a design session
before a build plan, unlike the two sections above. See
[`docs/rfcs/0024-app-shell-and-marketing-patterns.md`](docs/rfcs/0024-app-shell-and-marketing-patterns.md).
Depends on the Layout primitives section landing first.

- [ ] Page Header — strongest candidate, build-ready once Layout primitives land
- [ ] Error / Empty page shell — strongest candidate, build-ready once Layout primitives land
- [ ] Auth / form page shell
- [ ] App shell / sidebar layout
- [ ] Hero — content-shaped; may end up a documented recipe, not a registry component
- [ ] Footer — content-shaped; may end up a documented recipe, not a registry component

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
- [ ] Rating — reclassified as a composite (see RFC 0021), no new headless logic needed
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
