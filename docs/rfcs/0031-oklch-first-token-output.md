# RFC 0031 — OkLCH-first token output

**Status:** Accepted (2026-09-11), not yet built
**Decision:** Primitiv's token sources and its emitted output both carry colour
as CSS `oklch()`, not hex. Harmoni is OkLCH-first; Primitiv should be the same
with its output.

---

## 1. Why

**Hex is a lossy render of what the engine actually computed.** Every colour in
the system is generated in OkLCH — `generate_pair`, `anchored_lightness`, the
chroma cap that RFC 0027 §4 added all work in L, C and H — and is then flattened
to 8-bit sRGB at emit. That quantisation is why the round trip is not free:
OkLCH carries more precision than three bytes can hold, and the P3 work in
RFC 0010 §4 already showed the engine holding colour that hex cannot express at
all. Emitting `oklch()` stops throwing that away.

**It also makes the token layer say what it means.** `oklch(0.5557 0.1923
259.8783)` states a lightness, a chroma and a hue — the three things every
decision in the engine is actually about. `#236ce1` states three bytes. A
designer reading the token layer to understand why step 600 is where it is can
do that from the first form and not the second.

**Figma is not an obstacle.** Figma variables are RGB-backed and have no OkLCH
notation, so the two sides stop being byte-comparable — but the Harmoni plugin
already converts, and that conversion is the plugin's job rather than a reason
to hold the whole system at hex. The consequence for us is in §5.

## 2. What is already true

Three things that would otherwise look like work and are not:

- **`ColorInput::Css` already parses `oklch()`**, in both unitless and
  percentage forms, and round-trips to the same hex:

  ```
  oklch(0.5557 0.1923 259.8783)  -> oklch(0.5557 0.1923 259.8783) / #236ce1
  oklch(55.57% 0.1923 259.8783)  -> oklch(0.5557 0.1923 259.8783) / #236ce1
  #236ce1                        -> oklch(0.5557 0.1923 259.8783) / #236ce1
  ```

  So `primitiv theme --brand "oklch(...)"` works today, and a `palette.json`
  holding OkLCH parses with no input-side change.

- **`color::output::format_oklch` already fixes the notation** — `oklch(L C H)`,
  unitless L, four decimal places — with `format_oklch_alpha` producing the
  `oklch(L C H / a)` slash-alpha form the alpha ramps need. The format is
  settled in the engine; this RFC adopts it rather than inventing one.

- **The emitter does not parse colour at all.** `primitiv-emit` passes a DTCG
  `$value` through as a string; the only colour it assembles is the shadow
  composite, from parts it is handed. Its own tests already use
  `oklch(0.55 0.13 162)` as their colour fixture. **No emitter code change is
  needed** — which is the single most important thing to know before sizing
  this.

## 3. Blast radius, measured

| Surface | Count | How |
| --- | --- | --- |
| `palette.json` 6-digit hex | 128 | `regen-palette`, not by hand |
| `palette.json` 8-digit hex (alpha ramps) | 62 | same, via `format_oklch_alpha` |
| `intent.json` raw values | 2 | by hand — `scrim` and dark `surface/floating` |
| `elevation.json` `shadow.color.*` | 3 | by hand |
| `primitiv-emit` goldens containing a hex | 5 of 26 | regenerate |
| Apps' `tokens.css` | 3 | re-emit; `token-drift.yml` already guards all three |

Everything else in the token layer is an alias and follows for free — 203 of 206
Intent values are references, which is exactly the property that makes this
cheap.

## 4. The one casualty

**`packages/tokens/src/dark-mode-content.test.ts` parses hex directly** —
`parseInt(hex.slice(1, 3), 16)` in its `luminance()` helper — so it breaks the
moment a palette value is `oklch(...)`. RFC 0027 §6 moved the accessibility
*floors* into Rust and deliberately left this file the checks only it can see (a
state ramp running the wrong way, a background that fails to track the theme, a
pair that must stay consistent across modes). Those checks are still worth
having, so the helper needs to read OkLCH rather than be deleted.

Note what this is *not*: reintroducing a second contrast implementation. The
floors stay in Rust. This helper answers "is this light or dark" and "did these
two move together", which needs a lightness, and OkLCH hands it one directly —
`L` is the first component, so the replacement is simpler than the sRGB
luminance maths it replaces.

## 5. Figma, and what stops being comparable

The palette-regen cross-check that has caught real drift twice — 83 changed / 17
unchanged, agreed on both sides — currently compares strings. Once the repo
holds OkLCH and Figma holds RGB, that check has to convert before comparing, and
a tolerance appears where there was none (8-bit RGB cannot represent every 4dp
OkLCH value). Pick the tolerance deliberately: ±1 per channel after conversion
is the same bar `scripts/figma/p3-to-srgb.py` already self-checks against.

## 6. Open, and worth deciding before the first commit

1. **Achromatic hue.** `format_oklch` reports a hue for a colourless colour —
   `#ffffff` comes back as `oklch(1 0 90)`. It is valid CSS and renders
   correctly, because hue is ignored at chroma 0, but it ships a meaningless
   number into every neutral end, `absolute-white` and `absolute-black`. CSS has
   `oklch(1 0 none)`. Changing it moves goldens, so it wants its own cycle
   *before* the bulk conversion rather than after.
2. **Percentage or unitless L.** The engine emits unitless (`0.5557`). CSS
   accepts both; `oklch(55.57%)` is what most authoring tools show. Unitless
   matches the engine and avoids a second representation, which is the reason to
   keep it — recorded so it is a decision rather than an accident.
3. **Four decimal places.** Enough to round-trip 8-bit sRGB losslessly and
   short of noise. Worth confirming against the widest-gamut P3 values before
   committing, since those are the ones with something to lose.

## 7. Build order

1. Settle §6.1 (achromatic hue) on its own, goldens included.
2. Teach `regen-palette` to write `oklch()` / `oklch(… / a)`. Note its writer
   edits `palette.json` **line by line as text** — deliberately, to avoid
   `serde_json`'s `preserve_order` unifying across the workspace and silently
   reordering `primitiv-emit`'s output (RFC 0027 §5). An OkLCH value is longer
   and contains spaces, parens and a slash; the line rewriter needs to handle
   that, and the byte-identical check it already does is what proves it did.
3. Convert the 5 hand-held values in `intent.json` and `elevation.json`.
4. Re-emit; regenerate the 5 affected goldens.
5. Re-point `dark-mode-content.test.ts`'s helper at `L`.
6. Re-run the Figma cross-check with the §5 tolerance.
