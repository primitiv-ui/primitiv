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

- **2026-07-08 — Presentational subcomponents + `slidesPerPage` as a modifier
  (iteration 6).** (a) A styling-only grouping part (the `__controls` row) ships as
  a **generated `<CarouselControls>`** via a new emitter capability: a
  `subcomponent` with no `component` renders its own host `element` (a bare styled
  `<div>`), no headless backing — the behaviourless wrapper stays out of the
  headless primitive but is still part of the copied surface. (b) `slidesPerPage`
  is a **modifier** (not just a raw knob) with **numeric option names** (`1`–`4`):
  safe because `check-registry-types.mjs` stubs `cva`, so the recipe's numeric
  object keys never meet cva's generic inference — the wrapper's `"1" | … | "4"`
  string union is the typed surface. The `--primitiv-carousel-slides-per-page` knob
  stays exposed for arbitrary counts.

- **2026-07-09 — SUPERSEDED: viewport padding reworked from an outer-root gutter
  into a framed viewport track (iteration 7, QA round 2).** The decision below
  (padding on the root) was reverted on human QA — they wanted the frame + padding
  **on the viewport itself**. Now `padding` pads the viewport and turns on viewport
  surface/border/radius knobs (a padded, framed track), with the gap coupled so the
  resting track doesn't peek. See the iteration-7 entry's "QA round 2". The note
  below is kept for the rationale history.
- **2026-07-08 — Viewport padding is the *outer* gutter, distinct from peek
  (iteration 7).** The design/backlog's "Viewport padding" cell was folded into
  peek in iteration 3, but the human re-raised it as its own axis and flagged the
  composition with peek. Settled: **peek and viewport-padding are two different
  gutters and they stack.** Peek lives on the **viewport** (`padding-inline` +
  `scroll-padding-inline`) and *reveals* neighbour slivers — geometrically, a
  snap-aligned slide narrower than the scrollport always shows its neighbours, so
  any viewport scroll-padding is "more peek", never a neutral gutter. Viewport
  padding therefore lives on the **root** (`padding-inline`, `box-sizing:
  border-box` so it stays inside `inline-size:100%`), an outer frame that never
  reveals a neighbour. With both set the edge inset is `padding + peek` while the
  reveal stays exactly `peek` — the decoupling the human's question wanted. Scale
  **mirrors peek** (`none`/`sm`/`md`/`lg` → space-0/16/32/48) so the two gutters
  read as one t-shirt vocabulary (the human floated `xs` — matched peek's scale
  instead for a single mental model; a bespoke value is a direct knob override).
  Follows the scroll axis like peek (inline horizontal, block vertical). Pure CSS
  + a `padding` modifier — **no headless change**, so the publish-gotcha doesn't
  apply.

- **2026-07-09 — Thumbnails are a root `indicators` modifier, not a placement
  (iteration 9).** The axis is *what the indicators look like* (`dots` default ·
  `thumbnails`), orthogonal to `placement` (*where the controls sit*), so it
  composes with every placement/orientation. Thumbnail content is custom
  `<CarouselIndicator>` children (no headless change; the primitive already renders
  indicator children). Active ring = an **inset** `box-shadow` (over the clipped
  image); a dedicated active-`:focus-visible` rule composes it with the outset
  focus ring so a focused active thumbnail keeps both. The auto
  `<CarouselIndicators>` can't carry thumbnails (bare buttons, no children), so
  thumbnails use the manual group — multi-slide + thumbnails is out of scope for
  the example grid. Inactive thumbnails are dimmed (`opacity-60`) + hover-lifted —
  a code addition to reconcile against the Figma reference at lockstep.
- **2026-07-09 — Aspect ratio promoted from a bare knob to a slide `ratio`
  modifier (iteration 10).** `--primitiv-carousel-slide-aspect-ratio` existed but
  had no typed prop; made it a slide modifier (`square`/`standard`/`wide`/
  `ultrawide`) mirroring `radius` so square-vs-wide is a first-class prop, not an
  inline override. Values are ratio shapes (no new tokens); default `wide` is
  byte-equivalent to the prior base, so nothing regresses. Horizontal-only (the
  vertical viewport owns its ratio). No headless change.
- **2026-07-09 — External-flank is a third `placement` option (iteration 11).**
  `placement="flank"` (alongside `row`/`overlay`): prev/next outside the viewport
  edges, indicators below, via a 3-column grid on direct children (grid-areas,
  DOM-order-independent), reusing the default secondary control fill. Horizontal
  only for now — vertical-flank deferred to the placement-expansion follow-up (the
  vertical 2-col grid would fight flank's 3-col areas; not defensively scoped since
  no example composes them). It's the designed home for the thumbnails variant
  ("External-flank + thumbnails"). No headless change.

- **2026-07-09 — Control placement reworked into a composable framework (iteration
  12).** Grounded in the human's new **"Control Placement Framework"** frame on the
  Figma Carousel page (`1074:26198`, conceptual/illustrative — **no Figma lockstep
  this session**). The flat `placement` enum was too coarse; the frame decomposes
  external control placement into orthogonal axes. Landed model: `placement` is now
  the **family** (`external` default — renamed from `row` · `overlay` · `flank`),
  and **three shared control-layout axes compose on top of any family**: **`side`**
  (`after` default · `before` — which cross-axis edge, orientation-relative so it
  reaches all four physical edges by composing with `orientation`, RTL-safe),
  **`distribution`** (`group` default · `stretch` = space-between across the edge),
  **`align`** (`start` · `center` default · `end`, group-only). The whole external
  family collapses to **one flex `__controls` bar** whose `justify-content` is
  driven by distribution+align (space-between = stretch; flex-start/center/end =
  grouped align) — elegant because space-between on the 3 items *is* stretch-to-fill,
  and the same bar works in both orientations (row/column). **`flank` generalised**
  to vertical (up/down flanking the block edges, indicator column on an inline side)
  and to `side` (indicators before/after) via 2-D grid-areas per orientation×side —
  this delivers **vertical-flank**, the combo deferred in iteration 11.
  **`side=before` on external delivers controls-on-top** (and the vertical
  start-side column). Defaults (`external·after·group·center`) reproduce the
  iteration-1 row exactly (drift/gates green, no visual regression intended).
  Axes **degrade to a no-op** where a family doesn't read them (distribution/align
  are external-only; overlay keeps its bottom pill this round) — the composition
  promise. **Preserved learnings** (explicit ask): the overlay control-to-slide-edge
  inset calc (border+padding+peek+inset), the vertical indicator-group width/pill
  fix, the framed-track padding/surface knobs, the WCAG dot hit-area — all
  untouched. Pure registry CSS + 3 modifiers; **no headless change**, so the publish
  gotcha doesn't apply (the dev-alias already covers the earlier headless work).

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

### Iteration 6 — Multi-slide-per-view + CarouselControls part (awaiting human QA)

**Registry surface (headless-free — pure CSS + a modifier).** A root
**`slidesPerPage`** modifier (`1` default · `2` · `3` · `4`) re-points a new
**`--primitiv-carousel-slides-per-page`** count knob. The slide's `flex: 0 0 100%`
became `flex: 0 0 calc((100% - (N - 1) × gap) / N)` — each slide takes an equal
share of the viewport's *content* box (so it composes with peek: the % is of the
box minus 2×peek) minus the inter-slide gaps. With `N = 1` it reduces to the old
`100%`, so the default is byte-unchanged behaviourally. The basis is on the **main
axis**, so it works in **both** orientations for free (block-axis share when
vertical). One snap point per slide is unchanged, so prev/next + dots advance by
one (slidesPerMove = 1). For an arbitrary count, the knob is set directly (the
modifier is the 1–4 convenience). **No headless change** — multi-slide is a slide
layout concern the stylesheet owns (per the JS-vs-CSS table); the primitive
already treats each slide as a snap target, so it's unaffected by the
publish gotcha.

**`slidesPerPage` as a modifier with numeric option keys is type-safe** because
`check-registry-types.mjs` stubs `cva` as `(props?: Record<string, unknown>) =>
string` — cva's real generic inference never runs, so the recipe's numeric object
keys (`{ 1: …, 2: … }`, valid JS, runtime string keys) don't clash with the
wrapper's explicit `"1" | "2" | "3" | "4"` string union. Confirmed green.

**`__controls` promoted to a generated `<CarouselControls>` part** (the human's
side note). It was a CSS-only wrapper `<div>` the example hand-wrote; it is now a
**presentational subcomponent** — a new emitter capability: a `subcomponent` with
no `component` renders its own host `element` (a bare styled `<div>`) with the part
class and no headless backing (TDD in `primitiv-emit`, `contract.rs` +
`wrapper.rs`, `DEMO_GROUPED` fixture + test; the `component` field is now
`Option<String>`). The kitchen-sink examples compose `<CarouselControls>` instead
of the raw div. This keeps the behaviourless grouping element out of the headless
primitive (where it doesn't belong) while still shipping it as part of the copied
surface. Reusable by any future grouping wrapper.

**Built** (`CarouselPage.tsx`, `/carousel/multi`): a 2-/3-/4-up count ladder over a
6-slide gallery, plus 2-up composing with `peek="sm"` and a 3-up RTL instance side
by side.

**Regenerated** (recipe/tsx carry the `slidesPerPage` prop + the `CarouselControls`
part; styles.scss re-derived with the new `$…-slides-per-page` var) + drift-green +
kitchen-sink hand-synced. Registry README updated (the `slidesPerPage` modifier, the
slide flex-basis bullet, `<CarouselControls>` throughout).

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli`,
`node scripts/check-registry-types.mjs`. (No headless change — Carousel vitest not
needed. `cargo-llvm-cov` isn't in the sandbox; the new emitter branch is covered by
`DEMO_GROUPED` + the carousel drift tests — CI's Rust coverage gate confirms 100%.)

**Figma lockstep: pending** human QA. Light — multi-slide is a code-only
knob/modifier (no carousel `--primitiv-*` variable layer in Figma), and the design's
"Slides Per Page (2-up)" cell already shows the intent, so this is expected to be a
verification pass. **Next:** the remaining placements (external-flank /
controls-on-top) or thumbnails.

### Iteration 7 — Viewport padding (awaiting human QA)

**Registry surface (headless-free — pure CSS + a modifier).** A root **`padding`**
modifier (`none` default · `sm` · `md` · `lg`) re-points a new
**`--primitiv-carousel-viewport-padding`** knob. It pads the **root** (not the
viewport) on the scroll axis — `padding-inline` for horizontal, remapped to
`padding-block` under `[data-orientation="vertical"]` — with
**`box-sizing: border-box`** added to the root so the gutter subtracts from
`inline-size:100%` rather than overflowing the container. This is the **outer
gutter** framing the whole carousel; it never reveals a neighbour (that stays
peek's job on the viewport), so the two compose: edge inset = padding + peek,
reveal = peek. Default `none` → byte-unchanged behaviour for every existing
variant (padding-inline resolves to `space-0`; overlay's abs-positioned controls
inset from the padded box, which is a no-op at 0). Scale mirrors peek's.

**Built** (`CarouselPage.tsx`, `/carousel/padding`): a sm/md/lg size ladder, each
in a **tinted, bordered `carousel-page__frame`** so the gutter reads as surface
between the container edge and the slide; plus the **padding + peek** composition
(the axis the human's question raised), a **vertical** (block-axis gutter) and an
**RTL** instance side by side. `BasicSingle` / `VerticalSingle` gained a `padding`
passthrough.

**Regenerated** (recipe/tsx carry the `padding` root prop — omitted from the
headless passthrough, so no DOM leak; styles.scss re-derived with the new
`$…-viewport-padding` var) + drift-green + kitchen-sink hand-synced. Registry
README updated (scope, modifiers, viewport bullet).

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli` (364 + 20 + 105),
`node scripts/check-registry-types.mjs`. (No headless change — Carousel vitest not
needed.)

**QA round 1 (human):** the gutter was missing on the edge **opposite the
controls** (in horizontal the viewport's block-start/top; in vertical the
viewport's far inline edge, opposite the control column) — the first cut padded
only the scroll axis, leaving the cross axis flush. **Fixed** — the root now frames
**every edge** (`padding:` instead of the axis-specific `padding-inline` /
`padding-block`; the vertical remap dropped since full padding covers both axes).
The internal viewport↔controls spacing stays the block gap's job, so the gutter
doesn't leak between them. Regenerated (scss + recipe/tsx JSDoc) + drift-green +
hand-synced.

**QA round 2 (human) — reworked into a framed viewport track.** The human wanted
the frame (surface/border/radius) and the padding **on the viewport itself**, not an
outer gutter on the root with an example-only frame div, and questioned the
root-padding choice. Reworked (human OK'd trying it, revert if it doesn't land):
`padding` now pads the **viewport** (inline = peek + padding on the scroll axis,
block/cross = padding for the frame inset; `box-sizing: border-box`, `overflow`
clips to the radius) and **turns on the viewport frame** via new knobs
(`--primitiv-carousel-viewport-surface` / `-border-width` / `-border-color` /
`-radius`, all off by default). The `padding` sizes couple the inter-slide gap to
the padding so the resting track shows clean inset breathing room (no accidental
peek); `peek` on top reveals a neighbour within the track. The root gutter +
`box-sizing` on the root and the `.carousel-page__frame` example wrapper are gone.
**Caveat:** the clean-track gap coupling is reasoned, not browser-verified (no
sandbox browser) — the inline neighbour-hide depends on `gap ≥ padding`; QA
confirms whether the resting track reads as a clean frame vs. a peek. Regenerated
(scss only; recipe/tsx byte-identical — the frame knobs are `customProperties`,
not modifiers) + drift-green + hand-synced.

**QA round 3 (human) — comprehensive grid.** Reworked `/carousel/padding` to the
same **numbered grid** as the multi-slide page (the `GridCell` component and
`.carousel-grid` CSS were generalised out of the multi page and shared; the human
then set the grid to 2 columns). 12 cells: the `none` baseline + the size ladder,
then compositions — peek-on-top (×2), square slides in a rounded track, overlay,
2-up, vertical, RTL, and a busy lg + 3-up + peek. `OverlaySingle` / `MultiSlide`
gained a `padding` passthrough. Example-only.

**QA round 4 (human) — surface opt-in.** The human liked the track fill but wanted
it **opt-in**, not automatic with `padding`. Split the frame: `padding` now draws
only the **outline** (border + radius) + the inset + gap coupling, and a new root
**`surface`** modifier (`none` default · `subtle`) opts the background fill in
(re-points `--primitiv-carousel-viewport-surface`). So `padding` alone = outlined
track; `padding` + `surface="subtle"` = filled. Contract gained the `surface`
modifier group (regenerated recipe/tsx + scss, drift-green); `BasicSingle` gained a
`surface` passthrough and the grid shows both (cell 2 outlined, cells 3–4 filled).
Also **bumped the overlay control/pill opacity one step** (`neutral-alpha` 500→600,
hover 600→700, active 700→800, pill 500→600, inactive dot inverse-500→600) — the
human found the overlay controls too transparent on bright imagery (registry
default, so it lands on the overlay example too). Both are Figma-lockstep items
(the overlay bump is a value change on the existing bindings; `surface` is a
code-only knob/modifier).

**QA round 6 (human) — vertical overlay (two passes).** The human added vertical
overlay examples but the overlay positioning was horizontal-only, so the prev/next
stayed on the left/right edges (with left/right chevrons) while only the dots pill
went vertical (screenshot). Added `[data-orientation="vertical"].placement-overlay`
rules + the `OverlaySingle` up/down chevron swap. **Round 6b (human):** first pass
put up/down at top-*centre* / bottom-*centre* and the pill's inline inset let it
overflow the slide's inline-end edge (screenshot). Reworked so **every control
rides a lane on the inline-end side** — up at top, dots pill centred, down at
bottom, each inset from the slide edge past the frame (border + viewport padding)
and, for up/down, the block-axis peek. Added a **single-column grid** for
vertical-overlay so the (absolute) controls' reserved column is dropped and the
root is exactly the viewport, so the insets measure from the slide edge (this also
killed the pill overflow). The whole lane mirrors to inline-start under RTL. CSS +
example only (scss re-derived, drift-green).

**QA round 5 (human) — overlay controls inside the padded track.** With `padding` +
`placement="overlay"`, the prev/next and the dots pill were positioned from the
**root** edge (`peek + control-inset`), but the slide is inset inside the viewport
by the frame (border + viewport padding), so the controls straddled the padded-track
gutter / slide edge (screenshot). Fixed: the overlay insets now clear the frame too —
prev/next `inset-inline` and the pill `inset-block-end` add
`viewport-border-width + viewport-padding` (the pill on block, prev/next on inline
alongside the existing peek). Every added term is 0 when unset, so a plain overlay
(no padding/peek) is byte-unchanged. CSS-only (no contract change; scss re-derived,
drift-green).

**Figma lockstep: pending** human QA. Light — viewport padding is code-only (no
carousel `--primitiv-*` variable layer in Figma; bindings only). Reconcile the
framed-track model (viewport surface/border/radius + inner padding) with the
design's "Viewport padding" cell at lockstep. **Next:** the remaining placements
(external-flank / controls-on-top) or thumbnails.

### Iteration 8 — Multi-slide correctness (slidesPerPage / slidesPerMove) (awaiting human QA)

Full audit + plan: `docs/carousel-multi-slide-plan.md`. The human flagged a wrong
indicator count and existing headless bugs; the fix spanned three layers.

**Headless page model hardened (TDD, 100%).** The primitive already modelled
`slidesPerPage` / `slidesPerMove`, but numeric mode had gaps. Fixed (pushed
separately, commit `8b30295`): (1) **end-align the last windowed page** —
`ceil((total − perPage) / move) + 1` with the offset clamped to `total − perPage`
— so an inexact move (6 slides, perPage 3, move 2) no longer orphans the tail
(`[0,1,2] [2,3,4] [3,4,5]`, not `… [2,3,4]`); (2) **clamp numeric `move` to
`[1, perPage]`** so a move can't skip past a page; (3) **guard `perPage` / `move`
to an integer ≥ 1** (0 / negative / NaN / fractional) so a bad count can't divide
by zero (Infinity dots → RangeError) or go inert; (4) a `currentPageOffset` +
`pageForSlideIndex` centralise the offset model so a **user swipe maps to the
nearest window** (round, not floor) in numeric mode. New tests in
`Carousel.slides-per-move.test.tsx` + `Carousel.multi-slide-bounds.test.tsx`;
JSDoc + component README updated.

**Registry split-brain fixed (decision D1 — numeric passthrough).** The wrapper
was swallowing `slidesPerPage` (CSS-class only, never forwarded) so the headless
still thought it was 1 → one dot per slide. New **`primitiv-emit` capability**:
a contract **`styleProps`** entry (`{prop, cssVar}`) makes a root prop that (a)
stays in the props type (it flows from the primitive), (b) drives a CSS custom
property inline (`style={{…} as CSSProperties}`, unset when `undefined`), and (c)
is re-forwarded to the primitive — so **one number drives both** the flex-basis
and the headless page model. `slidesPerPage` moved from a capped `1`–`4` modifier
to this styleProp (any count now); `slidesPerMove` needs no contract change (it
already flows through `{...props}`). TDD in the emitter (`DEMO_STYLED` fixture +
`wrapper_tests`, covering the no-modifier styleProp path; the carousel drift test
covers the with-modifier path). `contract.rs` gained `StyleProp`; `wrapper.rs`
gained `emit_structural_root` + the `CSSProperties` import branch.

**Auto `<CarouselIndicators>` added.** The registry only exposed manual
`IndicatorGroup` + `Indicator`, so examples hand-mapped one dot per slide (wrong
for multi-slide). Added an `indicators` subcomponent → generated
`<CarouselIndicators>` wrapping the headless auto-`Indicators` (renders exactly
`totalPages` dots). The headless auto-dots carry no part class, so the indicator
CSS now targets **`.primitiv-carousel__indicator-group > button`** as well as the
`__indicator` class — both surfaces styled identically. The `--slides-N` modifier
classes were removed (the count is set inline now).

**Built** (`CarouselPage.tsx`, `/carousel/multi`): the **golden edge-case grid** —
a 3-column, numbered, described matrix of 13 cases (clean paged; move-1 window;
odd/partial last page; perPage 3 partials; move-1 overlap; **inexact-move
end-align**; **move-clamp**; fewer-slides-than-a-page ×2; exactly one page; peek
compose; RTL; vertical multi). Each cell states the expected dot count / disabled
ends so QA can tick it off. Uses the auto `<CarouselIndicators>` throughout.

**Regenerated** (recipe/tsx: `slidesPerPage` now forwarded + inline var,
`CarouselIndicators` part; scss re-derived) + drift-green + kitchen-sink
hand-synced. **Kitchen-sink dev-alias confirmed active**, so the unpublished
headless hardening is live for QA. Registry + component READMEs updated.

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli` (364 + 106),
`node scripts/check-registry-types.mjs`, `pnpm --filter @primitiv-ui/react
qa:units` (100% lines/branches/functions/statements, 1696 tests). Rust region
coverage (emit styleProps branches) enforced by CI.

**QA round 1 (human) — partial-last-page desync (examples 4 & 12).** In *auto*
(paged) mode a total that isn't a whole number of pages left a **partial last
page** (`perPage 3`, 7 slides → last page `[6]`). Its leading slide can't align to
the viewport start (nothing follows it), so the browser clamped the programmatic
scroll and `scrollsnapchange` snapped back to slide 4 → the active page desynced
to page 1: two Next clicks looked like they reached the end but left the 2nd dot
active, and Prev then jumped to page 0. **Fixed at the root: the last page now
end-aligns in *both* modes** (unified offset model — `offset(i) =
min(i·step, maxOffset)`, `totalPages = ceil(maxOffset/step)+1`), so every page is
a full, cleanly-snapping window. The page *count* is unchanged (identical to
`ceil(total/perPage)` for a full-page step); only the last page's offset shifts
back (7 slides `perPage 3` → `[0,1,2] [3,4,5] [4,5,6]`). `pageForSlideIndex`
became a nearest-offset scan (round/floor can't invert the end-aligned tail). TDD
(updated the partial-last-page test + 2 new example-4 scenarios in
`Carousel.slides-per-page.test.tsx`); 100% coverage; JSDoc + README updated. This
also subsumes the earlier windowed-only end-align (iteration 8 / commit `8b30295`)
into one model.

**Figma lockstep: pending** human QA. Multi-slide is code-only (no carousel
`--primitiv-*` variable layer); the design's "Slides Per Page" / "Slides Per Move"
cells show the intent. **Next:** re-QA of `/carousel/multi`, the viewport-padding
question (below), then the earlier awaiting-QA iterations.

### Iteration 9 — Thumbnail indicators (human-approved; polish pass pending)

**Registry surface (headless-free — pure CSS + a modifier).** A root
**`indicators`** modifier (`dots` default · `thumbnails`) re-points the indicator
styling: `dots` is the existing compact dot row; `thumbnails` reshapes each
indicator `<button>` into a rounded-rect image **thumbnail** (the gallery
pattern) — the active one ringed in the primary colour, the rest dimmed until
hovered/active. The consumer supplies the thumbnail content as children of each
`<CarouselIndicator>` (an `<img>` or a background element; the headless
`Indicator` already renders `children`, so no primitive change). Seven new knobs
(`--primitiv-carousel-thumbnail-{inline-size,aspect-ratio,gap,radius,ring-width,
ring-color,inactive-opacity}`): the thumbnail is `space-80` wide at the slide's
`16/9` ratio, `radii-8` corners, an `action-primary` ring of `border-width-2`,
and `opacity-60` when inactive. The modifier re-points `--primitiv-carousel-
indicator-gap` to the thumbnail gap (the dot row sits flush at 0), suppresses the
dot `::before`, and fills each frame with its child (`object-fit: cover`,
`display: block` so a non-replaced gradient stand-in fills too). The active ring
is an **inset** `box-shadow` (sits over the clipped image, follows the corners);
a dedicated **active + `:focus-visible`** rule composes the inset ring with the
two-layer outset focus ring so a focused active thumbnail keeps both (the active
rule's specificity would otherwise swallow the focus ring). **No headless change**
— thumbnails are custom indicator *content* + a styling modifier, so the publish
gotcha doesn't apply (the modifier is a CSS class; the child content flows through
the existing `Indicator`). Composes with every placement/orientation for free:
under `vertical` the group already flips to a column (a thumbnail rail beside the
viewport), under `overlay` the thumbnails ride the scrim pill.

**Naming.** A root **`indicators`** modifier (`dots`/`thumbnails`), not a
placement — the axis is *what the indicators look like*, orthogonal to *where the
controls sit* (`placement`). Single-word cva option names (the recipe emitter
doesn't quote keys). The prop `indicators` on the root coexists with the
`<CarouselIndicators>` auto-dots part (different namespaces — a root prop vs an
exported component). ⚠️ **The auto `<CarouselIndicators>` renders bare `<button>`s
with no children**, so it can't carry thumbnail images — thumbnails use the manual
`<CarouselIndicatorGroup>` + `<CarouselIndicator>` (one thumb per slide,
`slidesPerPage={1}`); a multi-slide thumbnail cell would need per-*page* thumbs
and was deliberately left out of the example grid.

**Built** (`CarouselPage.tsx`, `/carousel/thumbnails`): a **2-column grid** of the
control variants for QA — (1) default (prev / thumbnail strip / next below), (2)
horizontal filmstrip (thumbnails as the sole nav, no arrows), (3) vertical
(up / thumbnail rail / down beside), (4) overlay (controls + thumbnail pill on the
imagery), (5) RTL, (6) with peek. A `ThumbnailSingle` helper (placement /
orientation / showArrows / peek) drives every cell.

**Regenerated** (recipe/tsx carry the `indicators` root prop; styles.scss
re-derived) + drift-green + kitchen-sink hand-synced. Registry README updated
(scope, the `indicators` modifier).

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli` (106 + 20),
`node scripts/check-registry-types.mjs`. (No headless change — Carousel vitest not
needed.)

**QA round 1 (human) — approved overall.** The `indicators="thumbnails"`
approach, the composition with every placement/orientation, and the
control-variant grid all signed off as "mostly great." A handful of fine-tuning
items are deferred to a dedicated follow-up session (specifics TBD then) —
treat the current knob values (thumbnail size, ring width, inactive dim) as
provisional pending that pass, not as settled per the RFC 0006 stable-names
convention yet.

**Figma lockstep: pending** — deliberately held until after the deferred
polish pass, so the bridge write happens once (not once now and again after
fine-tuning). The Figma `CarouselThumbnail(s)` part (active = blue ring
`action-primary`, rounded-rect thumbs, bare/no-pill strip) is the design
target; reconcile the exact thumbnail size / radius / ring width and the
inactive-dim treatment (code adds an `opacity-60` dim + hover lift not
specified in the reference) once the code side is settled. No carousel
`--primitiv-*` variable layer exists in Figma (bindings only), so this is
expected to be a verification pass. **Next:** the thumbnails polish session,
then the remaining placements (external-flank / controls-on-top), autoplay, or
re-QA of the earlier awaiting-QA iterations.

### Iteration 10 — Slide aspect ratio (awaiting human QA)

**Registry surface (headless-free — pure CSS + a modifier).** The slide aspect
ratio was already a knob (`--primitiv-carousel-slide-aspect-ratio`, `16/9`) but
had no typed modifier — so "square vs wide slides" was a raw inline override, not
a first-class prop like `radius`/`peek`/`placement`/`indicators`. Promoted it to a
slide **`ratio`** modifier (mirroring `radius`, also on the slide): `square` (1/1)
· `standard` (4/3) · `wide` (16/9 default) · `ultrawide` (21/9), each re-pointing
the existing knob. The values are ratio *shapes* (like the base aspect ratios and
the circular control radius), not token values — no new knobs. Default `wide` is
byte-equivalent to the prior base `16/9`, so every existing variant is unchanged.
Read only in the horizontal layout (the vertical viewport owns its own ratio via
`--primitiv-carousel-vertical-aspect-ratio`, and the vertical rule already stands
the slide aspect down). **No headless change** — aspect ratio is a slide-layout
concern the stylesheet owns (per the JS-vs-CSS table), so the publish gotcha
doesn't apply. Composes with placement + peek for free (ratio is a slide concern,
placement/peek are root concerns).

**Built** (`CarouselPage.tsx`, `/carousel/ratio`): a **2-column grid** answering
the "square group vs wide group" ask — the LEFT column is square (1:1), the RIGHT
column is wide (16:9), paired row by row so each ratio is compared under a matching
control/peek variant: outset (row) controls, overlay controls, and peek sm/md/lg
(10 cells). `BasicSingle` and `OverlaySingle` gained a `ratio` passthrough to their
slides.

**Regenerated** (recipe/tsx carry the slide `ratio` prop alongside `radius`;
styles.scss re-derived) + drift-green + kitchen-sink hand-synced. Registry README
updated (scope, the `ratio` modifier).

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli` (364 + 20 + 106),
`node scripts/check-registry-types.mjs`. (No headless change — Carousel vitest not
needed.)

**Figma lockstep: pending** human QA. Ratio is code-only (no carousel
`--primitiv-*` variable layer in Figma; the `CarouselSlide` set has ratio variants
— 1:1, 16:9 — that already show the intent), so this is expected to be a
verification pass. **Next:** the thumbnails polish session, the remaining
placements (external-flank / controls-on-top), autoplay, or re-QA of the earlier
awaiting-QA iterations.

### Iteration 11 — External-flank placement (awaiting human QA)

**Registry surface (headless-free — pure CSS + a modifier).** Added a third
**`placement`** option, **`flank`** (`row` default · `overlay` · `flank`): the
prev/next controls sit *outside* the viewport's inline edges (left/right) with the
indicators centred in a row below — the Figma "External-flank + dots/thumbnails"
cell, and the designed home for the thumbnails variant (iteration 9). Unlike `row`
(controls in a `<CarouselControls>` wrapper below) and like `overlay`, the parts
are **direct children** of the root; `flank` turns the root into a 3-column grid
(`grid-template-areas: "prev viewport next" / ". indicators ."`) and assigns each
part to its area by class, so DOM order doesn't matter and the indicators centre
in a second row under the viewport. The controls keep the default
secondary-action fill (they're off the imagery, so no scrim re-point like
overlay). Logical grid columns follow writing direction → prev/next swap sides
under RTL with no extra CSS. Reuses the root `gap` (block-gap) for both the
control↔viewport columns and the viewport↔indicators row. **No headless change** —
placement is a layout concern the stylesheet owns. Composes with
`indicators="thumbnails"` (the External-flank + thumbnails cell), `peek`, and the
slide `ratio` for free.

**Naming.** `flank` — single-word cva option (the recipe emitter doesn't quote
keys), matching `row` / `overlay`. Horizontal orientation only for now (the
grid-areas model is inline-axis); a **vertical + flank** combo is left to the
placement-expansion follow-up (the vertical rule's 2-col grid would fight flank's
3-col areas — not defensively scoped since no example composes them yet).

**Built** (`CarouselPage.tsx`, `/carousel/flank`): a **2-column grid** — (1) flank
+ dots, (2) flank + thumbnails (the design cell), (3) flank + peek, (4) flank +
square ratio, (5) flank + RTL, (6) flank + thumbnails + peek. A `FlankSingle`
helper (ratio / peek / indicators dots|thumbnails) drives every cell.

**Regenerated** (recipe/tsx carry the `flank` placement option; styles.scss
re-derived) + drift-green + kitchen-sink hand-synced. Registry README updated
(scope, the `flank` placement).

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli` (364 + 20 + 106),
`node scripts/check-registry-types.mjs`. (No headless change — Carousel vitest not
needed.)

**Figma lockstep: pending** human QA. Flank is code-only (no carousel
`--primitiv-*` variable layer in Figma); the "External-flank + dots" and
"External-flank + thumbnails" design cells show the intent, so this is expected to
be a verification pass. **Next:** the thumbnails polish + placement-expansion
session the human flagged (which will likely add vertical-flank and the
controls-on-top placement), then autoplay / play-pause.

### Iteration 12 — Control placement framework (awaiting human QA)

**Paired with Figma from the start** — read the human's new **"Control Placement
Framework"** frame (`1074:26198`) live via the Desktop Bridge. It's illustrative
only (**no Figma lockstep this session**, by decision); it decomposes external
control placement into orthogonal axes, which drove the model below.

**Registry surface (headless-free — pure CSS + modifiers).** Reworked the flat
`placement` enum into a **composable framework** (see the 2026-07-09 decision):
`placement` renamed default `row` → **`external`** (family: `external`·`overlay`·
`flank`), plus three **shared control-layout axes** that compose on top —
**`side`** (`after` default · `before`), **`distribution`** (`group` default ·
`stretch`), **`align`** (`start`·`center` default·`end`). The external family is
now one flex `__controls` bar driven by `justify-content` (space-between = stretch;
flex-start/center/flex-end = grouped align), working in both orientations; `side`
swaps the bar to the leading edge via `order` + a vertical column-template swap.
**`flank` generalised** to a 2-D grid per orientation×side — delivering
**vertical-flank** (up/down on the block edges, indicator column on an inline side)
and the indicators `before`/`after`. **`overlay` now honours `side` too** (QA
fold-in): horizontal moves the dots pill top (before) / bottom (after); vertical
flips the whole up/pill/down control lane to the inline-start (before) / inline-end
(after) side — so all three families read `side`. Defaults reproduce iteration 1
byte-for-byte.
**Preserved** the overlay inset calc, the vertical pill/indicator-group fix, the
padding/surface framed-track knobs, the WCAG hit-area — all untouched.

**Built** (`CarouselPage.tsx`, `/carousel/placement`): the full combination set
**grouped by family** (per QA request — External · Overlay · Flank, each a labelled
`.carousel-page__group` heading + its own numbered grid, ~36 cells total) so the
whole surface QAs in one pass. External (18): after/before × group{start/center/end}
+ stretch, in both orientations, then peek / padding / square-ratio / vertical+peek /
RTL / thumbnail-stretch compositions. Overlay (9): after/before dots + thumbnails,
vertical after/before, + peek / padding / RTL. Flank (9): after/before dots +
thumbnails, vertical after/before, + peek / square-ratio / RTL. Helpers gained the
axes: `BasicSingle`/`VerticalSingle` (`side`/`distribution`/`align`), `FlankSingle`
(`side`/`orientation`), `OverlaySingle`/`ThumbnailSingle` (`side`); a `ThumbnailStretch`
helper drives the thumbnail-stretch cell. Route + sidebar entry ("Control placement")
wired.

**Regenerated** (recipe/tsx carry the new `side`/`distribution`/`align` root props;
styles.scss re-derived) + drift-green + kitchen-sink hand-synced. Registry README
updated (scope + the placement-framework paragraph). Renamed `row`→`external`
everywhere; swept for stale `placement-row` references (none).

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli` (20 + 106),
`node scripts/check-registry-types.mjs`. (No headless change — Carousel vitest not
needed.)

**QA round 1 (human) — page-scroll bug (headless fix, all pages).** The human
saw the page auto-scroll to the bottom on load and nudge down on every prev/next.
Root cause: `useCarouselViewport`'s programmatic scroll effect called
`targetEl.scrollIntoView()`, which walks **every** scrollable ancestor (incl. the
page/window) — so each of the ~36 carousels scrolled itself into vertical view on
mount (lowest wins → bottom) and every page change re-nudged. Fixed by scrolling
the **viewport element itself** (`viewport.scrollTo` computed from the target
slide's `getBoundingClientRect` delta + current scroll, snap engine finalises) —
restoring the design the hook's own JSDoc already described. TDD: a RED test
("scrolls the viewport, not the slide's ancestors") + rewrote the 7
scrollIntoView-spying tests to assert `viewport.scrollTo` with real mocked
geometry (start/centre math verified). `qa:units` green at 100%
(lines/branches/functions/statements, 1699 tests). Headless, so it fixes **every**
carousel on every page (the dev-alias carries it to the kitchen-sink). Carousel
README's JS-vs-CSS table + scroll/reduced-motion/orientation sections updated.

**QA round 2 (human) — overlay thumbnail tray (registry CSS only).** Two fixes,
both scoped to `.placement-overlay.indicators-thumbnails .__indicator-group` (the
only context where the indicator group has a visible background): (1) **responsive
overflow** — the overlay group was `inline-size: fit-content`, so a long thumbnail
strip overflowed the imagery (flank adapts because its indicators sit in a
`minmax(0,1fr)` grid column that constrains them). Capped the group to the slide
(`max-inline-size` horizontal / `max-block-size` vertical, inset by the same terms
the overlay controls clear) so the flex thumbnails shrink to fit like flank does.
(2) **container shape** — reshaped the dots' full pill (`radii-full`) into a
rounded-rect tray (`radii-12`) with an even `thumbnail-gap` inset, matching the
thumbnails' own corners. No contract change (reuses existing tokens/knobs); scss
re-derived + drift-green + hand-synced; registry README's thumbnail bullet updated.

**QA round 3 (human) — overlay dot tray overflow/collision (registry CSS only).**
Same overflow class as the thumbnails, but dots **can't shrink** (fixed WCAG hit
area) — with many slides the overlay dot tray overflowed the slide and, vertically,
the tall pill collided with the up/down controls sharing the lane (screenshot).
Human chose **wrap** (over scroll / few-slides-only): the overlay dot tray now caps
to the slide (`max-inline-size` horizontal / `max-block-size` vertical — the vertical
cap additionally clears the control size + a gap so the tray sits *between* the
up/down controls) and `flex-wrap: wrap`s the dots onto a second row/column; the base
group's `justify-content: center` centres each line (partial last row centred under
the first, per the human) and `align-content: center` centres the lines block.
Scoped to `.placement-overlay.indicators-dots` (row/flank dots already sit in a
constrained bar/grid cell). Stress cells added to the page's Overlay section (dots
many → wrap h+v, thumbnails many → shrink) via a `slides` passthrough on
`OverlaySingle`/`ThumbnailSingle`. No contract change; scss re-derived + drift-green
+ hand-synced. **Round 3b:** the vertical wrapped dots didn't widen for the 2nd
column (the well-known flex **column-wrap width-collapse** bug). First tried
rotating the flow with `writing-mode: vertical-lr` — it widened correctly but
**remapped the group's logical insets** (`inset-inline-end` → physical bottom), so
the tray jumped to the wrong corner and lost its edge distance (QA caught it).
**Round 3c: CSS Grid** — fixed the positioning (no writing-mode remap) but
`grid-auto-flow: column` greedily overfilled the first column to the cap, leaving a
lopsided 6+2 stub (QA). **Round 3d: CSS multi-column** — balanced the columns
(4+4) but its intrinsic width collapses to one column, so the 2nd column overflowed
the tray + slide (QA). **Settled on CSS Grid (round 3c) as final:** grid's intrinsic
width is the sum of its column tracks, so `inline-size: fit-content` grows to
*contain* every column (the requirement); it fills greedily rather than balancing,
but pure CSS can't do both without knowing the dot count, and in a real full-size
vertical carousel the dots fit one column and never wrap — the greedy split only
shows in the deliberately cramped demo cell. (A perfectly-balanced *and* contained
layout would need a count-driven track count = a small JS/headless enhancement,
deferred as not worth it for this niche combo.)

**Figma lockstep: pending** human QA + a later dedicated build of the placement
model in Figma (the current frame is conceptual). No carousel `--primitiv-*`
variable layer exists (bindings only). **Next:** QA `/carousel/placement`; then
autoplay/play-pause, or the thumbnails polish.

### Iteration 13 — Slide spacing (`gap` modifier) (awaiting human QA)

**Registry surface (headless-free — pure CSS + a modifier).** A root **`gap`**
modifier (`none` · `sm` · `md` default · `lg`) re-points the existing
**`--primitiv-carousel-gap`** knob on a t-shirt scale (`space-0` / `8` / `16` / `32`),
so the inter-slide spacing is a first-class prop, not a raw knob override. `md`
(space-16) is byte-equivalent to the prior base, so nothing regresses. It runs on
the scroll axis in **both** orientations (the viewport `gap` follows flex-direction)
and composes with every variant — the slide flex-basis already subtracts the gap, so
multi-slide recomputes automatically. **Placed before the `padding` rules in the
sheet** so the framed-track gap coupling (padding sets `--gap` = its inset for a
clean track) still wins when both are set — documented as the one composition where
`gap` defers. **No headless change** (gap is a slide-layout concern the stylesheet
owns), so the publish gotcha doesn't apply.

**Built** (`CarouselPage.tsx`, `/carousel/spacing`): an 8-cell grid — the size
ladder (none/sm/md/lg over a 2-up view, since the gap only shows with >1 slide
visible), then compositions (gap+peek on a single slide, gap+3-up, gap+vertical
block-axis, gap+RTL). `MultiSlide` / `BasicSingle` gained a `gap` passthrough. Route
+ sidebar entry ("Slide spacing") wired.

**Regenerated** (recipe/tsx carry the `gap` root prop; styles.scss re-derived) +
drift-green + kitchen-sink hand-synced. Registry README updated (scope + the `gap`
modifier). **Gates green:** `cargo test -p primitiv-emit -p primitiv-cli`,
`node scripts/check-registry-types.mjs`.

**Figma lockstep: pending** human QA. Gap is code-only (no carousel `--primitiv-*`
variable layer in Figma). **Next:** QA `/carousel/spacing` + `/carousel/placement`.

## Backlog (examples still to build)

Seeded from `ROADMAP.md` "Carousel example backlog (Blossom parity)".
Reorder as priorities shift; each is human-approved before it starts.

**Basic**

- Basic responsive single-slide _(iteration 1 — done)_
- Vertical orientation _(iteration 2 — awaiting QA of the landscape look)_
- Peek (cross-cutting option) _(iteration 3 — awaiting QA)_ — the `peek`
  modifier + `--primitiv-carousel-peek` knob; subsumes the "Wide peek" matrix cell.
- Viewport padding (cross-cutting option) _(iteration 7 — awaiting QA)_ — the
  `padding` modifier (`none` default · `sm` · `md` · `lg`) +
  `--primitiv-carousel-viewport-padding` knob; an **outer** gutter on the root
  (mapped to the scroll axis, `box-sizing: border-box`), distinct from peek and
  composing with it. Subsumes the "Viewport padding" matrix cell.
- Multi-slide-per-view _(iteration 6, then corrected in iteration 8 — awaiting QA)_
  — `slidesPerPage` / `slidesPerMove` are now numeric **styleProps** forwarded to
  the headless page model (not capped modifiers), the last windowed page
  end-aligns, counts are guarded, and the auto `<CarouselIndicators>` renders the
  right dot count. Golden edge-case grid at `/carousel/multi`. See iteration 8 +
  `docs/carousel-multi-slide-plan.md`.
- Placement framework _(iterations 4/11, then reworked into a composable framework
  in iteration 12 — awaiting QA)_ — `placement` is now the **family** (`external`
  default · `overlay` · `flank`) with three shared composable axes **`side`**
  (before/after), **`distribution`** (group/stretch), **`align`** (start/center/end).
  This subsumes the old `row`, delivers **controls-on-top** (`side="before"`) and
  **vertical-flank**, and composes across peek/padding/ratio/vertical/RTL/thumbnails.
  24-cell grid at `/carousel/placement`. Remaining placement work: overlay honouring
  `side` (top pill).
- Dots / indicators variations (below, overlaid _(overlay done, iteration 4)_,
  thumbnails _(iteration 9 — human-approved, polish + Figma lockstep pending)_ —
  the `indicators` modifier (`dots` default · `thumbnails`); image thumbnails as
  the indicators, active one ringed in `action-primary`. 2-column
  control-variant grid at `/carousel/thumbnails`.)
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
