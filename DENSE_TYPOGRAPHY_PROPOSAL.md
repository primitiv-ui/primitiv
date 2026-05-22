# Dense typography layer — proposal

A fourth `typography.dense` tier for `packages/tokens/src/semantic.json`,
sitting **below** `compact`. Designed to support the
`harmoni-figma-plugin` design work (480px plugin window, small UI
controls and tightly-packed rows) while remaining usable as a "dense"
size variant for the Primitiv Design System at large.

> **You decide; the table proposes.** This document is a proposal,
> not a fait accompli. The recommended ratio is in
> "Chosen ratio — strict Minor Second". Two alternative ratios are
> documented at the bottom in case the chosen one feels too flat
> when implemented as Figma text styles.

## Existing layers — at a glance

| Variant | Body.xs | Body.base | h6 | h1 | Display.xl | Heading range (h6 → h1) | Heading per-step ratio |
|---|---|---|---|---|---|---|---|
| `compact` | 12 | 16 | 18 | 32 | 40 | 1.78× | ~1.122 (≈ Major Second) |
| `comfortable` | 12 | 16 | 20 | 48 | 68 | 2.40× | ~1.192 (≈ Minor Third) |
| `spacious` | 12 | 16 | 20 | 88 | 160 | 4.40× | ~1.345 (≈ Perfect Fourth) |

Body and UI sizes are nearly identical across the three; differentiation
is almost entirely in the heading and display tiers. Dense breaks that
pattern — it scales the body and UI down as well, so it's
meaningfully smaller across the board.

> **Note on `body.base`.** Across Compact / Comfortable / Spacious,
> `body.base` is **always 16px**, deliberately aligned with the
> browser default and the standard web-typography convention. Dense
> breaks that convention on purpose: in a 480px plugin window, 16px
> body text would dominate the layout, leaving no room for the dense
> control surface the plugin needs. Outside the plugin, Dense is the
> right pick only when its consumer accepts the same trade-off.

## Required new primitives

Dense cannot be built from the existing primitive set
(`12, 14, 16, 18, 20, 22, 24, 26, …`). It needs the following added
to `packages/tokens/src/primitives.json`:

### `font-size` — add five

| New token | Used for |
|---|---|
| `font-size.10` | body.xs, body.overline |
| `font-size.11` | body.sm, ui.label, ui.button |
| `font-size.13` | body.lg, heading.h6 |
| `font-size.15` | heading.h4 |
| `font-size.17` | heading.h2 |

### `line-height` — add two

| New token | Used for |
|---|---|
| `line-height.12` | body.xs, body.overline |
| `line-height.14` | body.sm, ui.label, ui.button |

All other Dense aliases (`14`, `16`, `18`, `20`, `22`, `24`, `28`) reuse
existing primitives, so the addition is non-breaking — existing
variants keep working unchanged.

## Dense scale — full token table

Every row maps directly to a semantic token under
`typography.dense.<category>.<tier>` with the same four properties as
the existing variants: `font-family`, `font-weight`, `font-size`,
`line-height`.

### `body`

| Tier | font-family | font-weight | font-size | line-height | Use |
|---|---|---|---|---|---|
| `xs` | `serif` | `regular` | **10** | **12** | Tiny captions, step labels under swatches, contrast ratios inside swatches |
| `sm` | `serif` | `regular` | **11** | **14** | Default secondary body in dense rows |
| `base` | `serif` | `regular` | `12` | `16` | Primary body text |
| `lg` | `serif` | `regular` | **13** | `16` | Emphasised body / leading sentence of a section |
| `overline` | `sans` | `medium` | **10** | **12** | Uppercase section labels (`NEUTRAL`, `BRAND`, `APPLY TO FIGMA`) |

### `ui`

| Tier | font-family | font-weight | font-size | line-height | Use |
|---|---|---|---|---|---|
| `label` | `sans` | `semibold` | **11** | **14** | Form labels next to dense controls |
| `button` | `sans` | `semibold` | **11** | **14** | Button text in dense buttons |

### `heading`

Strict Minor Second progression from **13**.

| Tier | font-family | font-weight | font-size | line-height | Step ratio |
|---|---|---|---|---|---|
| `h6` | `sans` | `semibold` | **13** | `16` | — |
| `h5` | `sans` | `semibold` | `14` | `16` | 1.077 |
| `h4` | `sans` | `semibold` | **15** | `20` | 1.071 |
| `h3` | `sans` | `semibold` | `16` | `20` | 1.067 |
| `h2` | `sans` | `semibold` | **17** | `20` | 1.063 |
| `h1` | `sans` | `semibold` | `18` | `24` | 1.059 |

**Heading range:** `13 → 18` = **1.385×** over 5 steps. Geometric mean
per-step ratio: **1.067** (= the canonical Minor Second).

### `display`

Sized so `display.lg` is ~`h1 × 1.111` and `display.xl` is
~`display.lg × 1.1` — the same ratio Compact uses between its tiers.

| Tier | font-family | font-weight | font-size | line-height |
|---|---|---|---|---|
| `lg` | `sans` | `medium` | `20` | `24` |
| `xl` | `sans` | `medium` | `22` | `28` |

> **Bold** values are new primitives required (see "Required new
> primitives" above). Everything else aliases an existing token.

## Chosen ratio — strict Minor Second (≈ 1.067)

Dense uses a **Minor Second** musical ratio (1.067 per step). This is
the tightest typographic ratio commonly used and matches what you
asked for in the planning questions.

### Where it sits in the family

| Variant | Ratio | Musical name |
|---|---|---|
| **`dense`** (proposed) | **~1.067** | **Minor Second** |
| `compact` | ~1.122 | Major Second |
| `comfortable` | ~1.192 | Minor Third |
| `spacious` | ~1.345 | Perfect Fourth |

### Why Minor Second for Dense

- **Plugin UI is dense by definition.** At 11–13px the eye loses the
  ability to distinguish dramatic size jumps; weight and colour do
  most of the hierarchy work. A tighter ratio matches that reality.
- **Heading-to-body relationship stays calm.** With h1 = 18 and
  body.base = 12, an h1 reads as "a heading" without dominating the
  cramped layout. Compact's 32 / 16 ratio would feel shouty in a
  480px window.
- **Symmetry with the musical family.** Compact = Major Second,
  Comfortable = Minor Third, Spacious = Perfect Fourth — Dense
  slotting in as Minor Second gives the four-variant ladder an
  even, recognisable progression you can explain in one sentence.

### Trade-offs to be aware of when you test it

- **Visual hierarchy between heading tiers is subtle** (h2 vs h1 is
  only 1px). Plan to lean on `font-weight`, `text-transform`,
  or colour to disambiguate, especially between h4/h3/h2.
- **`display` tier exists for parity** with the other variants, but
  Dense will rarely need it in practice. Keep it in the schema so
  consumers of the design system get a complete size-variant set.
- **The body lg/base difference is just 1px** (13 vs 12). It still
  reads as different in semibold sans contexts (button vs label),
  but in serif body copy the distinction is more felt than seen.

## Alternative ratios — fall back to these if 1.067 feels too flat

If the Minor Second turns out to compress hierarchy too much in
practice (e.g. h1 vs h6 doesn't feel meaningful enough even with
weight/colour helping), here are two looser ratios that still feel
tighter than Compact.

### Option B — Tight Major Second (~1.10)

A halfway compromise between Minor Second (1.067) and Compact's
Major Second (1.122). Heading scale `13 → 21` instead of `13 → 18`.

| Tier | font-size | line-height |
|---|---|---|
| `h6` | 13 | 16 |
| `h5` | 14 | 16 |
| `h4` | 16 | 20 |
| `h3` | 17 | 20 |
| `h2` | 19 | 24 |
| `h1` | 21 | 24 |

Range: `13 → 21` = **1.615×**, per-step **1.100**.

Adds two more primitives: `font-size.19` and `font-size.21`. Body,
ui, and display can stay as proposed above.

**Pick this if:** Strict Minor Second feels too flat in real
component design, but you still want noticeably tighter than Compact.

### Option C — Same ratio as Compact (~1.122), differentiated by floor

Use Compact's exact heading ratio but shifted down. Heading scale
`13 → 23` mirrors Compact's `18 → 32` shape but at smaller sizes.

| Tier | font-size | line-height |
|---|---|---|
| `h6` | 13 | 16 |
| `h5` | 15 | 20 |
| `h4` | 17 | 20 |
| `h3` | 19 | 24 |
| `h2` | 21 | 28 |
| `h1` | 23 | 28 |

Range: `13 → 23` = **1.769×**, per-step **1.122** — identical to
Compact in feel, just smaller.

Adds three more primitives: `font-size.19`, `font-size.21`,
`font-size.23`.

**Pick this if:** You'd rather Dense feel like "Compact, but
smaller" without changing the scale curve at all — easiest mental
model for design-system consumers, but the least differentiated.

## Summary diff against `compact`

| Aspect | Compact | Dense (recommended) |
|---|---|---|
| body.xs / overline | 12 | **10** |
| body.sm | 14 | **11** |
| body.base | 16 | **12** |
| body.lg | 18 | **13** |
| ui.label / button | 16 | **11** |
| h6 | 18 | **13** |
| h1 | 32 | **18** |
| display.xl | 40 | **22** |
| Heading per-step ratio | 1.122 | **1.067** |
| Heading range (h6 → h1) | 1.78× | **1.385×** |
| New primitives required | 0 | **7** (5 font-size, 2 line-height) |

## Next step

This document is the proposal. Once you've reviewed it:

1. **Add the new primitives** (5 `font-size`, 2 `line-height`) in
   Figma's `Primitives` collection. Use the
   `primitiv-sync-figma-plugin` to back them up to
   `packages/tokens/src/primitives.json`.
2. **Create the `typography.dense.*` text styles** in Figma's
   `Typography / Dense` collection (or whatever the naming convention
   becomes — current convention is `Typography / Compact` etc.).
3. **Update `routeCollection`** in `packages/tokens/src/dtcg.ts` if
   the new collection name doesn't match the existing regex.
4. **Run the backup cycle** (see `packages/tokens/README.md`) and
   commit the updated `semantic.json` / `primitives.json`.
5. **Assess in real components.** If h1↔h6 contrast feels weak when
   designing plugin components, swap to Option B (Tight Major
   Second) and back up again.
