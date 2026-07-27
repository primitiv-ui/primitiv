# RFC 0025 — Responsive breakpoints

> **Status:** **Draft — proposed.** Settled out of the docs-site wireframe
> planning discussion (2026-07-27); the scale and units are decided, the
> Figma design-frame presets are recorded, and the token-emission + hook work
> are scoped as a follow-on session (§4–5).
>
> **Author:** simonrevill, with architectural drafting.
> **Date:** 2026-07-27
> **Builds on:** RFC 0001 (token architecture — `breakpoint.*` was listed as a
> planned but unbuilt category, §"Deferred token categories"); RFC 0006
> (token & style pipeline — the three cascade-based emitted formats this
> extends, and the `rem`-at-16px convention `crates/primitiv-emit/src/value.rs`
> already uses for every other length token); RFC 0022 (layout primitives —
> flagged that `Container`/`Grid` want viewport responsiveness but "no
> breakpoint token scale exists yet," recommending non-responsive v1 rather
> than solving it unilaterally; this RFC is that scale).
> **Skills:** `docs-site-planning` (the docs-site work this originates from),
> `figma-wireframe-tokens` (frame-sizing conventions).

---

## 0. Summary

Primitiv has no breakpoint scale. This RFC settles one: a six-tier,
mobile-first, `min-width` set (`xxs` → `2xl`), emitted in `rem` for
consistency with every other length token, plus the matching Figma
design-frame presets to mock up screens against. It also records why the
scale needs a small JS-consumable numeric export alongside the emitted CSS
custom properties, and scopes (without building) a future public
`useMediaQuery` hook that consumes it.

## 1. The scale

Mobile-first, `min-width` media queries — base/unstyled styles are the
smallest tier, each named breakpoint is a floor, not a range. Content-driven
choices except `xxs`, which is deliberately device-representative rather than
tied to a specific layout shift (D1):

| Token | px | rem | Represents |
|---|---|---|---|
| `xxs` | 360 | `22.5rem` | current dominant small-Android viewport width — the narrowest tier worth designing for explicitly |
| `sm` | 640 | `40rem` | large phone / phone landscape |
| `md` | 768 | `48rem` | tablet |
| `lg` | 1024 | `64rem` | small laptop — typically where a persistent sidebar nav replaces a drawer |
| `xl` | 1280 | `80rem` | desktop |
| `2xl` | 1536 | `96rem` | wide desktop |

`sm`–`2xl` match Tailwind's default scale (D2). `xxs` is additive — a
Primitiv-specific tier the default Tailwind scale doesn't have.

## 2. Units — `rem`, not `px`

Every breakpoint value emits in `rem` against the same 16px base
`crates/primitiv-emit/src/value.rs` already uses for spacing, radius, and
type tokens (`format!("{}rem", trim(value / 16.0))`) — no new conversion
convention, just applying the existing one to a new category.

This is also the functionally correct choice, not just a consistency one:
`rem`-based media queries scale with a user's browser default-text-size
setting, so someone who has increased their default font size gets the
layout reflow at the equivalent *visual* width. `px`-based breakpoints don't
— they fire at the same raw pixel count regardless of the user's text-size
preference, which can leave a zoomed-in user stuck in a cramped "desktop"
layout.

## 3. Figma design-frame presets

Design frames use the breakpoint's `min-width` value as the frame width, set
to a "Hug"/unconstrained height rather than a fixed device height (except an
optional above-the-fold check frame per breakpoint):

| Frame name | Width |
|---|---|
| `<Page> — xxs (360)` | 360 |
| `<Page> — sm (640)` | 640 |
| `<Page> — md (768)` | 768 |
| `<Page> — lg (1024)` | 1024 |
| `<Page> — xl (1280)` | 1280 |

`2xl` is deliberately not a standard design frame — content typically just
gains whitespace above 1280–1440 rather than reflowing, so a dedicated mockup
there is usually not worth the upkeep. Only fully mock up the tiers where
structure actually changes (nav collapse, column count, table behaviour);
gaps in between are fluid and don't need their own frame.

## 4. Token emission (scoped, not built this session)

`packages/tokens/src/breakpoint.json` — a single-mode base document (like
`motion.json`/`elevation.json`, no light/dark split), one primitive tier:

```jsonc
{
  "breakpoint": {
    "xxs": { "$type": "dimension", "$value": "360" },
    "sm":  { "$type": "dimension", "$value": "640" },
    "md":  { "$type": "dimension", "$value": "768" },
    "lg":  { "$type": "dimension", "$value": "1024" },
    "xl":  { "$type": "dimension", "$value": "1280" },
    "2xl": { "$type": "dimension", "$value": "1536" }
  }
}
```

Emitted as `--primitiv-breakpoint-*` across the three cascade-based formats
(CSS/SCSS/Tailwind), same as every other base category. Tailwind is the
format where this is most directly usable as-is — the `screens` config takes
these exact numbers.

**A real limitation to design around:** CSS custom properties cannot appear
inside an `@media` condition, only inside a declaration value. So
`@media (min-width: var(--primitiv-breakpoint-sm))` is not valid CSS — a
hand-authored stylesheet has to write the literal (`@media (min-width: 40rem)`)
directly. The emitted `--primitiv-breakpoint-*` custom properties are still
useful (documentation, JS reads, Tailwind config generation), but they don't
make the breakpoint itself usable inside a raw `@media` block — that's a
CSS-language constraint, not a gap in the emitter.

Once this lands, it directly unblocks RFC 0022 §"Container/Grid" — the
non-responsive-v1 recommendation there was explicitly because no breakpoint
scale existed yet.

## 5. Future: a public `useMediaQuery` hook (deferred, not scoped by this RFC)

Recorded here as the motivating forward-looking use case, **not built or
scoped in detail this session**:

- A `useMediaQuery`-style hook so consumers of the styled registry components
  can respond to viewport size in JS (e.g. to further refine a component's
  `size`/`density` prop per breakpoint) — needed for the docs site itself,
  plausible as a public export.
- `packages/react` currently exports no public hooks — existing ones
  (`useCollection`, `useControllableState`, …) are internal implementation
  details of compound components. This would be a new kind of public surface,
  so the package boundary (a new `@primitiv-ui/hooks`/`@primitiv-ui/utils`
  package vs. a new export path on `@primitiv-ui/react`) is an open decision
  for that session, not settled here.
- `matchMedia` needs real numeric values — it cannot read a CSS custom
  property. So the hook needs the breakpoint values as a plain JS-consumable
  constant (a small generated export, e.g. `breakpoints.ts`/JSON) alongside
  the CSS custom properties in §4. This is narrower than the TS/JS token
  format dropped in RFC 0006 (D50) — that format failed because it inlined
  *aliasable* values that need the cascade to resolve theme/density; raw
  breakpoint numbers aren't aliases and don't have that problem.
- The hook needs an SSR guard (no `window`/`matchMedia` at module load,
  falling back to a default until mount), since the docs site is expected to
  be server-rendered or statically generated.
- Flagged as a possible first step toward general-purpose CSS layout
  utilities later — explicitly out of scope until the hook itself exists.

## 6. Decision log

- **D1 — `xxs` at 360, not 375.** 375 (iPhone SE-class) was the long-standing
  default; current small-viewport traffic skews toward 360 (dominant
  small-Android width) as the narrower, more representative floor. Chosen as
  a device-representative design-frame anchor, not a strict "layout changes
  here" breakpoint like the rest of the scale.
- **D2 — `sm`–`2xl` match Tailwind's default 5-tier scale exactly.** Chosen
  so Tailwind-based consumers of the emitted token layer get correct values
  with zero remapping; `xxs` is additive on top, not a divergence from the
  other five.
- **D3 — `rem`, 16px base, mobile-first `min-width`.** Consistent with every
  other length token in the emitter and with the accessibility rationale in
  §2; `min-width` (not `max-width`) composes better with the existing
  cascade-layer approach (RFC 0008).
- **D4 — no dedicated `2xl` Figma frame.** Content above `xl` typically gains
  whitespace rather than reflowing; a frame there is high-upkeep for little
  signal. Revisit per-page if a specific screen genuinely needs it.
- **D5 — the `useMediaQuery` hook and its package boundary are explicitly
  deferred**, recorded in §5 as the motivating future use case only. Building
  it, and deciding whether it lives in a new package, is a separate session's
  work, to happen after the token side (§4) and the Figma sync are done.
