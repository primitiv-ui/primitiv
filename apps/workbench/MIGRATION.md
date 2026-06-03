# Workbench SCSS → modern CSS migration

Tracking doc for removing SCSS from `apps/workbench` and refactoring to
modern CSS (custom properties, native nesting, `calc()`). Update the
checklists as files land.

## Status at a glance

- [x] Phase 0 — approach decided (**Option A**, below)
- [ ] Phase 1 — Carousel cluster (shared partial + 12 examples)
- [ ] Phase 2 — Standalone example stylesheets (~38 files)
- [ ] Phase 3 — App shell + teardown (`App.scss`, remove `sass` dep)

## Scope (snapshot when this doc was written)

- **52** `.scss` files total.
- Only `_carouselShared.scss` defines `@mixin`s; all 12 carousel example
  partials `@use`/`@include` it. Every other example stylesheet is
  standalone (no `@use`/`@mixin`).
- **No** SCSS control-flow anywhere (`@if`/`@each`/`@for`/`@function`) —
  conversions are purely mechanical.
- `sass` is a `devDependency` in `apps/workbench/package.json`, to be
  removed at the end.

## Proven transforms (from the Cover Flow POC)

`coverFlow.css` is the reference conversion. The mechanical rules:

1. `$variable` → CSS custom property (`--cx-*` for shared tokens; a local
   `--x` otherwise).
2. `@use` + `@include mixin` → a shared utility class (see Option A).
3. `&__bem` concatenation → **flat BEM selectors**. Keep native `&`
   nesting only for states/pseudos/at-rules (`&:hover`,
   `&[data-state="…"]`, `@supports`, `@media`).
4. SCSS math (`#{$ratio}`, `$x / 2`) → `calc(...)` (e.g. `calc(1120 / 959)`).

**Verify each file**: `tsc -b` + `vite build` (CSS bundles, no errors) +
an eyeball of the example tab. Computed styles should be unchanged.

## Phase 0 — Approach: **Option A (chosen)**

A single shared `carouselShared.css` replaces `_carouselShared.scss`:

- **Tokens** as `--cx-*` custom properties, declared once on the
  `.carousel-example` wrapper so the whole subtree inherits them
  (`--cx-accent`, `--cx-ink`, `--cx-muted`, `--cx-border`, `--cx-surface`,
  `--cx-track`, `--cx-radius-card`, `--cx-shadow-card`).
- **Mixins** become shared utility classes prefixed `cx-`
  (`.cx-frame`, `.cx-viewport-track`, `.cx-slide-surface`, `.cx-image`,
  `.cx-controls`, `.cx-trigger`, `.cx-indicators`). Examples opt in by
  adding the class in JSX alongside their BEM class, e.g.
  `className="peek__trigger cx-trigger"`.

Rationale: DRY (no skin duplication across 12 files) and idiomatic CSS.
Trade-off: it adds one utility class per styled element in each example's
JSX. `coverFlow.css` currently *inlines* tokens + skins (POC style) and
is retrofitted onto the shared file in Phase 1.

> When the standalone examples are tackled (Phase 2), consider promoting
> `--cx-*` to a single workbench-wide `tokens.css` on `:root` so those
> files reference shared tokens instead of re-hardcoding hexes. Decide
> before starting Phase 2.

## Phase 1 — Carousel cluster

- [ ] Author `carouselShared.css` (tokens on `.carousel-example` +
      `cx-*` skin classes).
- [ ] SingleSlideScroll
- [ ] SingleSlideCrossfade
- [ ] MultiSlideScroll
- [ ] MultiSlideCrossfade
- [ ] MultiStepSlideScroll
- [ ] MultiStepSlideCrossfade
- [ ] Peek
- [ ] VariableSizes
- [ ] Programmatic
- [ ] AutoPlay
- [ ] Thumbnails
- [ ] Retrofit `coverFlow.css` onto the shared file
- [ ] Delete `_carouselShared.scss`
- [ ] Convert `CarouselExample.scss` (the tabs shell)

(One commit per file.)

## Phase 2 — Standalone examples (~38 files)

Mechanical, no shared deps. One commit per file or small batches.

**Cross-dependency to respect:** the Cover Flow playground reuses
SliderExample's `.sl-root` / `.sl-track` / `.sl-range` / `.sl-thumb`
classes. When `SliderExample.scss` converts, those names must stay
globally available. (All example CSS is bundled globally and every page
is eagerly imported in `App.tsx`, so this holds — but verify the Cover
Flow sliders still render after converting SliderExample.)

## Phase 3 — App shell + teardown

- [ ] Convert `App.scss` → `App.css`.
- [ ] Confirm zero `.scss` remain: `find apps/workbench/src -name '*.scss'`.
- [ ] Remove `"sass"` from `apps/workbench/package.json`; `pnpm install`.
- [ ] Final `vite build`.

## Conventions / gotchas

- **Global CSS bundling.** Every selector must stay scoped to its
  example block (a stray bare/element selector leaks to every page) —
  same rule as the SCSS era.
- **lightningcss + nesting.** lightningcss *preserves* native nesting in
  the output for `.css` files (the SCSS ones arrived pre-flattened).
  Fine for the modern browsers these examples target. If we ever need to
  support older engines, set an explicit lightningcss build target so
  nesting is flattened — apply consistently.
- **`calc()` types.** `length / number` and `length / length` need
  modern engines (already required by the scroll-driven examples).
- **No visual regression tests** exist for the workbench — every
  conversion needs a manual eyeball check.
