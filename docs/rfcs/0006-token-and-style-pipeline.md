# RFC 0006 — Token & style pipeline

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-09
> **Seeds from:** `docs/consumption-design.md` §5–§6.
> **Relates to:** RFC 0001 (token architecture — the layered token source);
> RFC 0004 (the styling contract + `--primitiv-*` custom-property API the output
> targets); RFC 0005 (the CLI that drives `tokens` / `theme` / `add`). Skills:
> `figma-token-sync`, `figma-variable-architecture`, `dark-mode-palettes`.

---

## 0. Summary

This RFC specifies how Primitiv's tokens become consumable artifacts, and how
the **polished default theme** (RFC 0004 §3.3, design doc §5.3) is authored and
emitted in every styling format. It is the engine behind RFC 0005's `tokens`,
`theme`, and the style half of `add`.

The moves:

1. **One source, many outputs.** The DTCG tokens in `@primitiv-ui/tokens`
   (synced from Figma) are transformed by a single **custom Rust emitter** in
   the CLI (D12) into **CSS custom properties (canonical), SCSS, a TS/JS token
   object, and a Tailwind preset — all four from day one** (D23).
2. **Names are the contract; values are free.** Consumers depend on the
   `--primitiv-*` names, never the literal values, so any value — most pointedly
   **dark-mode chroma** — can be refined later without a breaking change.
3. **Light theme + dark tokens in v1** (D24). The dark ramps already exist as
   Figma Intent Light/Dark modes; the emitter ships both token sets now, scoped
   for switching. No bespoke per-component dark CSS is authored yet, and dark
   values stay explicitly evolvable.
4. **One visual design, emitted per format.** The default theme is authored
   once against the canonical custom properties and emitted into each format;
   all formats look identical (design doc §5.4).
5. **Authored in the workbench** (D25). `apps/workbench`, which already renders
   every headless component, is extended with a styled preview so the
   Figma-sourced theme is built and eyeballed against the real components.

## 0.1 Scope

In scope: the transform pipeline, the output formats, theme generation via
Harmoni, the dark-mode model, and the style-authoring workflow. The styling
*contract* is RFC 0004; the CLI *commands* are RFC 0005; the Figma → DTCG sync
itself is the `figma-token-sync` skill and RFC 0001. This RFC consumes those.

---

## 1. Principles

### Principle 1 — One source of truth

Every output — CSS, SCSS, TS, Tailwind, the example styles, the theme — derives
from the DTCG tokens. No format is hand-maintained in parallel; divergence is
impossible by construction.

### Principle 2 — Names are stable, values are not

The public surface is the set of `--primitiv-*` custom-property *names* (RFC
0004 §3.3). Values behind them may change between releases. This is what lets
dark-mode polish, palette retuning, and density tweaks ship as non-breaking
value updates.

### Principle 3 — Dark is emitted, not finished

v1 emits the dark token set that already exists in Figma, and commits to
*keeping it updatable* rather than to its current perfection (the
`dark-mode-palettes` skill lists dark chroma/contrast work still open).
Consumers get working dark mode now and improvements for free later.

### Principle 4 — Author against the real components

The default theme is built where the headless components actually render (the
workbench), not in the abstract, so contract drift and visual regressions show
up immediately.

---

## 2. The pipeline

```
Figma variables ──(sync plugin, figma-token-sync)──► DTCG JSON
   (Intent: Light/Dark modes,                        (@primitiv-ui/tokens)
    Palette: Light/Dark, Context densities)                 │
                                                            ▼
                                          custom Rust emitter (in the CLI, D12)
                          ┌──────────────┬──────────────┬──────────────┐
                          ▼              ▼              ▼              ▼
                    CSS custom-      SCSS vars/     TS/JS token    Tailwind
                    properties        maps          object         preset
                    (canonical)                                   (+ recipes)
                          └──────────────┴──── consumed by ───────┘
                            the one default-theme design (authored once)
                                              │
                                              ▼
                            emitted per format → registry → `primitiv add`
```

---

## 3. Input — the DTCG tokens

### 3.1 What exists

`@primitiv-ui/tokens` already holds the DTCG JSON (`primitives`, `intent`,
`palette`, `context`, `interaction`), synced from Figma by the sync plugin and
routed through `dtcg.ts` (the `figma-token-sync` skill). The layered model —
primitives → intent → role → anatomy → interaction → component — is RFC 0001.
This RFC adds the *output* stage; it does not change the token architecture.

### 3.2 Light / Dark already present

Per `figma-variable-architecture`, the unified **Intent** collection has
**Light and Dark** modes, aliasing into a **Palette** collection that is itself
Light/Dark. So the dark token set is not new work — it is already in the source
and flows through DTCG. The emitter's job is to *surface* both modes (§5.2),
not to invent dark.

---

## 4. The emitter

### 4.1 Custom Rust, in the CLI (D12)

The transform is a custom emitter compiled into the CLI binary, parsing DTCG via
serde (rationale in RFC 0005 / design doc D12: single self-contained binary,
full control over the contract-specific output, and the layered model would need
custom Style Dictionary transforms anyway). `primitiv tokens --format <fmt>` is
a thin front-end over it.

### 4.2 Output formats — all four from day one (D23)

| Format | Output | Notes |
|---|---|---|
| **CSS** | `--primitiv-*` custom properties | **Canonical.** Everything else is an adapter over these. |
| **SCSS** | SCSS variables / maps + the same selectors | Resolves to the CSS custom properties; gives SCSS-pipeline users `$`-vars and maps. |
| **TS/JS** | a typed token object | For tokens-in-code (JS styling, theming the React layer, tooling). |
| **Tailwind** | a preset/config + per-component recipes | Tailwind **v4 is CSS-variable-native**, so the preset largely *is* the custom properties plus a `@theme` mapping — a thin, natural adapter. |

One emitter, four serialisers; identical values across all (design doc §5.4).

### 4.3 Namespacing

Two custom-property namespaces, per RFC 0004 §3.3:

- **Theme tokens** — `--primitiv-<token-path>` (e.g. `--primitiv-color-primary`).
  The global re-skin surface.
- **Per-component API** — `--primitiv-<component>-<part>` (e.g.
  `--primitiv-button-bg`), defaulting to theme tokens.

---

## 5. Theme generation (Harmoni)

### 5.1 Brand → palette → token overrides

`primitiv theme --brand "#0a7755"` links `harmoni-core` natively to derive a
contrast-checked palette and emit it as **theme-token overrides** (the
`--primitiv-<token-path>` layer) in the chosen format. Because the example
styles resolve those properties, a generated palette re-skins every component
without touching component CSS — the canonical re-skin path of design doc §5.3
(D11). The default value of the primary token is Primitiv's own primary; the
brand flag overrides it.

### 5.2 Light + dark (D24)

The emitter surfaces both Intent modes. Default switching mechanism: a
`[data-theme="dark"]` scope (explicit, toggleable, SSR-safe), with an opt-in
`@media (prefers-color-scheme: dark)` variant.

```css
:root,
[data-theme="light"] { --primitiv-color-bg: #fff;  /* … */ }
[data-theme="dark"]   { --primitiv-color-bg: #111;  /* … */ }
```

`primitiv theme` emits the dark set alongside the light one. **No bespoke
per-component dark CSS is authored in v1** — components read the variables, so
the dark token set re-skins them automatically.

### 5.3 Dark stays evolvable

Per Principle 2/3: dark values (chroma especially) are expected to improve as
the deferred dark engine work lands (`dark-mode-palettes` skill). Those land as
value updates to the same `--primitiv-*` names — non-breaking for consumers.
This is the explicit "let dark be updated in future" guarantee.

---

## 6. Example styles — one design, many formats

### 6.1 Authored once, emitted per format

The per-component default theme is authored once against the canonical custom
properties, then emitted into each format the consumer can choose (design doc
§5.4):

- **CSS** — contract selectors (RFC 0004 §3.1) reading `--primitiv-*`.
- **SCSS** — the same design exposed through the SCSS token output.
- **Tailwind** — a recipe over the preset; utilities resolve to the same
  custom properties.

We maintain *one* visual design, not N stylesheets.

### 6.2 Ported from Figma (source of truth)

The default theme's look is **ported from Figma**, the source of truth for the
whole system (design doc §5.3). Because both the tokens and the theme originate
in Figma, the styles and the values they consume cannot drift from the design.

### 6.3 Dependency on the token layer

A component's example styles resolve `--primitiv-*`, so they require the token
output to be present. The registry entry declares `tokens: true` (RFC 0005
§4.4/§6.2) and `add` ensures the token layer is emitted before copying styles.

---

## 7. Authoring & the workbench (D25)

The polished default theme is authored and visually checked by **extending
`apps/workbench`** — which already renders every headless component — with a
styled preview surface per component.

- **Why the workbench:** the components already mount there with their real
  contract attributes, so styling against the contract and catching drift is
  immediate; no second harness to build.
- **CLAUDE.md note:** this is a *conscious* exception to "leave the workbench
  alone." It fits the workbench's stated purpose (an iteration surface), and
  the styled preview is iteration, not a production surface — but it is a
  deliberate expansion and is recorded as such here.
- **Global-CSS bundling gotcha:** every workbench example's CSS is bundled
  globally (`workbench-examples` skill), so the styled preview must scope every
  selector to the contract classes (which it does by construction).

---

## 8. CLI surface (recap)

Specified in RFC 0005; listed here for the pipeline's entry points:

- `primitiv tokens --format <fmt>` — emit the token layer (§4).
- `primitiv theme --brand <hex> [--dark]` — Harmoni palette → theme overrides
  (§5).
- `primitiv add <component>` — copies the per-format example styles (§6),
  resolving the token-layer dependency.

---

## 9. What this RFC does not cover

- The styling **contract** itself — RFC 0004.
- CLI command details, flags, `primitiv.json`, refresh/wiring — RFC 0005.
- The Figma → DTCG **sync** mechanism and `dtcg.ts` routing — `figma-token-sync`
  / RFC 0001.
- The deferred dark **engine** work (contrast auditing, dark chroma scale) —
  `dark-mode-palettes` skill; this RFC only commits to *emitting and updating*
  dark, not finishing it.

---

## 10. Open questions

1. **Dark switch selector.** Confirm `[data-theme="dark"]` as canonical (vs
   `.dark` class) and whether the `prefers-color-scheme` variant is emitted by
   default or opt-in.
2. **TS token object shape.** Flat (`tokens['color.primary']`) vs nested
   (`tokens.color.primary`), and whether it ships as part of `@primitiv-ui/tokens`
   or is emitted by the CLI like the other formats.
3. **Tailwind version target.** v4-first (CSS-variable-native, simplest) vs
   also supporting v3 (`theme.extend` JS config) for the Tailwind output.
4. **Theme output location.** Does `primitiv theme` write a separate overrides
   file or merge into the emitted token file? (Likely a separate file, layered
   after the base tokens.)
5. **Workbench styled-preview shape.** One combined themed gallery vs a styled
   variant of each existing per-component example page.
6. **CSS Modules output — parked.** Not a v1 format (the four of D23 stand). CSS
   Modules only localises *class names*; the contract's `data-*` and `--primitiv-*`
   layers are global and module-safe, so the only friction is the root/modifier
   **class** layer. Whether a clean `.module.css` emit is even possible hinges on
   an RFC 0004 decision — *does the headless component hard-emit a fixed root
   class (→ needs `:global()`, awkward) or rely on a consumer-applied
   `className` (→ modules work naturally)?* Until that's settled, module projects
   are served by importing the global `.css`/`.scss` contract stylesheet once at
   the root while keeping modules for their own components. Revisit once the
   contract's class-emission is pinned down.

---

## 11. Decision record

| # | Decision | Maps to |
|---|---|---|
| 1 | One Rust emitter (in the CLI) transforms DTCG → all outputs | D12 |
| 2 | v1 emits **all four** formats: CSS (canonical), SCSS, TS/JS, Tailwind | D23 |
| 3 | Public surface is `--primitiv-*` **names**; values (incl. dark) may change non-breakingly | D6, Principle 2 |
| 4 | v1 ships **light theme + dark tokens** (already in Figma Intent modes); no bespoke per-component dark CSS; dark values stay evolvable | D24 |
| 5 | Dark switch via `[data-theme="dark"]` scope (+ opt-in `prefers-color-scheme`) | §5.2 |
| 6 | One visual design, emitted per format; all formats identical | D6 |
| 7 | `primitiv theme` (Harmoni) emits theme-token overrides re-skinning via custom properties | D11 |
| 8 | Default theme authored by **extending `apps/workbench`** with a styled preview (conscious CLAUDE.md exception) | D25 |
