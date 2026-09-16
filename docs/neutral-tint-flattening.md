# The neutral tint was flattened by an 8-bit hex round trip

> **Found:** 2026-09-16, from "the tints weren't as obvious" in the Harmoni
> plugin's neutral picker. It was a real bug, in the plugin's adapter, not
> in the engine. **Fixed** — the adapter now hands the engine the tint and
> lets it compose the anchors (`api::generate_tinted_neutral_pair`).
>
> **Primitiv's own shipped neutral ramp is NOT a victim of this** — §3.
> An earlier reading of mine said it was; §3 is the correction, measured.

---

## 1. The mechanism

A neutral ramp is generated *between two soft anchors*, and the tint is a
colour laid over those anchors: it overwrites their chroma and hue and
keeps their lightness. `tint_neutrals` scales the source's chroma down
hard on the way in — `× 0.08` for the white anchor, `× 0.05` for the black
one — because an anchor is a near-grey, not a colour.

So a tinted anchor carries chroma of order **0.01**. That is at the very
bottom of what 8-bit sRGB can represent, and how much of it survives
depends entirely on the anchor's lightness: near `L → 1` and `L → 0` the
sRGB gamut is a needle, and one bit of channel quantisation is a large
fraction of the whole chroma available.

The plugin's adapter used to tint the anchors in TypeScript, render each
to `#rrggbb`, and hand those hexes to the engine. That round trip is where
the tint died.

## 2. Measured, at two anchor pairs

Both rows: single-source tint, `#236ce1` (the brand seed) at strength 1.0,
ten steps, light mode. "old" is tint → hex → generate; "new" is tint →
OkLCH → generate.

| anchors | tinted anchor chroma (white / black) | after hex | ramp mean chroma old → new | hue span old → new | hex steps moved |
| --- | --- | --- | --- | --- | --- |
| plugin default `L 0.99` / `L 0.02` | 0.01538 / 0.00961 | 0.00752 / **0.00000** | 0.00397 → 0.01266 (**3.19× loss**) | **131.1°** → 0.0° | 8 / 10 |
| Primitiv veils `#e5ecf6` / `#121418` | 0.01538 / 0.00961 | 0.01546 / 0.00941 | 0.01261 → 0.01266 (0.4%) | 1.6° → 0.0° | 4 / 10 |

Read the black anchor of the first row: **the tint was quantised to exactly
zero**. The ramp then had no shadow hue to travel toward, so its hue swung
131° from end to end as the surviving highlight chroma bled away — which is
precisely the "tints aren't obvious" the picker was showing.

The severity is a function of the anchors, not of the tint. The plugin's
defaults are the extreme case; ordinary anchors a step in from the ends
lose almost nothing.

## 3. Primitiv's shipped neutral is a different story

The committed ramp does show a hue span — **10.4°** across
`color.neutral.50…900` — and that looks like the same signature. It is not.

**The committed values are 8-bit hex re-expressed as OkLCH.** Every one of
the ten light steps renders to a hex that reads back as the identical
`oklch(...)` string, to the digit. `packages/tokens/src/palette.json` was
authored in hex and converted in place when the source went OkLCH-first
(`7578ad3`); at chroma ~0.013, one bit of channel quantisation *is* a few
degrees of hue, and the wobble is non-monotonic (254.6 → 258.4 → 255.5 →
259.8 …) rather than the smooth sweep a flattened anchor produces.

So the shipped ramp carries the ordinary cost of having been stored as hex,
not the tint bug. Nothing in `packages/tokens` needs regenerating on account
of this finding.

## 4. The shipped neutral is *nearly* reproducible, and now could be

`packages/tokens/harmoni-seeds.json` records under `$notScoped.neutral` that
the neutral ramp is deliberately left out of the manifest, because it does
not come from `generate_brand_pair` and its input shape was never written
down. That input shape now exists:

```
white  #e5ecf6        (the light veil)
black  #121418        (the dark veil)
tint   { source: #236ce1, strength: 1.0, spread: 0, bow: 0 }
steps  10
```

Fed to `api::generate_tinted_neutral_pair`, that reproduces **7 of the 10
committed light steps exactly**; the other three (100, 300, 900) differ by
one bit in one channel — the hex-storage noise of §3, not a different ramp.

Closing the manifest gap therefore means two decisions, and they are the
user's, not the engine's:

1. **Record the recipe** in `harmoni-seeds.json` and extend the `ramp-audit`
   example to cover it, so the neutral stops being the one family nobody can
   regenerate.
2. **Accept that regenerating moves three steps by one bit.** They are
   imperceptible, but they are a diff in the token layer of all three apps
   and in Figma's `Primitives / Palette`.

Neither is urgent. What matters is that the reason the ramp was unreproducible
— "nobody wrote down the input shape" — no longer holds.

## 5. Why no test caught it

The engine was never wrong, so no engine test could fail. The bug lived in
the plugin's adapter, in code that *re-derived the engine's composition in
TypeScript* — and the adapter's own tests built their expectations the same
way, through hex, so the wrong answer matched. The fix and the test rewrite
landed together in `primitiv-ui/harmoni`.

The rule that would have prevented it is the one now stated in that repo's
working notes: **every decision belongs in the engine; TypeScript's only job
is to carry input in and output back out.** A frontend that composes a colour
is a second opinion competing with the one that gets written to Figma.

## 6. Reproducing the measurements

There is no committed example for this — the numbers above came from a
throwaway `harmoni-core` example that was deleted after it had done its job.
To re-measure, write one that calls `api::tint_neutrals` for the anchors,
renders them with `SwatchStep::from_label(...).hex`, feeds those hexes to
`api::generate_neutral_pair` for the "old" row, and compares against
`api::generate_tinted_neutral_pair` with the same tint for the "new" row.
