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

- **2026-07-13 — Blanket QA approval for everything currently in the
  kitchen-sink.** The human confirmed every route under `/carousel` in
  `CarouselLayout.tsx`'s nav — every per-feature example page plus the
  `builder` composability sandbox — is human-approved as shipped. Every
  iteration heading below that previously read "(awaiting human QA)" has been
  updated to "(human-approved)" to reflect this; the many in-body **"Next:**
  human QA of …" pointers scattered through older iteration entries predate
  this confirmation and are now historical rather than outstanding action
  items — read them for narrative/implementation history, not current status.
  **This does not clear Figma lockstep** — that stays tracked per iteration as
  its own, still-genuinely-open item (see each entry's own "Figma lockstep:"
  line) — QA approval and design-tool lockstep are separate gates. See also
  the "QA status" note under Parity tracking → Example backlog.
- **2026-07-13 — Overscroll callback shape (Blossom gap).** Scope: cover the
  three input sources the carousel already owns the physics for — keyboard,
  wheel, and mouse drag — and explicitly exclude native touch/swipe (no JS
  hook to observe OS-level rubber-banding from). Detection is
  **page-boundary-driven** (`canGoNext`/`canGoPrevious`), not raw
  scroll-pixel geometry — robust in both jsdom tests and real browsers, and
  consistent with how the rest of the primitive already treats boundaries.
  Keyboard and wheel are instantaneous taps (`amount: 0`, a single bare
  `"overscroll"`); `Home`/`End` are absolute jumps, not directional pushes,
  so they're excluded. Mouse drag is the one continuous, physically real
  case — it gets the full `onDragStatusChange`-shaped `"overscroll.start" |
  "overscroll" | "overscroll.end"` treatment with a live pixel `amount` (the
  drag delta already computed for the regular drag-scroll, no new geometry
  needed), plus a `data-overscroll` DOM hook and an `isOverscrolling()`
  imperative getter mirroring the existing `data-dragging`/`isDragging()`
  pair. See "Blossom — gaps identified" below for the landed writeup.
- **2026-07-13 — Variable-width slides scope (Ark UI's `autoSize`).** Resolves
  the design fork flagged when the idea was first raised (iteration 14's
  "Next / proposed" note). **Scoped to `slidesPerPage={1}`** — the multi-slide
  windowing math's flex-basis calc assumes every slide is an equal share,
  which a content-driven width fundamentally breaks; composing the two axes
  is unsupported (documented, not CSS-guarded). **Pure CSS, no headless
  change** — re-read `useCarouselViewport.ts`'s scroll effect before
  committing to this: it already measures the target slide's real
  `getBoundingClientRect()` width, never an assumed percentage, so the
  scroll-to-slide math was already width-agnostic. New root **`slideWidth`**
  modifier (`equal` default · `content`): `content` flips the slide's
  `flex: 0 0 <equal-share%>` to `flex: 0 0 auto` (intrinsic sizing) and resets
  `aspect-ratio` to `auto` (not `none` — `none` isn't valid CSS for this
  property; caught before it shipped) so the forced ratio doesn't fight the
  intrinsic size, mirroring the existing vertical-orientation reset. A real
  `<img>` slide should size to its own natural dimensions under this with no
  extra CSS (a percentage-sized replaced element inside an auto-sized
  ancestor falls back to intrinsic size, per the CSS sizing spec) — reasoned
  from the spec, not confirmed in a real browser this session (no headless
  browser available), flagged for human visual QA. See the iteration-14
  sub-entry below for the full build writeup.

- **2026-07-15 — Loop / infinite: two-phase strategy locked (C then A, same
  session), with A's iOS-inertia problem solved *in advance*.** The variant is
  split into two phases behind the loop concept, because seamless native-scroll
  looping and "no dead ends" are genuinely different targets (research: every
  seamless-loop lib — Embla, Swiper, Splide, Keen — gives up native scroll and
  drives its own transform/rAF engine; native scroll-snap can only *teleport*,
  and Blossom documents pure scroll-driven looping doesn't work). The prior
  workbench "two extra slides at each end" attempt was never committed and is
  not recoverable — only the concept was tracked. Diagnosis of why it failed:
  too few clones (a single iOS flick blows through a 2-slide buffer before it
  settles) **and** almost certainly teleporting on the wrong signal
  (mid-scroll) instead of at rest.

  **Phase C — semantic wrap ("no disabled ends"), the Figma-documented intent.**
  A `loop?: boolean` root prop. The end-clamp is localized to four spots in
  `useCarouselRoot` (`canGoNext`/`canGoPrevious` + the guards in `next`/
  `previous`); under loop, `canGoNext = canGoPrevious = totalPages > 1`, `next`
  wraps `(page + 1) % totalPages`, `previous` wraps `(page - 1 + totalPages) %
  totalPages`. Autoplay wraps **for free** (its `eligible` gate reads
  `canGoNext`, which now stays true at the last page). `data-loop` on the Root
  is the styling hook (mirrors `data-orientation`/`data-transition`); prev/next
  simply never disable (their `disabled` attr is driven by the boundary flags).
  **No scroll-effect change** — wrapping last→first smooth-scrolls the whole
  track back (a visible rewind glide), which is *exactly* what semantic wrap is,
  and is the same path `Home`/`End` (goTo(0)/goTo(last)) already exercise. Pure
  headless + a passthrough prop; unit-testable at 100% in jsdom.

  **Phase A — seamless infinite, and how iOS momentum is handled.** The insight
  that de-risks it: there are **two classes of navigation with two guarantees.**
  (1) *JS-driven* — buttons, indicators, keyboard, wheel, our mouse-drag,
  autoplay — the viewport is **at rest** at the moment of invocation, so we can
  recentre deterministically with no inertia to fight. This covers the vast
  majority of loop interactions on *all* platforms, iOS included (tapping Next
  on an iPhone is this path, not the flick path), and is fully jsdom-testable.
  (2) *Native touch flick* (iOS momentum) — the **only** path we can't
  interrupt; writing `scrollLeft` mid-inertia is ignored or jumps on Safari.
  Handle it with: **(a) a full-period clone buffer** — render a complete copy of
  the set on each side (min `slidesPerPage + peek`, a whole set as the safe
  default; replicate small sets to a floor, Embla's "not enough slides" guard),
  so any single flick settles *inside* the buffer on a snap point; **(b) recentre
  only at rest, on `scrollend`** (reusing the hook's existing settle-detection +
  `setTimeout(600)` fallback, line 435), teleporting by exactly one period — a
  pixel-identical view — under a `scroll-snap-type: none` window restored on the
  **next rAF** (not a microtask, or Safari re-animates snap). The measured-offset
  scroll effect already treats clones as real slides, so no offset math changes.
  **Residual edge case + graceful degradation:** a rapid *uninterrupted*
  flick-storm (no `scrollend` between flicks) can outrun any finite buffer on a
  tiny set — mitigate with a ≥1-period buffer + small-set replication, and if the
  true scroll boundary is ever hit first the flick just stops on real (cloned)
  content and the next `scrollend` recentres — worst case one reposition frame,
  never a blank/broken state (Swiper's `loopFix` has documented jumps too; this
  is the accepted ceiling). **a11y correctness (the 2-slide attempt's likely
  bug):** clones are `aria-hidden` + `inert` + `tabindex=-1`, excluded from the
  live count and the "x of n" label (announced total stays the real n), with
  consumer ids stripped/namespaced so there are no duplicate ids or
  double-announced/tabbable slides. **Sandbox limit + QA gate:** jsdom has no
  momentum/`scrollend` timing — unit-test the *logic* (period math, raw↔real
  index map, recentre-on-simulated-`scrollend`, snap-suppression calls, clone
  aria/inert) deterministically; the momentum *feel* is a **mandatory real
  iPhone-Safari QA gate**: slow drag across the seam · a hard single flick at the
  seam · a flick-storm at the seam · autoplay across the seam · a VoiceOver swipe
  (total stays n, no duplicate slides). A sits *behind the same `loop` concept*
  and only adds the scroll-seamlessness layer — C already settled the navigation
  semantics, so A never re-litigates them.

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

### Iteration 1 — Basic responsive single-slide (human-approved)

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

### Iteration 2 — Vertical orientation (human-approved)

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

### Iteration 3 — Peek (cross-cutting option, human-approved)

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

**Figma lockstep: pending.** Light — peek is a code-only knob/modifier
(no carousel variable layer in Figma); the existing "Wide peek" / peek example
cells already show the intent, so this is expected to be a verification pass like
vertical. **Next:** placement-focused iteration (overlay / external-flank).

### Iteration 4 — Overlay placement (human-approved)

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

**Figma lockstep: pending.** It will be a verification pass (no carousel
`--primitiv-*` variable layer exists — bindings only) plus the `absolute-white`
vs `content-inverse` decision above. **Next:** the remaining placements
(external-flank / controls-on-top) or multi-slide-per-view.

### Iteration 5 — Fade transition (human-approved)

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

**Figma lockstep: pending.** Light — fade is code-only (timing knobs +
a data hook; no carousel variable layer in Figma). The design's
`Crossfade / dissolve` intent maps directly. **Next:** the remaining placements
(external-flank / controls-on-top) or multi-slide-per-view.

### Iteration 6 — Multi-slide-per-view + CarouselControls part (human-approved)

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

**Figma lockstep: pending.** Light — multi-slide is a code-only
knob/modifier (no carousel `--primitiv-*` variable layer in Figma), and the design's
"Slides Per Page (2-up)" cell already shows the intent, so this is expected to be a
verification pass. **Next:** the remaining placements (external-flank /
controls-on-top) or thumbnails.

### Iteration 7 — Viewport padding (human-approved)

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

**Figma lockstep: pending.** Light — viewport padding is code-only (no
carousel `--primitiv-*` variable layer in Figma; bindings only). Reconcile the
framed-track model (viewport surface/border/radius + inner padding) with the
design's "Viewport padding" cell at lockstep. **Next:** the remaining placements
(external-flank / controls-on-top) or thumbnails.

### Iteration 8 — Multi-slide correctness (slidesPerPage / slidesPerMove) (human-approved)

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

**Figma lockstep: pending.** Multi-slide is code-only (no carousel
`--primitiv-*` variable layer); the design's "Slides Per Page" / "Slides Per Move"
cells show the intent. **Next:** the viewport-padding question (below) — QA is
now confirmed for everything shipped so far (2026-07-13).

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
then the remaining placements (external-flank / controls-on-top), or autoplay
— QA is now confirmed for everything shipped so far (2026-07-13).

### Iteration 10 — Slide aspect ratio (human-approved)

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

**Figma lockstep: pending.** Ratio is code-only (no carousel
`--primitiv-*` variable layer in Figma; the `CarouselSlide` set has ratio variants
— 1:1, 16:9 — that already show the intent), so this is expected to be a
verification pass. **Next:** the thumbnails polish session, the remaining
placements (external-flank / controls-on-top), or autoplay — QA is now
confirmed for everything shipped so far (2026-07-13).

### Iteration 11 — External-flank placement (human-approved)

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

**Figma lockstep: pending.** Flank is code-only (no carousel
`--primitiv-*` variable layer in Figma); the "External-flank + dots" and
"External-flank + thumbnails" design cells show the intent, so this is expected to
be a verification pass. **Next:** the thumbnails polish + placement-expansion
session the human flagged (which will likely add vertical-flank and the
controls-on-top placement), then autoplay / play-pause.

### Iteration 12 — Control placement framework (human-approved)

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
the tray + slide (QA). grid's intrinsic
width contains the columns but `grid-auto-flow: column` filled greedily (6+2). **Round
3e (final): `:has()` quantity queries.** The human asked for the balanced enhancement;
it turned out to need no JS/attr at all. A `:has(> :nth-child(N))` quantity query reads
the dot **count** structurally (`:has` is cross-browser since 2023) and sets an
*explicit* grid column count (≥6 → 2 cols, ≥11 → 3, ≈5/col); grid's **row-major**
auto-flow then **balances** the dots across those columns (8 → 4+4) and its intrinsic
width grows to **contain** them. This is the combination neither greedy-grid (no
balance) nor multicol (no width growth) could give — pure CSS, no writing-mode, so the
logical inline-end lane + RTL mirroring stay intact. Trade-off: count-driven (fixed
≈5/col threshold), not exact to the slide height, and the dot order is row-major (a
compact block, not a single top-to-bottom list) — both fine for a secondary indicator.
On `attr()`: reading `data-*` into a numeric layout value is CSS Values 5, Chrome-only
(133+, 2025), not cross-browser — the portable fallback is a custom property via inline
style, but `:has()` sidesteps needing a count from JS entirely.

**Figma lockstep: pending** a later dedicated build of the placement model in
Figma (the current frame is conceptual) — human QA is now confirmed
(2026-07-13), so this dedicated Figma build is the only remaining gate. No
carousel `--primitiv-*` variable layer exists (bindings only). **Next:**
autoplay/play-pause, or the thumbnails polish.

### Iteration 13 — Slide spacing (`gap` modifier) (human-approved)

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

**Figma lockstep: pending.** Gap is code-only (no carousel `--primitiv-*`
variable layer in Figma). **Next:** QA `/carousel/spacing` + `/carousel/placement`.

### Builder — live composability sandbox (human-approved)

**A QA tool, not a registry variant.** A new nested route **`/carousel/builder`**
(sidebar entry "Builder", pinned at the top): a centred **2-column grid** — controls
on the left, one live `Carousel` instance on the right (`CarouselBuilder.tsx` +
`CarouselBuilder.css`, scoped under `.carousel-builder`). The instance re-renders
from a single `BuilderConfig` state object as the controls change, so the human can
stress-test how the features *compose* and surface edge cases the per-feature
example pages don't cover. **It has already earned its keep** — the dynamic
slide-count control surfaced a real headless crash (see the IntersectionObserver fix
below).

**Controls = the styled `Accordion`** (the kitchen-sink registry component) in
**`multiple` mode, all sections open by default** (controlled `value` seeded with
every section id — uncontrolled Accordion only opens one `defaultValue`). *First cut
used the headless `Collapsible`, but its panels didn't collapse — a builder CSS bug,
not the component: `.carousel-builder__section-body { display: grid }` (a class
selector) overrode the browser's `[hidden] { display: none }`, so the
`hidden`-attribute panel never hid. Switched to the styled Accordion on human
request — it drives open/close via a grid-row transition on a force-mounted panel,
so there's no `display`-override footgun, and it dogfoods a registry component.*
Native `range`/`radio`/`checkbox` inputs drive state (a dev tool — robust, no
dependency on styled form surfaces). Sections map **every** contract axis:
**Layout** (`placement`, `orientation`, `side`, `distribution`, `align`, RTL) ·
**Slides** (slide count 1–8, `slidesPerPage` 1–4, `ratio`, slide `radius`) ·
**Spacing & frame** (`gap`, `peek`, `padding`, `surface`) · **Indicators**
(`dots`/`thumbnails`) · **Transition** (`slide`/`fade`).

**The live carousel** branches composition by `placement` — `external` wraps
prev/indicators/next in `<CarouselControls>`, `overlay`/`flank` render them as
direct children (matching the example helpers) — swaps auto `<CarouselIndicators>`
(dots, page-count-correct) vs a manual group of image thumbs (thumbnails), swaps the
prev/next chevrons under vertical, and wraps in `dir="rtl"` when RTL. A **`<pre>`
readout** echoes the active `<Carousel …>` props so a spotted bug reports its exact
combination. A Reset button restores the iteration-1 defaults.

**Headless fix the Builder surfaced (TDD, 100%).** Dragging the slide-count control
down (or pressing Reset from a larger count) crashed with `Failed to execute
'observe' on 'IntersectionObserver': parameter 1 is not of type 'Element'`
(`useCarouselViewport.ts`). Cause: the IO effect closes over `slideKeys` from its
render but reads the live `slidesRef`; when the count drops **in the same commit that
another effect dependency changes** (a Reset flips `transition`/`slidesPerPage` and
drops the count at once), the effect re-runs with the pre-drop `slideKeys` while the
removed slides have already left `slidesRef` in the mutation phase → `observe(undefined)`.
The fixed-array example pages never change count, so none hit it. Fix: the observe
setup loop now skips an orphaned key (`const el = slidesRef.current!.get(key); if
(el) observer.observe(el)`) — the `registerSlide` that unmounted it schedules a fresh
`slideKeys`, re-running the effect to observe the settled set. Driven by a RED test
(`Carousel.dynamic-slides.test.tsx`) after making the jsdom IO mock faithfully throw
on a non-Element (it previously swallowed it). `pnpm --filter @primitiv-ui/react
qa:units` green at 100% (1700 tests). The dev-alias carries the fix to the
kitchen-sink.

**Gates:** `pnpm --filter @primitiv-ui/react qa:units` (100%). No Rust/registry/emit
change, so those gates don't apply; the kitchen-sink page can't build in the sandbox
(the human verifies live). **Next:** human QA on `/carousel/builder` — drive
combinations and feed back edge cases to fix.

### Builder QA #1 — distribution/align extended to overlay + flank (human-approved)

**The Builder's first find.** Toggling `distribution`/`align` in `overlay` or `flank`
did nothing — every `distribution-*`/`align-*` rule targeted `.__controls`, the bar
that only exists in `external` (iteration 12 scoped them external-only by design). The
human wanted absolute composability, so we extended them — with the **indicator-cluster
semantic** (see the reasoning in the session): prev/next are structurally pinned to
each family's edges (that pinning *is* the family), so in overlay/flank the axes govern
the **indicator cluster** instead, mirroring how they drive the whole bar in external.

**Registry surface (headless-free — pure CSS + contract-doc update).**
- **Flank** (both orientations, both sides): the indicator group fills its grid cell,
  so its own `justify-content` positions the dots — the flex main-axis already follows
  orientation (row/column), exactly like the external bar. `align` → `flex-start`/
  `center`/`flex-end`; `distribution=stretch` → `space-between`. 3 rules.
- **Overlay horizontal** (both sides): the pill is absolute, so `align` moves it via
  `inset-inline-start`/`-end` (edge inset = the same frame + peek + control-inset the
  pill already clears, so it lines up with prev/next) and `distribution=stretch` spans
  it full-width with `space-between`. Scoped `:not([data-orientation="vertical"])`.
- **Vertical overlay = the one no-op** (documented, not faked): up/pill/down share a
  single inline-end lane with no wrapper to reposition them as a unit, so `align`/
  `distribution` on the pill would collide with the up/down controls. Left inert.
- Defaults (`group`·`center`) hit no override in either family, so nothing regresses.

**Builder** greys the fields where an axis is a no-op: `align` under
`distribution=stretch` (everywhere) and **both** under vertical overlay, each with a
short reason in the legend (`<fieldset disabled>` + a muted italic note).

**Contract descriptions** for `distribution`/`align` updated (they said "external
only" — now false); regenerated `carousel.tsx` (JSDoc) + `styles.scss` (from the CSS)
via the throwaway emit example, **recipe unchanged** (it embeds no descriptions) +
drift-green + kitchen-sink hand-synced (styles.css, contract, tsx). Registry README's
placement-framework paragraph rewritten.

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli` (20 + 106),
`node scripts/check-registry-types.mjs`. (No headless change — Carousel vitest not
needed.) **Figma lockstep: pending** (code-only; no carousel variable layer). **Next:**
human QA of `/carousel/builder` — confirm align/distribution now respond in overlay +
flank and are greyed where inert.

### Builder QA #2 — `cluster` (split/joined) for overlay + flank (human-approved)

**The Builder's second find.** After QA #1 landed align/distribution on the overlay/flank
*indicator* cluster, the human noted the prev/next stay pinned at the edges — and asked
for one more level: choose whether, in overlay/flank, the controls stay **split** (the
family's native layout) or **join** into one bar that moves together. Additive, and
(human's call) applied to **both** overlay and flank even though joined-flank overlaps
`external`.

**New modifier `cluster`** (`split` default · `joined`), read by overlay + flank:
- **split** — the family's native layout (unchanged): overlay's prev/next flank the slide
  edges + separate dots pill; flank's prev/next on the scroll-axis edges + perpendicular
  indicators.
- **joined** — prev + indicators + next bundle into the one `<CarouselControls>` bar,
  positioned by `side` / `distribution` / `align` exactly like the external bar. The bar
  reuses the existing `.__controls` distribution/align rules for free.

**CSS (pure registry, additive/low-risk).**
- **Flank joined = the base (external) layout returns**: the flank grid rules are scoped
  `:not(--cluster-joined)`, so with joined the viewport + the joined bar stack (horizontal)
  or sit side-by-side (vertical), driven by side/distribution/align. *No new positioning
  rules.*
- **Overlay joined (horizontal)**: the `.__controls` bar is `position: absolute`, spans the
  slide (transparent — each part keeps its own scrim), `side` puts it bottom/top; the inner
  prev/next/indicator-group are *reset* from split's absolute positioning so they flow in
  the bar (keeps split rules untouched → zero regression risk to split). The split-mode
  overlay dist/align `.__indicator-group` rules from QA #1 are scoped `:not(--cluster-joined)`
  so the bar owns positioning in joined.
- **Vertical overlay stays split** (its up/pill/down share one lane, no wrapper to move them
  as a unit) — the overlay-joined rules are scoped `:not([data-orientation="vertical"])`.
- **Composition differs by mode**: `joined` composes the parts inside `<CarouselControls>`,
  `split` as direct children. The Builder wires this automatically; documented for consumers.

**Builder** gained the `cluster` control (greyed with a reason for `external` = "always
joined" and vertical overlay = "split only"); `LiveCarousel` branches the composition
(`useControlsBar = external || joined`) and passes the effective `cluster`.

**Contract** gained the `cluster` modifier; regenerated recipe/tsx/scss (recipe changed this
time — new cva variant) + drift-green + kitchen-sink hand-synced. Registry README's placement
paragraph extended.

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli` (106 + 20),
`node scripts/check-registry-types.mjs`. (No headless change.) **Figma lockstep: pending**
(code-only). **Next:** human QA on `/carousel/builder` — set overlay/flank + `cluster=joined`
and confirm prev/next now move with the dots under align/distribution; check the control greys
for external + vertical overlay.

### Rearchitecture — placement is now a 2×2 (external/overlay × split/joined); flank retired (human-approved)

**The circular external-align bug forced a rethink; the human rebuilt the Figma
"Control Placement Framework" frame comprehensively and confirmed a cleaner model.**
Flank is **gone** — it was really just *external + split*. The new orthogonal model:

- **`placement`** (`external` default · `overlay`) — purely **off vs on the imagery**.
  `external` = controls in the space around the viewport (CSS grid, tracks); `overlay`
  = absolute over the slide.
- **`cluster`** (`split` default · `joined`) — how they're **arranged**, now read by
  **both** placements. `split` flanks prev/next at the viewport's scroll-axis edges +
  separate indicator cluster; `joined` = one `<CarouselControls>` bar.
- `side` / `distribution` / `align` / `orientation` compose on top of the full 2×2.

**CSS (grid, per the human's steer — flex justify-content was the flaky part).**
- **External + split = the ex-flank grid** (renamed `.placement-flank` →
  `.placement-external.cluster-split` throughout): prev/next in the scroll-axis edge
  tracks, indicators in a cross-axis cell positioned by distribution/align. Deterministic
  (the cell is a definite `1fr` track).
- **External + joined** = the base stack (viewport + bar). The align fix that kept
  failing: the joined bar is a grid item, so it now **fills its cell**
  (`justify-self: stretch; align-self: stretch`) — that gives `justify-content` room to
  move the cluster in *both* orientations (the determinism grid buys over a shrink-to-fit
  flex bar; the old implicit `auto` column let the bar collapse).
- **Overlay** unchanged this pass (already absolute split + joined). **Vertical overlay
  stays the shared-lane behaviour** and is the one split/joined exception (greyed in the
  Builder) — matching the frame's vertical-overlay to the up/down-flank + dots-on-side
  model is the **known follow-up**.

**Contract/emit**: `placement` dropped to `external`/`overlay`; `cluster`, `side`,
`distribution`, `align` descriptions rewritten to the 2×2. Regenerated recipe/tsx/scss +
drift-green + kitchen-sink hand-synced.

**Kitchen-sink**: Builder placement is now external/overlay, `cluster` applies to both
(`useControlsBar = joined`), greying simplified (cluster/align/distribution inert only
for vertical overlay; align also under stretch). `FlankSingle` migrated to
`placement="external" cluster="split"` (renders identically). **Cosmetic cleanup still
owed**: the `/carousel/flank` example route + sidebar label + a few README example rows +
some styles.css comments still say "flank" (they render external-split correctly — just
mislabeled); to be swept in a follow-up.

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli` (364 + 20 + 106),
`node scripts/check-registry-types.mjs`. (No headless change.) **Next:** human QA of the
new external grid on `/carousel/builder` — external × split/joined × side/distribution/
align × orientation should now be deterministic; then the overlay-vertical + cosmetic
cleanup pass, then density/size scaling (the human's next cycle).

### Overlay brought to the full 2×2 + active-dot pill (human-approved)

**Overlay now mirrors external across the whole matrix.** After external landed, overlay
was rewritten so `split`/`joined` × orientation × side × distribution/align all work:
- **All split positioning is scoped to `.cluster-split`**, so `joined`'s nested parts
  flow in the `<CarouselControls>` bar untouched — the old reset hacks are gone.
- **Vertical overlay was rebuilt** to the frame's model: `split` = up/down flank the
  block edges (centred inline over the slide) with the dots as a compact pill on an
  inline side (`side` picks end/start); `joined` = one up/dots/down bar on an inline
  side, full block span. The old shared up/pill/down lane (and its `:has()` dot-balancing
  grid) is retired.
- **distribution/align work in both orientations**: the horizontal pill moves via
  `inset-inline`, the vertical pill via `inset-block` (mirror); joined bars fill their
  edge so the shared `.__controls` justify-content rules drive them.
- Joined dots re-apply the pill appearance (split's pill is scoped away). Builder greying
  simplified — the vertical-overlay no-op is gone; only `align` under `distribution=stretch`
  is inert now.
- **Deferred:** overlay + thumbnails cap and vertical-many-dots overflow (edge cases) still
  reference the old lane geometry — a later polish pass.

**Active dot → animated pill.** The active indicator now elongates into a stadium pill
along the dot row's axis (inline when horizontal, block when vertical) via a new
`--primitiv-carousel-indicator-size-active` knob (`space-24`), with a
`motion-duration-control` transition on the size + colour. `radii-full` on the dot
`::before` gives a circle when square and a stadium when elongated.

**Gates green:** `cargo test -p primitiv-emit` (drift), `node scripts/check-registry-types.mjs`.
Regenerated + kitchen-sink synced. Rebased onto the merged Popover work on `main`.
**Next:** human QA of overlay (both orientations) + the active-dot pill; then the cosmetic
`flank` sweep and the deferred overlay-thumbnail/overflow polish, before density/size.

### Cosmetic flank sweep — retired-noun relabel (human-approved)

**Pure relabel, no behaviour change.** Flank was retired in the rearchitecture (it
was external + split); this sweep clears the leftover *`flank`-as-a-placement* labels
so nothing implies flank is still an axis. The distinction that governed every edit:
the **verb** "flank / flanking" (prev/next sitting at the viewport's edges) is correct
English and was **kept**; only the retired **noun** was swept.

- **Kitchen-sink route/nav.** `/carousel/flank` → **`/carousel/external-split`**
  (`Shell.tsx` route + import), sidebar label "External-flank" → **"External-split"**
  (`CarouselLayout.tsx`). The page component `CarouselFlank` → **`CarouselExternalSplit`**
  and the helper `FlankSingle` → **`ExternalSplitSingle`** (both already rendered
  `placement="external" cluster="split"` — the names were the only stale part). All
  the section headings, cell titles, aria-labels and notes on `CarouselPage.tsx` (plus
  the `CarouselPage.css` group-heading comment) reworded off the noun; the control-
  placement page's intro note rewritten to the 2×2 (`placement` × `cluster`).
- **Registry.** `styles.css` comments naming the old "flank" layout → "external-split"
  (regenerated `styles.scss` from it — recipe/tsx byte-identical, contract untouched);
  `README.md` header axis line + the "For `flank`" paragraph rewritten to
  `external` + `split`. Kitchen-sink `styles.css` re-synced.

Not swept (correct as-is): the verb "flank/flanking" throughout the CSS/README/TSX,
`Shell.css`'s unrelated nav-grid comment, and `CarouselBuilder.tsx`'s verb usage. The
append-only log/skill history keeps its "flank" references as the record of the retirement.

**Gates green:** `cargo test -p primitiv-emit` (106, drift), `node scripts/check-registry-types.mjs`.
(No headless/contract change.) **Next:** the deferred overlay edge cases (thumbnail cap +
vertical-many-dots overflow still reference the retired shared-lane geometry), then the
density / size cycle.

### Overlay edge cases — vertical-many-dots overflow (human-approved)

**The one genuinely-unhandled overlay case, now handled (registry CSS only).** After
the overlay-2×2 rework retired the old shared up/pill/down lane (and its `:has()`
dot-balancing grid), the horizontal overlay dot tray already capped + wrapped, but the
**vertical** overlay split dot pill had no overflow handling at all (the code even
said so — "its own overflow is a later concern"). On the landscape vertical viewport a
long dot column overflowed the slide's short block edges. Fix mirrors the horizontal
wrap but must dodge the **flex column-wrap width-collapse bug** (a wrapped flex column
doesn't widen for the extra columns — the exact bug that drove iteration 12's round
3b–3e), so the vertical dot pill switches to a **grid** and a **`:has(> :nth-child(N))`
quantity query** adds balanced columns as the count grows (≥6 → 2 cols, ≥11 → 3);
grid's row-major auto-flow spreads the dots evenly (8 → 4+4) and its intrinsic width
grows to contain them, keeping the run within the slide height and clear of the
block-centred up/down controls. Count-driven (~5/col), side-agnostic. This is the same
proven mechanism as the retired lane's balancer, re-applied to the new inline-end pill.

**Thumbnails cap left as-is (intentional).** Re-checked against the new geometry: the
overlay thumbnail cap already positions off the inline-end/start lane (not the old
shared lane) and thumbnails **shrink** (flex, no fixed hit area), so the existing
`max-inline-size` / `max-block-size` caps still bound them correctly — no shared-lane
term to remove. Only the dots (fixed hit area, can't shrink) needed the new wrap.

**Kitchen-sink.** The existing `/carousel/overlay` cell 11 ("vertical · dots · many")
already renders 8 slides, so it now exercises the fix; its title/note updated to the
balanced-column behaviour. The Builder also drives it (overlay · vertical · split ·
dots · 8 slides). Regenerated `styles.scss` + drift-green + kitchen-sink synced.

**Gates green:** `cargo test -p primitiv-emit` (106, drift), `node scripts/check-registry-types.mjs`.
(No headless/contract change — recipe/tsx byte-identical.) **Next:** human QA of the
vertical-many-dots wrap on `/carousel/overlay` (cell 11) + the Builder; then, on sign-off,
the density / size cycle.

### Iteration 14 — Density & size scaling (agreed model + staged plan)

**The milestone: make the carousel breathe with `data-density` (ambient) and a new
`size` prop (xs–xl), while the viewport/slides stay container-driven.** Design agreed
with the human (screenshot Q&A, decisions a / a / b-refined):

1. **Axes = size + density.** A per-instance root `size` modifier (xs · sm · md
   default · lg · xl) picks a slot; ambient `data-density` shifts every slot. Full
   parity with button/checkbox/switch; the kitchen-sink `ChromeControls` size toggle
   (inert until now) drives the carousel.
2. **The whole control chrome scales as a unit** — prev/next **like the regular
   buttons** (bind to the density-scoped `--primitiv-framed-control-{size}-*` ramp, so
   the control grows 32→40 at `md`, chevron 16), dots **gently** (already small — a
   shallow ramp, and the hit area stays **clamped ≥24px**, the WCAG 2.5.8 AA floor),
   plus the active pill, thumbnails and the chrome gaps.
3. **Content-composition modifiers keep their t-shirt steps but the resolved values
   scale with density+size too** (peek / viewport-padding / inter-slide gap re-point off
   raw primitives onto a size+density-scoped carousel spacing ramp). The *content
   dimensions* (viewport/slide) stay container-driven; the *spacing steps* breathe.

**What does NOT scale:** viewport/slide size (fill + aspect-ratio), slide radius (its
own `radius` modifier). Orientation/RTL are axis-agnostic (logical props + the same
tokens), so no new concern.

**Token model.** Density-sensitivity in this system comes from *semantic* tokens that
remap per density mode (`context.json` → the 4-mode Context collection → `tokens.css`);
the carousel is invariant today because its knobs point at raw primitives. Plan:
- **Control + chevron:** reuse `framed-control-{size}-{height,icon-size}` — **no new
  DTCG tokens**, the size modifier just re-points the knob per slot (density free).
- **Dots / active pill / thumbnails / chrome gap:** a small **bespoke carousel ramp**
  — new `carousel.{xs..xl}.{dot-size,dot-hit-area,active-pill,thumbnail-size,chrome-gap}`
  under each of the 4 density modes in `context.json`.
- **Content spacing (peek/padding/gap steps):** a size+density-scoped carousel spacing
  ramp the t-shirt modifiers re-point onto (exact steps settled in Stage 3).

**Staged (each stage = its own commit(s), pushed for live QA before the next):**
- **Stage 1 — the mechanism (registry-only, zero new tokens).** Add the `size` modifier
  + re-point `--primitiv-carousel-control-size` / chevron to `framed-control-{size}-*`;
  wire `ChromeControls` size into the carousel pages + Builder. Proves size+density
  end-to-end on the buttons before authoring the matrices.
- **Stage 2 — the bespoke chrome ramp** (dots gentle + ≥24 hit-area clamp, active pill,
  thumbnails, chrome gap) in `context.json` × 4 densities, knobs re-pointed.
- **Stage 3 — content spacing** (peek/padding/gap steps on the scaled ramp).
- **Figma lockstep last**, after human sign-off — add the carousel size×density entries
  to the Context collection (`figma-variable-architecture`).

**Figma lockstep: pending** (code-first per plan decision 2). **Next:** build Stage 1.

#### Stage 1 — the mechanism (controls scale; registry-only, zero new tokens) — human-approved

Landed the size+density mechanism end-to-end on the prev/next controls, with **no new
DTCG tokens** — the win of reusing the framed-control ramp:
- **Contract.** New root **`size`** modifier (`xs · sm · md` default `· lg · xl`). The
  `control-size` / `control-icon-size` knob defaults re-pointed from raw primitives
  (`space-32` / `space-16`) to `--primitiv-framed-control-md-{height,icon-size}`, so the
  documented default = the `md` slot (button parity; the control grows 32→40 at `md`).
- **styles.css.** A size-ramp block in the variants layer: each `--size-{slot}` re-points
  `control-size` + `control-icon-size` to `framed-control-{slot}-{height,icon-size}`.
  Those framed-control tokens are already density-scoped, so the control gains **density
  response for free** — `size` picks the slot, `data-density` shifts it. Regenerated
  recipe/tsx (new `size` cva variant + omitted-from-primitive prop) + scss + drift-green.
- **Kitchen-sink.** `BasicSingle` gained a `size` passthrough; a new **`/carousel/size`**
  route (sidebar "Size") shows the xs→xl ladder (flip the header Density to see every
  cell shift). The **Builder** reads the ambient `useChrome().size` (the header toggle,
  previously inert for carousel) and threads it to the live carousel + the `<pre>`
  readout — matching how a real consumer sets `size` while density stays ambient.
- **README** updated (the `size` + density scaling bullet).

Global side-effect (intended, agreed): every carousel's prev/next control grows 32→40 at
the default `md` — button parity. **Gates green:** `cargo test -p primitiv-emit` (106,
drift), `check-registry-types.mjs`. (No headless change.) **Next:** human QA of
`/carousel/size` + the header Size/Density toggles on the Builder; then Stage 2 (the
bespoke dots/pill/thumbnail/chrome-gap ramp in `context.json` × 4 densities).

#### Control glyph centring fix (QA follow-up, all sizes)

Human QA of Stage 1 caught the prev/next chevron sitting off-centre at xs/dense. Cause:
the control `<button>` never reset the UA padding (`1px 6px`), which squeezes the grid
content box hard at small sizes, plus the inline-SVG baseline gap. Fixed: `padding: 0`
on the control + `display: block` on its `svg`. (The human noted radio looks similar,
but its control is a `<span>` with a `scale`-animated dot — a different mechanism, not
the same root; left for a separate look.) Registry CSS only; regenerated + synced.

#### Stage 2 — the bespoke chrome ramp (dots / pill / thumbnails / gaps) — human-approved

The indicator group + gaps now scale with size **and** density, so the whole control
cluster stays coherent next to the scaled controls.
- **`context.json`** gained a `carousel` group in **all 4 density modes** — 5 size slots
  × `{dot-size, dot-hit-area, active-pill, thumbnail-size, chrome-gap}` (100 emitted
  `--primitiv-carousel-{slot}-*` tokens). Values: `md`/comfortable **exactly reproduces**
  today's defaults (dot 8 / hit 24 / pill 24 / thumb 80 / gap 16), so no regression at the
  default; density shifts the whole ramp ~1 step (compact −1, dense −2, spacious +1) —
  mirroring the checkbox/framed-control cadence — with the **hit area floored at 24** (WCAG
  2.5.8) in every cell and the **dots deliberately gentle** (barely shrink; they're already
  small). `tokens.css` regenerated via the CLI (`primitiv tokens`, embeds context.json);
  +100 lines, purely additive, CLI reproduces the prior file exactly.
- **styles.css** re-points the 6 indicator/gap knobs (base `md` defaults + each `--size-*`
  slot) to the `carousel-{slot}-*` ramp; contract `defaultsTo` updated to match. Regenerated
  scss + drift-green (recipe/tsx byte-identical — customProperty defaults don't reach them).
- **Kitchen-sink** `/carousel/size` note updated (the whole cluster scales now); thumbnails
  at size are visible in the Builder (indicators=thumbnails + the header Size toggle).

Proposed ramp values (comfortable base, mirrored across densities) — flagged for the
human's eye: dots flat at 8 through xs–md then 10/12; thumbnails 56→68→80→116→140 (the
top jumps because the primitive ladder is sparse up there — cap lg/xl on request).

**Gates green:** `cargo test -p primitiv-emit` (106, drift) + `-p primitiv-cli` (364+20),
`check-registry-types.mjs`. TS token tests use synthetic `context` fixtures, unaffected.
**Next:** human QA of the indicator/thumbnail/gap ramp on `/carousel/size` + Builder
(dots gentle enough? thumbnail top end OK?); then Stage 3 (content spacing steps —
peek/padding/gap on the scaled ramp), then Figma lockstep.

**QA round 1 (human) — indicator group too big at dense/xs.** The dot **hit area** was
floored at 24 (WCAG 2.5.8) in *every* density, so at dense/xs the dots' 24px hit-boxes
stayed large while the prev/next controls shrank to 16 — the indicator group looked
oversized (screenshot). Fix: relax the floor in the **compact/dense** modes only
(dense dot-hit-area xs/sm 24→16, md 24→20; compact xs/sm 24→20), so the indicator
buttons track the controls; **comfortable + spacious stay ≥24** (WCAG-safe at the
default density — the sub-24 targets are the deliberate trade-off of the opt-in compact
modes). Token-only change (`context.json` → `tokens.css`), 5 cells; no registry/CSS
change. Flag for QA: confirm the dense/compact indicator group now reads proportionate,
and that sub-24 dot targets in dense are an acceptable compact-mode trade-off.

**QA round 2 (human) — thumbnails + a Builder ratio bug.** Three items:
- **Thumbnail size reined in.** The ramp topped out too large (comfortable lg/xl 116/140).
  Shifted the whole `thumbnail-size` ramp down ~one notch on the (sparse) primitive ladder
  (comfortable now 48/56/68/80/116; dense 32/40/48/56/68; etc.) — `md` 80→68, lg 116→80,
  xl 140→116. Token-only (`context.json` → `tokens.css`, 20 cells).
- **Thumbnail shape tracks the carousel ratio + `ratio` promoted to a root modifier.** The
  thumbnail aspect-ratio was hardcoded `16/9` (its comment even claimed it "mirrors the
  slide"); pointed it at `--primitiv-carousel-slide-aspect-ratio`. But `ratio` was a *slide*
  modifier (per-slide, on `CarouselSlide`), so it couldn't reach the sibling thumbnails.
  **Moved `ratio` from the slide to the root** (`--ratio-*` sets the aspect knob at the root,
  slides inherit it, thumbnails track it) — the correct model for "uniform ratio now,
  per-slide later" (the human's steer). Contract/CSS regenerated (recipe/tsx now carry
  `ratio` on `<Carousel>`, dropped from `<CarouselSlide>`); example helpers + the Builder
  migrated `<CarouselSlide ratio>` → `<Carousel ratio>`; drift-green + type-check.
- **Builder ratio radios "not responding" = the vertical no-op.** Slide ratio is inert in
  vertical (the vertical viewport owns its ratio), so clicking ratio changed nothing visible.
  Greyed the ratio field out under vertical with a reason ("vertical viewport owns its ratio"),
  matching the `align`-under-`stretch` pattern. If it was seen in *horizontal*, that's a
  separate repro to chase.

**Deferred (human musing):** whether the indicator-group *padding* (the overlay pill's inner
padding + the dot gaps) should also scale from `md` across size/density — a candidate for
Stage 3 (content spacing).

**QA round 3 (human) — `ratio` now works in vertical too.** The human asked whether a vertical
scroller with square slides was even possible. It was — but only via a *separate* knob: in
vertical each slide fills the viewport (one per view), so the slide's own `aspect-ratio` stands
down and the **viewport's** `--primitiv-carousel-vertical-aspect-ratio` (default landscape 16/9)
governed the shape, and the `ratio` modifier (horizontal-only) never wired to it. Fixed the
inconsistency: `--primitiv-carousel-vertical-aspect-ratio` now **defaults to
`var(--primitiv-carousel-slide-aspect-ratio)`**, so the root `ratio` modifier shapes the slides
in **both** orientations (square vertical slides, a widescreen vertical scroller, …), while the
knob stays independently overridable to decouple the vertical track. Default `ratio=wide` keeps
the vertical viewport at 16/9 — no regression. The Builder ratio grey-out (added in round 2 for
the vertical no-op) is removed since ratio is now live there. Contract + CSS regenerated
(recipe unchanged; tsx JSDoc + scss re-derived), drift + type-check green.

**QA round 4 (human) — multi-slide didn't honour the ratio.** With `slidesPerPage > 1`,
`ratio="square"` rendered a short landscape strip, not squares. Root cause (confirmed by
rendering the real CSS in headless Chromium — the sandbox *does* have the Chromium binary
even without Playwright): a flex item's default `min-block-size: auto` (min-content) blocks
`aspect-ratio` from sizing the slide once several share the viewport — the flex line's cross
size collapses. Single-slide dodged it (the full-width slide's aspect resolved). Fix: add the
**symmetric partner to the existing `min-inline-size: 0` — `min-block-size: 0`** on the slide,
so `aspect-ratio` drives the height. Verified via screenshots that spp 1–4 are now square and
that single-slide, vertical (square + wide), and fade are all unregressed. Registry CSS only
(scss re-derived, recipe/tsx byte-identical), drift-green. **Method note:** the
`chrome-linux/chrome` binary under `/opt/pw-browsers` renders static HTML (the real
tokens.css + carousel styles.css inlined) to a screenshot — a genuine visual check in-sandbox
for pure-CSS behaviour, no dev server needed.

**QA round 5 (human) — vertical multi-slide ignored the ratio too.** `slidesPerPage=2` +
`orientation=vertical` + `ratio=square` rendered two *wide* slices (screenshot). Different
geometry from the horizontal fix: in vertical the slide's own aspect stands down and it
fills a 1/N slice of the viewport *height*, while the viewport carried a fixed (per-slide)
aspect — so a square viewport split into 2 gave 2:1 slices. Fix: the vertical viewport's
aspect is now **`calc(--vertical-aspect-ratio / --slides-per-page)`**, so the track grows
to N slides tall and each slice comes out at the ratio (2 square slides → a 1:2 track;
`calc(ratio / 1)` for the single-slide default is unchanged). Verified via headless
Chromium: vertical spp 1–3 square stack as squares, spp2 wide stacks as 16:9. Registry CSS
only (scss re-derived, recipe/tsx byte-identical), drift-green.

### Stage 3 — content spacing + indicator-wrap polish (human-approved)

The Stage 3 cycle of the density/size work. Two buckets: **A** — two indicator-wrap
polish items (registry CSS only) done first as a warm-up; **B** — the main
content-spacing scaling. Ramp model approved by the human up front (shared 4-rung
ramp, gentle size scaling) before any token cells were authored.

**A1 — vertical overlay dots wrap column-major.** The many-dots vertical overlay tray
used a row-major `:has()` grid (`grid-auto-flow: row` + `repeat(2/3, auto)` columns), so
the active dot alternated left↔right as you paged. Switched to `grid-auto-flow: column`
+ `grid-template-rows: repeat(5, auto)` (dropping the `:nth-child(11)` 3-col rule):
dots now read sequentially top→bottom down each column, then wrap to the next. Verified
in headless Chromium (8 dots → 5+3, active 3rd-from-top in col 1). Registry CSS only.

**A2 — overlay thumbnails wrap instead of shrinking.** The overlay thumbnail tray capped
to the slide and *shrank* the thumbnails to fit (a long strip got tiny, never wrapped).
Now they hold their `thumbnail-inline-size` (`flex-shrink: 0`) and **wrap** — rows when
horizontal (`flex-wrap: wrap` + `align-content: center`), columns when vertical. Threshold
= hold-size-then-wrap (no shrink) for a cohesive gallery. **QA round 1 (human) — vertical
rail should fill the vertical space.** The first vertical cut used a fixed 3-row grid cap,
so 8 thumbnails on a tall slide forced 3 short columns (screenshot). Reworked to be
**height-driven**: the rail now *fills* the lane's block extent (`block-size` = the
inset-clearing calc) and wraps by height via flex column-wrap, so a tall slide stacks the
thumbnails into **one** column and only spills to a second when the height genuinely can't
fit them. Verified in headless Chromium (900px-wide/tall slide → 1 column of 8; 480px
short slide → 2 columns of 5+3, both contained, no width-collapse). Registry CSS only.

**B — content-spacing scaling (the main Stage 3 work).** `peek` / `viewport-padding` /
inter-slide `gap` now breathe with `size` + ambient density, mirroring the control chrome
— while the *content dimensions* (viewport/slide fill + aspect ratio) stay container-driven.
- **Model (approved a/a):** a **shared 4-rung content-space ramp**, not three per-property
  ramps. `carousel.{size}.content-space.{1..4}` in `context.json` × 4 density modes (80
  cells); each gutter's t-shirt step picks a rung — **gap → 1/2/3, peek & padding → 2/3/4**
  (peek/padding sit one rung above gap, matching today's peek `md`=32 = gap `md`=16 one step
  up). md/comfortable ramp = `[8,16,32,48]`, so gap `8/16/32` and peek/padding `16/32/48`
  **exactly reproduce today's steps** — zero regression at the default. Density shifts the
  whole ramp ~1 space step (compact −1, dense −2, spacious +1), floored at `space-4`.
- **Overlay pill inner padding** (the human's deferred musing) folded into the **existing
  Stage 2 chrome ramp** as `carousel.{size}.pill-padding-{block,inline}` (md/comfortable =
  4/12, today's values), scaling on the chrome cadence — it's chrome-level padding, kin to
  `chrome-gap`, not a content gutter. The dot/thumbnail gaps already scale via `chrome-gap`.
- **CSS wiring:** the base rule + each `--size-{slot}` rule publish `--primitiv-carousel-
  content-space-1…4` (default = md slot; re-pointed per slot) and re-point the two pill-
  padding knobs to the `carousel-{slot}-pill-padding-*` ramp; the `peek-*`/`gap-*`/`padding-*`
  step modifiers pick a rung from those intermediate vars. Size class sets the ramp, step
  class picks — density baked into the token, no combined `.size-x.gap-y` selectors.
- `context.json` → `tokens.css` regenerated via the CLI (+120 tokens, additive); contract
  `customProperties` gained the 4 cs rungs + the two pill-padding `defaultsTo` re-points;
  regenerated scss + drift-green (recipe/tsx byte-identical — customProperty defaults don't
  reach them) + kitchen-sink hand-synced. Verified in headless Chromium: md/comfortable
  unchanged; spacing breathes across xs→xl and dense→spacious (padding/gap/peek grow
  together, proportionately). README updated (peek/gap/padding scaling + the Stage-2/3
  chrome-scaling paragraph).

**Gates green:** `cargo test -p primitiv-emit -p primitiv-cli` (106 + 364 + 20),
`node scripts/check-registry-types.mjs`. (No headless change.) **Figma lockstep: pending**
(code-first per plan decision 2 — after human sign-off, the carousel content-space +
pill-padding size×density cells join the Context collection). **Next:** human QA of
`/carousel/builder` — drive peek/gap/padding at each size×density and confirm the spacing
breathes sensibly (xl magnitudes OK? dense tight enough?), plus the two wrap-polish items.

### Slide media — real `<img>` support + slide as positioning context (human-approved)

**The gap the human surfaced:** every example put "imagery" on as a CSS `background`,
which fills its box by definition — masking that a real `<img>` (a replaced element
with its own intrinsic size/ratio) does **not** conform to the slide box. The README's
own canonical `<CarouselSlide><img/></CarouselSlide>` would render at intrinsic size,
top-left anchored + clipped. Only *thumbnails* had an `object-fit` rule; slides had none.

**Registry surface (headless-free — pure CSS + a slide modifier + 2 knobs).**
- **Media fill.** A direct media child of the slide (`> img, > video, > picture, >
  picture > img`) is stretched to the box (`inline/block-size: 100%`, `display: block`)
  and `object-fit` / `object-position` decide how it conforms. Scoped to *direct media*
  so layered content (captions) is untouched.
- **`fit` slide modifier** (`cover` default · `contain`) re-points a new
  `--primitiv-carousel-slide-object-fit` knob: cover fills + crops (keeps ratio),
  contain fits the whole image + letterboxes against the slide's own background.
- **`--primitiv-carousel-slide-object-position`** knob (default `center`) — the crop's
  focal point, set per slide (`object-position: top`).
- **Slide is now a positioning context** (`position: relative`, the human's explicit
  call) so a caption / CTA / scrim anchors to the slide box (and clips to its corners)
  with no wrapper — the hero pattern.
- The line drawn: the surface owns *how media conforms to the box* (fill, cover/contain,
  focal point) + the positioning context; the **consumer** owns the asset, `srcset`/
  `sizes`, `loading`/`fetchpriority` (LCP: eager slide 1), and `alt` — documented in the
  README's new "Slide media" bullet.

**Verified in headless Chromium** (real intrinsic-size SVG data-URI `<img>`s): cover
fills + crops portrait/landscape/square into a 16:9 slot; contain letterboxes on the
slide bg; object-position top/center/bottom keeps the right band; a positioned caption
anchors inside the slide (position:relative). Contract/CSS regenerated (recipe/tsx now
carry the slide `fit` prop; scss re-derived) + drift-green + type-check + kitchen-sink
hand-synced (styles.css, contract, recipe, tsx). New **`/carousel/images`** route
(sidebar "Images") — a 6-cell grid: cover mixed sources, contain, object-position focal
point, caption overlay, images + ratio=square, RTL — using an in-file `photo()` SVG
placeholder helper (self-contained, no network) so it dogfoods real `<img>` slides.

**Figma lockstep: pending** (code-only — no carousel `--primitiv-*` variable layer).

#### Contain backdrop opt-in + size/density-scaled radius (human-approved)

Two human follow-ups on the media work:
- **Contain letterbox backdrop is opt-in, not hardcoded.** A slide **`surface`** modifier
  (`none` default · `subtle`) mirrors the root `surface` and fills the slide with the same
  `--primitiv-surface-subtle` token — off by default so a cover image is never tinted, on to
  back a `contain` letterbox. The images example's contain cells use it instead of a hardcoded
  colour. Verified light + dark (theme-adaptive token).
- **Radius joins the size/density scaling + an opt-in container radius** (approved model:
  shared ramp + viewport-track rounding). New `carousel.{size}.radius` ramp × 4 density modes
  (comfortable xs 8 / sm 10 / md 12 / lg 14 / xl 16 — **md = radii-12, today's value, no
  regression**; density ±1 step, dense −2). A shared intermediate `--primitiv-carousel-radius`
  (base = md slot, re-pointed per slot by the size modifier) is referenced by **both** the
  slide corners (the slide `radius=md` modifier now points at it, so slides scale) **and** a
  new root **`radius`** modifier (`none` default · `md`) that rounds the **viewport track**
  (not the whole root — no focus-ring clipping), so the two always match. The `padding`
  frame's radius also re-points to the scaled ramp for coherence. `radius=none` is a no-op
  (doesn't fight `padding`'s rounding — verified a padded track still rounds by default).
  Verified in headless Chromium: slide corners grow xs→xl; radius=none square track vs radius=md
  rounded track (peek clipped by the rounded corner); padding-only still rounded. `context.json`
  → `tokens.css` regenerated (+20 tokens); contract gained the root `radius` modifier + the
  `--primitiv-carousel-radius` intermediate; recipe/tsx/scss regenerated + drift-green +
  type-check + kitchen-sink synced. Builder gained a **`radius (container)`** control in the
  Spacing & frame section + the `<pre>` echo.

**Next / proposed:** **variable-width slides** (the human raised Ark UI's model —
content-sized slides of differing widths in one track). This is a distinct feature with
a real design fork (opt-in mode? per-slide width? the page/indicator model assumes equal
shares — it needs its own proposal + likely a headless look before building). Held for a
green light. **Also QA:** `/carousel/images` (cover/contain/focal-point/caption).

#### Variable-width slides (`slideWidth`) — built on branch, pending CI + merge

**Green-lit 2026-07-13** (the human, after the overscroll gap landed). Resolves the
design fork the note above flagged.

**Design decision (see the Decisions log below for the full writeup).** Scoped to
`slidesPerPage={1}` — the multi-slide flex-basis math assumes every slide is an equal
share, which a content-driven width breaks, so composing the two is unsupported (a
documented boundary, not guarded in CSS). Pure CSS, **no headless change**: the
viewport's programmatic scroll already measures the target slide's real
`getBoundingClientRect()` width rather than assuming a percentage, so it was already
width-agnostic — confirmed by re-reading `useCarouselViewport.ts`'s scroll effect before
touching anything.

**Registry surface.** A new root **`slideWidth`** modifier (`equal` default ·
`content`). `equal` is the existing behaviour (the base rule already resolves it,
byte-unchanged). `content`:
```css
.primitiv-carousel--slide-width-content .primitiv-carousel__slide {
  flex: 0 0 auto;
  aspect-ratio: auto;
}
```
`flex: 0 0 auto` switches the slide's flex-basis from the equal-share percentage to an
intrinsic size (an image's natural dimensions, an explicit inline width, any
natural-width content); `aspect-ratio: auto` resets the forced ratio so it doesn't fight
that intrinsic size — the exact same reset the vertical-orientation rule already applies
for the same reason (confirmed while writing this: `aspect-ratio: none` is **not valid
CSS** — the property only accepts `auto | <ratio>` — a mistake caught before it shipped;
`auto` is correct and is what actually landed). `@layer` ordering (variants after base)
means the rule correctly overrides the *horizontal* base rule's `aspect-ratio: var(...)`
without extra specificity; for vertical it's a no-op (both rules already resolve to
`auto` there). No new custom property, so `styles.scss`'s `$`-var block needed no change —
confirmed byte-identical to `styles.css` (mechanically hand-derived per
`primitiv-emit::scss::emit_component_scss`, since no cargo in this sandbox).

**Real `<img>` sizing — reasoned, not browser-verified.** The stylesheet has a
pre-existing rule forcing a direct `<img>`/`<video>`/`<picture>` slide child to
`inline-size: 100%; block-size: 100%` (for `object-fit` to work under `equal`). Under
`content` mode the slide's own size becomes intrinsic (`flex: 0 0 auto`), so a
percentage-sized `<img>` inside it is "a percentage against an indefinitely-sized
ancestor" — per the CSS sizing spec, browsers resolve that by falling back to the
image's *natural* intrinsic dimensions to establish the box, so a real `<img>` slide
should size itself correctly with zero extra CSS. This is spec reasoning, not confirmed
in a real browser (no headless browser available in this sandbox this session) —
flagged explicitly for the human's visual QA pass, same caveat pattern as iteration 7
round 2 and iteration 8's "reasoned, not browser-verified" notes.

**Hand-regenerated** `carousel.recipe.ts` / `carousel.tsx` (no cargo in this sandbox —
mirrored `crates/primitiv-emit/src/wrapper.rs` / `recipe.rs`'s exact output by hand, the
same PR #240 precedent) + `styles.scss` (mechanically CSS-body-verbatim, confirmed
byte-identical). **Because this touches `contract.json`'s `modifiers`, this landed on a
feature branch (`carousel-variable-slide-width`) + PR, not `main`** — CI's
`primitiv-emit` drift-guard tests verify the hand-regeneration byte-for-byte before
merge (per the standing per-session instruction: registry Rust-generated file changes go
through a branch/PR in this sandbox, mirroring PR #240's exact shape). Kitchen-sink
hand-synced on the same branch (contract/recipe/tsx/styles.css — all four confirmed
identical to the registry originals via `diff`).

**Built** (`CarouselPage.tsx`, `/carousel/variable-width`, route `variable-width`): a
7-cell grid — real `<img>` sources at their natural widths (portrait/landscape/square,
the headline demo) vs. the same sources under `equal` for contrast; non-image content
boxes with explicit inline widths (proving it isn't image-specific); `content` + peek;
`content` + a per-slide `snapAlign="center"` override (composes with the existing
per-slide override, per the "Images" page's own note); RTL; and a vertical instance
(block-size driven by each image's natural height — content-sizing is orientation-
agnostic since `flex-basis` governs whichever axis is the main axis).

**Builder wired.** A `slideWidth` `RadioField` (`equal` / `content`) in the Slides
section; a `WIDTHS` stand-in array gives the Builder's plain gradient slides an explicit
width per index when `content` is picked (a gradient `<div>` has no intrinsic size of
its own, so the preview needs *something* to size to). The composability truths this
surfaces are made explicit rather than left as silent visual breaks: `ratio` and
`slidesPerPage` both go inert under `slideWidth="content"` — greyed out via the same
`disabled`/`note` convention `align`/`distribution=stretch` already uses (`RangeField`
gained the same optional `disabled`/`note` props `RadioField` already had, for the
`slidesPerPage` slider). `describe()`'s prop echo updated.

**Gates:** `node scripts/check-registry-types.mjs` green (the registry wrapper
type-checks against `@primitiv-ui/react`). `cargo test -p primitiv-emit -p primitiv-cli`
**not run in this sandbox (no cargo)** — deferred to CI on the PR, per the standing
instruction for this exact situation. The kitchen-sink itself can't build in this
sandbox either (no `node_modules`) — authored carefully against `noUnusedLocals` /
`noUnusedParameters`, and a brace/paren balance check passed on every touched file, per
the established sandbox convention.

**Figma lockstep: pending.** Code-only (no carousel `--primitiv-*` variable layer in
Figma; `slideWidth` has no Figma composition-matrix cell either — this is an Ark-parity-
driven addition, not a designed frame, so this is expected to stay a code-only knob/
modifier, not a verification pass). **Next:** human QA of `/carousel/variable-width`
(especially the real-`<img>` cells — the one genuinely unverified claim above) and the
Builder's new control, then CI + merge of the PR.

**The human's two asks:** (1) a consistent 4-column grid across the example pages
(most were already on the shared `.carousel-grid`, but at 2 columns; five pages —
Responsive, Vertical, Overlay, Fade, Peek — still used older ad-hoc `__row`/`__stack`
flex layouts predating that pattern); (2) "the carousel layouts aren't up to date with
the Builder page" — clarified by the human as **controls sitting on the left, separate
from the viewport/slides**. Both resolved this pass.

**(2) Root cause found: a stale `cluster` default across six example helpers.** The
"Rearchitecture" iteration made `cluster="split"` the *contract* default (prev/next flank
the viewport edges, indicators as a separate cluster — not the original iteration-1
"bar below" look, which is `cluster="joined"`). Six kitchen-sink helpers —
`BasicSingle`, `VerticalSingle`, `MultiSlide`, `ThumbnailSingle` (its non-overlay
branch), `ThumbnailStretch`, `ImageSingle` — predate that change: they still wrap
prev/`CarouselIndicatorGroup`/next in `<CarouselControls>` (the DOM shape `joined`
CSS expects) but never pass `cluster` explicitly, so they'd been silently rendering
under the *default* `split` CSS ever since. Split's grid assigns `.__prev`/`.__next`/
`.__indicator-group` to named grid areas **as direct children** — but here they're
nested inside the `<CarouselControls>` div instead, so that div itself (untargeted by
any grid-area) gets auto-placed by the grid into the first free cell: the "prev" area,
on the left. The whole cluster (prev + dots + next, as one flex row) piles up to the
left of a narrowed viewport — exactly the human's report. Confirmed against the
Placement page's own "External" section: its cell notes ("bar below", "space-between
across the whole edge") describe the *joined* bar behaviour verbatim — i.e. that whole
18-cell section had been rendering broken since the rearchitecture, not just
cosmetically off. The Builder was never affected — it already branches
`useControlsBar = external || joined` and composes accordingly, which is why it looked
"up to date" while the routes didn't.

**Fix:** add `cluster="joined"` to the five helpers whose entire DOM is the wrapped
shape (`BasicSingle`, `VerticalSingle`, `MultiSlide`, `ThumbnailStretch`, `ImageSingle`);
`ThumbnailSingle` gets `cluster={placement === "overlay" ? undefined : "joined"}`
since its overlay branch already renders unwrapped direct children — correctly matching
the default `split` shape, so it must keep it. Verified with a before/after headless
Chromium render (default classes `placement-external cluster-split` + wrapped DOM
exactly reproduces the left-pile bug; `cluster-joined` produces the correct centred bar
below the viewport). This restores the intended look across every page using these
helpers — Default, RTL, Square, Responsive, Peek, Padding, Multi, Ratio, Spacing, Size,
Images, Overlay/Fade's row cells, and (most visibly) all 18 "External" cells on the
Placement page.

**Grid: bumped to 4 columns + converted the remaining 5 pages.** `.carousel-grid`
`grid-template-columns` `repeat(2, …)` → `repeat(4, …)` (with a `72rem`→2-col and
`40rem`→1-col responsive fallback, new — the old fixed 2-col had no narrow-viewport
concession, and 4 columns need one). `Example` gained a `wide` boolean prop
(`.carousel-page--wide`, `max-inline-size: 88rem` vs the default `64rem`) — applied to
every one of the 14 grid-using pages so 4 columns have room (~21rem/cell at full width,
verified in headless Chromium against the tightest case, external-split's 3-part
prev/viewport/next cell). The 3 single-instance pages (Default/RTL/Square) are
untouched per the human's call — a 1-cell 4-col grid would look broken.

**Responsive, Vertical, Overlay, Fade, Peek** converted from `__row`/`__stack` flex
wrappers to the standard `carousel-grid` + numbered `GridCell` shell, reusing each
existing instance's `label`/inline comment as the cell title/note (no new example
instances — same coverage, consistent shell). One nuance: `GridCell` gained a
**`span="full"`** option (`grid-column: 1 / -1`) for **Responsive**'s narrow-vs-wide
comparison — forcing two *different*-width containers into equal grid tracks would
flatten the exact contrast the page demonstrates, so that page is one full-span cell
containing the original comparison row, not two independent cells. Dead CSS removed
(`__stack`, `__vertical`, now unused; `__row`/`__narrow`/`__wide` kept — still used
inside Responsive's single spanning cell).

**No registry/contract/token change** — kitchen-sink example-page CSS/TSX only (both the
grid work and the `cluster` fix). Verified via headless Chromium (external-split at
4-up, ~88rem page; the cluster before/after) and a structural balance check
(`<GridCell>`/`</GridCell>` 116/116, `<Example>`/`</Example>` 17/17, 16 `carousel-grid`
divs — matches 13 single-grid pages + Placement's 3 grouped sections) since the
kitchen-sink can't build in this sandbox. **Next:** human QA — especially the Placement
page's External section (18 cells), which should now visibly match its own notes.

### Thumbnail overflow + align reversal + wrap-to-center (three bugs, one root pattern)

**Human QA on three screenshots** surfaced three thumbnail bugs, all traced to the same
family of missing CSS resets/an overspecified fix from an earlier session — registry CSS
only, no contract change.

1. **Joined-bar thumbnails overflow the carousel entirely** (Placement page "stretch +
   thumbnails" cell). Root cause: `.primitiv-carousel__controls` (the `<CarouselControls>`
   bar) never had `min-inline-size: 0` — a grid item's default min-inline-size is its
   content's *unshrunk* width, so a wide thumbnail cluster just grows the bar straight
   through its grid track instead of ever being constrained enough to wrap. Fixed by adding
   `min-inline-size: 0` to the base `__controls` rule (a general robustness fix — dots never
   hit this since they're tiny, but any wide content could) and a new hold-size-then-wrap
   rule for `.--indicators-thumbnails .__controls .__indicator-group` (mirroring the
   existing overlay-tray treatment: `flex-wrap: wrap` + `min-inline-size: 0` on the group,
   `flex-shrink: 0` on each thumbnail). Verified in headless Chromium: 6 thumbnails in a
   420px host now wrap 4+2 and stay fully contained (previously blew ~120px past the edge).

2. **Vertical overlay split + thumbnails: `align="start"`/`"end"` had no visible effect
   (and could read as "reversed"), plus overflow past the slide edge.** Root cause: a prior
   session's "fill the vertical space" fix set `block-size: calc(100% - insets)` on the
   thumbnail indicator-group — same specificity as, and later in the file than, the base
   `align="center"` rule's `block-size: fit-content`, so it silently won by source order.
   Forcing the box to ~100% of the lane made every align value look identical (nothing left
   to distinguish start from end when the box already spans the whole lane) and let content
   taller than that fixed box overflow visibly past the slide. Fixed by dropping the
   `block-size`/`justify-content` overrides entirely — the base align rule's `fit-content`
   sizing (already correct, already there) is what should govern this, not a competing
   same-specificity rule. Verified in headless Chromium: a 3-thumbnail strip now pins flush
   top/center/bottom distinctly per align value, fully contained.

3. **Thumbnails wrap into columns fine, but a short trailing column centres instead of
   starting at the top.** Same rule family: the vertical case relied on inherited
   `flex-wrap` + `align-content: center`, plus the codebase's own documented "flex
   column-wrap width-collapse bug" (why the vertical *dots* already use grid, not flex, to
   wrap). Rebuilt the many-thumbnails case on the same proven grid pattern as the dots —
   `display: grid; grid-auto-flow: column; grid-template-rows: repeat(4, auto)` (a
   shallower cap than dots' 5, thumbnails being much bigger), triggered via the same
   `:has(> :nth-child(5))` quantity-query mechanism. Grid's default auto-placement fills
   cells top-to-bottom and leaves a short column's trailing cells empty — start-aligned for
   free, no extra alignment property needed (unlike flex's justify-content, which
   redistributes every item across the *whole* shared main-axis space). Verified: 7
   thumbnails split 4+3, the second column's 3 items flush at the top, matching column 1's
   first row.

**Gates green:** `cargo test -p primitiv-emit` (106, drift) + `-p primitiv-cli` (364 + 20),
`node scripts/check-registry-types.mjs`. (No headless/contract change — recipe/tsx
byte-identical.) **Figma lockstep: pending** (code-only). **Next:** human re-QA of the
three repro cells (Placement "stretch + thumbnails"; Builder vertical overlay split +
thumbnails at each align value; a many-thumbnails vertical overlay wrap case).

### Thumbnail size scaled back (external + overlay, a compromise to try first)

**Human follow-up:** wrapped thumbnails — especially vertical + overlay, where the tray
sits directly on the slide — can obscure a meaningful chunk of the visible image; dots
don't have this problem since they're much smaller. Proposed and approved: scale *both*
ramps back rather than only overlay's, since overlay sitting on the image is the more
acute case but external's filmstrip had room to shrink too — start with a shift-based
compromise, revisit if it's not enough.

- **`thumbnail-size` (external) shifted 1 notch down** the primitive size scale at every
  slot × density (e.g. comfortable/md: 68→56; xs..xl `40/48/56/68/96`).
- **New `overlay-thumbnail-size` ramp, shifted 2 notches down** from the *original*
  values (e.g. comfortable/md: 68→48; xs..xl `32/40/48/56/80`) — a dedicated,
  smaller-still ramp specifically for overlay, since it's the placement where a bigger
  wrapped tray actually costs visible image, not just chrome space external can spare.
- **CSS wiring:** the plain `--size-{slot}` rules keep re-pointing
  `--primitiv-carousel-thumbnail-inline-size` to the (now-shifted) external
  `carousel-{slot}-thumbnail-size` token — no rule changes needed there, the value just
  got smaller. Five new compound rules (`--size-{slot}.--placement-overlay`, higher
  specificity than the plain per-size rules) re-point the same knob to
  `carousel-{slot}-overlay-thumbnail-size` when overlay is active, regardless of slot.
  No contract/modifier change (same existing knob, just resolves differently by
  context) — recipe/tsx untouched, only `context.json` → `tokens.css` (+20 cells) and
  `styles.css`/`.scss`.
- **Verified in headless Chromium:** external md now ~56px (was 68px); overlay md now
  ~48px (was 68px, same as external before this session). The joined-bar wrap (fixed
  last session) and the vertical-overlay wrap-to-start / align distinctness (also fixed
  last session) both still hold with the new, smaller sizes — re-tested a 7-thumbnail
  vertical-overlay wrap (4+3 split, second column still starts flush at the top) and the
  joined-bar overflow case (still fully contained).

**Gates green:** `cargo test -p primitiv-emit` (106, drift), `node
scripts/check-registry-types.mjs`. (No headless/contract change.) **Figma lockstep:
pending** (code-only — no carousel `--primitiv-*` variable layer in Figma yet). **Next:**
human QA of the new sizes on `/carousel/thumbnails`, `/carousel/builder`, and the
Placement page's overlay + thumbnails cells — confirmed as "a compromise to try first";
if wrapped overlay thumbnails still obscure too much, both ramps can shift back further.

### Vertical overlay thumbnails: single column + internal scroll (replaces column-wrap)

**Human follow-up, with the actual numbers.** Even at the scaled-back size, a wrapped
2-column overlay tray still measured ~29% of a 420px slide's width in a screenshot; the
human asked to push further. Computed the diminishing-returns curve first (each further
notch buys less, since the tray's ~24px fixed gap+padding becomes a *bigger* share of a
*smaller* total): 48px→120px(28.6%), 40px→104px(24.8%), 32px→88px(21.0%) — and at 32px
thumbnails are already getting too small to read as images, no better than dots but
costing more room. Presented the real lever instead: the width problem only exists
*because* the tray wraps to a 2nd column — a single column's width is one thumbnail +
padding (~64px, 15% of the slide) **regardless of item count**. Proposed trading the
2nd-column wrap for internal scroll (using the vertical axis, which the viewport already
has, instead of spreading sideways); the human picked this over another size cut.

**Implementation (registry CSS only, no contract change).** Removed the grid +
`:has(:nth-child(5))` column-wrap mechanism entirely. The vertical-overlay-thumbnails
rule now: `flex-wrap: nowrap` (overriding the shared horizontal rule's wrap, which would
otherwise still try to start a 2nd column once content outgrows the cap — the same known
flex-column-wrap bug the old grid fix was dodging), `max-block-size: calc(...)` (the
same lane-height cap as before — content-sized up to that cap, so align start/center/end
still work exactly as fixed last round), and `overflow-block: auto` so a strip taller
than the cap scrolls internally instead of wrapping sideways or spilling past the slide.
Scrollbar hidden (`scrollbar-width: none` + the `::-webkit-scrollbar` pseudo) to match
the main viewport's chrome-free scroll convention — native touch/wheel/keyboard
scrolling (and a focused thumbnail's native scroll-into-view) all still work with no JS.

**Verified in headless Chromium:** a 10-thumbnail vertical overlay tray now renders at
the *exact same width* as a 3-thumbnail one (previously the 10-thumbnail case would
wrap to 2 columns and roughly double in width) — the excess scrolls, clipped top/bottom
within the capped lane. Re-confirmed align start/center/end are still visually distinct
and fully contained with the new single-column model.

README updated (the vertical-overlay bullet now describes single-column + scroll,
distinct from the horizontal overlay tray's row-wrap, which is unchanged).

**Gates green:** `cargo test -p primitiv-emit` (106, drift), `node
scripts/check-registry-types.mjs`. (No headless/contract change — recipe/tsx
byte-identical.) **Figma lockstep: pending** (code-only). **Next:** human QA of a
many-thumbnails vertical overlay case (confirm the scroll feels natural, the tray width
reads as acceptably narrow now) on the Builder and `/carousel/thumbnails`.

### Thumbnails + slidesPerPage > 1: page-grouped indicators + a group border

**A previously-flagged gap, now closed.** The thumbnails iteration (iteration 9) noted
"a multi-slide thumbnail cell would need per-*page* thumbs... deliberately left out of
the example grid" and the Builder's own code comment admitted the same: dots use the
auto `<CarouselIndicators>` (already page-aware), thumbnails were still per-*slide* with
no example ever combining them with `slidesPerPage > 1`. The human asked for exactly
this: thumbnails grouped by page, the group sharing active state, clickable as a unit,
a border marking the group, and the uneven-last-page edge case handled.

**Root-cause research first (no premature build).** Investigated the actual headless
primitive before writing anything: `<CarouselIndicator index={N}>` is **already
page-indexed, not slide-indexed** — `goTo(index)` and `isActive = index === currentPage`
both operate on page numbers (`Carousel.tsx`). Every thumbnail example maps one
indicator per *slide* using the raw slide index, which only "works" because
`slidesPerPage` was always 1 in existing examples (page index === slide index in that
case) — untested and silently wrong the moment `slidesPerPage > 1` is introduced. The
primitive already exposes exactly the tool needed: `pageForSlideIndex(slideIndex)` on
`CarouselContextValue` (public API via the exported `CarouselContext`), implementing the
identical page-offset/end-alignment formula from the multi-slide iteration
(`offset(page) = min(page × slidesPerMove, maxOffset)`, last page end-aligned). **This
meant zero headless changes were needed** — purely a consumer-side (registry example)
wiring fix.

**The fix: `index={pageForSlideIndex(slideIndex)}` instead of the raw slide index.**
Added a `ThumbnailIndicators` child component (in both `CarouselPage.tsx` and
`CarouselBuilder.tsx` — it must render as a `Carousel` descendant to read
`useContext(CarouselContext)`) that maps each slide's thumbnail through
`pageForSlideIndex`. Multiple slides sharing a page now naturally share the same
`index` value, so they already get `data-state="active"` together (the existing
opacity/ring CSS needed no change) and clicking any of them calls `goTo()` with the
same page number. The uneven-last-page case (e.g. 8 slides ÷ 3 per page → 3/3/2) is
inherited for free, since it's the identical formula the dots already use.
`ThumbnailSingle` gained a `slidesPerPage` prop (default 1, passed straight through to
`<Carousel>`); the Builder's known-gap comment/code was replaced with the same pattern.

**New CSS: a group border around the run of same-page thumbnails.** Each thumbnail
keeps its own existing ring unchanged; this adds ONE continuous border framing the
*whole run* on top of that, so a multi-slide page reads as a single unit. Built
entirely from forward-looking selectors (CSS has no "preceding sibling" combinator): a
"baseline" edge is drawn on every run member that shares it (e.g. every member with a
*following* active sibling gets the inline-start edge), then cancelled on members that
aren't actually at that edge (members that *also* have a *preceding* active sibling
aren't the true start). **Caught and fixed a real specificity bug before shipping:**
`:has(+ [data-state="active"])` and the plain adjacent-sibling form `A + B` don't carry
equal specificity by accident (the `:has()` argument was a bare attribute selector,
lighter than the sibling form's full compound), so a baseline/cancel pair for the same
edge didn't reliably tie-break by declaration order — a 3+ member run's *middle*
thumbnail kept a stray edge instead of none. Fixed by wrapping the relational lookups
in `:where(...)` (zero specificity contribution), so every baseline/cancel pair ties
exactly and the *later-declared* rule always wins for elements matching both. Verified
in headless Chromium with runs of 2 and 3 in both orientations before trusting it
(caught the bug this way, not by inspection). Vertical rails swap axes (inline shared,
block is the run-boundary edge) via a higher-specificity `[data-orientation="vertical"]`
override. `box-sizing: border-box` added to the base thumbnail rule so the new border
never shifts a thumbnail's rendered footprint (no layout jank as group membership
toggles). Logical properties throughout — RTL- and orientation-safe with no extra
`:dir()` rules.

**Built** (`/carousel/thumbnails`, 3 new cells): slidesPerPage=2 (4 clean pairs),
slidesPerPage=3 with 8 slides (3/3/2 — the uneven-last-page case), and vertical +
slidesPerPage=2 (confirming the axis-swapped border). Verified end-to-end in headless
Chromium matching the exact 3/3/2 scenario: each page's group renders a correctly
continuous border sized to its own group (3-wide, 3-wide, then 2-wide for the uneven
last page) with no bleed between groups.

**Gates green:** `cargo test -p primitiv-emit` (106, drift), `node
scripts/check-registry-types.mjs`. (No contract/recipe/tsx change — pure CSS +
kitchen-sink TSX; the kitchen-sink itself can't build in this sandbox, so structural
balance-checked — brace/paren counts and `<GridCell>` open/close pairs — in place of a
real compile.) **Figma lockstep: pending** (code-only). **Next:** human QA of the three
new Thumbnails cells (7-9) and the Builder's `slidesPerPage` + `indicators="thumbnails"`
combination.

### Mouse input — click-and-drag scrolling, wheel translation, and a multi-slide snap-boundary fix

**New workstream, four items from live QA.** Investigated item 3 (a reported
desync bug) before building anything broadly, per plan — write-up below, then
the fixes.

**Root cause (item 3 — vertical + `slidesPerPage > 1` wheel desync).** Not a
JS bug: a throwaway repro test confirmed `scrollsnapchange` → `pageForSlideIndex`
is orientation-symmetric and already correct for any given snapped slide. The
real bug was in `styles.css` — `scroll-snap-align: start` was applied to
*every* slide unconditionally, so with `slidesPerPage > 1` the browser's
mandatory snap could legitimately rest on an **interior** slide (not a page
start). That state has no clean page mapping: the viewport shows a straddled
mix of two pages while `currentPage`/the indicators still claim one. This is
orientation-agnostic in principle — it's just that horizontal wheel did
nothing at all before item 2 landed, and swipe/fling gestures usually have
enough momentum to skip past interior slides, so nobody had exercised it via
small, per-notch deltas before. It would have hit mouse-drag (item 1) and
Magic Mouse trackpad swipes (item 4) identically once those existed, so the
fix landed first, as a prerequisite.

**Fix (headless + CSS).** `useCarouselSlide` now computes `isSnapStart` —
whether a slide's index is exactly a page offset (`min(page ×
effectiveSlidesPerMove, maxOffset)` for some page, the identical formula
`pageForSlideIndex` inverts, so the two always agree) — and `Carousel.Slide`
publishes it as a new **`data-snap-start`** hook (present on every slide at
`slidesPerPage={1}`, only page-leading slides above that). The registry
stylesheet now defaults `scroll-snap-align: none` and scopes `start` to
`[data-snap-start]`. TDD in `packages/react` (`Carousel.slide-snap.test.tsx`,
3 tests: default-all-start, clean multi-page, end-aligned uneven last page),
100%. Registry CSS + SCSS mirror updated (no contract change — the hook is a
data attribute, not a modifier) + kitchen-sink hand-synced. Both READMEs
(headless + registry) updated.

**Item 1 — mouse click-and-drag scrolling.** Confirmed with the human up
front: 1:1 pointer tracking, no momentum/flick (release lets the existing
`scroll-snap-type` settle, matching how touch/trackpad already work with zero
custom code). `useCarouselViewport` gained pointer handlers on the Viewport:
`onPointerDown` (mouse only, `transition === "slide"` only) records the start
client position + start `scrollLeft`/`scrollTop`; `onPointerMove` computes the
delta from that start point (not incrementally from the last move, avoiding
drift) and only starts tracking once the delta clears a **4px movement
threshold** — below it, nothing happens (no capture, no `preventDefault`), so
a plain click on a link/button inside a slide still reaches it natively. Once
past the threshold: `setPointerCapture`, a **`data-dragging`** hook set via
`setAttribute` (imperative, not React state — no re-render needed), and
`scrollLeft`/`scrollTop = startScroll - delta` every move. `onPointerUp`/
`onPointerCancel` (same `endDrag` callback) release capture and clear the
hook. A **`suppressNextClickRef`** + `onClickCapture` on the Viewport cancels
the synthetic click browsers still fire at the release point after a real
drag, so a link/button under the cursor doesn't fire post-drag. The
`scrollLeft -= delta` formula is direction-mode-agnostic by construction (it's
relative to a captured start value, not an absolute sign convention), so it's
RTL-safe with no special-casing — dragging right always reveals content that
was to the left, in both LTR and the now-standardized negative-scrollLeft RTL
convention. Registry CSS: `cursor: grab` on the viewport, `cursor: grabbing` +
`user-select: none` on `[data-dragging]`. `setPointerCapture`/
`releasePointerCapture` are called via optional chaining (jsdom doesn't
implement them — confirmed by a quick check — so tests exercise the capture
call sites without needing a working implementation). TDD
(`Carousel.mouse-drag.test.tsx`, 9 tests: sub-threshold no-op, 1:1 tracking
horizontal + vertical, pointerup/pointercancel cleanup, a stray pointerup
with no tracked drag, non-mouse pointer types ignored, click suppression
after a real drag vs. a plain click), 100%.

**Items 2 + 4 — horizontal mouse-wheel translation, trackpad/Magic-Mouse-safe.**
Confirmed with the human: continuous 1:1 translation (not page-per-tick),
matching the vertical-orientation baseline. A physical wheel's vertical
notches (`deltaY`) already natively scroll a vertical carousel — nothing
needed there (item 4's first half). On the default horizontal orientation, a
plain vertical wheel notch does nothing today (browsers only auto-translate
to horizontal scroll when Shift is held), so a new `wheel` listener on the
Viewport (via `addEventListener(..., { passive: false })`, **not** the React
`onWheel` prop — React registers wheel listeners as passive by default, which
would silently no-op `preventDefault()` and let the page scroll vertically at
the same time) translates `deltaY` into `scrollLeft` whenever `deltaX` is
negligible (`< 0.5`). This is the item-4 guard: a trackpad/Magic Mouse
horizontal swipe already produces real `deltaX` and already scrolls a
horizontal viewport natively (the same mechanism as touch), so the handler
stands down entirely (not even the deltaY component) the moment `deltaX` is
real, never fighting it. `deltaY` is normalized to pixels first —
`DOM_DELTA_LINE` (a physical wheel's typical mode) scales ×16,
`DOM_DELTA_PAGE` scales by the viewport's `clientWidth` — so a physical
wheel's larger, fewer ticks feel proportional to a trackpad's many small
pixel-mode ones. Stands down when `transition !== "slide"` or the carousel is
vertical. TDD (`Carousel.wheel.test.tsx`, 6 tests: horizontal translation +
`preventDefault`, deltaX-present no-op, vertical no-op, DOM_DELTA_LINE scale,
DOM_DELTA_PAGE scale, `transition="fade"` no-op), 100%.

**No new example page.** All four items are Viewport-level behaviour that
applies to every existing carousel instance automatically (not a new
placement/modifier), so QA can drive click-drag and wheel on any existing
`/carousel/*` page rather than a dedicated route.

**Gates green:** `pnpm --filter @primitiv-ui/react qa:units` (100%
statements/branches/functions/lines, 1765 tests), `cargo test -p primitiv-emit
-p primitiv-cli` (106 + 20), `node scripts/check-registry-types.mjs`. Kitchen-
sink dev-alias confirmed still active, so all three new headless capabilities
(`data-snap-start`, `data-dragging`, the drag/wheel handlers) are live there
without a publish. Both component READMEs updated (new "Mouse input" section
+ "Multi-slide snap targeting" section in the headless README; registry
README's Viewport bullet + multi-slide bullet).

**Figma lockstep: not applicable** — mouse input and the snap-boundary fix are
pure interaction behaviour, no new visual/token surface. **Next:** human QA of
click-drag + wheel scrolling across the existing example pages (try
`/carousel/multi` and `/carousel/vertical` specifically for the item-3 fix —
wheel/drag should now always land cleanly on a full page, never straddled),
plus item 3's specific repro (vertical + `slidesPerPage > 1`, wheel-scroll
slowly and confirm the indicators always track a clean page).

### Iteration — Loop, Phase C (semantic wrap / "no disabled ends") (awaiting human QA)

The loop variant, split into two phases (see the 2026-07-15 decision entry for
the full rationale + the Phase A iOS-inertia strategy). **This is Phase C** —
the cheap, robust, Figma-documented half; Phase A (seamless infinite) is
designed and waits on Phase C's QA.

**Headless gap filled (TDD, 100%).** A `loop?: boolean` root prop (default
`false`). The end-clamp is localized to four spots in `useCarouselRoot`; under
loop: `canGoNext = canGoPrevious = totalPages > 1` (both directions stay
available while there's more than one page to wrap between — a single page has
no wrap target, so the triggers still disable), `next` wraps
`(currentPage + 1) % totalPages`, `previous` wraps
`(currentPage - 1 + totalPages) % totalPages`. **Autoplay wraps for free** —
its `eligible` gate reads `canGoNext`, which now stays true at the last page.
`data-loop="true" | "false"` on the Root (mirrors `data-orientation` /
`data-transition`, always present) is the styling hook. **No scroll-effect
change** — wrapping last→first smooth-scrolls the whole track back (a visible
rewind), the same path `Home`/`End` (`goTo`) already take; that *is* semantic
wrapping. 8 new tests (`Carousel.loop.test.tsx`): `data-loop` true/false,
triggers stay enabled at both ends, Next wraps last→first, Previous wraps
first→last, single-page still disables, autoplay wraps past the last page.
JSDoc (prop + context field) + headless README (new "Loop" section + keyboard
note) updated.

**Registry surface (headless-free — a passthrough prop, no modifier).** `loop`
isn't in the wrapper's omit list, so `<Carousel loop>` reaches the headless Root
directly (like `transition`); no recipe/tsx/scss change, no regeneration. Added
`data-loop` (true/false) to the contract `dataAttributes` (documentary only — the
emit gates confirm it doesn't feed generated output) + a registry-README bullet.
Kitchen-sink contract hand-synced.

**Built** (`CarouselPage.tsx`, `/carousel/loop`): a 6-cell grid — default loop,
loop + autoplay (endless hero), loop + vertical, loop + RTL, loop + peek, and a
single-slide cell proving the no-wrap-target guard still disables. `BasicSingle`
gained `loop` + `autoplay` passthroughs; `VerticalSingle` gained `loop`. Sidebar
entry + Shell route wired. **Kitchen-sink dev-alias confirmed still active**
(vite + tsconfig), so the unpublished `loop` prop + `data-loop` hook are live for
QA without a publish.

**Gates green:** `pnpm --filter @primitiv-ui/react qa:units` (100%
lines/branches/functions/statements, 1878 tests), `cargo test -p primitiv-emit
-p primitiv-cli` (106 + cli), `node scripts/check-registry-types.mjs`.

**Figma lockstep: pending** (light — `loop` is code-only behaviour + a data hook;
the design's "Loop (no disabled ends)" cell is exactly this intent, so a
verification pass). **Next:** human QA of `/carousel/loop` (confirm the arrows
never disable at the ends, Next/Prev wrap, autoplay never stops, and the single
cell still disables). **Then Phase A** (seamless infinite) per the locked
strategy — it only adds the scroll-seamlessness layer on top and needs a real
iPhone-Safari device-QA gate for the momentum feel.

## Headless gaps (drive reactively, per example)

Tracked so we know what's outstanding; only built when an example needs
it (decision 4).

- [~] Looping / infinite — **Phase C (semantic wrap) + the infinite clone
      buffer landed** (loop iteration, 2026-07-15). (1) `loop` is now a **mode
      selector** (`boolean | "wrap" | "infinite"`, `true`→`"wrap"`) resolving to
      `data-loop="none" | "wrap" | "infinite"` — so wrap stays a first-class
      configurable option (human request). (2) Phase A **increment 1** landed:
      under `loop="infinite"` the Viewport renders a full-period clone copy at
      each end (`CarouselCloneContext` + a clone-aware `CarouselSlide` — inert,
      `aria-hidden`, `tabindex=-1`, `id` stripped, never registered, tagged
      `data-clone-of`), so clones never inflate the real count / indices /
      indicators / "x of n". (3) **Increment 2a landed — free-scroll recentre.**
      Clones now carry `data-snap-align` (so a swipe *settles* on a clone); a new
      `useCarouselViewport` `scrollend` effect finds the nearest settled slide and,
      if it's a clone, instantly teleports by the clone→real offset with
      `scroll-snap-type` suppressed + restored next rAF (invisible — identical copy
      one period away); `scrollsnapchange` maps a clone target to its real index so
      the page/indicators track through the buffer. **So swipe / drag / wheel across
      the seam glides seamlessly.** Control-flow TDD'd at 100% with per-instance
      mocked geometry (`Carousel.infinite-recentre.test.tsx`, 7 tests) — the pixel
      geometry is real-browser-only, verified for feel on device. (4) **Increment 2b
      landed — forward/backward glide + instant init.** A one-shot
      `wrapDirectionRef` set by `next()`/`previous()` at the source (a 2-page
      carousel can't infer wrap-direction from indices, so it's captured where the
      intent is known; `goTo` clears it) tells the scroll effect to glide one step
      into the **adjacent clone** (forward → trailing, backward → leading) instead
      of rewinding; the scrollend recentre then teleports to the real slide. So
      **button / keyboard / autoplay** now glide too, matching free-scroll. The
      **first** infinite scroll is instant (`hasPositionedRef`) so the viewport
      lands on the middle copy with no one-period slide on load. Glided clones are
      treated as their own single-slide page for center/end alignment. TDD'd at 100%
      (`Carousel.infinite-glide.test.tsx`, 5 tests). Kitchen-sink `/carousel/loop`
      cells 7 (glide) + 8 (infinite autoplay), `allowMouseDrag` on. **Infinite is now
      feature-complete pending real-device QA** (the recentre/glide *feel* — hard
      flick, flick-storm at the seam, autoplay across the seam, VoiceOver — is the
      one remaining gate; jsdom can't exercise real scroll layout).
      (5) **Composition step (single-slide) landed.** `fade`+`infinite` now guards
      clone rendering on `transition === "slide"` (fade stacks slides, no scroll —
      a buffer would just duplicate them). Single-slide infinite composes with
      **peek / vertical / RTL** with no code change (the one-period teleport is
      decoration-agnostic and the active slide ≈ viewport width keeps the
      geometry-nearest recentre reliable) — demoed at `/carousel/loop` cells 9–11
      for QA. **Known boundary:** the geometry-nearest recentre gets unreliable when
      a slide is much narrower than the viewport (multi-slide, or center-aligned
      tiny slides), so **multi-slide is the next increment** — and the place to swap
      the heuristic for tracking the real snapped element (`scrollsnapchange`'s
      `snapTargetInline`), which retro-hardens every composition. Recentre desktop
      QA (2026-07-15): forward + backward glide confirmed working after the
      scroll-behavior-suppression fix (the styled viewport's `scroll-behavior:
      smooth` was animating the teleport into a visible rewind — fixed).
      **Builder integration (deferred, agreed 2026-07-15):** add a `loop` control
      (`none`/`wrap`/`infinite`) to `CarouselBuilder.tsx` **after** multi-slide
      infinite lands, so `infinite` composes with the builder's existing
      `slidesPerPage` control instead of exposing the broken `infinite` +
      `slidesPerPage>1` combo. (`wrap` already composes with any `slidesPerPage`
      today, so it could go in earlier gated behind the builder's disabled-but-
      hinted pattern — but cleaner to wire the whole control once infinite is
      universal.)
      (6) **Multi-slide infinite landed (2026-07-15).** Three sub-steps: **(a)**
      the recentre now reads the browser's real `scrollsnapchange` target
      (falling back to geometry before the first snap / without support) instead
      of a geometry-nearest guess — robust to snapAlign/peek/padding and
      multi-slide page-leading snaps, and it retro-hardens the single-slide
      compositions. **(b)** the Viewport now sets `data-snap-align` on a clone
      **only when its mirrored index leads a page** (mirrors `useCarouselSlide`'s
      `isSnapStart`), so interior clones aren't snap points — the scroll settles on
      the same positions in the buffer as in the real copy. **(c)** the glide's
      page-span alignment measures against the matching **clone** of the page's
      last member (not the real one a period away), so center/end alignment is
      correct for a multi-slide glided page. Demoed at `/carousel/loop` cell 12
      (2-up). TDD'd at 100% (multi-slide clone-snap + multi-slide glide tests). The
      builder `loop` control (deferred note above) is now unblocked.
      (7) **Rapid-click rewind fixed — teleport-then-glide (2026-07-15, human QA).**
      The human hit a rewind when clicking Next repeatedly fast. Cause: a button
      wrap glided *onto* a clone and deferred the recentre to `scrollend`; a click
      before scrollend left the viewport parked on the trailing clone, so the next
      nav scrolled back toward the real middle copy (visible rewind). Fix: a wrap now
      **teleports one period to the buffer copy *behind* it first** (instant,
      invisible — an identical slide), **then smooth-scrolls to the *real* target**,
      so every button wrap *ends on the real slide* — no pending recentre for a rapid
      click to interrupt, and no drift (the teleport counteracts the glide each
      cycle). Replaces the earlier glide-onto-a-clone + scrollend-recentre approach
      for programmatic nav; the scrollend recentre now serves **free-scroll/swipe
      only** (which the full-period buffer already gives runway for). Period is
      measured real-slide-0 → its trailing clone (one full copy). Glide tests
      reworked to assert the one-period teleport (fwd/bwd/multi-slide/vertical); 100%.
      (8) **Kitchen-sink now deployable with the docs (2026-07-15) — phone QA path.**
      The kitchen-sink builds as a **separate SPA served at `/primitiv/kitchen-sink/`**
      inside the docs Pages deployment (mirrors the workbench at `/primitiv/workbench/`):
      `KITCHEN_SINK_BASE` sets the Vite base + switches `main.tsx` to a HashRouter
      (GH-Pages-safe deep links); `deploy-docs.yml` installs it standalone
      (`pnpm install --ignore-workspace`, it's excluded from the workspace with its
      own lockfile) and `cp`s its dist into `.vitepress/dist/kitchen-sink`. Being a
      separate HTML document, there is **zero CSS interaction** with VitePress or the
      workbench. The dev-alias means the deploy exercises the **current branch's**
      headless code — so: trigger **Actions → "Deploy docs" → Run workflow** on the
      branch, then QA on a phone at `/primitiv/kitchen-sink/#/carousel/loop`. Caveat:
      the deploy overwrites the single Pages site, so re-deploy `main` afterwards.
      **Naming (2026-07-15):** the third mode was renamed `seamless` →
      **`infinite`** (human preference); earlier log prose calling it "seamless"
      is historical — the mode token is `"infinite"`.
- [x] Vertical orientation + `data-orientation` — **landed (iteration 2)**.
      `orientation="vertical"` switches the scroll axis, the `snapTargetBlock`
      sync, and the ArrowDown/ArrowUp keys; `data-orientation` on the Root is
      the styling hook.
- [x] Fade transition + `data-transition` hook — **landed (iteration 5)**.
      `transition="fade"` (a named non-slide mode) disables scroll wiring and
      publishes `data-transition` on the Root; the registry crossfades off it.
- [x] Mouse-drag gesture — **landed (mouse input iteration)**. Opt-in via
      `allowMouseDrag` (default `false`, matching Ark UI). Pointer handlers
      on the Viewport track the pointer 1:1 into scrollLeft/scrollTop past a
      movement threshold; `data-mouse-drag` is a persistent enabled hook,
      `data-dragging` is the transient active-drag hook.
- [x] **Bug fix — `snapAlign="center"` native snap disagreed with the
      programmatic scroll — landed 2026-07-13.** Discovered while
      cross-checking the Ark parity gaps (per-item `snapAlign`): the JS
      scroll math (`useCarouselViewport.ts`'s `centerOffset`) correctly
      centred a slide for `next`/`previous`/`goTo`, but the CSS hook marking
      a slide as a valid native snap-stop was hardcoded `data-snap-start` →
      `scroll-snap-align: start` regardless of `snapAlign` — so a user's own
      swipe/wheel/drag would settle at the *start* position, disagreeing
      with the programmatic centre. Fixed by generalizing the hook:
      `useCarouselSlide` now returns `snapAlign` (the resolved root value,
      only on a page's valid leading slide — same gating as before), and
      `Carousel.Slide` publishes `data-snap-align="start" | "center"`
      instead of the old boolean `data-snap-start`. Registry `styles.css` +
      `.scss` (+ kitchen-sink hand-sync) gained a second rule for
      `[data-snap-align="center"]`. TDD in `Carousel.slide-snap.test.tsx`
      (renamed describe block, existing assertions updated to check the
      attribute's value, one new test for the `center` case). Headless +
      hand-mirrored CSS only — no `contract.json`/Rust involvement (this
      data attribute was never a `contract.json`-tracked field, and the
      stylesheets are hand-maintained text, not Rust-generated), so nothing
      blocked by the no-Rust-in-this-sandbox constraint.
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
- **Vertical viewport `aspect-ratio` doesn't stand down under
  `slideWidth="content"` (found 2026-07-13, QA session).** The slide itself
  correctly switches to content-driven block-sizing in vertical mode
  (`.primitiv-carousel[data-orientation="vertical"] .primitiv-carousel__slide`
  already sets `aspect-ratio: auto`), but the *containing viewport*
  (`.primitiv-carousel[data-orientation="vertical"] .primitiv-carousel__viewport`,
  `styles.css:571-576`) keeps an unconditional
  `aspect-ratio: calc(vertical-aspect-ratio / slides-per-page)` regardless of
  `slideWidth` — nothing stands it down the way the slide-level rule already
  does at `styles.css:762-765` for `.primitiv-carousel--slide-width-content`.
  So a content-sized slide in vertical mode still scrolls inside a
  fixed-height window sized by `ratio`, not by the slide's actual rendered
  height — a taller-than-ratio slide gets cropped, a shorter one leaves dead
  space. The Carousel Builder's `ratio` control was updated to stay live (not
  disabled) for this specific combination, with a hint noting the gap, so it
  can be reproduced/inspected live. **Deferred** — the right fix likely needs
  a design decision (does the vertical viewport auto-follow the tallest
  slide? the active slide only? something else?), so revisit properly,
  possibly in a Figma session, rather than patching the CSS ad hoc.

## Parity tracking — Ark UI and Blossom

**Goal (stated 2026-07-13):** reach full feature parity with both Ark UI's
Carousel and the Blossom Carousel, then look for opportunities to go beyond
both — the aim is for Primitiv's Carousel to be the best on the web for React,
not just equivalent. This section is the running gap list each is compared
against, **including the example backlog below** — check items off as they
land, the same way the "Headless gaps" tracker above works.

### Example backlog — still to build (Blossom-seeded)

Seeded from `ROADMAP.md` "Carousel example backlog (Blossom parity)".
Reorder as priorities shift; each is human-approved before it starts. Folded
in here (rather than kept as its own top-level section) so the example
worklist and the Ark/Blossom feature-gap lists read as one parity picture.

**Live reference:** the kitchen-sink's `/carousel` section is the source of
truth for what's actually built, not this prose list — check it before
trusting a bullet's status. `apps/kitchen-sink/src/pages/CarouselLayout.tsx`
is a sidebar of full-page nested routes, one per landed example (wired in
`Shell.tsx`'s route table); `apps/kitchen-sink/src/pages/CarouselBuilder.tsx`
(route `builder`) is a live composability sandbox — every landed axis is a
control on the left, a single instance re-renders live on the right, used to
stress-test how features compose and to spot edge cases the per-feature pages
don't cover (see its own note below). Bullets below are annotated with their
route where one exists; a bullet with no route is genuinely still to build.

**QA status (2026-07-13):** everything currently shipped in the kitchen-sink —
every route in `CarouselLayout.tsx`'s nav, including `builder` — is
human-approved. The per-iteration "awaiting QA" tags in the Iterations section
above predate this confirmation; read them for implementation history, not
current QA status. Figma lockstep is tracked separately per iteration (a
distinct, still-genuinely-open item in most cases) and isn't implied by this.

**Basic**

- Basic responsive single-slide _(iteration 1 — done)_ — routes `default` /
  `responsive`.
- Vertical orientation _(iteration 2 — human-approved)_ — route `vertical`.
- Peek (cross-cutting option) _(iteration 3 — human-approved)_ — the `peek`
  modifier + `--primitiv-carousel-peek` knob; subsumes the "Wide peek" matrix
  cell. Route `peek`.
- Viewport padding (cross-cutting option) _(iteration 7 — human-approved)_ —
  the `padding` modifier (`none` default · `sm` · `md` · `lg`) +
  `--primitiv-carousel-viewport-padding` knob; an **outer** gutter on the root
  (mapped to the scroll axis, `box-sizing: border-box`), distinct from peek and
  composing with it. Subsumes the "Viewport padding" matrix cell. Route
  `padding`.
- Multi-slide-per-view _(iteration 6, then corrected in iteration 8 —
  human-approved)_ — `slidesPerPage` / `slidesPerMove` are now numeric
  **styleProps** forwarded to the headless page model (not capped modifiers),
  the last windowed page end-aligns, counts are guarded, and the auto
  `<CarouselIndicators>` renders the right dot count. Golden edge-case grid at
  route `multi`. See iteration 8 + `docs/carousel-multi-slide-plan.md`.
- Placement framework _(iterations 4/11, then reworked into a composable
  framework in iteration 12, then rearchitected to a 2×2 with `flank`
  retired — human-approved)_ — `placement` is the **family** (`external`
  default · `overlay`) crossed with **`cluster`** (`split` default · `joined`),
  plus **`side`** (before/after), **`distribution`** (group/stretch),
  **`align`** (start/center/end). Delivers **controls-on-top**
  (`side="before"`) and the old external-flank layout (now `cluster="split"`).
  24-cell grid at route `placement`; the retired-noun "flank" example is now
  route `external-split` (nav label "External-split"). Remaining placement
  work: overlay honouring `side` (top pill).
- Dots / indicators variations (below, overlaid _(overlay done, iteration 4)_ —
  route `overlay`; thumbnails _(iteration 9 — human-approved, polish + Figma
  lockstep pending)_ — route `thumbnails`) — the `indicators` modifier (`dots`
  default · `thumbnails`); image thumbnails as the indicators, active one
  ringed in `action-primary`. 2-column control-variant grid.
- Snapping (centred) — `snapAlign="center"`. **No example route yet**, but
  the underlying primitive now correctly supports it end-to-end (a native
  scroll-snap bug where the CSS hook disagreed with the programmatic centre
  was fixed 2026-07-13 — see "Headless gaps" above); building the example
  is the remaining work.
- Right-to-left — route `rtl` exists as a dedicated example (and composes
  throughout the other example pages/the Builder), so the *example* is built;
  the remaining gap is headless **test** coverage, not the demo — see
  "Explicit RTL tests" under Headless gaps above.
- Masonry — grid-based with complex snapping cells. **No route yet.**
- Sticky Slides — sticky labels/content inside slides. **No route yet.**

Additional axes shipped beyond this seeded list, each with its own route but
not originally a backlog bullet: `square` (square slides, iteration 1),
`ratio` (aspect-ratio modifier, iteration 10), `spacing` (the `gap` modifier,
iteration 13), `size` (density/size scaling, iteration 14), `images` (real
`<img>` slide content).

**Advanced**

- Cover Flow (scroll-driven 3D, `--cf-*` playground). **No route yet.**
- Autoplay + play/pause. The headless primitive already supports both
  (`PlayPauseTrigger`, autoplay); **no example route yet** — that's the
  remaining work.
- Crossfade / dissolve (`transition="fade"`) _(iteration 5 — human-approved)_ —
  the `transition="fade"` value + `data-transition` hook + registry crossfade CSS;
  dissolve is the same mechanism with different timing knobs. Route `fade`.
- Multi-step (slide + fade). **No route yet.**
- Variable-size slides — the `slideWidth` modifier (`equal` default ·
  `content`), scoped to `slidesPerPage={1}`. **Built on branch
  `carousel-variable-slide-width`, pending CI + merge** — route
  `variable-width` once merged. See iteration 14's sub-entry.
- Programmatic control (imperative API, progress bar) — **landed
  2026-07-14** alongside the continuous scroll-progress signal. Route
  `progress`. See the dedicated iteration entry below.
- Slideshow (parallax) — a registry `effect="parallax"` modifier + a new
  `<CarouselSlideContent>` presentational subcomponent, a native CSS
  view-timeline (zero JavaScript) with a `--slide-progress`-driven CSS
  fallback for browsers lacking `animation-timeline: view()` support. Route
  `slideshow`. See the dedicated iteration entry below.
- Stories (3D + overscroll), Smart Stack, Cards, Flipbook, Timeline. **No
  routes yet.**

**The Builder (route `builder`) as a parity tool.** It currently threads
every *example-backlog* axis above that's landed —
`placement`/`side`/`distribution`/`align`/`cluster`, `orientation`, `rtl`,
`allowMouseDrag`, `slideCount`, `slidesPerPage`, `ratio`, `radius`
(slide + container), `gap`, `peek`, `padding`, `surface`, `indicators`
(dots/thumbnails), `transition` (slide/fade), **`showProgress`
(continuous scroll-progress overlay, added 2026-07-14 — see its own
iteration entry below)**, **`effect` (none/parallax, added 2026-07-14 —
see the Slideshow iteration entry below)** — as live controls, so it's the
fastest way to re-verify how landed axes compose (all of them
human-approved as of 2026-07-13 — see the QA status note above — except
`showProgress` and `effect`, pending QA), not just the single-axis example
page. Every Ark UI
API-level gap tracked below is now landed (`pageSnapPoints`, indicator
`readOnly`, `inViewThreshold`, `snapType`, per-item `snapAlign`, drag
status, the autoplay status callback, `ProgressText`, the per-call
`instant` override, and `scrollToIndex`, all 2026-07-13), but **none of
them were ever *independent* Builder-control candidates** — they're
headless API surface / call-site arguments / presence-absence
composition choices, not styling/composition axes, so they don't show up
as their own Builder controls regardless (`instant` is a one-shot
call-site argument, not a persistent prop; `scrollToIndex` is an
imperative method, not a prop at all). `snapAlign` specifically: the
Builder's would be a **root-level** default like the others, not a
per-slide override, which needs individually-configurable slides the
Builder's single uniform gallery doesn't have. `ProgressText` is the one
partial exception, worth flagging precisely: it still has no variant
axis of its own, but it **does** now render in the Builder — bundled
under the `showProgress` toggle (2026-07-14) rather than as its own
independent control, since it was a natural free pairing with the
progress-overlay work rather than a dedicated pass. Only the Blossom
overscroll gap (below) remains open.

### Ark UI — gaps identified (read 2026-07-13)

Source: `chakra-ui/ark`'s
[`carousel.mdx`](https://raw.githubusercontent.com/chakra-ui/ark/refs/heads/main/website/src/content/pages/components/carousel.mdx)
(the docs page, fetched directly — doesn't inline props, only usage
narrative) cross-referenced against the actual machine API in the
`@zag-js/carousel@1.42.0` npm package (`carousel.types.d.ts` /
`carousel.props.d.ts` — Ark's React bindings are a thin wrapper over the
Zag.js state machine, so this is the authoritative prop/API surface). Already
tracked in our own backlog/headless-gaps sections are cross-referenced, not
repeated here.

**Already tracked (no new entry needed):** `loop` (our "Looping / infinite"),
`allowMouseDrag` (our mouse-drag gesture — **landed**, and now matches Ark's
opt-in/default-off shape exactly, see the resolved divergence below),
explicit RTL (`dir`), `autoSize` + per-item
`snapAlign` (our "variable-width slides" backlog item, iteration 14 follow-up
— note Ark's per-item `snapAlign` generalizes ours, see below).

**New gaps (not yet tracked anywhere):**

- [x] **Per-item `snapAlign`, including an `"end"` value.** **Landed
      2026-07-13.** `CarouselSnapAlign` gained `"end"` (aligns a slide's
      trailing edge — `viewportSize − slideSize` offset, vs. `"center"`'s
      half that and `"start"`'s zero); `Carousel.Slide` now accepts its own
      `snapAlign`, overriding the root default for just that slide (only
      when it's a valid snap-start position — an interior slide of a
      multi-slide page still never snaps, override or not). The Viewport's
      scroll maths reads the *effective* per-slide value straight off the
      DOM (`targetEl.dataset.snapAlign` — `Carousel.Slide` already
      publishes it) rather than threading new context/registration
      plumbing through for a value only the slide component itself knows.
      TDD in `Carousel.slide-snap.test.tsx` (override + gating on a
      non-snap-start slide) and `Carousel.scroll-sync.test.tsx` (`"end"` at
      root level, and a slide's override winning over a different root
      default). Registry `styles.css`/`.scss` (+ kitchen-sink hand-sync)
      gained the `"end"` CSS rule — no `contract.json`/Rust involvement,
      `snapAlign` already flowed through the wrapper's existing
      passthrough type.
- [x] **Configurable IntersectionObserver threshold.** **Landed 2026-07-13.**
      Added `inViewThreshold?: number | number[]` (default `0.6`, matching
      Ark's shape) as a Root prop, threaded through context into
      `useCarouselViewport.ts`'s observer construction (`{ threshold:
      inViewThreshold }`) and the `isInView` cutoff comparison. For the
      single boolean `isInView`/the IO page-drive fallback need, a plain
      number is used directly; an array uses its **highest** value as the
      cutoff (a design decision — Ark's docs don't specify the array
      semantics beyond the raw observer option). TDD in
      `Carousel.intersection-observer.test.tsx` (3 new tests: default 0.6
      passthrough, a custom single threshold, and an array cutoff).
      Headless-only — no registry/contract/CSS change, so no kitchen-sink
      sync needed.
- [x] **`snapType`: `"proximity"` vs `"mandatory"`.** **Landed 2026-07-13.**
      Added `snapType?: "mandatory" | "proximity"` (default `"mandatory"`,
      matching Ark) as a Root prop, published on `Carousel.Viewport` as
      `data-snap-type`. Registry `styles.css`/`.scss` (+ kitchen-sink
      hand-sync) gained `[data-snap-type="proximity"]` overrides for both
      orientations (`x proximity` / `y proximity`, axis kept explicit so the
      cross axis isn't reset by the shorthand's default). TDD in a new
      `Carousel.snap-type.test.tsx` (2 tests: default + custom). Headless +
      hand-mirrored CSS only — a plain data-attribute hook like
      `orientation`/`transition`, not a `contract.json` modifier, so no Rust
      involvement. Not wired into the kitchen-sink Builder — like
      `snapAlign` before it, a behavioural-only prop with no visual
      composition, so it's not a Builder-control candidate (see that note
      below).
- [x] **Drag status — imperative `isDragging` + a change callback.**
      **Landed 2026-07-13.** Added `isDragging(): boolean` to the imperative
      API (a live ref read, like `isInView` — a drag can tick many times a
      second, so it's not React state) and an `onDragStatusChange` Root
      callback firing `{ type: "dragging.start" | "dragging" |
      "dragging.end", page, isDragging }` exactly as Ark shapes it. Hooked
      into the existing pointer handlers (`useCarouselViewport.ts`) right
      next to the `data-dragging` DOM attribute they already set —
      `"dragging.start"` on the threshold-crossing move, `"dragging"` on
      every subsequent move while active, `"dragging.end"` on
      `pointerup`/`pointercancel`; never fires for a plain click that never
      crossed the threshold. TDD in a new `Carousel.drag-status.test.tsx`
      (10 tests). Headless-only — no registry/contract/CSS change.
- [x] **Autoplay status callback.** **Landed 2026-07-13.** Added
      `onAutoplayStatusChange` to `Carousel.Root`, firing
      `{ type: "autoplay.start" | "autoplay" | "autoplay.stop", page,
      isPlaying }` exactly as Ark shapes it — on every autoplay tick, not
      just play/pause toggles. Hooked into the existing autoplay timer
      effect (`useCarouselRoot.ts`): an `isAutoplayRunningRef` edge-triggers
      `"autoplay.start"`/`"autoplay.stop"` around a running session (the
      effect reruns on every page change without re-firing `"start"`), and
      `"autoplay"` fires once per scheduled tick, right before `next()`
      advances the page. Covers `playing` flipping false, the last page
      being reached, and hover/focus/touch suspension as `"autoplay.stop"`
      triggers, and resumption as a fresh `"autoplay.start"`. TDD in a new
      `Carousel.autoplay-status.test.tsx` (8 tests). Headless-only — no
      registry/contract/CSS change.
- [x] **Indicator `readOnly` prop.** **Landed 2026-07-13.** Added `readOnly`
      to both `Carousel.Indicator` and `Carousel.Indicators` (forwarded to
      every generated dot). Not a literal mirror of Ark's DOM output (no
      network access to the `@zag-js/carousel` source this session to
      confirm it exactly) — our own defensible design: a `readOnly`
      indicator renders a `<span>` instead of `<button>` (no button
      semantics), `aria-hidden="true"` (decorative, not announced), and no
      longer calls `goTo` on click; `data-state` still tracks the active
      page so existing CSS keeps working, and a consumer's own `onClick`
      (if passed) still fires — only the internal navigation is suppressed.
      TDD in `Carousel.indicators.test.tsx` (5 new tests). Headless-only —
      no registry/contract/CSS change, so no kitchen-sink sync needed.
- [x] **A dedicated `ProgressText` part.** **Landed 2026-07-13** via PR #240
      (`carousel-progress-text` branch — off `main` because it touches
      Rust-generated registry files this sandbox can't verify with cargo; see
      the note below on why). Added `Carousel.ProgressText` — a
      `<span>` rendering the live
      `"N of M"` active-page progress via a new `translations.progressText`
      format (`{ page, totalPages } => string`, 1-indexed default
      `"${page + 1} of ${totalPages}"`, matching `slideLabel`'s convention).
      `children`, if passed, overrides the computed text. Deliberately carries
      **no ARIA wiring of its own** — Ark's `progressText` part is
      unopinionated too (no network access this session to confirm the exact
      DOM output, so this is our own defensible default, same caveat as
      `readOnly`); compose it inside your own live region if you want page
      changes announced, rather than doubling up on the Viewport's existing
      `aria-live` toggling. TDD in a new `Carousel.progress-text.test.tsx` (5
      tests) plus a `translations.progressText` override/fallback pair added
      to `Carousel.translations.test.tsx`.
      Threaded into the registry too (unlike every other gap this session,
      which stayed headless-only): a new `progress-text` subcomponent in
      `contract.json`, hand-regenerated `carousel.tsx` / `carousel.recipe.ts`
      (no cargo in this sandbox, so done on the `carousel-progress-text`
      branch/PR — `primitiv-emit`'s drift-guard tests in `rust.yml` verify the
      hand-regeneration byte-for-byte before merge, rather than trusting it
      unverified on `main`), and new muted-caption custom properties
      (`--primitiv-carousel-progress-text-color` → `content-secondary`,
      `--primitiv-carousel-progress-text-font-size` → `body-sm-font-size`) in
      `styles.css`/`.scss` — no layout of its own, the consumer places it
      anywhere (inside `<CarouselControls>`, standalone, …). Kitchen-sink
      hand-synced (`carousel.contract.json` / `.recipe.ts` / `.tsx` / the
      stylesheet).
- [x] **Per-call `instant` (skip-animation) override on imperative scroll
      methods.** **Landed 2026-07-13.** `next`, `previous`, and `goTo` each
      gained an optional trailing `instant?: boolean` parameter, matching
      Ark's `scrollNext(instant?)` / `scrollPrev(instant?)` /
      `scrollTo(page, instant?)` shape. Implementation: a new
      `instantScrollRef` (a one-shot ref, not state — same pattern as
      `isProgrammaticScrollRef`) set by every `next`/`previous`/`goTo` call
      (`!!instant`, so a plain call always clears a stale `true` from a
      prior instant call) and consumed — then reset to `false` — by the
      Viewport hook's scroll effect the moment it reads it, right before
      calling `viewport.scrollTo`, so the override can never leak into a
      later page change that didn't request it (a user swipe, a subsequent
      plain `next()`). When set, it takes priority over the resolved
      `prefers-reduced-motion`-aware `scrollBehavior`. TDD in a new
      `Carousel.instant-scroll.test.tsx` (5 tests: instant on each of the
      three methods, one-shot consumption reverting to smooth on the very
      next call, and the existing default-smooth behavior unaffected).
      Headless-only — no registry/contract/CSS change, so no kitchen-sink
      sync needed. JSDoc (`types.ts`) + the headless README's "Imperative
      API" and "Reduced motion" sections updated. Gates green: scoped
      `vitest run src/Carousel` (286 tests, Carousel files absent from the
      v8 coverage under-threshold table = fully covered),
      `node scripts/check-registry-types.mjs`, a scoped `tsc --noEmit` (no
      Carousel-related errors; pre-existing unrelated sandbox noise only).
- [x] **Slide-index-level imperative scroll, distinct from page-level `goTo`.**
      **Landed 2026-07-13.** Added `scrollToIndex(slideIndex, instant?)` to
      `CarouselImperativeApi`, matching Ark's `scrollToIndex(index,
      instant?)` alongside `scrollTo(page, instant?)` (`goTo`). Thin
      wrapper — `goTo(pageForSlideIndex(slideIndex), instant)` — reusing
      the existing internal `pageForSlideIndex` (already computed for
      `Carousel.Indicator`'s click-to-jump) rather than duplicating the
      page-mapping math, and the `instant` override from the per-call gap
      above composes for free since it just defers to `goTo`. TDD in a new
      `Carousel.scroll-to-index.test.tsx` (4 tests: direct single-slide
      jump, mapping an interior multi-slide-page index to its *containing*
      page's leading slide rather than treating it as its own page start,
      the `instant` override, and controlled-mode `onPageChange` routing).
      Headless-only — no registry/contract/CSS change. JSDoc (`types.ts`)
      + the headless README's "Imperative API" section updated. Gates
      green: scoped `vitest run src/Carousel` (290 tests, Carousel files
      fully covered per the coverage-reporter-omission note above),
      `node scripts/check-registry-types.mjs`, a scoped `tsc --noEmit` (no
      Carousel-related errors).
- [x] **`pageSnapPoints` exposed on the imperative API.** **Landed
      2026-07-13.** Added `getPageSnapPoints(): number[]` to
      `CarouselImperativeApi` — the same offset formula
      `currentPageOffset` uses (`Math.min(page * effectiveSlidesPerMove,
      maxOffset)`), computed for every page, including the end-aligned
      last page. TDD in `Carousel.page-snap-points.test.tsx` (3 tests: no
      multi-slide paging, an end-aligned last page, no slides registered).
      Named `getPageSnapPoints()` (a function) rather than mirroring Ark's
      plain `pageSnapPoints` property, to match this API's existing
      `getProgress()` getter convention. Headless-only — no registry/
      contract/CSS change, so no kitchen-sink sync needed (nothing
      example-facing changed).

**Design divergence to flag, not necessarily a gap:**

- ~~**`allowMouseDrag` is opt-in in Ark (default `false`); ours is
  unconditionally on for every mouse pointer.**~~ **Resolved 2026-07-13**
  (same session, human decision): matched Ark — `allowMouseDrag` is now a
  Root prop, default `false`. TDD in `packages/react`
  (`Carousel.mouse-drag.test.tsx`, split into "opt-in disabled" / "enabled"
  describe blocks + a new `data-mouse-drag` styling-hook describe block, 13
  tests total). Threaded through `types.ts` (`CarouselRootProps` +
  `CarouselContextValue`) → `useCarouselRoot.ts` (default `false`) →
  `Carousel.tsx` (`CarouselRoot` passthrough) → `useCarouselViewport.ts`
  (`onPointerDown` gates on it first, alongside the existing `pointerType`/
  `transition` checks). No registry contract change — `allowMouseDrag` flows
  through the wrapper's existing `ComponentPropsWithRef<typeof
  CarouselPrimitive.Root>` passthrough type + `{...props}` spread
  automatically, the same as `transition`/`snapAlign`/`orientation` already
  do. **A second fix fell out of this:** the registry's `cursor: grab` was
  unconditional on the viewport, which would have misleadingly invited a
  drag that isn't enabled — added a persistent **`data-mouse-drag`** hook
  (present only when `allowMouseDrag` is `true`, distinct from the
  transient `data-dragging`) and scoped `cursor: grab` to it in `styles.css`
  + `.scss` + kitchen-sink hand-sync. Both READMEs (headless + registry)
  updated. Gates: 239 Carousel tests green; a scoped coverage run confirms
  the Carousel files are fully covered (absent from the v8 reporter's
  under-threshold table — the reporter omits 100%-covered files); the
  full-package `qa:units` run is unreliable in this sandbox session (hangs/
  OOM-kills on the full ~1700-test suite) so wasn't re-confirmed end-to-end
  this round — flag for a human/CI re-check. **Follow-up (human caught):**
  the kitchen-sink **Builder** (`/carousel/builder`, "every carousel axis is
  a control") hadn't been wired for the new prop — added an `allowMouseDrag`
  `BuilderConfig` field (default `false`), a checkbox control in the Layout
  section next to RTL, threaded to the live `<Carousel>` instance, and added
  to the `<pre>` prop-echo (`describe()`, boolean-shorthand style like a
  JSX prop written without `={true}`) only when true. Kitchen-sink-only,
  no registry/contract change — structural balance-checked in place of a
  real compile (braces/parens/`CheckField` count), per the sandbox
  convention.
- **Ark's `Control` is a headless anatomy part (`getControlProps()`); ours
  (`CarouselControls`) is registry-only, deliberately kept out of the
  headless primitive** (iteration 6 decision — "the behaviourless grouping
  element ... doesn't belong" in the headless layer). Not a gap so much as a
  different architectural choice already made deliberately; noting the
  divergence for completeness, not proposing to revisit it.
- **Ark requires an explicit `slideCount` prop** (its machine has no live DOM
  slide registration, so it needs the count told to it, particularly for
  SSR). We register slides from real mounted DOM nodes
  (`useCarouselSlide`/`registerSlide`), which is strictly more capable
  (dynamic add/remove already works, tested in `Carousel.dynamic-slides.test.tsx`)
  — not a gap, a place we already exceed Ark.

### Blossom — gaps identified (cross-checked 2026-07-13)

Source: a capability inventory pasted in by the human (`blossom-carousel.com`
is still unreachable from this sandbox — 403 through both `curl` and
`WebFetch`, likely Cloudflare bot protection — so this is the same
paste-in fallback used for Ark's docs page). Confirms the human's earlier
read: the backlog was indeed seeded from Blossom's demo gallery, and almost
every capability maps directly onto something already built or already
tracked. Cross-referenced against the "Example backlog" above and the Ark
section so nothing is duplicated.

**Already tracked or already built (no new entry needed):** native
scrolling + CSS Scroll Snap as the source of truth, scroll physics from the
browser (our whole architecture, not a gap) · mouse/touch drag (landed —
`allowMouseDrag` + native touch) · programmatic API (our imperative API:
`next`/`previous`/`goTo`/`play`/`pause`/`refresh`/`getProgress`/`isInView`/
`getPageSnapPoints`) · previous/next controls and pagination dots (iteration 1)
· thumbnail navigation (iteration 9) · RTL support (the `rtl` route + logical
properties throughout) · responsive layouts (container-adaptive by default,
iteration 1) · accessible keyboard navigation (the WAI-ARIA APG arrow/Home/End
bindings) · aspect-ratio slides (the `ratio` modifier, iteration 10) ·
variable-width slides (our "Variable-size slides" backlog item, tied to Ark's
per-item `snapAlign` gap above) · masonry, sticky slides, cover flow,
slideshow/parallax, stories, smart stack, cards, flipbook, and timeline
layouts (all already backlog items, Advanced list) · `position: sticky`
support (subsumed by the sticky slides/cards backlog items — CSS `position:
sticky` needs nothing from us to "support," it's a consumer stylesheet
concern once the sticky example itself is built) · CSS-first configuration
(our `--primitiv-carousel-*` custom-property layer is the same principle,
implemented as a registry CSS API rather than Blossom's framework-agnostic
core) · progressive enhancement / native scrolling preserved (the scroll-snap
CSS already works independent of JS for the core scroll behaviour; only the
enhancement layer — buttons, dots, keyboard — needs hydration, matching the
philosophy already).

**New gaps (not yet tracked anywhere):**

- [x] **Overscroll events/API.** **Landed 2026-07-13.** Design decision (see
      the Decisions log) + implementation. Added a new Root callback
      `onOverscrollStatusChange` firing `{ type: "overscroll.start" |
      "overscroll" | "overscroll.end", edge: "start" | "end", source:
      "keyboard" | "wheel" | "drag", amount, page }`, detected off the same
      `canGoNext`/`canGoPrevious` page-boundary truth the rest of the
      primitive already uses, from three input sources the carousel directly
      owns the physics for: **keyboard** (a blocked arrow key; `Home`/`End`
      excluded — absolute jumps, not directional pushes), **wheel** (the
      existing horizontal-desktop wheel-to-scroll translation, blocked at a
      boundary), and **mouse drag** (`allowMouseDrag`, pushing past a
      boundary). Keyboard/wheel are instantaneous taps — always a single bare
      `"overscroll"`, `amount: 0`. Drag is the one continuous, physically real
      case — `"overscroll.start"` → repeated `"overscroll"` (with the live
      drag-delta `amount`) → `"overscroll.end"` (on a reversal back within
      bounds, or the drag ending), mirroring `onDragStatusChange`'s shape
      exactly. Paired with a new `isOverscrolling()` imperative getter
      (mirrors `isDragging()`, drag-only) and a persistent
      `data-overscroll="start" | "end"` DOM hook on the Viewport for the
      drag case (mirrors `data-dragging`) — a CSS hook for a rubber-band
      resistance visual with no JS required. **Native touch/swipe overscroll
      is explicitly out of scope** — OS-level rubber-banding has no JS hook
      to observe it from, consistent with the primitive's "native scroll is
      the source of truth" philosophy elsewhere. This unblocks the **Stories
      (3D + overscroll)** backlog item's prerequisite. TDD in a new
      `Carousel.overscroll.test.tsx` (14 tests: keyboard edge start/end +
      no-fire-when-not-blocked + Home/End excluded, wheel edge start/end +
      no-fire-within-bounds, drag start→continue→end + mid-drag reversal +
      pointerup release + the opposite edge + no-fire-within-bounds, and
      `isOverscrolling()` true only during a drag-overscroll). Headless-only
      — no registry/contract/CSS change, so no kitchen-sink sync needed.
      JSDoc (`types.ts`, `Carousel.tsx`) + a new "Overscroll" README section
      + the JS/CSS ownership table updated. Gates green: scoped `vitest run
      src/Carousel` (304 tests, Carousel files fully covered per the
      coverage-reporter-omission note above), `node
      scripts/check-registry-types.mjs`, a scoped `tsc --noEmit` (no
      Carousel-related errors).

**Open questions raised by the inventory, not firm gaps:**

- **"CSS Grid layouts" vs. our "Masonry" backlog item.** Blossom lists these
  as two separate layout capabilities, but its example gallery only ships a
  "Masonry" example (no separate "Grid" example) — ambiguous whether "CSS
  Grid layouts" just means *how* masonry is built (CSS grid under the hood)
  or a distinct, simpler 2D grid arrangement (e.g. a fixed grid of slides
  rather than a single scrolling row). Resolve when Masonry is actually
  built; not worth a separate backlog item speculatively.
- **"Sticky cards" vs. "Sticky Slides."** Listed as a separate layout
  capability, but the example gallery only has "Sticky Slides" (not "Sticky
  Cards") alongside a separate "Cards" example — likely "sticky cards" means
  applying the sticky-slide treatment to the Cards example specifically,
  not a third backlog item. Fold into the **Cards** backlog item as a detail
  to consider when it's built, rather than adding a new bullet.

**Design divergence to flag, not a gap:**

- **Framework integrations (Core, React, Vue, Svelte, Web Components).**
  Blossom ships a framework-agnostic core plus per-framework bindings.
  Primitiv is React-only by design across the whole design system, not just
  Carousel — this is an intentional scope boundary, not something to close.

### Wider field — capability gaps beyond parity (Embla / Swiper / Keen / Splide, surveyed 2026-07-14)

This is the **"then go beyond both"** phase of the goal above. With the
Ark/Blossom gap lists essentially closed (only Blossom overscroll had
remained, now landed), the question shifts from "are we equivalent?" to
"what makes us *the best* React carousel?" — so this scan widens past
Ark/Blossom to the rest of the field: **Embla** (the headless benchmark,
closest to our philosophy), **Swiper** (the feature-maximalist), **Keen**,
and **Splide** (the a11y-first one). Surveyed from each library's own
option/method/event/plugin docs (sources at the end).

**Where we already lead (frame, not a gap).** The field's own comparisons
peg *accessibility* and *headless/zero-style* as the two axes nobody wins
together: Splide is a11y-first but styled; Embla/Swiper are headless but
"require manual `role` / `aria-label` / keyboard / live-region work." We
already ship Splide-grade a11y (viewport `aria-live` polite/off, auto slide
labels, full WAI-ARIA APG pause semantics, `ProgressText`) **and**
Embla-grade headlessness/zero-style, plus drag / overscroll / autoplay
**status telemetry** none of them expose. That combination is the moat —
every item below must preserve it, not trade it away.

**Already tracked or already built (no new entry needed):** loop / infinite
(our "Looping / infinite" backlog item — table stakes, still open) ·
variable-width slides (the `slideWidth` follow-up) · the imperative API,
autoplay + play/pause, RTL, aspect-ratio slides, mouse/touch drag (all
landed or tracked, per the Ark/Blossom sections above) · grid / multi-row
(Swiper/Splide `grid`) maps onto the existing **Masonry** backlog item + its
"CSS Grid layouts" open question — resolve there, no new bullet ·
Slideshow (parallax) / Stories / Smart Stack / Cards / Flipbook / Timeline
(the Advanced example backlog — most are *unblocked by* the scroll-progress
signal below).

**New gaps (not yet tracked anywhere):**

_Differentiators — what would make us best, not just complete:_

- [x] **Continuous scroll-progress signal (per-slide + global).** **Landed
      2026-07-14** (see the "Continuous scroll-progress signal" entry below
      for the full build writeup). `getScrollProgress()` (global, `0..1`) and
      `getSlideProgress(index)` (per-slide, `-1..1`) added, purely additive
      alongside the existing page-granular `getProgress()`/boolean `isInView`,
      surfaced both imperatively and as `--carousel-progress` /
      `--slide-progress` CSS custom properties, rAF-batched. Route `progress`
      (**landed same day** — see its own iteration entry below); a full
      parallax/cover-flow showcase is still natural future work; unblocks
      most of the **Advanced** example backlog and the Cover
      Flow family whenever that example work starts. Loop and virtualization
      still build on the same plumbing.
- [ ] **Headless virtualization.** Render only near-viewport slides (sized
      spacers preserve the measured offsets + native snap the whole
      architecture relies on). Swiper and Keen ship it; reviewers note Embla
      makes you build it yourself. Nobody pairs real virtualization with real
      a11y — highest moat. Architecturally the hardest of these (offsets are
      measured off live DOM), so it wants its own RFC.

_Table stakes — reasons a team picks a competitor today:_

- [ ] **`dragFree` + momentum/inertia + `skipSnaps`.** Embla's signature
      *feel*: inertial flick, optional non-snapping free scroll, and
      skip-snaps on a vigorous drag. Ours is deliberately momentum-less
      (`allowMouseDrag` tracks the pointer 1:1, stops dead on release) — this
      is the tactile gap.
- [ ] **Auto-resize + richer lifecycle events.** An internal `ResizeObserver`
      on viewport + slides that auto-re-aligns (Embla `watchResize` /
      `watchSlides` auto-`reInit`), retiring the manual `refresh()` footgun;
      plus `onSettle` / `onSelect` / `onSlidesInView` / `onReInit` to match
      Embla's event vocabulary (today everything routes through
      `onPageChange`). Pairs naturally with the scroll-progress signal.
- [ ] **Continuous auto-scroll / marquee.** A ticker / logo-wall that scrolls
      *continuously* rather than paging (Embla `AutoScroll`, Splide
      `AutoScroll`) — distinct from our page-and-stop `autoplay`.
- [ ] **Responsive per-breakpoint options.** Change `slidesPerPage` / align /
      etc. per breakpoint from inside the component (Embla `breakpoints`,
      Swiper responsive, Splide media-query options). **Open decision:** for a
      headless, CSS-first lib this may be better left consumer/CSS-owned than
      absorbed as a prop — settle the boundary before building.
- [ ] **Auto-height.** Viewport tracks the active slide's measured height
      (Embla `AutoHeight`) — the standard answer for variable-content slides;
      a natural companion to the ResizeObserver above.

_Polish / niche:_

- [ ] **a11y superset** (our strongest brand claim to extend): auto-wire
      `aria-controls` (indicators/triggers → slide/viewport ids) instead of
      the manual `ids` bag; add the WAI-ARIA APG **tabbed** carousel variant
      (indicators `role="tab"`, slides `role="tabpanel"`) for full-APG
      coverage; optional focus-follow to the newly-active slide.
- [ ] **Pinch-to-zoom** lightbox gesture (Swiper `zoom`), as an opt-in part.
- [ ] **URL hash / history sync** helper (Swiper `hash-navigation` /
      `history`) — DIY-able today via controlled `page`, but no first-class part.
- [ ] **Headless lazy-load part** — mount slide children on near-viewport
      (Splide/Swiper lazy); `isInView` exists but every consumer re-wires it.
- [ ] **Autoplay countdown / Stories progress** — a per-tick progress value
      for segmented Stories bars + hold-to-pause tap zones (not currently
      exposed); ties into the **Stories** Advanced example.
- [ ] **Auto-pause media** (`<video>`) in inactive slides — Splide's `Video`
      behaviour.

**Recommended sequence:** scroll-progress signal → virtualization → loop
(already tracked) → `dragFree`/momentum. Sources: Embla
([options](https://www.embla-carousel.com/docs/api/options) ·
[events](https://www.embla-carousel.com/docs/api/events) ·
[plugins](https://www.embla-carousel.com/docs/api/plugins)), Swiper
([API/modules](https://swiperjs.com/swiper-api)),
[Keen](https://keen-slider.io/docs), Splide
([options](https://splidejs.com/guides/options/) ·
[extensions](https://splidejs.com/extensions/)), and the
[Embla vs Swiper vs Splide 2026](https://www.pkgpulse.com/guides/embla-carousel-vs-swiper-vs-splide-2026)
comparison. `ROADMAP.md` carries a one-line pointer to this section.

### Mouse-drag sensitivity (human QA follow-up)

**Human feedback:** the just-landed click-and-drag felt unresponsive —
"I have to drag quite a lot." Root cause: `scrollLeft`/`scrollTop` tracked the
raw pointer delta literally 1:1, so a wide slide (often several hundred
pixels) needed dragging its *full on-screen width* to scroll through one
slide's worth of content — far more physical pointer travel than the gesture
should cost, unlike a native touch swipe (which most OSes/browsers already
apply their own acceleration to).

**Fix.** Two tuned constants in `useCarouselViewport.ts`:
- **`DRAG_SENSITIVITY = 2`** — the tracked pointer delta is multiplied by 2
  before being applied to `scrollLeft`/`scrollTop`
  (`nextScroll = startScroll - delta * DRAG_SENSITIVITY`), so a drag needs to
  cover only half the on-screen distance to produce the same scroll. Still
  **no momentum** — the multiplier only scales the delta computed on every
  `pointermove` against the drag's start position; motion stops dead the
  instant the pointer stops or releases, preserving the earlier human
  decision (1:1-tracking-no-momentum) in spirit, just re-tuned in magnitude.
- **`DRAG_THRESHOLD_PX` lowered `4 → 3`** — the click-vs-drag movement
  threshold nudged down slightly too, so the drag registers a touch sooner
  (a smaller contribution than the sensitivity multiplier, but asked for
  explicitly).

**TDD.** Updated `Carousel.mouse-drag.test.tsx`: the two drag-tracking tests
(horizontal + vertical) now assert the 2×-amplified `scrollLeft`/`scrollTop`
value instead of the raw delta (renamed to describe the amplification, with
the maths spelled out in comments); the pointerup-cleanup test's final
`scrollLeft` assertion updated to match; added a new test pinning the lowered
3px threshold (2px still doesn't start a drag, 3px does). 14 tests total,
green. A scoped `vitest run src/Carousel --coverage` confirms the Carousel
files stay fully covered (absent from the v8 reporter's under-threshold
table — the full-package `qa:units` run remains unreliable in this sandbox
session, per the earlier note).

**Docs.** Every "1:1" mention of the drag tracking (`Carousel.tsx` JSDoc, the
headless README's Status list + JS/CSS table + "Mouse input" section, the
registry README's Viewport bullet) reworded to describe the amplified
tracking instead of a literal 1:1 ratio. No registry contract/CSS change —
this is pure headless physics tuning, the `data-mouse-drag`/`data-dragging`
hooks and the CSS scoped to them are unaffected.

**Gates green:** `pnpm --filter @primitiv-ui/react exec vitest run
src/Carousel` (240 tests), `cargo test -p primitiv-emit -p primitiv-cli`,
`node scripts/check-registry-types.mjs`. **Next:** human re-QA of drag feel
at 2× — if still not sensitive enough (or overshoots), `DRAG_SENSITIVITY` is
a single named constant, easy to retune again.

### Coverage-verification methodology bug (caught by CI, fixed 2026-07-13)

**What happened.** PR #241's CI (`packages/react qa:units`) failed:
`useCarouselViewport.ts` at 99.2% branch coverage, a real gap that had been
sitting on `main` since the overscroll feature landed earlier this session
— not something the PR branch introduced (it never touches `packages/react`).

**Root cause of the gap.** `endDrag`'s `if (drag.overscrollEdge)` branch
(fired on `overscroll.end`) has an implicit `else` — "the drag ended and it
was never overscrolling, do nothing." Every existing mouse-drag test starts
at page 0 and drags toward the start edge (a small `clientX` increase) to
exercise the basic drag-tracking math — which the overscroll detection
added this session unavoidably classifies as an overscroll too (`delta > 0
&& !canGoPrevious`, and `canGoPrevious` is always `false` at page 0). So by
the time any existing test released the drag, `drag.overscrollEdge` was
always truthy — the "never overscrolled" `else` path had no test exercising
it at all. Fixed: a new test in `Carousel.overscroll.test.tsx` starts at
`defaultPage={1}` (both `canGoNext`/`canGoPrevious` true) so the drag stays
genuinely in-bounds, then releases — confirmed via the v8 JSON reporter
(`coverage/coverage-final.json`, the `b` branch-hit map) that this closes
the exact branch id that CI flagged, with no other regression.

**Root cause of why this session's own verification missed it three times
running** (after the instant-scroll, scrollToIndex, and overscroll cycles
alike): the verification pattern used throughout this session —
`grep -n "useCarouselRoot\|useCarouselViewport\|Carousel.tsx" <coverage
output>` and treating no-match as "100%, absent from the under-threshold
table" — has a blind spot. The v8/vitest text reporter **truncates long file
paths** to fit its fixed-width column (e.g. `useCarouselViewport.ts`
prints as `  ...elViewport.ts`), so a grep for the untruncated name silently
finds nothing whether the file is at 100% *or* has a real gap. The false
negative wasn't caught earlier because every prior scoped check happened to
be genuinely 100% at the time; this is the first time it masked a real
regression. **Fixed methodology, going forward:** grep a short, truncation-
proof substring (e.g. `elViewport.ts`, `elRoot.ts`, matching the tail v8
prints) — or better, parse `coverage/coverage-final.json`'s `b` map
directly for `0`-hit entries in the touched file(s), which is exact and
can't be fooled by column width. No more trusting an absence-of-match on a
long filename.

**Fixed directly on `main`** (headless-only, no registry/contract touch) —
commit `2a66bb0f`, one test added, 305 Carousel tests green,
`useCarouselViewport.ts` confirmed 0 uncovered branches via the JSON
reporter. The `carousel-variable-slide-width` branch (PR #241) doesn't
touch `packages/react`, so it needed a merge from `main` to pick the fix up
before its own CI would re-run clean — done in the same session.

### Human QA sweep — default snapAlign, Builder gaps, native drag, multi-slide alignment (2026-07-13)

A single QA session surfaced and fixed several independent issues, in order:

**`snapAlign` default flipped `"start"` → `"center"`.** Centre-alignment is
the more broadly useful default (the "active card centres in view" feel
most consumers reach for). Changed in `useCarouselRoot.ts`, with every test
pinned to the old default updated to assert `"center"` instead (or given an
explicit `snapAlign="start"` where the test's actual concern was unrelated
to alignment, e.g. multi-slide page targeting, axis selection) — plus the
Builder's `DEFAULT_CONFIG`, both READMEs, and the `CarouselPage.tsx`
start-vs-override demo (now explicit `snapAlign="start"` on the root, since
it's no longer the ambient default).

**Carousel Builder: stale `slidesPerPage` under `slideWidth="content"`.**
The `slidesPerPage` control was disabled but not reset when `slideWidth`
switched to `"content"` (unsupported at `slidesPerPage > 1`), so a value
set earlier in `"equal"` mode kept flowing into the live instance,
corrupting pagination/indicators. Fixed by clamping the *effective* value
(not the stored config) to 1 under `slideWidth="content"`, so the control
still remembers what the user had set for when they switch back.

**Vertical + `slideWidth="content"`: the `ratio` control re-enabled.**
Investigation found `ratio` still drives the vertical viewport's forced
`aspect-ratio` even in content mode (only the *slide's* own aspect-ratio
stands down) — the Builder previously disabled `ratio` there with a
misleading "n/a" note. Now it stays live with a hint explaining why. The
underlying CSS gap (the vertical viewport rule should itself stand down
under `--slide-width-content`) is logged as an open question above —
deferred, possibly a Figma-session decision (does the viewport auto-follow
tallest/active slide? something else?).

**Thumbnail active-ring occlusion fixed.** The ring was an `inset
box-shadow` painted under the thumbnail's own flush 100%×100% content
(nearly fully hidden except rounding slivers). Reserved the ring's width as
a real, transparent-by-default `border` instead (already `box-sizing:
border-box`, so zero footprint shift) — activation is just a
`border-color` swap, which a pre-existing-but-unused `transition:
border-color` in the base rule suggests was the original intent.

**Native browser image/link drag suppressed under `allowMouseDrag`.** A
real `<img>`/`<a>` slide is natively draggable; starting a drag over one
fired the browser's own HTML5 drag (the ghost image), competing with the
custom pointer-drag. The one existing `-webkit-user-drag: none` CSS rule
was scoped to the slide *wrapper*, not the media element (the property
isn't inherited, so it silently did nothing), and is WebKit-only regardless
(no Firefox equivalent). Fixed cross-browser via a new `onDragStart`
handler on the Viewport that `preventDefault()`s under `allowMouseDrag`
(untouched otherwise); the CSS rule was also corrected to target the media
element too, as WebKit-specific defense-in-depth.

**Builder: a `content="pictures"` option.** Real photos from Lorem Picsum
(randomised per-slide dimensions, computed once at load) as an alternative
to the synthetic gradient/PHOTOS placeholders, composing with both
`slideWidth` and `indicators="thumbnails"` — added specifically so genuine
thumbnail rendering could be inspected (the active-ring fix above was
verified against it).

**Grouped-thumbnail hover.** With `slidesPerPage > 1`, several thumbnails
already share one page and highlight together when *active* (a CSS-only
`:has(+ …)`-adjacency trick, since every member independently computes the
identical `data-state="active"` value via `pageForSlideIndex`). Hover can't
reuse that trick — `:hover` only ever applies to the pointed-at element,
and no CSS selector can project it onto an arbitrary-length sibling run
the way a naturally-shared attribute value can (confirmed: no bounded-N
enumeration precedent exists anywhere in the registry either, and one
would need to hardcode a max `slidesPerPage` to work at all). Fixed with a
small amount of consumer JS instead — the kitchen-sink `ThumbnailIndicators`
pattern tracks "which page is hovered" (reusing the already-exposed
`pageForSlideIndex`) and marks every thumbnail sharing it with
`data-group-hover`, which the registry stylesheet treats identically to
`:hover`. Zero headless change — any headless-only consumer can wire the
identical pattern themselves.

**`snapAlign="center"`/`"end"` + `slidesPerPage > 1`: centres/ends the
leading slide only, not the whole page (found via human QA, confirmed a
genuine gap — unlike `slideWidth="content"` + `slidesPerPage > 1`, this
combination was never restricted or documented).** Root cause: the
alignment math measured only the *leading slide's own box*, never the
full page's span. Under `slideWidth="equal"`, any run of `slidesPerPage`
equal-width slides always exactly fills the viewport by construction, so
the correct offset for a full page is always ~0 regardless of
start/center/end — the bug was undershooting by roughly half a slide's
width, clipping the page's trailing member(s) off-screen. Two fixes,
matching the two ways a page's scroll position gets set:
- **Programmatic (`scrollTo`)** — `useCarouselViewport.ts`'s leftover-space
  calc now measures from the leading slide's edge to the *actual last
  member's* edge (clamped to the real slide count, so `slidesPerPage`
  exceeding the total slide count doesn't look up a nonexistent slide).
- **Native (swipe/wheel/touch)** — `scroll-snap-align` on one element can
  only ever align *that* element's own box, so a JS fix to the scrollTo
  path alone wouldn't hold once a user's own gesture let the browser's
  native snap re-settle. Fixed by extending each page's leading slide's
  `scroll-margin-inline-end`/`-block-end` out to its actual last member —
  invisible, no layout effect, purely enlarging the native snap area — kept
  live via a `ResizeObserver` on the viewport (equal-share slide sizes
  derive from the viewport's own size) alongside the existing
  page/slide-count triggers. No-op at `slidesPerPage=1`.

A page-wrapper DOM element (grouping each page's slides under a synthetic
container, mirroring how the group border frames them) was considered and
rejected: it would restructure the slide-is-a-direct-flex-child model
everything else depends on (refs, IntersectionObserver, a11y), essentially
adding a new implicit surface, for a fix `scroll-margin` achieves without
touching the DOM shape at all — consistent with the standing preference
that the headless component do the heavy lifting rather than grow a new
subcomponent, and that a non-registry consumer get full correctness for
free (here, entirely for free — no registry CSS involved).

Added a jsdom `ResizeObserver` polyfill (`src/test/resizeObserverPolyfill.ts`,
`MockResizeObserver`) mirroring the existing `IntersectionObserver` one, since
jsdom doesn't implement it.

**Gates green:** 315 Carousel tests (up from 305), full `packages/react`
suite 1839 passing (one pre-existing, unrelated `Switch.recipe.test.ts`
failure — a `class-variance-authority` resolution issue, untouched by this
session). Coverage on every touched file confirmed 100% lines/branches via
the JSON/lcov reporter. Each fix landed as its own commit, pushed straight
to `main` per this session's standing authorisation.

**Follow-up, same session: thumbnail grouping was itself broken —
`pageForSlideIndex` reused for the wrong job.** Immediately after the
group-hover fix landed, human QA found it (and the pre-existing *active*
grouping) shrinking a page's real member count: `slidesPerPage={4}` at 8
slides gave the first group only 3 of its 4 thumbnails; `slidesPerPage={3}`
at 7 slides gave the first group 2 of 3; `slidesPerPage={2}` at 7 slides
(an uneven total) left one thumbnail an isolated group of one. All three
traced to the same root cause: `ThumbnailIndicators` mapped each slide's
thumbnail through `pageForSlideIndex(slideIndex)` for grouping, but that
function resolves an index to its *nearest* page start — the correct tool
for `goTo`/native-snap-target mapping (its actual, narrower purpose,
already covered by its own tests), and *not* the same thing as "which
page's real window `[offset, offset + slidesPerPage - 1]` contains this
slide." The two disagree whenever a page's last member sits closer
(index-distance-wise) to the *next* page's offset than to its own — true
for any `slidesPerPage >= 3` regardless of divisibility, and also for
`slidesPerPage=2` once the end-aligned last pages overlap (an uneven
total). Confirmed this is pre-existing, not introduced this session — the
`pageForSlideIndex`-for-grouping pattern predates it, and was simply never
exercised at `slidesPerPage >= 3` or an uneven total until now.

**Fix:** a new `pageContainingSlideIndex` helper (duplicated identically
in both `CarouselBuilder.tsx` and `CarouselPage.tsx`'s
`ThumbnailIndicators`, mirroring how the pattern already existed twice) —
a plain window-containment loop over `0..totalPages-1` using primitives
already exposed via context (`slidesPerPage`, `effectiveSlidesPerMove`,
`maxOffset`, `totalPages` — the same four `useCarouselViewport.ts`'s new
`scroll-margin` effect above already consumes), returning the *first* page
whose window contains the index. This resolves the rare overlap case (the
last two pages sharing a slide) by preferring the earlier page, so every
slide's thumbnail belongs to exactly one group. `pageForSlideIndex` itself
was left completely untouched — changing its semantics would risk
regressing the `goTo`/native-snap-target behavior it's actually tested
against. Zero headless change; the registry README's thumbnail-grouping
guidance was corrected to describe (and warn against) this exact pitfall.

**Follow-up: the active-ring border fix from earlier this session still
looked cut off once the thumbnail-grouping fix above made multi-slide
groups render correctly.** Since a browser can't be driven interactively in
this sandbox, diagnosed by building a standalone HTML mock against the real
compiled `tokens.css` + `primitiv-base.css` + registry `styles.css` and
screenshotting it with Chrome's `--headless=new --screenshot` CLI (no
Playwright available locally) — confirmed visually, then confirmed the
mechanism precisely by dumping `getComputedStyle()` border longhands into
the page and reading them back via `--dump-dom`. The computed
`border-inline-start`/`-end` cancellation was *already correct*
(`border-*-style: none` on the right sides) — the bug was purely visual:
each thumbnail keeps its own full `border-radius` (the base rule sets it
unconditionally), so at a group seam the "kept" side's rounded corner still
curves away per its own independent radius even though the "cancelled"
side is genuinely borderless — reading as a gap/notch rather than one
continuous frame. Fixed by squaring the two corners on each cancelled side
(`border-start-start-radius`/`border-end-start-radius` etc., set to
`var(--primitiv-radii-0)`) in the same cancel rule blocks (no new
selectors needed — same specificity/cascade tie-break already in place).
Re-verified visually: a 3-member active run now renders as one seamless
frame with square joins and rounded outer corners only.

Also confirmed `border-color` was already transitioning smoothly (a
pre-existing declaration) — the group frame's own
`border-inline-start`/`-end`/`-block` appearing/disappearing (`none` ↔
`solid`) can't be smoothed by any transition-list change regardless, since
CSS cannot interpolate the `style` keyword.

**Reverted, same session, on human feedback: corner-squaring undone —
every thumbnail keeps full rounding always, even mid-group.** Shown a
render of a 3-member active run, the corner-squaring above (each thumbnail
rounded only on its outer edge, interior members fully square) read as
"radii gone missing" rather than "one continuous frame" — asked directly,
the human's preference is every thumbnail keeps its own full corner radius
regardless of grouping, accepting a small visual gap at the seams between
grouped members (the group's own `gap` gutter, not a border defect) over
squared-off interior members. Reverted the `border-*-radius: 0` overrides
and their transition-list entries from the previous fix, restoring the
plain `border-inline-start`/`-end: none` cancellation with no radius
override. The group frame concept itself (bordering same-page thumbnails
as a unit) is unchanged — only the corner-squaring cosmetic layered on top
of it is gone.

**Separately, a real (and kept) fix found alongside this: the ring/content
corner nesting was wrong on *every* thumbnail, grouped or not.** The same
mock + `getComputedStyle` diagnosis approach turned up a second, distinct
bug: the thumbnail's content (`.primitiv-carousel__indicator > *`) used
`border-radius: inherit` — copying the frame's radius value verbatim onto
a *smaller* box (the content sits inset by the reserved border width,
`box-sizing: border-box`). Reusing the identical radius on a smaller box
over-rounds it relative to the frame's own outer curve, so the two curves
don't nest concentrically — leaving a small black wedge at all four
corners between the border and the content, visible on any single
thumbnail the moment its ring has a real colour (invisible before this
session's ring fix, for the same reason the seam issue was: the ring used
to be an occluded inset box-shadow). Fixed with the standard nested-corner
formula — inner radius = outer radius − border width, `max()`-clamped to 0
so it degrades gracefully at small radii/large ring widths instead of
producing an invalid negative value:
`max(var(--primitiv-radii-0), calc(thumbnail-radius - ring-width))`. This
fix stands regardless of the corner-squaring reversal above — it's an
independent, still-needed correction.

### Continuous scroll-progress signal (headless-only, human-approved)

**Next item off the "wider field" backlog** (the human picked this over
looping, an autoplay example route, and `dragFree`/momentum — the dev
log's own recommended-first, highest-leverage item). Two design forks
were put to the human ahead of implementation and resolved: (a) this
feature over the alternatives, confirmed; (b) whether the scroll-driven
recompute should be rAF-batched from the start — confirmed **yes**, to
avoid a forced-layout-read-per-slide-per-scroll-tick anti-pattern,
especially relevant for slide-heavy variants like thumbnails.

**Headless gap filled (TDD, 100%).** Two new imperative getters, purely
additive — `getProgress()` and `isInView()` are untouched, byte-for-byte:

- **`getScrollProgress(): number`** — continuous `0..1` for how far the
  Viewport has scrolled along its main axis (`0` when there's no
  overflow to scroll). Computed off raw scroll geometry
  (`scrollLeft`/`scrollWidth`/`clientWidth`, or the block-axis
  equivalents when vertical), deliberately independent of the page/offset
  math `getProgress()` uses. **RTL-safe with no `dir` check** — modern
  browsers standardize RTL `scrollLeft` on the "negative" convention (`0`
  at the start, down to `-maxScroll` at the end), so the formula takes
  `Math.abs(scrollPos)` before normalising, making "distance travelled
  from the start" monotonic in both directions. This mirrors the exact
  reasoning already in `useCarouselViewport.ts` for why the mouse-drag
  handler needs no RTL special-casing either — confirmed with a dedicated
  test (mocked negative `scrollLeft`) rather than just flagging it as a
  caveat, since the fix was cheap and the convention was already
  established in this file.
- **`getSlideProgress(slideIndex: number): number`** — continuous
  `-1..0..1` for how far a slide's center sits from the viewport's
  center, via `getBoundingClientRect` (the same idiom the multi-slide
  `scroll-margin` fix already uses for its own geometry). `0` = centered;
  `±1` = the slide's center has reached the viewport edge, clamped beyond
  that. `0` for a never-registered/out-of-range index. **Documented
  precisely, not just "±1 = off-screen":** normalised by the
  **viewport's** half-extent, not the slide's own, so at
  `slidesPerPage > 1` a fully on-screen outer page member can already
  read a large magnitude (~±0.67 at three-per-page) — this is not the
  same signal as `isInView` flipping to `false` (geometry vs. an
  IntersectionObserver threshold crossing).

Both values are also mirrored live onto CSS custom properties —
**`--carousel-progress`** (Viewport) and **`--slide-progress`** (each
Slide) — written imperatively via `style.setProperty`, unprefixed
because this is a headless-primitive-owned DOM hook (like
`data-dragging`/`data-overscroll`), not the registry's
`--primitiv-carousel-*` token namespace. This is the first time this
component writes a CSS custom property from JS (every prior imperative
DOM write was a plain attribute via `setAttribute`, or a real — not
custom — inline property, in the `scroll-margin` fix). No new
callback/event: continuous values fire too often for the discrete-
transition event pattern `onDragStatusChange`/`onOverscrollStatusChange`
use — ref + on-demand getter + CSS-var mirror is the right shape,
matching how `isInView`/`isDragging` already work.

**Wiring.** One new `useEffect` in `useCarouselViewport.ts`, placed
alongside the existing scroll-margin `ResizeObserver` effect but
**unconditional** — no `transition !== "slide"` gate, a deliberate
divergence, since progress should degrade gracefully in `fade` mode
(near-zero/coincident values) rather than not exist. Attaches a passive
native `scroll` listener (the first use of this event type in the
component) plus a second `ResizeObserver` on the Viewport, both driving
one shared `recomputeProgress` closure, rAF-batched via a `scheduleRecompute`
wrapper (a plain closure-local `pendingFrame` variable, not a ref — it
never needs to outlive one effect instance). The **initial synchronous
call bypasses the rAF gate** so values are non-default before first
paint, mirroring how the scroll-margin fix calls `recomputeScrollMargins()`
once before `resizeObserver.observe(viewport)`. The effect's dependency
array includes `slideKeys` (confirmed load-bearing by a dedicated
red/green cycle — temporarily stripping it broke 8 of 21 tests, not just
the one it was added for) so a slide-set change (`refresh()`-driven or a
dynamic add/remove) recomputes immediately against the new index mapping
rather than serving a stale cached value; per-slide values are looked up
by iterating `slideKeys` **by index** (`slidesRef.current!.get(slideKeys[i])`),
not `Map` iteration order (insertion order ≠ numeric index once slides
are dynamically added/removed), and the per-slide store is rebuilt as a
fresh `Map` each pass rather than mutated, so a shrunk slide count can't
leave stale indices lingering. Only the two setters
(`setScrollProgress`/`setSlideProgress`) cross into
`CarouselContextValue` — the refs and the getters themselves stay
entirely inside `useCarouselRoot.ts`, mirroring the existing
`visibleSlideIndicesRef`/`setSlideInView`/`isInView` isolation exactly.

**Test-infra fallout: two ResizeObservers on the same element broke an
existing test's assumption.** With the new effect's `ResizeObserver`
alongside the pre-existing scroll-margin one, `MockResizeObserver.latest`
(the most-recently-constructed instance) stopped reliably referring to
the scroll-margin fix's own observer in `slidesPerPage > 1` fixtures —
`Carousel.scroll-margin.test.tsx`'s own resize-recompute test started
failing. Fixed by adding a `MockResizeObserver.fireAll()` static (fires
every constructed instance, regardless of which element it watches or
when it was created) to the shared polyfill
(`src/test/resizeObserverPolyfill.ts`) and switching both that
pre-existing test and this feature's own ResizeObserver test to use it
instead of `.latest?.fire()` — a small, well-justified addition to the
shared test infrastructure now that a component can legitimately have
more than one active observer on the same element.

**rAF-batching TDD, driven honestly.** Two new tests specifically for
the batching behaviour — coalescing two scroll events within one frame
into a single `requestAnimationFrame` call, and cancelling a pending
frame on unmount — were written and confirmed genuinely red (the
existing per-tick-recompute tests stayed green throughout, since without
batching a plain scroll event already recomputed synchronously). A third
test (the slide-set-change freshness check, above) initially passed on
first run against the already-correct `slideKeys` dependency — per this
repo's pure-red-green rule, `slideKeys` was **temporarily stripped from
the effect's dependency array** to confirm the test (and 7 others) went
genuinely red, then restored to go green, rather than keeping a
characterisation test that never failed.

**Docs.** JSDoc on both new `CarouselImperativeApi`/`CarouselContextValue`
fields in `types.ts`; a new "Continuous scroll progress" README section
(CSS-var read example, the `slidesPerPage > 1` magnitude caveat, the
`isInView`-is-a-different-signal clarification, the RTL handling note)
plus a new "JS vs CSS responsibilities" table row and an Imperative API
code-sample/prose update.

**Built:** nothing example-facing — **headless-only, no registry/
contract/CSS change, so no kitchen-sink sync needed**, matching how every
other Ark-parity API-level gap landed (`scrollToIndex`, `getPageSnapPoints`,
`onDragStatusChange`, etc.). A demonstrative example (a parallax or
cover-flow showcase) is natural next work once the example-backlog
placements are revisited, but is out of scope for this pass.

**Gates green:** `pnpm --filter @primitiv-ui/react exec vitest run
src/Carousel` (23 new scroll-progress tests + the full 338-test Carousel
suite, no regressions), `getProgress()`/`isInView()`'s own test files
confirmed byte-unchanged. Each TDD cycle landed as its own commit, pushed
straight to `main` per this workstream's standing authorisation.
`node scripts/check-registry-types.mjs` unaffected (no registry change).

**Next:** virtualization, then loop, then `dragFree`/momentum — the dev
log's own recommended sequence — or an example route demonstrating this
signal (parallax/cover-flow), whichever the human prioritises next.

### Kitchen-sink demo-coverage audit (2026-07-14) — gaps to close after the progress example

Prompted by "are there other missing routes? I think we might be behind."
An audit cross-referenced every capability this log claims is landed
against what's actually reachable in `apps/kitchen-sink` (a route, a
Builder control, or composed into an existing example) — not just
trusting route names. Human decision: finish the scroll-progress example
first, then come back for this batch. Findings, so they aren't lost:

**Genuinely missing — landed and tested, zero demo anywhere, not even a
Builder control:**
- **Autoplay + play/pause** (`PlayPauseTrigger`, autoplay, `onAutoplayStatusChange`) —
  no route, no Builder control, no registry-surface usage at all.
- ~~**`Carousel.ProgressText`** ("N of M") — hand-synced into the registry
  surface files (`contract.json`/`recipe.ts`/`tsx`) but no example page
  actually renders it.~~ **Resolved 2026-07-14** — the `progress` route
  (built the same day, see its own iteration entry) renders
  `<CarouselProgressText>` in its controls row, a natural pairing since
  both are "progress" themed. Picked up as a free side-effect of that
  work, not a dedicated pass.
- **Overscroll** (`data-overscroll`, `onOverscrollStatusChange`,
  `isOverscrolling`) — zero demo anywhere, not even in the stylesheet
  (only unrelated touch-scroll `overscroll-behavior` rules exist).
- **Drag status** (`isDragging`, `onDragStatusChange`) — zero demo anywhere.

**Partially behind:**
- **Mouse click-and-drag** (`allowMouseDrag`) — only a Builder checkbox;
  no dedicated route showcasing the drag-sensitivity tuning and native-
  drag-suppression work that had its own QA rounds (see "Mouse-drag
  sensitivity" and the Human QA sweep above).
- **Snap strictness** (`snapType="proximity"`) — CSS shipped
  (`[data-snap-type="proximity"]`, both orientations) but no TSX
  anywhere ever sets the prop — dead code with no way to see it. The
  log's own reasoning for excluding it from the Builder ("behavioural-
  only, no visual composition") doesn't fully hold up — proximity vs.
  mandatory snapping has a real, visually-distinguishable scroll feel.

**Minor, not urgent:** `snapAlign` covers `"start"`/`"center"` (Builder +
the `variable-width` route) but never demos `"end"` anywhere.

**Confirmed fine, not behind:** loop/infinite (correctly unbuilt — an
open headless gap, not a docs lag), explicit RTL (dedicated route +
composed into 15+ other examples + Builder toggle), per-item `snapAlign`
override (demonstrated in `variable-width`), reduced motion (inherently
OS-driven, not a Builder-control candidate, never claimed as a gap).

**Next:** three "genuinely missing" items remain (`ProgressText` resolved
above, as a free side-effect of the `progress` route) plus the two
"partially behind" ones — most likely as small combined routes rather
than one route each (e.g. autoplay/play-pause stands alone; drag status
+ overscroll naturally pair with a mouse-drag route). Pick up with
`/carousel-variant` next.

### Scroll progress example (kitchen-sink, `/carousel-variant progress`, awaiting human QA)

The example-facing follow-up to the headless "Continuous scroll-progress
signal" iteration above, built the same day. **No Figma cell for this** —
unlike the Examples-frame matrix, "progress" isn't a design-seeded
composition (same class as the Advanced backlog's Cover Flow item); it's
a code-first showcase of a differentiator, so the usual Figma-pairing
step was skipped and will only ever be a code-first feature, per the
design divergence pattern already established for other pure-code
capabilities in this log.

**Built** (`apps/kitchen-sink/src/pages/CarouselPage.tsx`, `ProgressSingle`
+ `CarouselProgress`, route `progress`): one instance wired up two
deliberately different ways, to teach the distinction:
- **Pure CSS, no JS** — each slide dims and shrinks slightly the further
  its center sits from the viewport's, via `.carousel-page__progress-slide`
  reading `var(--slide-progress, 0)` directly (it's set right on that
  element by the headless primitive, so no cascade concerns). Uses the
  *square* of the value, not `abs()`, for universal browser support —
  always non-negative, same "further from center → more faded/shrunk"
  falloff, and avoids relying on a CSS function not yet universal as of
  this session.
- **Imperative, for the parts outside the Viewport's own DOM subtree** —
  a slim progress-track bar and a live `getScrollProgress()` /
  `getSlideProgress(active)` numeric readout, both below the carousel.
  `--carousel-progress` is set on the *Viewport* element specifically, so
  it doesn't cascade sideways to a sibling — the imperative getter is
  the correct tool for exactly this case, not a workaround. Driven by a
  polling `requestAnimationFrame` loop (not a raw `scroll` listener) so
  it also picks up resize-driven recomputes, mirroring how the headless
  effect itself recomputes on both scroll and resize.
- **`<CarouselProgressText>`** in the controls row — the "N of M" part
  landed in the registry surface back in the Ark-parity work but never
  had an example page render it (see the audit above). A natural,
  free pairing here since both are "progress" themed — not a dedicated
  pass, just closing that gap as a side-effect.

**QA round 1 (human, live in the browser) — `Component must be rendered
as a child of Carousel.Root`.** The first cut placed `<CarouselProgressText>`
in the external readout block, alongside the imperative bar/numbers —
visually adjacent to the carousel but a React *sibling* of `<Carousel>`,
not a descendant. `CarouselProgressText` reads `CarouselContext`
internally (unlike the bar/numbers, which only need the imperative
`ref` — no React tree relationship required), so it threw immediately on
mount. **Fixed** by moving it inside `<CarouselControls>` (a genuine
descendant of `Carousel.Root`), which also crystallized the demo's own
teaching point more precisely: the CSS-var effects and `ProgressText`
both need to live *inside* the component tree (context or DOM
inheritance), while only the imperative getters can reach *outside* it
(the ref, not the tree, is what carries the value out). A
`margin-inline-start` on the moved part (`.carousel-page__progress-text`)
keeps it from crowding the next-trigger button.

**No registry/contract change** — `--carousel-progress`/`--slide-progress`
are unprefixed, headless-primitive-owned custom properties (not the
registry's `--primitiv-carousel-*` token namespace), so they're already
available on any Carousel instance regardless of registry version; the
example's own CSS (`CarouselPage.css`) references only existing,
confirmed-real design tokens (`--primitiv-space-space-4`,
`--primitiv-radii-full`, `--primitiv-action-primary-default`,
`--primitiv-surface-subtle`) for the track/fill, no new ones needed. No
`crates/primitiv-emit` regeneration, no drift tests, no hand-sync —
this is the registry equivalent of "headless-only, no kitchen-sink sync
needed" from the Ark-parity gaps: here it's "kitchen-sink-only, no
registry/contract change needed."

**Dev-alias confirmed active** (`apps/kitchen-sink/vite.config.ts` +
`tsconfig.app.json` `paths`, both still pointing `@primitiv-ui/react` at
`packages/react/src`) — required, since `getScrollProgress`/
`getSlideProgress` and the CSS-var writes are brand-new, unpublished
`packages/react` code; the kitchen-sink's pinned `^0.1.0` dependency
would otherwise silently lack them entirely (the exact Gotcha this
skill warns about).

**Typecheck caveat.** `apps/kitchen-sink`'s local `tsc --noEmit` hit a
pre-existing, unrelated environment issue this session (`tsconfig.app.json`'s
`baseUrl` flagged as deprecated under whatever TypeScript version is
locally installed — TS5101, a fatal config error that blocks the compiler
before it reaches any source file, confirmed via `git status` to be a
pre-existing config untouched by this change). Verified type-correctness
by hand instead (ref/type shapes match every other imperative-API usage
in `packages/react`'s own test suite exactly) — flagged for the human to
confirm with their own local build alongside the usual live-browser check.

**Gates green:** `node scripts/check-registry-types.mjs` (unaffected — no
registry/contract touch), `pnpm --filter @primitiv-ui/react exec vitest
run src/Carousel` (339 tests, unaffected — this is a kitchen-sink-only
change).

**Next:** human QA of `/carousel/progress` (check both the CSS-driven
slide effect and the imperative bar/readout scroll smoothly together),
then the remaining kitchen-sink demo-coverage gaps from the audit above
(autoplay/play-pause, overscroll, drag status, mouse-drag, snapType).

### Scroll progress added to the Builder (human-requested follow-up, awaiting QA)

Human asked to add the just-shipped signal to the Builder (`/carousel/builder`)
too, so it can be stress-tested against every other landed axis at once —
exactly the Builder's stated purpose, and a stronger fit here than most of
the Ark-parity gaps that were explicitly excluded as Builder-control
candidates (those are behavioral-only with no visual composition;
scroll-progress has a real one).

**Added to `BuilderConfig`:** `showProgress: boolean` (default `false`) —
Builder-only, like `content` (`SlideContent`), not a real `Carousel` prop,
so it's deliberately **not** echoed in `describe()`'s JSX output (mirroring
how `content` is already excluded there) — it does appear in the `state.json`
panel since that block spreads the whole config. A `CheckField` in the
Layout section, next to `allowMouseDrag`.

**`LiveCarousel` changes:** a `carouselRef` + the same
`getScrollProgress()`/`getSlideProgress()` polling `requestAnimationFrame`
loop as the dedicated `progress` route, gated on `config.showProgress` (the
effect early-returns when off, so the common case costs nothing extra).
When on: every slide gets `.carousel-builder__slide--progress` (the same
fade/scale-by-`--slide-progress` treatment, duplicated into
`CarouselBuilder.css` under this file's own naming rather than reusing
`CarouselPage.css`'s classes — each page's CSS stays self-contained, per
the workbench-examples convention), `<CarouselProgressText>` rides inside
whichever controls composition is active (`joined` bar or the `split`
fragment) since it's a genuine `Carousel.Root` descendant, and the same
imperative progress-track bar + live numeric readout renders below the
stage.

**No registry/contract change** — same reasoning as the dedicated route:
the CSS vars are headless-owned, already available on any Carousel
instance.

**Typecheck caveat carried over** from the dedicated-route entry above —
`apps/kitchen-sink`'s local `tsc` still hits the same pre-existing,
unrelated `tsconfig.app.json` `baseUrl`/TS5101 issue, so this was verified
by hand (identical ref/type shapes to the already-browser-confirmed
`progress` route) plus a structural brace/paren/`CheckField`-count balance
check, not a real compile.

**Gates green:** `node scripts/check-registry-types.mjs` (unaffected — no
registry/contract touch).

**Next:** human QA — toggle "Show scroll progress" on in the Builder and
confirm it composes cleanly with orientation, multi-slide, RTL, thumbnails,
overlay, and fade (the whole point of adding it here).

### Slideshow (parallax) — registry `effect` modifier + `<CarouselSlideContent>` (kitchen-sink `/carousel-variant slideshow`, awaiting human QA)

The next Advanced-backlog item off the list above, replicating Blossom
Carousel's own Slideshow example: a pure native CSS scroll-driven animation
(`view-timeline` + `animation-timeline` + `animation-range`), zero
JavaScript — genuinely different from the JS-computed `--carousel-progress`/
`--slide-progress` signal that had just landed, though the two turned out to
compose (see the fallback below). **No Figma cell** — same class as
Cover Flow/"progress" (code-first, Advanced backlog), so the usual
Figma-pairing step was skipped.

**Two design forks put to the human ahead of implementation, both
resolved:**

- **Registry surface, not kitchen-sink-only** (unlike "progress", which
  stayed kitchen-sink-only because its signal is headless-JS-owned with no
  CSS surface of its own). This technique is *pure CSS with no headless
  dependency at all* — the same shape as every other landed axis that
  **did** get a registry home (`transition="fade"`, the `indicators`
  modifier, `placement`, `peek`, `padding`, `slideWidth`) — so it landed as
  real registry capability: a new **`effect`** root modifier (`none`
  default · `parallax`) in `contract.json` + `styles.css`, plus a new
  **`<CarouselSlideContent>`** presentational subcomponent (mirrors
  `<CarouselControls>` from iteration 6 — a subcomponent with no
  `component` field, so the generator emits its own bare styled `<div>`
  with no headless backing) — the layer the animation actually targets,
  distinct from `<CarouselSlide>` itself which owns the clipping
  (`overflow: hidden`, already in place).
- **Also add a `--slide-progress`-driven fallback for browsers without
  `animation-timeline: view()` support**, rather than degrading to plain
  static slides there. Current support (checked live): ~82–85% global,
  Chrome/Edge/Safari ship it, **Firefox stable is still flag-gated** as of
  writing (an Interop 2026 priority; on by default in Nightly). This turned
  out to need **no new JavaScript at all**: `--slide-progress` is already
  written continuously on every Slide by the "Continuous scroll-progress
  signal" work (unconditionally, independent of any CSS technique reading
  it), so the fallback is a second, plain CSS rule under
  `@supports not (animation-timeline: view())` reading that existing
  variable with the same `--primitiv-carousel-parallax-amount` knob and
  direction — visually equivalent to the view-timeline path, zero JS of the
  registry's own either way.

**Built (registry).** `registry/components/carousel/contract.json` gained
the `slide-content` subcomponent (`.primitiv-carousel__slide-content`) and
the `effect` modifier group; `styles.css`/`.scss` (kept byte-identical
per convention) gained: a base `__slide-content` rule (fills the slide
exactly, 100% × 100%, with the same media object-fit/position treatment as
a direct slide child); the `@supports (animation-timeline: view())` block
(`view-timeline-name`/`-axis` on the slide, following the scroll axis like
`peek`/`gap` — `inline` horizontal, `block` vertical — plus the
`animation`/`animation-timeline`/`animation-range: cover` on
`slide-content`, with an orientation override swapping the keyframes name);
the `@supports not (...)` fallback block (the `--slide-progress` read); the
two `@keyframes` (inline and block variants — a named-timeline reference
can't be conditionally selected by a CSS selector, so the swap is via
`animation-name` under `[data-orientation="vertical"]`, not a single
shared keyframe); a `prefers-reduced-motion: reduce` override cancelling
both branches (`animation: none; transform: none;`), a system-wide pattern
already used by Modal/Accordion, newly applied here since parallax is
scroll-linked decorative motion, unlike this component's otherwise
un-reduced-motion-gated fade transition; and a new
**`--primitiv-carousel-parallax-amount`** knob (`50%`, matching Blossom's
own `±50%` keyframe exactly) — not tokenized (no design-token family fits
"how far a technique's own geometry drifts relative to its box", the same
class of exception as the motion-literal rule documents).

**No local Rust access this session** (per the sandbox-gotchas skill —
cargo/wasm-pack don't run here at all) — `carousel.recipe.ts`/`carousel.tsx`
were hand-edited to the *exact* byte shape `emit_recipe`/`emit_wrapper`
would produce (verified line-by-line against `recipe.rs`/`wrapper.rs`'s
actual formatting logic — the `subcomponent_binding`/`subcomponent_pascal`
naming, the `emit_structural_root` destructure/call order for the
style-prop root, the presentational-subcomponent shape already proven by
`<CarouselControls>`); `styles.scss`'s CSS body confirmed byte-identical to
`styles.css` via `diff`, and the new `$primitiv-carousel-parallax-amount`
alias appended matching `emit_component_scss`'s first-occurrence-order
scan. The Rust drift-guard tests
(`crates/primitiv-emit/src/{recipe,wrapper,scss}_tests.rs`) are relied on
via CI to confirm this, per the standing sandbox limitation — flagged
rather than claimed as locally verified.

**Built (kitchen-sink).** `CarouselPage.tsx` (`SlideshowSingle` +
`CarouselSlideshow`, route `slideshow`): a 4-cell numbered grid — default
horizontal, vertical (proving the timeline axis follows orientation),
RTL (proving the named timeline is direction-agnostic), and composing with
`peek`. `CarouselLayout.tsx` gained the sidebar entry; `Shell.tsx` the
route. Hand-synced the registry surface into
`apps/kitchen-sink/src/components/` + `src/styles/primitiv/carousel/`
exactly as `add` would install it.

**QA round 1 (human, live in the browser) — no visible difference while
scrolling.** Root cause: the first cut painted the slide's gradient
directly on `<CarouselSlideContent>` (the layer that translates) with
nothing behind it on `<CarouselSlide>` itself. Since `<CarouselSlideContent>`
is sized exactly 100% × 100% of the slide (no oversize) and a CSS
`transform` doesn't reflow layout, translating it by up to
±`--primitiv-carousel-parallax-amount` moves its *painted* position past
the slide's own edge on one side while uncovering the opposite side — and
because the slide's own background was left `transparent`, that uncovered
region revealed whatever sat behind the whole carousel (the page
background), not a visible drift of the gradient itself. This is a
real, generalizable gotcha for the technique (not scoped to the demo):
**a full-bleed layer with no backdrop behind it will reveal a gap at the
extremes unless it's deliberately oversized before translating.** **Fixed**
by re-layering both the kitchen-sink example and the Builder's parallax
composition: the gradient/photo backdrop moved to `<CarouselSlide>` itself
(static, never transformed), with only a small, high-contrast foreground
marker (a numeral) left inside `<CarouselSlideContent>` — since the content
layer is otherwise transparent, the region a translate reveals just shows
the identical, unmoving backdrop underneath, and the marker's visible
shift across the slide is the parallax cue. Documented as a "layering
gotcha" in the registry README's new `effect` bullet and in
`SlideshowSingle`'s own JSDoc, so a consumer composing a real photo
doesn't rediscover it blind — the honest fix for full-bleed photographic
content is to give it its own backdrop (a blurred/darkened copy behind, or
oversize the content layer and recalibrate the translate amount against
its enlarged box) rather than assuming `<CarouselSlideContent>` alone is
safe to fill edge-to-edge at the default 50% amount.

**Builder wiring (human-requested, same session).** Added `effect: Effect`
("none"/"parallax") to `BuilderConfig` (default `"none"`), forwarded as a
real `Carousel` prop (unlike `showProgress`/`content`, which are
Builder-only and excluded from `describe()`) — echoed in both
`describe()`'s JSX output and the `state.json` panel, and given a
`RadioField` in the existing "Transition" accordion section (alongside
`transition`, the other scroll/animation-adjacent axis) rather than a new
section. `LiveCarousel`'s slide rendering branches on `config.effect`:
the gradient/photo backdrop stays exactly where it already was (on
`<CarouselSlide>`), and only when `effect="parallax"` does the existing
per-branch content (a numeral marker for the gradient case, the real
`<img>` for the `content="pictures"`/`slideWidth="content"` cases) move
inside a `<CarouselSlideContent>` wrapper — the default (`effect="none"`)
path is byte-for-byte unchanged from before this session. **Known,
accepted limitation, not fixed this round:** composing
`effect="parallax"` with `content="pictures"` puts a real, opaque photo
directly in `<CarouselSlideContent>` with no matching backdrop behind it
(the Slide has no background set in that branch), so it can reveal a gap
at the extremes exactly per the gotcha above — left as-is since the
Builder is a stress-test sandbox whose job is to surface exactly this kind
of composition edge case, not to guarantee every combination looks
polished.

**Registry README updated** — a new `effect` bullet (the mechanism, the
`@supports` gate, the fallback, and the layering gotcha in full) in the
Modifiers section, plus the subcomponent list and scope callout at the top
of the file both gained `<CarouselSlideContent>`.

**Gates:** `node scripts/check-registry-types.mjs` green (wrapper
type-checks against the published `@primitiv-ui/react` — unaffected by this
change anyway, since no headless prop changed). `cargo test -p
primitiv-emit -p primitiv-cli` **relies on CI** this session (no local Rust
access) — flagged above with the exact verification method used in place
of a real run. `apps/kitchen-sink`'s local `tsc --noEmit` still hits the
same pre-existing, unrelated `tsconfig.app.json` TS5101 `baseUrl` error
documented in the "progress" iteration — verified types by hand (brace/paren
balance checked programmatically; JSX attribute shapes cross-checked
against existing patterns in the same files) rather than a real compile.

**Next:** human re-QA of `/carousel/slideshow` after the backdrop/foreground
re-layering fix (confirm the numeral visibly drifts during scroll in all
four cells, and that the Builder's "effect" toggle composes cleanly with
the other axes), then Figma lockstep is not applicable (code-only,
design-divergent feature, same as "progress"). The remaining Advanced
backlog (Stories, Smart Stack, Cards, Flipbook, Timeline) stays open.

**QA round 2 (human, live in the browser) — settings + a real RTL bug.**
Two asks: (a) flatten every cell — `radius="none"` on the root
(container) and each `<CarouselSlide>`, and `gap="none"`, so the effect is
judged on its own rather than competing visually with rounded corners/gaps.
**Fixed** — added to `SlideshowSingle` uniformly (all four cells; the
Builder's own defaults are untouched, out of scope for this ask). (b) The
RTL cell's drifting number wasn't merely off-centre — a screenshot showed
it clipped hard against one edge, roughly a full `--primitiv-carousel-
parallax-amount` off from centre, meaning the *resting* (centred) slide's
view-timeline progress wasn't landing anywhere near 50% under RTL. A first
attempt (switching the marker's centering from grid `place-items` to
flexbox) had no effect, confirming this was never a plain centering bug.

**Root cause, confirmed live in-browser.** `view-timeline-axis` was set to
the **logical** `inline` keyword (matching Blossom's own source and this
component's general axis-follows-orientation convention for `peek`/`gap`/
etc.). But `inline` is direction-relative — which physical edge counts as
its "start" flips under RTL — while this carousel's own scroll container
is deliberately **physical** (`overflow-x`, `scroll-snap-type: x`, not a
logical equivalent; the RTL handling `getScrollProgress()` and the
mouse-drag delta already rely on this exact distinction, documented in
their own sections). Naming the timeline off the logical axis mismatched
the element's actual physical scroll position under RTL, so the browser's
computed cover-range progress for the centred slide landed near an extreme
instead of 50%. **Fixed** by switching to the CSS spec's **physical** `x`/
`y` axis keywords (`view-timeline-axis: x` horizontal, `: y` vertical via
the existing `[data-orientation="vertical"]` override — that override
stays, since the axis genuinely changes; RTL needed no override at all
once on the physical keyword). This retracts the effect's own earlier
"the named view-timeline is direction-agnostic, no special-casing needed"
claim (README + the RTL cell's own note) — corrected in both, plus the
Vertical cell's note (was worded around `block`/`inline`, now `y`/`x`).
Registry `styles.css`/`.scss` (kept byte-identical) + the kitchen-sink
hand-sync updated; no `contract.json` change (the fix is inside the
existing `effect` modifier's rule body, not a new knob/option).

**Gates:** `node scripts/check-registry-types.mjs` green (unaffected — no
contract/wrapper change). No headless change. Rust drift tests untouched
(no `contract.json` edit this round).

**Next:** human re-QA of `/carousel/slideshow` cell 3 (RTL) — confirm the
marker now rests centred and drifts symmetrically during scroll, matching
cells 1/2/4 — plus a general re-check of the flattened (no radius/gap)
look across all four cells.

**QA round 3 (human) — round-2 RTL fix was wrong; the physical axis didn't
fix it either.** The human reported RTL "half worked — some numbers centred,
some not." Reproduced the *real* behaviour in a headless Chromium (a
standalone repro of the exact viewport/slide/slide-content markup driven by
Playwright, since the kitchen-sink can't build in the sandbox — the browser
binary is the pre-installed `chromium_headless_shell-1194`, pointed at via
`executablePath`; the bundled Playwright's own download is stale): with
`view-timeline-axis: x` (round 2's "fix"), **LTR centres every slide, but RTL
centres none** — the visible slide's content sits at −50% for the first half
of the track and +50% for the second half, never 0%. So round 2's claim
("physical `x` fixes RTL, confirmed in-browser") was **false** — `x` is no
better than `inline` here.

**Real root cause (browser bug, not our axis choice).** Chromium resolves a
**horizontal** view-timeline's `cover` progress against the wrong scroll
bounds in an RTL scroller — the resting/centred slide lands at 0%/100%
progress instead of 50%, so its content is stuck jammed against an edge. This
is independent of the axis keyword (`x` and logical `inline` both fail); the
bug is the cover-range resolution under RTL. Vertical (`y`) is unaffected —
block scrolling doesn't flip under RTL. All verified numerically in the repro
(anti-diagonal 0% pattern = each slide's timeline resolving from the opposite
side).

**Fix — horizontal RTL abandons the native timeline and reuses the JS
`--slide-progress` fallback.** Inside `@supports (animation-timeline: view())`,
a horizontal-scoped RTL override
(`.primitiv-carousel--effect-parallax:not([data-orientation="vertical"])
.primitiv-carousel__slide-content:dir(rtl)`) sets `animation: none` and drives
the same `translateX(calc(var(--slide-progress,0) * amount))` the
`@supports not` (Firefox) branch already uses. `--slide-progress` is written
continuously by the primitive from **physical** `getBoundingClientRect`
geometry (`(slideCenter − viewportCenter) / halfWidth`), so it's 0 exactly
when the slide is centred — RTL-correct by construction, no headless change.
LTR keeps the pure-native timeline; vertical RTL keeps its native `y` timeline
(the `:not([data-orientation="vertical"])` scope). The
`prefers-reduced-motion` cancel gained a **twin selector** at the same
`:not()`+`:dir()` specificity so it still beats the RTL override (source order
alone wouldn't — the override out-specifies the plain cancel). **Verified
live in the repro:** LTR / RTL-horizontal / RTL-vertical all rest at 0%
(centred), and under emulated `prefers-reduced-motion: reduce` the RTL
transform resolves to `none` even mid-scroll.

Registry `styles.css` + `styles.scss` (kept byte-identical, confirmed by
`diff` and the `scss_tests` drift guard) + the kitchen-sink hand-sync all
updated; the round-2 "physical axis fixes RTL" prose was corrected in the
stylesheet comment, the component README's `effect` RTL note, and the RTL
cell's own note. No `contract.json` change (the fix is inside the existing
`effect` modifier's rule body).

**Gates green (run locally — cargo *is* available this session, unlike the
round-2 session):** `cargo test -p primitiv-emit` (364 + 106, incl.
`the_committed_carousel_scss_is_the_derived_form_of_its_css`) +
`-p primitiv-cli` (20), `node scripts/check-registry-types.mjs`. No headless
change, so no Carousel vitest.

**Next:** human re-QA of `/carousel/slideshow` cell 3 (RTL) once more —
confirm every number rests centred and drifts symmetrically like cells 1/2/4,
in a real RTL browser.

## Kitchen-sink deploy white-page — duplicate React (`resolve.dedupe`)

The `/primitiv/kitchen-sink/` route built and deployed cleanly but rendered a
**blank page** (empty `#root`) on device. Reproduced headlessly against the
production `vite build` output (loaded the `dist` in Chromium): a single
`PAGEERROR: Cannot read properties of null (reading 'useContext')` and
`#root.innerHTML.length === 0` — the classic **two-React-copies null
dispatcher**.

**Root cause.** The kitchen-sink is excluded from the pnpm workspace
(`'!apps/kitchen-sink'`) so it installs standalone with `--ignore-workspace`
and owns its `node_modules/react`. But its Vite alias points
`@primitiv-ui/react` at the workspace **source** (`packages/react/src`), which
lives *outside* this install; that source's `import "react"` resolves *upward*
to a **second** React copy — `packages/react/node_modules/react` in a dev tree,
the root-workspace copy in the deploy job. Two React instances don't share a
hook dispatcher, so the first hook the headless tree renders throws
`useContext` of null and the whole app unmounts to blank. The workbench never
hit this: it's *inside* the workspace, so pnpm gives it one deduped React.

**Fix.** `resolve.dedupe: ['react', 'react-dom']` in
`apps/kitchen-sink/vite.config.ts` — collapses every `react` / `react-dom`
request (including the aliased source's) onto the app's single copy. After the
change the headless probe renders (`#root` 31 KB, heading "Heading 1 - Primitiv
Kitchen Sink", no page error) and the JS bundle shrinks ~9 KB as the duplicate
React drops out. Base/router/asset paths were never the problem — orthogonal to
this fix.

**Verified** by building `KITCHEN_SINK_BASE=/ vite build` and loading the
output in headless Chromium before/after: blank + `useContext`-null → mounted,
no error. Deploy workflow rebuilds the kitchen-sink from source, so a re-run
picks the fix up.

## Kitchen-sink responsive shell — foldable examples sidebar

On a phone the `/carousel` layout's fixed **14rem** examples column swallowed
the demos. Folded it into a slide-in **drawer** behind a toggle, mirroring the
workbench sidebar (`CarouselLayout.tsx` + `.css`, tokenised — `--primitiv-scrim`
backdrop, `surface-raised` drawer). Desktop is byte-for-byte unchanged (the bar
+ backdrop are `display:none`, sidebar stays the in-flow sticky column); below
**48rem** the body goes single-column, the sidebar becomes `position:fixed`
`translateX(-100%)` and slides in on the toggle, with a scrim backdrop and
close-on-route-change (so tapping an example dismisses the drawer). The example
grid already collapsed 4→2→1 col, so mobile now gets the full width. Verified in
headless Chromium at 390px (folded → 390px main; open → drawer at x0 + backdrop;
link tap → route changes and drawer closes) and 1200px (bar hidden, 14rem
sidebar in-flow, main to its right) — no page errors.

## Infinite wrap: buttons inert at the ends on iOS — hold snap through the glide

On-device QA (iOS) of cell 7 (`loop="infinite"`, single-slide): **swipe** wrap
works both ways at normal speed, but the **prev/next buttons** wouldn't navigate
past the last slide / before the first. Reproduced in **neither** Chromium
desktop nor Chromium mobile-emulation (both Blink drive the wrap 0→1→2→3→**0**
perfectly), so it's **iOS WebKit-specific**.

**Root cause.** A button wrap is *teleport-then-glide*: an instant `scrollLeft`
jump one period into the clone buffer, then a smooth glide onto the real target.
The teleport suppressed `scroll-snap-type` and **restored it immediately**, before
the glide. iOS Safari re-snaps to the *nearest* snap point the instant a
`mandatory` snap-type is restored — and right after the teleport that nearest
point is a **clone**, so the restore yanked the viewport onto the clone and
stranded the wrap (buttons look inert). This is exactly why a **swipe** wrap
already worked: its recentre lands on a *real* slide, so restoring snap is a
no-op. The button path lands mid-buffer, so it isn't.

**Fix** (`useCarouselViewport.ts`). Keep `scroll-snap-type` suppressed across the
whole glide and restore it only once the scroll settles (reusing the existing
`scrollend` + 600 ms fallback that already clears the programmatic-scroll flag).
Because the suppressed glide fires no `scrollsnapchange`, also point
`lastSnapTargetRef` at the real target so the recentre effect's scrollend handler
sees a real slide and stands down. Desktop/Blink is unaffected — the glide lands
on the real snap point, so the deferred restore is a no-op (re-verified in
Chromium: 0→1→2→3→0→1→2→3, unchanged). TDD: new glide test asserts snap stays
`none` through the glide and is restored on `scrollend`.

**Bug 1 (fast-fling stops at the last slide, resumes after a pause) — buffer
deepened.** The clone buffer was one period each side and the recentre only fires
on `scrollend`; a hard iOS momentum fling exhausts the buffer before `scrollend`
lands, so it stops dead at the physical end until the fling settles and the
teleport catches up. This is the fundamental scroll-momentum limit we flagged up
front (Blossom's documented caveat) — of the options (larger buffer / early
`scroll`-driven recentre that risks cancelling iOS momentum / non-scroll
JS-driven track) we chose the **larger buffer** as the low-risk first mitigation.

`BUFFER_PERIODS` (Carousel.tsx) now renders **2** full-period copies each side
instead of 1, doubling the fling runway before the physical end. It's a single
tunable constant — bump it if device QA shows fast flings still stall. Only the
teleport's period measurement assumed one period: it now takes the **nearest
trailing** clone of index 0 (`compareDocumentPosition` → first clone-of-0
following the real slides) rather than the last, so one wrap still glides exactly
one step regardless of depth. Initial-position and recentre are geometry-driven
and depth-agnostic (no change). TDD across the clone-count, glide and recentre
suites (all rewritten to resolve slide roles by DOM position, not fixed index);
Carousel.tsx + useCarouselViewport.ts stay at 100%. Re-verified in Chromium:
wrap still cycles 0→1→2→3→0 and glides a single step. Mitigation, not a cure —
a truly relentless flick can still out-run 2 periods; revisit depth or a
non-scroll approach if QA demands it.

## Playwright harness for the infinite loop (real-layout regression net)

The jsdom unit tests mock *all* geometry ("verified for feel on a real device"),
so the clone-buffer / teleport / recentre paths had no automated real-browser
coverage. Stood up a Playwright PoC against the kitchen-sink loop page:
`apps/kitchen-sink/playwright.config.ts` + `e2e/carousel-infinite.spec.ts`, run
via `pnpm test:e2e:kitchen-sink` (root Playwright; the kitchen-sink is
workspace-excluded). The webServer boots the kitchen-sink's own vite (base "/" →
BrowserRouter, so `/carousel/loop` is a real deep link).

Four specs on cell 7 (single-slide infinite, 4 slides) assert what jsdom can't —
using real scroll-snap geometry, the viewport **settles on a real slide, never a
clone**: initial position, Next-wrap onto real first, Prev-wrap onto real last,
and two full laps landing real at every step. All green in Chromium.

**Sandbox gotchas handled.** Pinned `@playwright/test` 1.46 wants Chromium build
1129 but the sandbox ships 1194 (and Playwright's browser CDN is egress-blocked,
so `playwright install` can't fetch the pinned one) — point `executablePath` at
the pre-installed **headless-shell** binary (1.46 launches `--headless=old`,
which full Chromium 1194 removed; headless-shell is the standalone old-headless
impl). **WebKit** — iOS Safari's engine core, the one engine with a real chance
of surfacing the iOS-only snap quirks — is **not installable here** (same egress
block). The config registers `webkit` / `mobile-safari` projects **conditionally**
(only when the browser is present or under CI), so a bare run passes on Chromium
alone here while those projects light up on a dev machine (`npx playwright install
webkit`) or in CI, where the download is allowed.

**Boundary (unchanged):** no Playwright engine simulates touch **momentum/
inertia**, so the fast-fling overshoot (bug 1) is still not reproducible in any
engine — real-device only.

**Real-iPhone QA: buttons still rewind; Playwright can't catch it.** The CI
WebKit run passed but a real iPhone *still rewinds* on the wrap buttons —
demonstrating the hard ceiling: Playwright's `webkit` is desktop Linux WebKitGTK,
not iOS Safari (different scroll-snap/programmatic-scroll impl), and no engine
simulates touch momentum. So the WebKit pass is necessary-not-sufficient; the
button rewind and fast-flick jank are iOS-Safari-only and can't be automated here
(real-device cloud, e.g. BrowserStack, would be the only automation that reflects
iPhone). Attempted a **blind iOS fix** for the button rewind:
`useCarouselViewport.ts` now forces a layout flush (`void offsetWidth`) after
setting `scroll-snap-type: none` and before the teleport write — the implicit
read inside `scrollLeft +=` doesn't reliably apply the reset on iOS, so it
re-snaps the teleport back and the smooth glide runs the whole track (the
rewind). Desktop + Playwright Chromium/WebKit unaffected (verified). This is an
iOS-runtime fix invisible to the test env, pending on-device QA. The fast-flick
jank is untouched — that's the native-scroll-snap momentum limit, only a
JS-transform infinite (Embla/Swiper approach) removes it.

**First CI run pinned an old browser.** `@playwright/test` 1.46 pins Chromium
build **1129** (~mid-2024), which *strands the wrap on a clone* — the wrap specs
timed out on it in CI while **WebKit + mobile-safari passed** (the iOS-engine
signal is positive) and local Chromium 1194 passed. Rather than chase a stale
build no user ships, the kitchen-sink's `@playwright/test` is bumped to **1.61.1**
so CI runs a modern Chromium + WebKit (matching reality and the already-green
iOS engines). The settle assertions also now **poll** (`expect().toPass()`)
instead of sleeping a fixed duration, so they're robust to engine/CI-speed
differences.

**CI job landed — `.github/workflows/e2e-carousel.yml`.** Since WebKit can't be
downloaded in the dev sandbox, the iOS-engine signal comes from CI (GitHub
runners allow the download). The job installs the kitchen-sink standalone (no
wasm/workspace build needed for the headless Carousel), `playwright install
--with-deps webkit chromium`, and runs the suite; `CI=true` registers the
`webkit` / `mobile-safari` projects, so the specs run on iOS Safari's engine core
and Chromium, uploading the HTML report as an artifact. To make the job
self-contained, `@playwright/test` is now a kitchen-sink devDep and
`pnpm test:e2e` / `pnpm test:e2e:kitchen-sink` run it. Triggers: manual dispatch +
PRs touching `Carousel/**` or `apps/kitchen-sink/**`. Next: widen the specs to the
other loop cells (multi-slide, vertical, RTL, peek, autoplay-across-seam).

## RFC 0018 landed (button/keyboard/programmatic): infinite on a JS transform engine

Native scroll-snap + clone buffer couldn't loop reliably on iOS (button rewind,
fast-flick stall, un-reproducible in Playwright WebKit). Reimplemented
`loop="infinite"` on a **JS transform track** (`none`/`wrap` untouched):

- **Pure engine core** (`loopEngine.ts`, 100%): `shortestStep` (wrap the short
  way — the iPhone bug as a pure fn), `snapTarget`/`flingTarget`,
  `normalizeOffset`, `easeOut`/`tweenValue`, `wrapShift` (the clone-free seam fill).
- **Engine hook** (`useCarouselLoop.ts`): the viewport clips a translated
  `[data-carousel-track]`; each slide gets a `wrapShift` so copies fill the seam.
  A `currentPage` change glides the short way via an eased rAF tween; first
  position instant; reduced-motion instant. Unit-tested with mocked geometry +
  rAF (jsdom lays nothing out).
- **Removed** the scroll-snap infinite machinery: clone buffer (`BUFFER_PERIODS`,
  `makeClones`, `CarouselCloneContext`, the `Slide` clone branch), the
  teleport-then-glide, the `scrollend` recentre, `wrapDirectionRef`, and the
  clone→real snapchange map. `useCarouselViewport`'s scroll effects gate off for
  infinite. Deleted the three infinite scroll-snap test files.
- **Registry CSS** (`styles.css` + `.scss` mirror, drift-guarded; kitchen-sink
  synced): `[data-loop="infinite"]` viewport → `overflow:hidden` + snap none;
  `.primitiv-carousel__track` is the flex row (column when vertical).

**Verified:** 387 Carousel unit tests, all Carousel files 100% (lines/branches/
functions/statements); `tsc` clean; carousel scss drift guard green; the
Playwright infinite specs pass **in real Chromium** against the rebuilt
kitchen-sink (wrap settles on a real slide both ways, two full laps, no clones).

**Still to come:** drag + fling momentum (the touch feel), then multi-slide /
peek / RTL polish under the engine. Button / keyboard / indicator / autoplay
navigation is complete and deployable for iPhone QA.

---

## 2026-07-16 — Infinite engine: iOS flash fix + drag/fling + RTL / peek / multi-slide

Follow-on to the transform-engine rebuild, from real-iPhone QA feedback.

- **iOS entering-slide flash (fixed).** The engine had been promoting *every*
  slide to its own compositor layer (per-slide `translate3d` + `backface-visibility`).
  iOS Safari won't rasterise a layer outside the viewport clip until the first
  frame it scrolls in — so the incoming slide was a white tile for one frame.
  Now slides paint into the **track's single layer**: interior slides carry no
  transform; only the seam copy is shifted, with a **2D** translate so it stays
  in the track bitmap. (The per-slide layering had been added while chasing the
  *earlier* flash, which was really the inter-slide gap — it never helped this one.)
- **Touch drag + fling momentum.** Pointer-follows-track 1:1 (transition off),
  velocity-projected fling snaps to the nearest slide on release and syncs the
  page. Touch always on; mouse gated by `allowMouseDrag`; sub-threshold press is
  a tap. `flingTarget` reused from the pure engine.
- **RTL.** The engine read a negative stride and bailed (`stride <= 0`), so RTL
  infinite sat dead. Now it reads the stride **sign as an axis `dir`** and mirrors
  the track translate, seam shift and drag delta.
- **Peek.** The track's own inset inside the peek/viewport padding was ignored,
  double-counting the peek and shoving the active slide off-centre. Now `measure()`
  captures the first slide's `base` inset (viewport positioned so `offsetLeft` is
  relative to it) and `paint()` subtracts it.
- **Multi-slide.** The glide effect drove off `currentPage` (a page index) as if
  it were a slide index — so 2-up advanced one slide, not a page. Now it targets
  `currentPageOffset` (the page's leading slide index). The inter-slide gap returns
  for multi-slide via a `data-slides-per-page` track hook; one-up stays gapless.

**Verified:** 396 Carousel unit tests; `useCarouselLoop.ts` + `loopEngine.ts` +
`Carousel.tsx` 100% (lines/branches/functions/statements); carousel scss drift
guard green; `tsc` clean.

**Still to come:** real-iOS-Safari QA of all six behaviours (the sandbox can't
drive it); fling could snap to page boundaries for multi-slide (currently snaps
to the nearest slide, then the page effect re-aligns).
