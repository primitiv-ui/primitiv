# RFC 0011 — Duotone neutral ramps

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-23
> **Seeds from:** the 2026-06-23 duotone-tint discussion (this session).
> **Relates to:** RFC 0002 (Harmoni → Intent → Plugin) — extends the neutral
> ramp the plugin already writes; RFC 0003 (Dynamic foreground wiring) — the
> duotone ramp feeds the same foreground path unchanged; RFC 0010 (OKLCH
> picker) §6 — keeps the brand-hue tint "as an orthogonal blend", which this
> RFC generalises from one anchor to two. Skills: `harmoni-architecture-history`
> (the neutral module, `SoftNeutrals`, the canonical OkLCH form),
> `rust-wasm-workflow` (the harmoni-core ↔ harmoni-wasm boundary),
> `dark-mode-palettes` (the dark neutral path the change must mirror).
> **Prior art:** Adobe **Leonardo** (`adobe/leonardo`, **Apache-2.0**) — its
> multi–key-colour interpolation (sorted by lightness, interpolated in a
> perceptual space, OKLCH included) is the mechanism we adopt; we constrain it
> to the two-anchor neutral case rather than the general N-key scale.

---

## 0. Summary

Harmoni's neutral ramp is **monotone**: every step is locked to a single hue
and chroma is interpolated linearly between the light and dark endpoints. The
tint path (`neutral/tint.rs`) collapses one source colour onto both ends at the
*same* hue, and the ramp builder (`neutral/ramp.rs`) reuses that one hue for
every step. There is no way to express the look high-end neutral families ship —
**a light end leaning one direction and a dark end leaning another** (warm
highlights, cool shadows, or vice versa), with the tint reading richest through
the mid-tones rather than at an endpoint.

This RFC proposes **duotone neutral ramps**: two independent tint anchors — a
*highlight* anchor governing the light end and a *shadow* anchor governing the
dark end — with **hue and chroma interpolated across the ramp** between them
(shortest-arc in hue, with an optional mid-tone chroma bow). The single-hue tint
becomes the degenerate case where both anchors share a hue.

The moves:

1. **The colour maths stays in Rust/wasm — one source of truth** (RFC 0010
   Principle 1). The ramp builder learns to interpolate hue; the tint builder
   learns to produce two-hue endpoints. The plugin renders the result, it does
   not recompute it.
2. **Additive and back-compatible.** `tint_neutrals` (one source) stays;
   duotone is a new entry point. The existing monotone output is reproduced
   exactly when the two anchors coincide, so nothing regresses.
3. **Built behind the existing controlled contract.** The plugin gains a second
   tint control; the engine's `{ l, c, h }` swatch contract is unchanged.

## 0.1 Scope

In scope: the duotone model (two anchors + hue/chroma interpolation), the
shortest-arc hue maths, the engine API and its wasm boundary, the dark-ramp
mirror, and the plugin UI for choosing the two anchors. Out of scope: the
general N-key Leonardo scale (we fix N = 2 for neutrals — see §6.1), changes to
*brand* palette generation, contrast/foreground logic (the duotone ramp feeds
the existing `get_best_foreground` path untouched), and Display-P3 gamut work
(the anchors carry small chroma well inside sRGB; P3 is orthogonal).

---

## 1. Principles

### Principle 1 — One colour engine, no JS twin

Inherited from RFC 0010. Hue interpolation and the two-anchor blend are computed
in harmoni-core and cross the wasm boundary as ordinary `Palette` swatches. The
plugin never interpolates colour itself.

### Principle 2 — Duotone is a generalisation, monotone is a special case

The new path must reduce to today's output bit-for-bit when the highlight and
shadow anchors share a hue. This is the regression guard *and* the migration
story: the default UI state (one source, no spread) is monotone, and the user
opts into duotone by separating the anchors.

### Principle 3 — Perceptual interpolation only

Hue interpolates along the **shortest arc** in OKLCH; chroma interpolates (with
an optional bow) in OKLCH. We never interpolate in a gamma-encoded space — that
is what would dirty the mid-greys, the exact failure duotone is meant to cure.

---

## 2. The problem, concretely

`neutral/ramp.rs` today:

```rust
let hue = soft_white.hue.into_degrees();          // one hue …
// … reused for every step:
let c = soft_white.chroma + (soft_black.chroma - soft_white.chroma) * fraction;
SwatchStep::from_label(l, apply_tint(c), hue, step)
```

and `neutral/tint.rs`:

```rust
let hue = source.hue.into_degrees();              // both ends, same hue
white: Oklch::new(white.l, source.chroma * 0.08 * strength, hue),
black: Oklch::new(black.l, source.chroma * 0.05 * strength, hue),
```

Two structural limits fall out:

- **One hue across the whole scale.** A warm-highlight / cool-shadow neutral is
  unrepresentable regardless of input.
- **Linear chroma, so the mid-tone tint is just the endpoint average.** Tint
  reads weakest exactly where neutrals cover the most surface area (cards,
  panels, table rows), so designers over-crank strength and the endpoints go
  muddy.

## 3. The model

A duotone ramp is defined by:

- **Highlight anchor** `H = (l_h, c_h, h_h)` — governs the light end (step 50).
- **Shadow anchor** `S = (l_s, c_s, h_s)` — governs the dark end (step 900).
- a **chroma-bow** parameter `bow ∈ [0, 1]` (0 = linear, the current behaviour).

For step `i` at interpolation fraction `t ∈ [0, 1]` (0 at the light end):

- `l(t)` — unchanged from today (anchored endpoints, interpolated lightness).
- `h(t)` — **shortest-arc** interpolation from `h_h` to `h_s`. Going from 350°
  to 10° rotates +20° through 0°, not −340° through 180°. This is the one piece
  of genuinely new maths and the place the 0°/360° seam must be driven red.
- `c(t)` — linear `lerp(c_h, c_s, t)` plus a bow term `bow · peak · 4t(1−t)`
  (a parabola that is 0 at both ends and maximal at the mid-tone), so the tint
  can crest through the middle without disturbing the anchored endpoints.

When `h_h == h_s` and `bow == 0`, `h(t)` is constant and `c(t)` is the old
linear lerp — Principle 2 holds.

## 4. Engine API

```rust
// neutral/tint.rs — produce two-hue endpoints from two sources.
pub fn tint_neutrals_duotone(
    white: Oklch, black: Oklch,
    highlight: Oklch, shadow: Oklch,
    strength: f32,
) -> SoftNeutrals;

// neutral/ramp.rs — interpolate hue + bow across the scale.
pub fn generate_neutral_ramp(
    soft_white: Oklch, soft_black: Oklch, tint: TintMode, bow: f32,
) -> Palette;
```

`api/neutral.rs` threads both through the `ColorInput` boundary as it does
today; `harmoni-wasm` mirrors any new arguments and the `.d.ts` is regenerated
(`pnpm run build:wasm`). `SoftNeutrals` is unchanged — it already carries a full
`Oklch` per end, so two hues need no new type.

> **Open question (O1):** whether `bow` rides on `generate_neutral_ramp` (a new
> trailing arg, as above) or on a small `RampOptions` struct. A struct ages
> better if more shaping params arrive; a trailing arg is the smaller diff now.
> Leaning struct — decide before the wasm signature is frozen.

## 5. Plugin UI

Today: one **"Use brand as neutral tint"** button (grabs `swatches[5]`) + one
strength slider. Duotone needs a way to set *two* anchors. Two candidate UIs:

**Option A — Highlight + Shadow pickers (Leonardo-faithful).** Two explicit
anchor swatches the user sets independently. Maximum control, matches Leonardo's
key-colour mental model, but two more controls and the obvious "what do I put
here?" cold-start problem.

**Option B — One source + a temperature/spread slider.** Keep the single source;
add a bipolar **spread** slider that rotates the highlight and shadow hues
symmetrically away from the source hue (e.g. ±15°). One extra control, an
obvious default (spread 0 = today's monotone), and it degrades gracefully.

**Recommendation:** ship **Option B first** (lowest cold-start cost, preserves
the current one-click flow, Principle 2 default is literally the zero position),
and treat Option A as a "advanced / two anchors" disclosure later. Both drive
the same `tint_neutrals_duotone` underneath — B just derives the two anchors
from one source + spread before the call, so the engine API is identical.

> **Open question (O2):** confirm Option B for the first cut. (Owner indicated a
> Leonardo-style model, which is Option A; B is the constrained, lower-friction
> form of the same mechanism — flag for explicit sign-off.)

## 6. Decisions

| # | Decision |
|---|---|
| D1 | **Duotone = exactly two anchors** (highlight + shadow), not the general N-key Leonardo scale. Neutrals are a two-endpoint problem; N-key smoothing is complexity we do not need and cannot test cheaply to 100%. |
| D2 | **Hue interpolates shortest-arc in OKLCH.** The 0°/360° seam is driven red first. |
| D3 | **Monotone is the `bow=0`, equal-hue special case** and is reproduced exactly (Principle 2 regression guard). |
| D4 | **`tint_neutrals` (single source) is retained**, not replaced; duotone is additive. |
| D5 | **Chroma bow is a parabola** (`4t(1−t)`), zero at both anchors — shaping the mid-tone without moving endpoints. |
| D6 | **The dark neutral ramp mirrors the light one** (swap anchors), exactly as `useColors.ts` does today — no separate dark model. |

### 6.1 Why not the full Leonardo N-key scale

Leonardo interpolates through an arbitrary list of key colours sorted by
lightness, with optional smoothing once there are >2. That generality is the
right call for data-viz scales; for a UI neutral it buys little and costs a lot:
a variable-length key list is harder to drive to 100% region coverage, harder to
present in the plugin, and invites palettes that drift hue non-monotonically
(the thing smoothing then has to undo). Fixing N = 2 keeps the maths a single
interpolation with a closed-form seam test.

## 7. Test & build plan (TDD)

Red-green-refactor, 100% lines/regions/functions, small commits — the repo
norm. Sequence:

1. **Engine — hue interpolation** (`ramp.rs`): red the 0°/360° shortest-arc
   seam, then the general case; green the lerp. *Crux cycle.*
2. **Engine — chroma bow** (`ramp.rs`): red `bow=0` ≡ today, then a positive
   bow crests at the mid-tone.
3. **Engine — duotone tint** (`tint.rs`): red two-hue endpoints from two
   sources; assert single-source equivalence when sources coincide.
4. **`api/neutral.rs`**: thread the new params through `ColorInput`.
5. **wasm boundary**: mirror types / args, regenerate `.d.ts`, hold 100%.
6. **Plugin UI**: spread (Option B) control in `ColorEngine.tsx` +
   `useColors.ts`; tests in `engine.test.ts` / `ColorEngine.test.tsx`.

## 8. Status

Draft. Engine cycles 1–3 are the substance; the rest is plumbing and one UI
control. O1 (bow arg vs struct) and O2 (UI Option B vs A) are the two things to
settle before the wasm signature and the plugin layout are frozen.
