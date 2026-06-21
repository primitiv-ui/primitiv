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
update live and show the gamut boundary in place.

- **L×C plane** — a `<canvas>` for the current hue: x = lightness `0..1`,
  y = chroma `0..c_max`. The in-gamut region is painted with the actual colour
  at each (L, C, H); out-of-gamut pixels are marked (style TBD in build —
  transparent or a muted band, matching oklch.com's readability). The sRGB
  gamut boundary is overlaid as a curve; the current colour sits at a draggable
  cursor. Dragging emits `onChange({ l, c })`.
- **Hue strip** — a `<canvas>` for hue `0..360` at the current (L, C), with the
  same out-of-gamut marking and a draggable cursor → `onChange({ h })`.
- **Numeric + text inputs** — L / C / H number fields and a hex⇄oklch text
  field. The text field round-trips through the engine (parse via wasm), never
  a JS parser, per Principle 1.

Repaint gating (Principle 2): the plane repaints only when **H** changes; the
hue strip repaints only when **L or C** change; cursor moves are cheap overlay
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

- `OklchPicker.tsx` — orchestrates `value`/`onChange`, lays out the charts and
  the reused `Field`/`Input` rows, wears the design-system tokens (Principle 4).
- `LcChart.tsx` — the bespoke 2D control: blits `paint_lc_plane`, overlays the
  boundary curve, draws and drags the cursor (pixel → (l, c) mapping with
  clamping). No headless analogue exists for a 2-D pad.
- `HueSlider.tsx` — composes `Slider` (Principle 6): paints the track from
  `paint_hue_strip`, with `Slider.Thumb` as the cursor → `onChange({ h })`.
- `useGamutPaint.ts` — owns the repaint-gating and `requestAnimationFrame`
  coalescing of §2.

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
