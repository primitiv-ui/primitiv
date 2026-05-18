# Design System Test

A workbench experiment that drives a dense, desktop-only dashboard UI
entirely from a single Harmoni-generated palette (light + dark ramps),
to check that the generated colours produce an accessible, good-looking
interface in both themes. A switch in the top bar flips the whole page
between light and dark via a `data-theme` attribute on the page root.

## 10-step colour application model

Harmoni ramps have **10 steps** (`50`–`900`). This page adapts the
12-step [Radix Colors](https://www.radix-ui.com/colors) use-case model
down to a strict 10-step scale by merging the two redundant pairs:

- _App background_ + _Subtle background_ collapse into one base-background
  step.
- _UI element border_ absorbs its _hovered_ variant.

Each remaining use case then maps 1:1 onto a ramp step. The neutral scale
inverts between themes; the Primary-Dark ramp is generated pre-inverted
(step `50` darkest → `900` lightest), so the accent scale is a plain
ascending map in both themes.

| Step | Use case | Neutral light | Neutral dark | Accent light | Accent dark |
|------|----------|---------------|--------------|--------------|-------------|
| 1 | App / base background | neutral 50 | neutral 900 | primary-light 50 | primary-dark 50 |
| 2 | UI element background | neutral 100 | neutral 800 | primary-light 100 | primary-dark 100 |
| 3 | Hovered UI element background | neutral 200 | neutral 700 | primary-light 200 | primary-dark 200 |
| 4 | Active / selected UI element background | neutral 300 | neutral 600 | primary-light 300 | primary-dark 300 |
| 5 | Subtle borders and separators | neutral 400 | neutral 500 | primary-light 400 | primary-dark 400 |
| 6 | UI element border & focus ring (incl. hover) | neutral 500 | neutral 400 | primary-light 500 | primary-dark 500 |
| 7 | Solid background | neutral 600 | neutral 300 | primary-light 600 | primary-dark 600 |
| 8 | Hovered solid background | neutral 700 | neutral 200 | primary-light 700 | primary-dark 700 |
| 9 | Low-contrast text | neutral 800 | neutral 100 | primary-light 800 | primary-dark 800 |
| 10 | High-contrast text | neutral 900 | neutral 50 | primary-light 900 | primary-dark 900 |

Text and icons placed on the accent solid (step 7) use `--accent-contrast`:
`--white` in light mode, `--black` in dark mode.

## Token layers

`DesignSystemTestExample.scss` declares three layers on the `.ds-test`
root:

1. **Raw palette** — the literal generated `oklch()` values, plus
   `--white` / `--black`. Theme-agnostic; never consumed by component
   rules.
2. **Semantic scale** — `--neutral-1`…`--neutral-10` and
   `--accent-1`…`--accent-10`, one use case per step (the table above).
   Re-pointed under `.ds-test[data-theme="dark"]`.
3. **Friendly aliases** — readable names over the semantic scale
   (`--bg`, `--surface`, `--border`, `--text`, `--accent-solid`, …).

Every colour on the page resolves through this scale — no literal colour
values are used in component rules.

## Evaluation — how the generated ramps performed

First run, against a single purple palette (one hue, low-chroma harmony
tint). The dashboard was assembled and themed entirely from the generated
ramps with **no manual colour correction** — that on its own is a good
result. Detailed observations below.

### What worked well

- **Accent ramp.** The purple reads as a confident brand colour in both
  modes. Subtle accent tints (active nav item, the "Deployment complete"
  alert) are harmonious and clearly lower-emphasis than the solid. The
  `--accent-contrast` flip (white in light, black in dark) keeps text on
  the accent solid legible in both themes.
- **Dark-mode generation.** The anchored dark ramp keeps backgrounds
  genuinely dark and surfaces/borders cleanly separated — no muddy
  mid-greys. The dashboard did not need a hand-tuned dark palette.
- **Borders.** Semantic steps 5–6 give quiet but visible separators and
  focus rings in both themes.

### What needs attention

1. **No comfortable mid-contrast text tier.** "Low-contrast text"
   (step 9) and "high-contrast text" (step 10) both land at the extreme
   dark end of the neutral ramp (neutral 800/900 in light), so secondary
   labels like "REVENUE" read at almost full strength — there is no
   genuinely *muted* text. The ramp **does** contain mid steps
   (neutral 600/700 ≈ 5–9:1 on the page background), but the use-case
   model routes those to solid backgrounds instead of text.
2. **Low-emphasis surfaces sit too heavy.** The neutral (non-accent)
   alert uses step 4. In dark mode that is a fairly light mid-grey that
   competes for attention; a genuinely "subtle" neutral background wants
   step 2–3.
3. **The harmony tint is imperceptible.** The neutral ramp carries a
   ~0.0095-chroma tint from the purple — visually indistinguishable from
   pure grey. If tint-for-harmony is a goal, the generated chroma is too
   low to have any effect; if it is not, the tint is inert.
4. **Brand weight shifts between modes.** The dark accent solid
   (primary-dark 600, L≈0.65) is noticeably lighter/softer than the light
   one (primary-light 600, L≈0.44). Both are legible — this is expected
   from the anchored two-segment dark model — but the brand reads
   "lighter" in dark mode. Flagged so it stays a conscious trade-off.

### Caveats

- Findings **1 and 2 are use-case-model decisions, not generation
  defects.** The 10-step model here was deliberately quick. Before
  attributing anything to the generator, the model's step→use-case
  assignment (especially text and subtle-background steps) should be
  tuned.
- This is a **single palette** — one hue, one tint. Re-check against a
  warm hue and a low-chroma/near-grey brand before drawing general
  conclusions about the generator.

### Recommended next steps

- Tune the use-case model: route a mid step to "low-contrast text" and
  pull "subtle background" lighter.
- Consider generating ramp steps against explicit per-step WCAG contrast
  targets rather than a pure lightness curve, so a usable secondary-text
  step is guaranteed.
- Re-run this dashboard with 2–3 more generated palettes (warm, cool,
  near-grey brand) to separate generator behaviour from model/mapping
  behaviour.
