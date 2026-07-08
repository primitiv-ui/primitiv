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
- **2026-07-08 — Figma lockstep done (via the bridge; not in git).**
  Key finding: **there is no per-component `--primitiv-carousel-*` variable
  layer in Figma** — the carousel components bind directly to Primitives /
  Intent variables (the code's knob indirection is code-only; e.g.
  `CarouselControl` fill was already bound to `action/secondary/default`). So
  the lockstep was binding-parity + value fixes, **not** a new collection.
  Changes written: **`CarouselSlide`** cornerRadius `0 → 12` bound to `radii/12`
  (all 3 ratio variants — fixes the design-time oversight); **`CarouselIndicators`**
  `itemSpacing 8 → 16` bound to `space/space-16` (all 4 external/overlay ×
  horizontal/vertical variants) → 24px pitch, matching the AA-floored code
  (human chose design==ship over the tighter 16px mockup). `CarouselControl`
  (32px circular, `action-secondary`, width bound) already matched — no change.
  Optional future: a slide `radius=none` variant (not modelled in Figma).
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

- **2026-07-08 — Kitchen-sink dev-aliases the workspace source (QA of
  unpublished headless changes).** The kitchen-sink is excluded from the pnpm
  workspace and consumes the **published** `@primitiv-ui/react@^0.1.0`, so the
  vertical variant — the first example needing a *new* headless capability
  (`orientation`) — rendered as the horizontal fallback (no `data-orientation`
  emitted). Iteration 1 "just worked" because horizontal was already published.
  Fix (human choice): `vite.config.ts` + `tsconfig.app.json` `paths` alias
  `@primitiv-ui/react` and `@primitiv-ui/icons` to `packages/*/src`, so example
  pages exercise workspace source ahead of a publish. **Drop an alias once its
  change ships to npm.** This also smooths every future variant that fills a
  headless gap.

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

## How to start a variant (next sessions)

Run **`/carousel-variant <name>`** (e.g. `/carousel-variant overlay`). It loads
the `carousel-variant` skill + these docs, reads the Figma frame, builds the
example route + evolves the registry surface, runs the gates, pushes to `main`,
and stops for your QA (Figma lockstep stays after sign-off). Pick `<name>` from
the backlog below.

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
- [x] Dedicated Carousel section: `react-router-dom` (`^7.14.1`, matching
      the workbench), `<BrowserRouter>` in `main.tsx`. `Shell.tsx` = the
      page nav (`/` → App, `/carousel` → nested). `pages/CarouselLayout.tsx`
      = a **left sidebar** of full-page example routes
      (`default`/`responsive`/`rtl`/`square`, `index` → `default`) around
      an `<Outlet/>`, with the reusable **`ChromeControls`** bar
      (`chrome.tsx` — density/size/theme, applied on `<html>`) up top so
      those checks are available while iterating. Each example is its own
      route component in `pages/CarouselPage.tsx`.

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

**QA round 1 (human):** nested routes approved — keep the format. Dots read
too far apart: the 8px dots sat in 48px hit buttons + an 8px gap (~56px pitch).
**Fixed** — indicator hit-area 48→24 (`space-24`) and gap 8→0, so the pitch is
now 24px (WCAG 2.5.8 AA floor) with the same small 8px dots. Registry default,
regenerated + drift-green + hand-synced.

**QA round 2 (human):** with the dot gap at 0, the prev/next buttons sat flush
against the dots — needs a wrapper with its own gap. **Added** a
`.primitiv-carousel__controls` CSS-only helper (a wrapper `<div>` the consumer
puts prev / indicators / next in) with a dedicated
`--primitiv-carousel-controls-gap` knob (`space-16`), separate from the tight
dot-to-dot `indicator-gap`. Renamed the old root grid gap `control-gap` →
`block-gap` (viewport↔controls, vertical) to disambiguate from the new
controls-row gap. Kitchen-sink example now uses the registry class (dogfooding).
Three distinct gaps now: `gap` (slide↔slide) · `block-gap` (viewport↔controls) ·
`controls-gap` (prev↔dots↔next). Regenerated + drift-green + hand-synced.

**Figma lockstep: done** (2026-07-08 — slide radius + indicator pitch mirrored
via the bridge; no variable collection needed — see the decisions entry).

**Next:** the **vertical** headless work (driven early, per the design) — start
it with `/carousel-variant vertical`.

### Iteration 2 — Vertical orientation (awaiting human QA)

**Headless gap filled (TDD, 100%).** Added an `orientation` prop
(`"horizontal"` default · `"vertical"`) to the primitive
(`Carousel.orientation.test.tsx`, 8 tests). It threads through
`useCarouselRoot` → context and drives four things:
- `data-orientation` published on the Root `<section>` (the styling hook).
- The viewport scroll axis — `scrollIntoView` uses the `block` option
  (mapped to `snapAlign`) with `inline: "nearest"` when vertical.
- The user-swipe sync — reads `snapTargetBlock` off `scrollsnapchange`
  instead of `snapTargetInline`.
- Keyboard — the viewport pages on `ArrowDown` / `ArrowUp` (the
  horizontal arrows go inert); `Home` / `End` unchanged.
The `IntersectionObserver` page fallback is axis-agnostic (lowest visible
index), so it needed no change. JSDoc + component README updated (new
Orientation section, keyboard table).

**Registry surface evolved.** A `[data-orientation="vertical"]` block in
`styles.css` (variants layer): the root becomes a two-column grid
(`minmax(0,1fr) auto`) so the viewport sits beside a controls **column**;
the viewport is a landscape scroll box (new
**`--primitiv-carousel-vertical-aspect-ratio`** knob, `16 / 9` — one slide
shown, scroll down to the next, matching the design; override for a portrait
track) snapping on the block axis; the slide's horizontal `aspect-ratio`
stands down; the
`__controls` and `__indicator-group` flip to `flex-direction: column`. The
grid columns follow writing direction, so RTL moves the controls to the
start side with no extra CSS. Contract documents `data-orientation` (as
Tabs does) + the new knob. Regenerated (recipe/tsx unchanged; styles.scss
re-derived) + drift-green + kitchen-sink hand-synced (also fixed the
stale contract copy left from the iteration-1 QA rounds).

**Built** (`CarouselPage.tsx`, `/carousel/vertical`): the vertical
"External-column beside" composition + a side-by-side RTL instance.

Gates green: `cargo test -p primitiv-emit -p primitiv-cli`,
`node scripts/check-registry-types.mjs`, `pnpm --filter @primitiv-ui/react
qa:units` (100% lines/branches/functions).

**Figma lockstep: done — verification pass, no writes needed** (2026-07-08,
via the bridge). The vertical anatomy was already built correctly in the
design: `CarouselControl` up/down (both contexts, 4 states each) match the
prev/next external bindings exactly — 32×32 (`space/32`, id `369:32054`),
fill `action/secondary/default` (`346:4418`), circular radius (`142:124`);
`CarouselIndicators` `orientation=vertical` is `VERTICAL` layout with
`itemSpacing 16` bound to `space/space-16` (`4:13`). No carousel
`--primitiv-*` variable layer exists (bindings only, per the earlier
finding), and the `3/4→16/9` viewport ratio is code-only — so there was
nothing to write. The **real divergence was code-side**: the shipped
vertical was portrait single-slide, but the design's `card: Vertical` cell
is **landscape slides with top/bottom peek + side controls**. Reconciled by
flipping the code default to landscape `16/9` (above); **peek deferred** to
its own cross-cutting iteration (below). The Figma vertical example keeps
its peek as the documented target.

**Next:** human QA of the landscape `/carousel/vertical`. Then a
placement-focused iteration (overlay / external-flank / on-top) or
multi-slide-per-view.

### Iteration 3 — Peek (cross-cutting option, awaiting human QA)

**Registry surface (headless-free — pure CSS + a modifier).** The old
`--primitiv-carousel-padding-inline` knob was renamed to the semantic
**`--primitiv-carousel-peek`** and made cross-cutting: the base viewport pads
the inline edges and sets a matching **`scroll-padding-inline`** so the active
slide (still `flex: 0 0 100%`, now of the *content* box = viewport − 2×peek)
snaps inside the padding and reveals a peek-wide sliver of each neighbour. The
vertical viewport remaps peek to the **block** axis (`padding-block` +
`scroll-padding-block`, inline padding zeroed). A root **`peek` modifier**
(`none` default · `sm` `space-16` · `md` `space-32` · `lg` `space-48`) re-points
the knob — so `<Carousel peek="md">` works in either orientation, and composes
with every other variant. No headless change: `scrollIntoView` aligns start-to-
start and the snap engine corrects to the padded snap position, exactly as the
existing peek path always assumed.

**Regenerated** (recipe/tsx now carry the `peek` root prop; styles.scss
re-derived) + drift-green + kitchen-sink hand-synced. Registry README updated
(scope, modifiers, viewport/slide bullets).

**Built** (`CarouselPage.tsx`, `/carousel/peek`): a horizontal peek size ladder
(sm/md/lg) + peek composing with the **vertical** and **RTL** variants side by
side — peek shown in action across the other variants, per the request.

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli`,
`node scripts/check-registry-types.mjs`.

**Figma lockstep: pending** human QA. Light — peek is a code-only knob/modifier
(no carousel variable layer in Figma); the existing "Wide peek" / peek example
cells already show the intent, so this is expected to be a verification pass like
vertical. **Next:** placement-focused iteration (overlay / external-flank).

### Iteration 4 — Overlay placement (awaiting human QA)

**Read the design live** (Desktop Bridge, 2026-07-08) — the Examples-frame cell
`card: Overlay + dots` (`1033:25218`). Exact anatomy captured: viewport 320×144
radius 12 with a peek sliver; **CarouselControl** 32×32 circular, **inset 8px**
from the inline edges, vertically centred, fill `color/neutral-alpha/500`
(`#1214184d`, dark @30%), glyph `color/absolute-white`; the bottom cluster is a
**CarouselIndicators pill** (`neutral-alpha/500`, radius full, padding block 8 /
inline 12, dots gap 16) **+ a CarouselAutoplayButton** (same scrim), grouped and
**inset 8px** from the bottom. Dots: inactive `color/neutral-alpha-inverse/500`,
active `color/absolute-white`.

**Registry surface (headless-free — pure CSS + a modifier).** A root
**`placement`** modifier (`row` default · `overlay`). `row` is the existing
below-the-viewport flow layout (base; the class carries only `position: static`
so the axis is explicit). `overlay` makes the root the positioning context and:
prev/next go `position: absolute`, flanking the slide edges
(`inset-inline-start`/`-end: --overlay-control-inset` = `space-8`) and vertically
centred (`inset-block:0` + `margin-block:auto`); the indicator group becomes a
bottom-centred pill (`inset-block-end: space-8`, `inset-inline:0` +
`margin-inline:auto` + `inline-size:fit-content` — transform-free so it stays
centred under RTL) with the scrim `background`, `radii-full`, and small padding.
The modifier **re-points the shared control/indicator colour knobs** to a new
`--primitiv-carousel-overlay-*` family (11 knobs): control bg = `neutral-alpha-500`
(hover 600 / active 700), fg = `content-inverse`; pill bg = `neutral-alpha-500`;
inactive dot = `neutral-alpha-inverse-500`, active dot = `content-inverse`. No new
part classes — overlay reuses `__prev`/`__next`/`__indicator-group`. Logical
properties throughout → RTL swaps the controls and keeps the pill centred with no
RTL-specific CSS.

**Naming.** `placement` option `external-row` → **`row`**: the recipe emitter
doesn't quote cva variant keys, so a hyphenated option name emits invalid JS
(`external-row: …`). Every existing modifier option is a single-word identifier;
`placement="row"` / `"overlay"` keeps that and reads cleanly. (Future placements:
`flank`, `top`.)

**Theme divergence from Figma (for the lockstep).** The Figma pins light mode, so
it binds the control glyph + active dot to **`absolute-white`** (fixed). Code uses
the theme-adaptive **`content-inverse`** (white in light on the dark scrim, black
in dark on the light scrim) so overlay stays legible in **both** themes — flagged
as an open question to reconcile at the Figma lockstep.

**Play/pause deferred.** The design's bottom cluster pairs the dots pill with a
`CarouselAutoplayButton`. The headless primitive already supports play/pause +
autoplay, but the registry surface doesn't expose a `PlayPauseTrigger` yet — that
lands with the **Autoplay + play/pause** backlog item (the overlay CSS centres the
pill alone; a bottom-cluster wrapper will group it with a play button then).

**Regenerated** (recipe/tsx now carry the `placement` root prop; styles.scss
re-derived) + drift-green + kitchen-sink hand-synced. Registry README updated
(scope, modifiers).

**Built** (`CarouselPage.tsx`, `/carousel/overlay`): the design cell (overlay +
`peek="sm"`), plus edge-to-edge (no peek) and an RTL instance side by side.

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli`,
`node scripts/check-registry-types.mjs`. (No headless change — Carousel vitest not
needed.)

**QA round 1 (human):** overlay controls approved. One fix — with `peek` set, the
prev/next were inset only from the *viewport* edge, so they overlapped the peek
gutter and part of the button sat off the slide. **Fixed** — the overlay control
inset is now `calc(peek + overlay-control-inset)`, so the control follows the
active slide's leading edge and keeps a comfortable gap from *its* edge at any
peek value (peek=0 is unchanged). Regenerated + drift-green + hand-synced.

**Figma lockstep: pending** human QA. It will be a verification pass (no carousel
`--primitiv-*` variable layer exists — bindings only) plus the `absolute-white`
vs `content-inverse` decision above. **Next:** the remaining placements
(external-flank / controls-on-top) or multi-slide-per-view.

### Iteration 5 — Fade transition (awaiting human QA)

**Headless gap filled (TDD, 100%).** The primitive already had a `transition`
prop (`"slide" | "none"`) that gates all scroll wiring on `transition === "slide"`
while still flipping the per-slide `data-state`. Two additions drove fade:
- a named **`"fade"`** member on `CarouselTransition` (`"slide" | "fade" | "none"`)
  — the JS gate is `!== "slide"`, so `"fade"` disables scroll wiring for free;
  it exists to name the intent so the styled surface can ship a crossfade default;
- a **`data-transition`** hook on the Root `<section>` (mirrors `data-orientation`)
  publishing the resolved mode, so CSS switches the visual off one hook.
Driven by two RED tests in `Carousel.transition-modes.test.tsx` (default
`data-transition="slide"`; `="fade"` when set). JSDoc + component README updated
(transition section rewritten around the `data-transition` hook + the fade CSS
recipe). Full `qa:units` green at 100% lines/branches/functions/statements.

**Registry surface (CSS keyed off the headless hook — no modifier).** Because
`transition` is a **passthrough** Root prop (the wrapper omits only `peek` /
`placement`), `<Carousel transition="fade">` reaches the headless Root directly —
no contract modifier, no recipe/tsx change. Under `[data-transition="fade"]` the
stylesheet stops the viewport scrolling (`display: grid`, gap/peek/overflow
neutralised), stacks every slide in the one cell (`grid-area: 1 / 1`), and
cross-fades the active slide in over the others off its `data-state` hook. The
outgoing slide keeps `visibility: visible` (hittable/announced) until the opacity
fade completes via a `visibility 0s … <fade-duration>` delay, then drops from the
hit-test + a11y tree; the active override (states layer) clears that delay. Two
new knobs — `--primitiv-carousel-fade-duration` (`motion-duration-overlay`) /
`--primitiv-carousel-fade-easing` (`motion-easing-default`) — and the
`data-transition` hook documented in the contract `dataAttributes`. Regenerated
(scss re-derived; recipe/tsx byte-identical) + drift-green + kitchen-sink
hand-synced (styles.css + contract).

**Built** (`CarouselPage.tsx`, `/carousel/fade`): a crossfade with the row
controls below, plus a crossfade composing with `placement="overlay"` — a
hero-style fade carousel. (Kitchen-sink dev-alias already in place, so the new
headless `"fade"` value + `data-transition` hook are live there.)

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli`,
`node scripts/check-registry-types.mjs`, `pnpm --filter @primitiv-ui/react
qa:units` (100%).

**Figma lockstep: pending** human QA. Light — fade is code-only (timing knobs +
a data hook; no carousel variable layer in Figma). The design's
`Crossfade / dissolve` intent maps directly. **Next:** the remaining placements
(external-flank / controls-on-top) or multi-slide-per-view.

## Backlog (examples still to build)

Seeded from `ROADMAP.md` "Carousel example backlog (Blossom parity)".
Reorder as priorities shift; each is human-approved before it starts.

**Basic**

- Basic responsive single-slide _(iteration 1 — done)_
- Vertical orientation _(iteration 2 — awaiting QA of the landscape look)_
- Peek (cross-cutting option) _(iteration 3 — awaiting QA)_ — the `peek`
  modifier + `--primitiv-carousel-peek` knob; subsumes the "Wide peek" /
  "Viewport padding" matrix cells.
- Multi-slide-per-view (slidesPerPage, gap, peek)
- Placement: overlay _(iteration 4 — awaiting QA)_ — the `placement` modifier
  (`row` default · `overlay`); controls inset on the imagery, dots in a pill.
  Remaining placements (external-flank, controls-on-top) still to build.
- Dots / indicators variations (below, overlaid _(overlay done, iteration 4)_,
  thumbnails)
- Snapping (centred) — `snapAlign="center"`
- Right-to-left — needs explicit RTL confirmation/tests
- Masonry — grid-based with complex snapping cells
- Sticky Slides — sticky labels/content inside slides

**Advanced**

- Cover Flow (scroll-driven 3D, `--cf-*` playground)
- Autoplay + play/pause
- Crossfade / dissolve (`transition="fade"`) _(iteration 5 — awaiting QA)_ —
  the `transition="fade"` value + `data-transition` hook + registry crossfade CSS;
  dissolve is the same mechanism with different timing knobs.
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
- [x] Vertical orientation + `data-orientation` — **landed (iteration 2)**.
      `orientation="vertical"` switches the scroll axis, the `snapTargetBlock`
      sync, and the ArrowDown/ArrowUp keys; `data-orientation` on the Root is
      the styling hook.
- [x] Fade transition + `data-transition` hook — **landed (iteration 5)**.
      `transition="fade"` (a named non-slide mode) disables scroll wiring and
      publishes `data-transition` on the Root; the registry crossfades off it.
- [ ] Mouse-drag gesture (only native scroll today)
- [ ] Explicit RTL tests (mirrors implicitly via logical properties;
      no dedicated coverage)

## Open questions (for the human)

- ~~**Slide corner radius.**~~ **Resolved 2026-07-08:** round by default
  (`radii-12`) + a `radius` modifier to square it; update the Figma
  `CarouselSlide` (was `cornerRadius:0`) to match in the next lockstep pass.
- ~~**Overlay vs external control fill.**~~ **Resolved 2026-07-08 (iteration 4):**
  the overlay context landed as the root **`placement="overlay"`** modifier —
  controls on a `neutral-alpha-500` scrim (glyph `content-inverse`), dots in a
  `neutral-alpha-500` pill. `row` (external, `action-secondary`) stays the default.
- **Overlay glyph/active-dot colour at the Figma lockstep.** Figma binds them to
  `absolute-white` (it pins light mode); code uses the theme-adaptive
  `content-inverse` so overlay stays legible in dark mode. Confirm the code
  choice (and whether Figma should adopt a theme-adaptive equivalent) at lockstep.
- **Overlay + autoplay pill grouping.** The design pairs the dots pill with a
  play button in one bottom cluster. Play/pause is deferred to the autoplay
  iteration; revisit the pill-vs-cluster centring (a bottom-cluster wrapper) then.
