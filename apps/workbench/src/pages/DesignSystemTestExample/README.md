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
