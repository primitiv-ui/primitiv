# RFC 0010 — OKLCH colour picker

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-21
> **Seeds from:** the 2026-06-21 picker-planning discussion (this session).
> **Relates to:** RFC 0002 (Harmoni → Intent → Plugin) — replaces the plugin's
> hex input as the *first-choice* brand-colour entry; RFC 0003 (Dynamic
> foreground wiring) — the picker feeds the same engine path. Skills:
> `rust-wasm-workflow` (the harmoni-core ↔ harmoni-wasm boundary),
> `harmoni-architecture-history` (`ColorInput`, the canonical OkLCH form),
> `workbench-examples` (the build-first surface).
> **Prior art:** Evil Martians' [oklch.com](https://oklch.com)
> (`evilmartians/oklch-picker`, **MIT**) — the *interaction model* is adapted,
> not the code (§8).

---

## 0. Summary

Harmoni is OKLCH-first end to end — the engine's canonical colour form is
OkLCH (`harmoni-architecture-history`), `ColorInput::Oklch { l, c, h }` is a
first-class input, and every swatch carries its `l`/`c`/`h`. The one place
this is *not* true is the **input**: the Figma plugin (and the workbench Color
engine page) pick a brand colour through a plain `<input type="color">` hex
swatch. Hex is lossy, is not OKLCH, and — most importantly — hides the single
fact that matters when working in OKLCH: **where a colour sits relative to the
gamut boundary**.

This RFC proposes a dynamic, oklch.com-style picker: paint-backed canvas
charts for the **Lightness × Chroma plane** (at the current hue) and a **Hue
strip**, both of which repaint in real time and draw the gamut boundary as the
user drags. It becomes the first-choice brand-colour input for Harmoni.

The moves:

1. **The colour maths stays in Rust/wasm — one source of truth.** The picker
   renders from engine-computed data, not from a second colour library in JS.
   We expose the gamut primitive Harmoni already has and add batched
   *painters* that return raw RGBA buffers the canvas can blit directly.
2. **Gamut scope is phased: sRGB first, Display-P3 as a defined fast-follow.**
   The engine knows sRGB today (`max_in_gamut_chroma`); the picker ships on it
   end-to-end, then P3 is added additively. Rec2020 is out of scope.
3. **Built in the workbench, then ported to the plugin.** The picker is a
   self-contained, controlled React component developed against the workbench
   Color engine page, styled with the **Primitiv design-system tokens**, then
   lifted into the plugin once it is proven.

## 0.1 Scope

In scope: the picker's interaction model, the wasm gamut API it renders from,
the sRGB → P3 phasing, the component decomposition, and the workbench-first →
plugin-port path. Out of scope: changes to palette *generation* itself (the
picker feeds the existing `generate_palette_pair` flow unchanged), the 3D
gamut model oklch.com renders with `three`/`delaunator` (we render 2D charts
only), and Rec2020. Publishing/versioning mechanics live in `RELEASING.md`.

---

## 1. Principles

### Principle 1 — One colour engine, no JS twin

Every colour value, gamut test, and sRGB conversion the picker shows is
computed by harmoni-core and crosses the wasm boundary. We do **not** add a JS
colour library (culori / colordx) for rendering. A second engine would drift
from the Rust output — the picker would show a boundary the generated palette
doesn't honour. The picker is a *view* of the engine, not a parallel
implementation.

### Principle 2 — Render from batched buffers, not per-pixel calls

The charts are CPU-painted: each repaint computes a colour-per-pixel grid. That
is thousands of points, so it is one batched wasm call per repaint returning a
flat RGBA `Vec<u8>` → `Uint8Array`, which the canvas blits via
`ImageData`/`putImageData`. Per-pixel calls across the wasm boundary are
forbidden; the boundary is crossed once per chart per change.

### Principle 3 — The picker is controlled and portable

`OklchPicker` is a controlled component: `value: { l, c, h }` in, `onChange`
out, no internal source of truth. It owns no engine state and no app wiring, so
the same directory lifts from the workbench into the plugin without surgery.

### Principle 4 — The chrome wears the design system

The picker's *chrome* — layout, surfaces, borders, radii, labels, numeric
controls — is styled with the Primitiv `--primitiv-*` tokens, not ad-hoc CSS,
so the first-choice input looks like part of the system. (The chart *paint* is
engine colour data and is exempt — it is the subject, not the chrome.)

### Principle 5 — sRGB first, P3 additive

The picker ships complete on the sRGB gamut Harmoni already computes. P3 is a
strictly additive layer — a second boundary curve, an extended-band paint, and
a toggle — landed without reworking the v1 surface.

### Principle 6 — Compose the design system, don't reinvent its controls

Every standard control the picker needs — sliders, numeric fields, labelled
form rows, the gamut toggle — already exists as an accessible headless
component in `@primitiv-ui/react`, on which both apps already depend. We
compose those (with their keyboard handling, ARIA, and `data-*` contract) and
spend custom code only on what the system does *not* have: the canvas paint and
the 2D L×C control. Reuse is the default; a bespoke control is a justified
exception.

---

## 2. The interaction model

Adapted from oklch.com: the colour is chosen across paint-backed charts that
update live and show the gamut boundary in place. oklch.com renders the OKLCH
solid as a **net of three linked 2D charts**, each plotting a different axis
pair and holding the third axis fixed, all reacting live to any change. We mirror
that net (minus alpha and Rec2020 — RFC §0.1), each chart sitting above the
painted 1-D slider for the axis it holds fixed:

- **Hue chart** — a `<canvas>` at the current **hue**: x = lightness `0..1`,
  y = chroma `c_max..0` (high chroma at the top). The in-gamut region is painted
  with the actual colour at each (L, C, H); out-of-gamut pixels are transparent
  (the OKLCH "holes" — settled in build, §10). The sRGB gamut boundary is
  overlaid as a curve (plus the P3 curve in P3 mode). Repaints when **H** changes.
- **Lightness chart** — a `<canvas>` at the current **lightness**: x = hue
  `0..360`, y = chroma `c_max..0`. Repaints when **L** changes.
- **Chroma chart** — a `<canvas>` at the current **chroma**: x = hue `0..360`,
  y = lightness `1..0`. Repaints when **C** changes.

  > **Axis orientation (verified against the live site / `evilmartians/oklch-picker`
  > source, not assumed):** **hue is the horizontal axis** on the two hue charts;
  > chroma is always vertical; lightness is horizontal on the Hue chart and
  > vertical on the Chroma chart. So the Hue chart's `paintCL`, the Lightness
  > chart's `paintCH`, and the Chroma chart's `paintLH` (oklch.com's own function
  > names) are mirrored by `paint_lc_plane`, `paint_ch_plane`, `paint_lh_plane`.

  The current colour sits at a draggable, gamut-clamped cursor on each chart, and
  each chart draws **shared crosshair guide lines** through its cursor: charts
  that share a plotted axis line up (the Hue & Lightness charts share a horizontal
  current-chroma line; the Lightness & Chroma charts share a vertical current-hue
  line; the Hue & Chroma charts share a current-lightness line). Dragging or
  arrow-nudging a chart emits the full `onChange({ l, c, h })`, clamping chroma to
  the gamut only on the charts that plot it.
- **Painted 1-D sliders** — one per axis (L / C / H), a `<canvas>` track painted
  with that axis's sweep at the current value of the others, with a headless
  `Slider` thumb → `onChange`.
- **Numeric + text inputs** — L / C / H number fields and a hex⇄oklch text
  field. The text field round-trips through the engine (parse via wasm), never
  a JS parser, per Principle 1.

Repaint gating (Principle 2): each chart repaints only when the axis it holds
fixed (or the gamut) changes; each slider track only when one of its two fixed
axes (or the gamut) changes; cursor and guide-line moves are cheap overlay
redraws. Repaints coalesce on `requestAnimationFrame`.

## 3. The wasm gamut API

harmoni-core already has the primitive; the boundary just needs to expose it
and add the painters. All new work is strict TDD at 100% lines / regions /
functions (the `cargo llvm-cov` gate in `CLAUDE.md`), following the
mirror-types rule (`rust-wasm-workflow`).

**3.1 Boundary primitive.** Expose the existing
`max_in_gamut_chroma(lightness, hue) -> f32`
(`crates/harmoni-core/src/palette/generator.rs:124`) at the wasm boundary. The
picker sweeps it to draw the boundary curve and to clamp the cursor.

**3.2 Batched painters** (return flat RGBA `Vec<u8>`, row-major, 4 bytes/pixel):

- `paint_lc_plane(h, width, height, c_max, …) -> Vec<u8>` — the L×C plane at a
  fixed hue. Reuses `oklch_to_rgb` (`crates/harmoni-core/src/color/output.rs`)
  for in-gamut pixels and `max_in_gamut_chroma` to mark out-of-gamut ones.
- `paint_hue_strip(l, c, width, …) -> Vec<u8>` — hue `0..360` at fixed (L, C),
  same marking.

Both document their buffer layout and drive every branch (in-gamut vs
out-of-gamut, edge widths) from a test.

**3.3 OKLCH-triple generation entry (optional, decided in build).**
`generate_palette_pair_oklch(l, c, h, …)` so the picker hands its value
straight to generation. Not required — `generate_palette_pair` already accepts
an `oklch(L C H)` CSS string via `csscolorparser` — so this is a cleanliness
call, not a blocker.

After any `.d.ts`-affecting change, rebuild with `pnpm run build:wasm` and
confirm the new functions appear in the generated types.

## 4. Reusing the design-system headless components

Both apps already depend on `@primitiv-ui/react`, so reuse adds no dependency.
The mapping from picker control to existing headless component (Principle 6):

| Picker control | Reuse | Registry stylesheet? |
|---|---|---|
| Hue slider (and optional 1D L / C sliders) | **`Slider`** — `Root`/`Track`/`Range`/`Thumb`, `orientation`, `min`/`max`/`step`, `value`/`onValueChange`; gives keyboard, ARIA `aria-valuenow`, and `data-orientation`/`data-disabled` for free | **No** — author the picker's own CSS against the Slider contract, with `--primitiv-*` tokens, painting the track from engine data |
| L / C / H numeric fields | **`Input`** wrapped in **`Field`** (label + a11y wiring); **`InputGroup`** where a unit/affix helps | **Yes** — `registry/components/{input,input-group,field}/styles.css` |
| hex ⇄ oklch text field | **`Input`** (+ `Field`); parse/format via wasm, never a JS parser (Principle 1) | **Yes** (as above) |
| sRGB / P3 gamut toggle (§7) | **`Toggle`** or **`ToggleGroup`** | check at build time; style against contract if absent |

Custom code is confined to what the system lacks: the canvas **paint** and the
**2D L×C control** (the headless `Slider` is 1-D only).

## 5. Component decomposition (workbench)

A self-contained directory, e.g. `apps/workbench/src/OklchPicker/`:

- `OklchPicker.tsx` — orchestrates `value`/`onChange`, lays out the three charts
  (each above its slider) and the reused `Field`/`Input` rows, wears the
  design-system tokens (Principle 4). Owns the gamut as internal view state.
- `PlaneChart.tsx` — the **reusable** bespoke 2D control (generalised from the
  original `LcChart`): given two plotted axes + the fixed third, it blits the
  externally-painted plane canvas, overlays any boundary polylines and the shared
  crosshair guide lines, and maps pointer drags / arrow nudges to a gamut-clamped
  value (clamping chroma only when chroma is a plotted axis). All three charts —
  Hue (L×C), Lightness (H×C), Chroma (H×L) — are instances of it. No headless
  analogue exists for a 2-D pad.
- `AxisSlider.tsx` — composes `Slider` (Principle 6): paints the track from
  `paint_{hue,lightness,chroma}_strip`, with `Slider.Thumb` as the cursor →
  `onChange`. One generic control backs all three axes.
- `GamutToggle.tsx` — the sRGB/P3 toggle composing the headless `ToggleGroup`.
- `geometry.ts` — the pure, axis-generic pixel↔value mapping (`pointToAxes` /
  `axesToPoint` / `nudgeAxes`) every chart shares.
- `boundary.ts` — sweeps `max_in_gamut_chroma` into the Hue chart's boundary
  polyline (sRGB, plus the P3 curve in P3 mode).
- `useGamutPaint.ts` — owns the repaint-gating and `requestAnimationFrame`
  coalescing of §2, driving the three plane canvases + three slider tracks.

**Tests (vitest, `react-test-conventions`):** the pure logic — pixel→value
mapping, clamping to `[0,1]` / `[0,360]` / `0..c_max`, value↔string
round-trips, and repaint-gating decisions. Canvas/`getContext` is mocked; no
pixel assertions.

## 6. Wiring into the Color engine page

`apps/workbench/src/ColorEngine.tsx` swaps its brand `<input type="color">` for
`OklchPicker`, feeding the value into the existing `useColors` flow
(`apps/workbench/src/useColors.ts`) — via `generate_palette_pair_oklch` (§3.3)
or a formatted `oklch()` string. The live palette swatches regenerate as the
user drags. Whether the neutral white/black inputs also adopt the picker is a
build-time call.

## 7. Display-P3 (fast-follow, same RFC)

Additive on §3: a P3 variant of `max_in_gamut_chroma` (a Display-P3 RGB
standard defined via the `palette` crate's custom-primaries support), a `gamut`
parameter on the painters so a P3 boundary curve and the sRGB→P3 "extended"
band can be drawn distinctly, and an sRGB/P3 toggle in the picker. Same strict
TDD and 100% gate. No change to the v1 surface.

## 8. Prior art & attribution

The interaction model — paint-backed L×C plane + hue strip with a live gamut
boundary — is adapted from Evil Martians' oklch.com
(`evilmartians/oklch-picker`, **MIT**). We study it for the model only; we do
not copy its source. Its stack (TypeScript + Vite, `@colordx/core` for colour
maths, `three`/`delaunator` for the 3D model) differs from ours by design: our
maths is in Rust (Principle 1) and we render 2D charts, not the 3D gamut solid.
MIT attribution is carried in the picker directory.

## 9. Trajectory: port to the plugin

Once proven in the workbench, the `OklchPicker/` directory lifts into
`apps/harmoni-figma-plugin/src/ui/`, replacing the hex inputs at
`ColorEngine.tsx:104-113`. The plugin's singlefile/wasm-inlined Vite build
already supports wasm (`vite-plugin-wasm`); the only adaptation is the chrome —
the plugin themes off Figma CSS vars, so the picker's `--primitiv-*` tokens are
either shipped as a layer or aliased to Figma theme vars. The existing
`oklchToRgba` + postMessage apply path is unchanged. If workbench/plugin
duplication later bites, a shared internal package is the escape hatch — out of
scope here per the build-first → port decision.

---

## 10. Implementation progress

### Phase 1 — Rust/wasm gamut API ✅ (landed)

The engine side of §3 is complete and the full workspace is green
(`cargo test --workspace`: harmoni-core 98, harmoni-wasm 12, primitiv-cli
353 + e2e — no regressions).

- **`api::gamut::paint_lc_plane(hue, width, height, c_max)`** and
  **`paint_hue_strip(l, c, width)`** — flat RGBA `Vec<u8>` buffers, row-major,
  4 bytes/pixel, pixels sampled at their centres. **Out-of-gamut pixels are
  transparent** (four zero bytes) — the decision left open in §2 is settled as
  *transparent* for v1 (a muted band can be layered later if needed).
- **`api::gamut::max_in_gamut_chroma(l, hue)`** — the boundary primitive,
  re-exported through `api` and wrapped in wasm.
- Thin `#[wasm_bindgen]` wrappers for all three in `harmoni-wasm/src/lib.rs`
  (untested on host, matching the existing wrapper pattern; the logic is fully
  covered in harmoni-core).

**Discovery — the generator's gamut helper is clamped (and load-bearing).**
`palette::generator::max_in_gamut_chroma` uses the *clamped* `into_color`, which
snaps every channel into range, so its in-gamut predicate always passes and it
returns the search ceiling (~0.4). It is not actually a gamut boundary. It is
nonetheless **load-bearing**: the constant cancels in the chroma-ratio scaling,
so generated palettes look right, and *correcting it changes palette output*
(it broke the `primitiv-cli` theme-pipeline golden tests). So the picker does
**not** reuse it — `api::gamut::max_in_gamut_chroma` is a separate, correct,
**unclamped** binary search (Principle 1 is still honoured: one engine, in
Rust). A genuine fix to the generator's gamut scaling is a worthwhile but
*output-changing* follow-up that needs its own RFC item, golden-file updates,
and sign-off — explicitly **not** done here.

**Decisions taken during the build:**
- **1c skipped.** No `generate_palette_pair_oklch`; the existing
  `generate_palette_pair` already accepts an `oklch(L C H)` string, so Phase 2
  formats the value into that. Revisit only if the string round-trip bites.
- **wasm pkg not regenerated here.** `wasm-pack` is unavailable in the dev
  sandbox (`sandbox-gotchas`), so `crates/harmoni-wasm/pkg/*.d.ts` was not
  rebuilt. The Rust source is correct and committed; **Phase 2 must run
  `pnpm run build:wasm`** (on a machine with `wasm-pack`) before the new
  functions are callable from the workbench, then confirm they appear in the
  generated `.d.ts`.
- **Coverage not machine-verified here** — `cargo-llvm-cov` is absent from the
  sandbox. Tests drive every branch of the new code (both gamut arms, both
  in/out-of-gamut paint arms, the quantiser); confirm with the gate when the
  tool is available.

### Phase 2 — workbench `OklchPicker` ✅ (landed)

The controlled, portable picker of §4–§6 is built at
`apps/workbench/src/OklchPicker/` and wired into the Color engine page. The
full picker vitest suite is green at **100% lines / branches / functions /
statements** (51 tests), scoped via a new `vitest.config.ts` in the workbench.

- **wasm boundary extended.** `parse_color(input) -> OklchTriple` and
  `describe_oklch(l, c, h) -> OklchTriple` expose the engine's existing
  `ColorInput::to_oklch` / `oklch_to_hex` / `format_oklch` for the hex⇄oklch
  text field — no JS colour library (Principle 1). The `OklchTriple` mirror
  already carried `{ l, c, h, hex, rgb, oklch }`, so no core change was needed;
  `pnpm run build:wasm` regenerated the `.d.ts`.
- **Pure logic, strict TDD.** `geometry` (pixel↔value mapping + clamping),
  `boundary` (the engine-swept sRGB curve as an SVG polyline), `repaint`
  (per-chart gating), `color` (wasm parse/format bridge) and `paint`
  (`ImageData` blit) are each driven red→green. `useGamutPaint` gates each
  chart's batched paint on the axis that moved and coalesces onto a single rAF,
  folding a cancelled paint into the next frame.
- **Components.** `LcChart` is the bespoke 2-D pad (boundary overlay + cursor +
  gamut-clamped pointer drag over the engine-painted plane); `HueSlider`
  composes the headless `Slider` over an engine-painted hue-strip canvas;
  `OklchPicker` orchestrates them with the `Field`/`Input` rows, controlled by
  `{ l, c, h }` / `onChange`. Chrome wears `--primitiv-*` tokens; the oklch.com
  MIT attribution is carried in the directory (§8).
- **Wiring.** `ColorEngine` replaces each brand `<input type="color">` with an
  `OklchPicker`, owning the `{ l, c, h }` (the generator forces swatch lightness
  to the curve, so it can't be read back from a swatch) and feeding changes into
  the existing `useColors` flow as an `oklch()` string (1c skipped, as decided).

**Verification.** `pnpm run build:wasm` ran (a prebuilt `wasm-pack` binary was
fetched into the environment) and the new functions appear in the generated
`.d.ts`; the picker is covered by vitest and `tsc --noEmit`. The workbench dev
server is not run here (sandbox-gotchas), so the visual check in a real browser
is left to the human.

### Phase 3 — picker hardening / a11y / numeric UX ✅ (landed; one human pass outstanding)

The quality pass that makes the workbench picker production-ready before P3 and
the plugin port. The picker vitest suite is green at **100% lines / branches /
functions / statements** (77 tests across the workbench harness); `tsc --noEmit`
and `eslint` are clean.

- **Keyboard + a11y for the bespoke L×C pad.** The pad is now focusable
  (`tabIndex=0`) with a visible `:focus-visible` ring, and arrow keys nudge
  `(l, c)` — `←/→` lightness, `↑/↓` chroma — gamut-clamped through the engine
  exactly like a pointer drag, with **Shift** for a coarse step. The nudge maths
  is a pure `nudgeLc` in `geometry.ts` (every arm + the non-arrow `null` driven
  by a test); the pad's accessible name announces the live value
  (`"Lightness and chroma. Lightness 0.60, chroma 0.150. …"`).
  **Decision:** chosen over react-aria-style *paired hidden range inputs*. Two
  visually-hidden sliders would give true per-axis `aria-valuenow`, but they add
  a heavier DOM to carry into the Phase 5 plugin port, and the accessible
  **L/C/H number fields already provide per-axis keyboard + ARIA entry** — so
  the pad's keyboard support is a sighted-keyboard enhancement layered on that
  SR-friendly path, not the sole a11y story.
- **Numeric-field UX.** A new pure `channels.ts` models each field's range,
  display precision, and spinner step. Typed values **clamp into the channel
  range** (L `[0,1]`, C `[0,c_max]`, H `[0,360]`); engine floats are **rounded
  for display** (L/C 3 dp, H 1 dp); steps are sane (L `0.01`, C `0.005`, H `1`).
  Clamping is to *range, not gamut* on purpose — a valid-range value outside the
  sRGB gamut is kept so the chart cursor can sit beyond the boundary and show the
  colour is unreachable; the **pad** clamps to gamut on interaction, the numeric
  fields do not.
- **Text-field softening (the §5/item-5 rough edge).** The hex⇄oklch field no
  longer rewrites itself to the canonical `oklch(…)` string mid-edit: while
  focused the user's text stands (even as a valid entry flows back through
  `onChange`), and it resyncs to canonical only on **blur** or when the value
  changes from elsewhere. This matches oklch.com, which never rewrites the
  representation you are actively typing into.
- **§6 decision — neutrals adopt the picker.** The Color engine page's neutral
  white/black anchors now use `OklchPicker` in place of the `<input type=color>`
  hex swatches. The brand-hue **tint is fully retained**: it is an *orthogonal*
  blend applied in `useColors` (`tint_neutrals` layered on whatever anchors are
  set), independent of how the anchors are entered. Rationale for adopting
  rather than deferring: the real neutral design move is a subtle warm/cool
  off-white/off-black — a tiny chroma offset along a chosen hue — which is
  exactly what the L×C view surfaces and hex hides. The only caveat is that pure
  `oklch(1 0 h)` / `oklch(0 0 h)` are degenerate at the pad's chroma-0 edge
  (hue is inert until you move off it), which is acceptable.

**Verification.** `wasm-pack` was unavailable in the sandbox; the prebuilt
binary from `sandbox-gotchas` was fetched, `pnpm run build:wasm` ran, and the
gamut/colour functions are present in the generated `.d.ts`. Unlike Phases 1–2,
the **workbench dev server *does* run in this environment** (`pnpm run dev`,
`http://localhost:5173/`, ColorEngine at `/`), so the human can view the picker
live. The one thing this phase could **not** do in-sandbox is the **real-browser
visual QA pass** — Playwright's browser download is blocked and no system
Chromium is present — so confirming the gamut boundary curve, the out-of-gamut
checkerboard, cursor/thumb alignment, the hue-strip track, and the token chrome
under the design system is the **remaining human pass**.

### Phase 4 — Display-P3 (+ painted axis sliders) ✅ (landed; one human pass outstanding)

The additive wide-gamut layer of §7, plus the painted 1-D L/C sliders §4 marked
optional — pulled into this phase to bring the picker to the full oklch.com
editing model (minus alpha, which isn't in Harmoni's opaque OkLCH model). The
workspace is green (`cargo test --workspace`, modulo a **pre-existing,
unrelated** `primitiv-emit` button-wrapper golden that also fails on `main` in
this sandbox) and the picker vitest suite is **100% lines / branches / functions
/ statements** (94 tests).

**Engine (`harmoni-core`, strict TDD, 100% regions/functions/lines via
`cargo llvm-cov`):**
- **`color::p3`** — a `DisplayP3` RGB standard (DCI-P3 primaries, D65, sRGB
  transfer) defined through the `palette` crate's custom-primaries support, and
  `oklch_to_p3_rgb`. The RGB↔XYZ matrices are **derived from the primaries** (the
  default `None`) rather than hard-coded: an explicit matrix would shadow
  `red`/`green`/`blue` into dead code and fail the functions gate. Validated
  against the canonical sRGB-red-in-P3 value `(0.9175, 0.2003, 0.1386)`.
- **`api::gamut::Gamut`** (`Srgb` | `DisplayP3`) threaded through a now
  gamut-aware `max_in_gamut_chroma` and the painters. `paint_lc_plane` /
  `paint_hue_strip` paint up to the chosen gamut's boundary and blit **P3
  coordinates in P3 mode** (for a `display-p3` canvas), and two new fixed-axis
  painters — **`paint_lightness_strip`** and **`paint_chroma_strip`** — back the
  L and C slider tracks.
- **wasm:** a `Gamut` mirror enum (round-trip tested like `TintMode`) and the
  `gamut` parameter exposed on every painter wrapper; `paint_lightness_strip` /
  `paint_chroma_strip` added. `pnpm run build:wasm` regenerated the `.d.ts`
  (`Gamut = "Srgb" | "DisplayP3"`; all `paint_*` take `gamut`).

**Picker (`apps/workbench/src/OklchPicker/`, controlled + portable):**
- **`paint`** blits onto a `display-p3` context and tags each `ImageData` with
  its buffer's colour space, so an sRGB buffer displays unchanged while a P3
  buffer keeps its wide colours instead of clamping on `putImageData`.
- **`repaint` / `useGamutPaint`** now gate **four** charts (plane + hue /
  lightness / chroma strips) on the axis that moved, with the **gamut as a fifth
  axis** that repaints everything — so each painted track shifts in relation to
  the others as you drag (the oklch.com model: you read the gamut range live).
- **`boundary` / `LcChart`** sweep a chosen gamut; the pad clamps the
  pointer/keyboard to the **active** gamut and draws the **sRGB boundary (solid)
  plus the P3 boundary (dashed)** in P3 mode, the band between marking the
  sRGB→P3 extended region.
- **`AxisSlider`** — one generic painted slider composing the headless `Slider`,
  used for all three axes (it **replaced** the single-purpose `HueSlider`).
- **`GamutToggle`** — the sRGB/P3 control composing the headless `ToggleGroup`
  (single-select, never deselecting to none); no registry sheet exists, so it is
  styled against the contract with `--primitiv-*` tokens.
- **`OklchPicker`** owns the gamut as **internal view state** (not part of the
  controlled `{ l, c, h }` value — Harmoni's model is opaque OkLCH), keeping the
  `value`/`onChange` contract and Phase-5 portability intact.

**Decisions taken during the build:**
- **1-D L/C sliders: added now**, per the §4-optional triage — the user wants
  the full oklch.com editing experience (three distinct painted axis charts, each
  updating against the others). Not a follow-up.
- **No alpha** — out of Harmoni's colour model; deliberately omitted.
- **P3-faithful bytes on a `display-p3` canvas**, rather than sRGB-clamped paint
  — otherwise the extended band would show nothing new on a P3 display.
- **Transparent out-of-gamut** retained from Phase 1 (a checkerboard reads it),
  now applied per-gamut and on the new slider tracks too.

**Verification.** `cargo test --workspace` (less the pre-existing emit golden),
`cargo llvm-cov` 100% on `color/p3.rs` + `api/gamut.rs`, `pnpm run build:wasm`
with the new signatures confirmed in the `.d.ts`, picker vitest at 100%,
`tsc --noEmit` + `eslint` + the workbench production build (`tsc -b && vite
build`) all clean, and the dev server runs (`http://localhost:5173/`). The
**real-browser visual QA pass remains the human's** (no browser in the sandbox):
the P3 boundary curve and the dashed extended-band marker, the `display-p3`
canvas fidelity of the extended colours, the three painted slider tracks, and the
toggle chrome under the design system.

### Phase 4b — the three-chart net ✅ (landed; one human pass outstanding)

The two missing charts of the oklch.com net, bringing the editor to full parity
(minus alpha / Rec2020). The workspace is green (`cargo test --workspace`) and the
picker vitest suite is **100% lines / branches / functions / statements** (93
tests).

**Axis-orientation verification.** The task's prose guessed hue on the *vertical*
axis of the new charts; reading the `evilmartians/oklch-picker` source
(`view/chart/paint.ts` — `paintCL` / `paintCH` / `paintLH`) showed hue is
**horizontal**, chroma always vertical, lightness horizontal on the Hue chart and
vertical on the Chroma chart. We build the verified orientation (confirmed with the
human), so `paint_ch_plane` paints hue×chroma and `paint_lh_plane` hue×lightness.

**Engine (`harmoni-core` + `harmoni-wasm`, strict TDD, `api/gamut.rs` at 100%
regions/functions/lines via `cargo llvm-cov`):**
- **`paint_ch_plane(l, w, h, c_max, gamut)`** — the Lightness chart: hue (x) ×
  chroma (y) at a fixed lightness, boundary found once per column.
- **`paint_lh_plane(c, w, h, gamut)`** — the Chroma chart: hue (x) × lightness (y)
  at a fixed chroma, boundary found per pixel. Both transparent out of gamut, P3-
  aware like the existing painters. Thin wasm wrappers added; `pnpm run build:wasm`
  regenerated the `.d.ts` with both signatures.

**Picker (`apps/workbench/src/OklchPicker/`, controlled + portable):**
- **`PlaneChart`** generalises the bespoke `LcChart` (now retired): it takes its
  two plotted axes + the fixed third, an externally-painted canvas, optional
  boundary polylines, a gamut-clamped draggable cursor (chroma clamped only when
  plotted), arrow-key a11y, and shared crosshair guide lines that link charts
  sharing an axis. `geometry.ts` gained axis-generic `pointToAxes` / `axesToPoint`
  / `nudgeAxes`; the old L×C-specific helpers were removed.
- **`repaint` / `useGamutPaint`** now gate **six** canvases (three charts + three
  slider tracks): each chart on the axis it holds fixed, each strip on its two
  fixed axes, all on the gamut.
- **`OklchPicker`** lays the three charts each above its matching slider (Lightness
  chart over the L slider, …) in a wrapping row; the `{ l, c, h }` / `onChange`
  contract and the internal-gamut-view-state decision are unchanged, so Phase-5
  portability is intact.

**Decision taken during the build:** the painted 1-D slider **tracks stay** (chart
+ slider per axis), matching oklch.com, rather than the charts subsuming them
(confirmed with the human).

**Verification.** `cargo test --workspace`, `cargo llvm-cov -p harmoni-core` 100%
on `api/gamut.rs`, `pnpm run build:wasm` with both new signatures in the `.d.ts`,
picker vitest at 100%, `tsc -b` + `eslint` + the workbench production build
(`tsc -b && vite build`) all clean. The dev server runs
(`http://localhost:5173/`). The **real-browser visual QA pass remains the human's**
(no browser in the sandbox): the three painted planes, the hue-horizontal
orientation, the transparent OKLCH holes on the new charts, the shared crosshair
guide lines, cursor alignment, and the token chrome under the design system.

### Phase 5 — plugin port

Unchanged from §9 — out of scope for Phase 4b.
