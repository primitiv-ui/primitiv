# Primitiv Consumption Layer — Design Doc

> **Status:** Working draft (for review)
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-09
> **Seeds:** RFC 0004 (distribution + styling contract), RFC 0005 (CLI),
> RFC 0006 (token & style pipeline)

---

## 0. Summary

This document designs the **consumption layer** of Primitiv — how an
external consumer (human or agent) installs and configures the design
system: the tokens, the headless React library, the Harmoni engine, and
the example styles. Publishing itself is a solved, mechanical process
(`.github/workflows/publish.yml`); this doc is about the *shape of the
experience*, not the plumbing.

The key decisions, all settled in the 2026-06-09 design discussion:

1. **A hybrid distribution model split on the logic/style seam.**
   Component *logic* ships as versioned npm/JSR packages
   (`@primitiv-ui/react`, `/icons`, `/tokens`). Component *styles* are an
   **opt-in, copy-in** layer delivered by a CLI from a registry. We do
   **not** ship a second "styled components" package.
2. **A documented styling contract** — a root identifier class plus the
   `data-*` state attributes the headless components already emit — is the
   surface the example styles target. Styles couple to the contract, not
   to Primitiv internals, which is what makes them portable.
3. **Example styles are copy-in editable source**, owned by the consumer
   once installed. They are a **polished default theme** (not a throwaway
   starting point), authored per-component against the token layer and
   **ported from Figma, the source of truth for the whole system**.
4. **One look, many formats.** Example styles are offered in the
   consumer's chosen format (CSS, SCSS, Tailwind, …). All formats are
   derived from the same Primitiv design tokens / CSS custom properties
   and are visually identical. Flexibility is the headline feature.
5. **A Rust CLI is the orchestrator.** It is interactive for humans and
   fully flag-driven / `--json` for agents. A durable `primitiv.json`
   records the consumer's choices so every re-run is deterministic.
6. **A static registry** — `registry.json` plus the style files, served
   from the repo/CDN, no backend — backs the CLI and doubles as the
   machine-readable manifest for agents.

The Button is worked end-to-end in the appendix as the canonical example.

---

## 1. Current state

What a consumer could grab *today*, and the gaps this design fills.

- **Three packages exist** under `packages/`: `@primitiv-ui/react`
  (headless), `@primitiv-ui/icons`, `@primitiv-ui/tokens` (DTCG JSON).
  All are currently `private: true`, `version 0.0.0`, with source-first
  `exports` pointing at `./src/*.ts`. Publish-readiness is tracked in
  `RELEASING.md` and is out of scope here.
- **`@primitiv-ui/react` is purely headless.** There is no CSS anywhere
  in `packages/`. The only styling that exists lives in `apps/workbench`
  example pages and on the Figma side.
- **Tokens are DTCG JSON** sourced from Figma via the sync plugin. They
  are **not yet transformed** into any consumable format (no CSS custom
  properties, no SCSS, no TS object).
- **The React barrel is a single `.` export.** No per-component subpaths.
- **No CLI exists.**
- **`docs/rfcs/` already holds 0001–0003** with a settled house style.

The headline consequence: the "styles" Developers 2 and 3 want **do not
exist as an artifact yet**. This is a build-and-then-distribute problem,
not a packaging problem — which is why the styling contract and the
token→style pipeline (sections 4 and 6) carry most of the design weight.

---

## 2. Consumer profiles

The four profiles that drive the design. Not exhaustive, but they bracket
the requirement space.

| # | Profile | Wants | Primary mechanism |
|---|---|---|---|
| **Dev 1** | Has own styling system | Headless components only, possibly a subset | **Package.** `pnpm add @primitiv-ui/react`; subset via tree-shaking / subpaths |
| **Dev 2** | No styling system | The complete solution — headless + tokens in their format + ready styles | **Package + CLI scaffold.** Tokens emitted in chosen format; example styles copied in |
| **Dev 3** | Has a library (e.g. Radix) | Just the *styles* for one / some / all components | **Registry copy-in, à la carte**, against the styling contract |
| **Agent** | Serving a user's project | To evaluate fit and install exactly what's needed, deterministically | **Static registry manifest + non-interactive CLI** |

The same source of truth serves all four; they differ only in *which
layers* they take and *how* they take them.

---

## 3. The hybrid distribution model

There are two distribution models in this space, and the design tension is
the temptation to pick exactly one:

- **Package model** (versioned npm/JSR install): dependency-managed,
  tree-shaken, centrally patchable. Right for *logic* — the a11y, keyboard,
  focus, and roving-tabindex behaviour in `@primitiv-ui/react` is real and
  must not be copy-pasted into thousands of repos where a bugfix can never
  reach it.
- **Registry / copy-in model** (shadcn-style): a CLI writes source into the
  consumer's repo; they own and edit it. Right for *styles* — visual
  customisation is the whole point, and CSS is inseparable from the
  consumer's build (Tailwind? SCSS? plain CSS?).

**Decision: be a deliberate hybrid, split on the logic/style seam.**

- **Logic = versioned package.** `@primitiv-ui/react` stays the headless
  engine. Fixes ship as version bumps. (Likewise `/icons`, `/tokens`.)
- **Styles = opt-in copy-in.** The CLI/registry delivers example styles
  *into* the consumer's repo, targeting the package's styling contract.

This is precisely what a pure shadcn model *cannot* do (it has no runtime
package) and what a pure component library *will not* do (it locks you into
its styling). Primitiv's unique position — a genuine headless engine plus a
token engine (Harmoni) underneath — is what makes the hybrid both possible
and the differentiator.

**Explicitly rejected:** shipping a second `@primitiv-ui/react-styled`
package. Styles are opt-in copy-in, not a parallel install.

---

## 4. The styling contract

Because CSS is coupled to DOM structure and component state, "give me
Primitiv's Button styles for my component" only works if both sides expose
the **same styling surface**. The contract *is* that surface.

**Decision: the contract has four parts — a root class, modifier classes,
the `data-*` state attributes, and a CSS custom-property API.**

- A **root class** identifies the component: `.primitiv-button`,
  `.primitiv-tabs`.
- **Modifier classes** express *purely visual variants the headless layer
  does not model* — tone/intent, size, emphasis: `.primitiv-button--primary`,
  `.primitiv-button--lg`, `.primitiv-tabs--underline`. Applied by the consumer
  (or by a copied-in recipe).
- **`data-*` attributes** express *state and behavioural options the headless
  layer already emits*: `data-state`, `data-disabled`, `data-loading`,
  `data-orientation` (the `data-*` styling surface from the
  `react-component-patterns` conventions). Styling reads these automatically;
  the consumer wires nothing.
- A **CSS custom-property API** per component (`--primitiv-*`) is the themable
  seam (see section 5).

```css
.primitiv-tabs { /* base, reads tokens via --primitiv-tabs-* */ }
.primitiv-tabs--underline { /* visual variant → a modifier class */ }
.primitiv-tabs[data-orientation="vertical"] { /* behavioural → a data attr */ }
.primitiv-button[data-disabled] { /* state → a data attr */ }
```

**The data-vs-modifier rule.** If the headless component already reflects it —
orientation flips keyboard navigation, `disabled`, open/closed state — style
the **`data-*`** attribute; it is emitted for free and stays in sync with
behaviour. If it is a look-only choice the headless layer does not know about —
intent colour, size, emphasis — use a **modifier class**. This is the
cva/shadcn convention and keeps *one*, not two, ways to express each thing.
(So vertical tabs are `[data-orientation="vertical"]`, **not**
`.primitiv-tabs--vertical` — orientation is behavioural.)

Why this and not plain BEM-style classes or pre-styled wrappers:

- **Decouples style from logic.** The CSS targets a documented contract,
  not Primitiv's component internals.
- **Minimal wiring.** Consumers add one root class; state styling is
  automatic because the attributes are already there.
- **Serves Dev 3 honestly.** Any component that emits the same contract —
  including Radix, which largely follows the same `data-*` conventions —
  can reuse the CSS. Framed honestly: this is *best-effort, contract-
  documented*, not magic. Perfect on Primitiv-headless; "to the degree your
  component emits the contract" elsewhere.

**Deliverable:** every component documents its contract — root class, the
`data-*` states it sets, its part/slot names, and its `--primitiv-*` custom
properties. This contract doc is what both the example CSS and external
consumers code against.

---

## 5. Example styles

The opt-in styled layer. Four sub-decisions, all settled.

### 5.1 Opt-in, with format choice

The CLI **first asks whether** the consumer wants example styles for a
component, and **only then asks the format** (CSS, SCSS, Tailwind, …). A
consumer who wants headless-only never sees a style file. The chosen format
is recorded in `primitiv.json` as the project default; it can be overridden
per `add`.

### 5.2 Ownership — copy-in editable source

Installing example styles **writes editable source files into the
consumer's repo** (e.g. `src/styles/primitiv/button.css`). The consumer
owns them and may edit freely. There is **no silent auto-update**; re-running
`add` refreshes / diffs the files deliberately. This matches the
"styles = copy-in" seam and maximises flexibility.

> **To pin down (see §11):** the exact refresh behaviour on re-add —
> overwrite, three-way diff, or skip-if-modified.

### 5.3 Positioning — polished default theme, ported from Figma

Example styles are a **production-quality default theme**, not a throwaway
reference. They are:

- **Authored per-component** by hand and visually tested — likely in the
  existing `apps/workbench` (which already renders the headless components),
  extended with a styled preview surface.
- **Ported straight from Figma**, the source of truth for the entire
  Primitiv Design System. The Figma variables already back the token layer
  (via the sync plugin → DTCG JSON), so the default theme and the tokens
  share one origin and cannot drift.
- **Re-skinned primarily via token / CSS-custom-property overrides**, not by
  editing component CSS — though, because the source is copied in and owned,
  deep edits remain available as an escape hatch.

This justifies investing in the token/theming layer (section 6): the
default theme stays stable while consumers recolour and re-scale through
tokens.

**Default primary colour.** The default theme ships with Primitiv's own
primary colour as the default value of the primary token (e.g.
`--primitiv-color-primary`), regardless of format — design tokens, a Tailwind
theme config, or otherwise. It is the *default, not a lock-in*. A consumer
overrides it however they like: their own CSS custom properties, a palette
generated from the **Harmoni** Rust library or the Harmoni Figma plugin, or any
other method. Because Harmoni derives a full, contrast-checked palette from a
single brand colour, the canonical re-skin path is "set your brand colour →
regenerate the palette with Harmoni → override the token set" — but nothing
forces it; a hand-edited custom property works just as well.

### 5.4 One look, many formats

A consumer picks the format that fits their stack; **all formats look
identical** because they are all derived from the same Primitiv design
tokens / CSS custom properties:

- **CSS** — custom properties + the contract selectors. The canonical form.
- **SCSS** — same output, exposed as SCSS variables/mixins over the tokens.
- **Tailwind** — a Tailwind **preset/config generated from the tokens** plus
  the component recipes; utilities resolve to the same custom properties.
- **(future)** CSS Modules, vanilla-extract, etc. — added as further
  generated adapters over the one token source.

Authoring implication: the per-component default theme is built once
against the token layer, then **emitted into each format** by the pipeline.
We maintain *one* visual design, not N hand-written stylesheets.

---

## 6. The token & style pipeline

The engine behind sections 4 and 5. One source of truth, many outputs.

```
Figma variables ──(sync plugin)──► DTCG JSON (@primitiv-ui/tokens)
                                        │
                                        ▼
                            token transform / emitter
                          ┌─────────────┼─────────────┐
                          ▼             ▼             ▼
                   CSS custom-     SCSS vars     Tailwind preset
                   properties                    + TS/JS object
                          │             │             │
                          └─────► consumed by ◄───────┘
                          per-component example styles (one design)
                                        │
                                        ▼
                          emitted per format into the registry
```

- **Input:** the DTCG JSON already in `@primitiv-ui/tokens`.
- **Transform — lean toward a custom emitter over Style Dictionary.** The CLI
  is Rust and the goal is a single self-contained binary (section 7); a Rust
  emitter living *in* the CLI gives `primitiv tokens` and `primitiv theme` with
  zero Node dependency, whereas Style Dictionary forces either a bundled Node
  runtime or a separate JS build step the Rust CLI shells out to — both
  undercut the single-binary story. Primitiv's layered token model
  (primitives → intent → role → anatomy → interaction → component, plus density
  contexts — RFC 0001) is bespoke enough that you would be writing custom Style
  Dictionary transforms anyway, and a custom emitter gives full control over the
  contract-specific output (`--primitiv-*` naming, the per-component
  custom-property API). DTCG is just JSON — serde parses it in Rust directly;
  the existing `dtcg.ts` types are a *spec reference to port*, not reusable Rust
  code, so it is net-new (but not much) Rust. **Fallback** if TS comfort wins: a
  TS emitter in `@primitiv-ui/tokens` as a build step, accepting that
  `primitiv tokens` then needs Node present. Outputs either way: CSS custom
  properties (canonical), SCSS, a TS/JS token object, and a Tailwind preset.
- **Harmoni belongs here.** The Rust CLI can call the Harmoni **core crate
  directly** (no wasm) to generate a brand palette locally and emit it as a
  theme: `primitiv theme --brand "#0a7755"`. This is the one place the Rust
  engine, the tokens, and the CLI converge.
- **Example styles** are authored against the canonical CSS custom
  properties, then emitted per format alongside the token output.

`primitiv tokens --format <fmt>` is a thin front-end over this pipeline.

---

## 7. The CLI surface

A Rust CLI is the orchestrator across packages, tokens, and the registry.
Two entry points: a `create-*` scaffold for greenfield, and a binary for
à la carte ops.

```sh
# Greenfield scaffold — interactive
pnpm create @primitiv-ui          # or: npx primitiv init
  → detect framework; ask styling format, token format, brand/theme
  → write primitiv.json

# À la carte — deterministic, agent-friendly
primitiv add button switch         # ensure pkg + (opt-in) copy styles per config
primitiv tokens --format css       # emit tokens in chosen format
primitiv theme --brand "#0a7755"   # Harmoni-generated palette → theme file
primitiv list --json               # machine-readable component registry
```

### 7.1 `primitiv.json` — the durable config

The linchpin that makes re-runs and agent use deterministic. Records:

- framework / target,
- whether example styles are wanted and in which **format**,
- paths / import aliases for where copied files land,
- token output format and theme/brand,
- registry version pin.

Same role as shadcn's `components.json`. Without it, `add` would have to
re-ask everything every time.

### 7.2 `add` flow (per component)

1. Ensure the headless package is installed (or note it's a peer).
2. **Ask whether** example styles are wanted (skip if config already says).
3. If yes and no format recorded, **ask the format**; persist it.
4. Resolve the registry entry's transitive deps (token layer, Tailwind
   preset for the Tailwind format, icon deps, etc.).
5. Copy the editable style source into the configured path.

### 7.3 Interactive vs non-interactive

Every command runs in two modes:

- **Interactive** (human): prompts as above.
- **Non-interactive** (agent / CI): every prompt has a flag; `--yes` accepts
  config defaults; `--json` emits structured output; exit codes are stable.

---

## 8. The registry

**Decision: a static `registry.json` manifest plus the style files**, served
from the repo / GitHub raw / a CDN. No backend.

```
registry.json                     # index: components, versions, deps
r/
  button/
    contract.json                 # root class, data-* states, css-var API
    styles.css                    # canonical
    styles.scss
    tailwind/…                    # preset fragment + recipe
  switch/…
```

- **Simple, cacheable, versioned with the repo**, and trivially mirrored to
  a CDN.
- **Doubles as the agent manifest** (section 9). The same `registry.json`
  the CLI reads is the one an agent inspects.
- A small registry *service* is explicitly deferred — overkill for v1.

---

## 9. AI agent affordances

The Agent profile is first-class, not bolted on:

- **`registry.json` at a stable URL** — an agent can fetch it to evaluate
  whether Primitiv fits, enumerate components, and read each component's
  contract and dependencies *before* installing anything.
- **Non-interactive CLI** — `--json`, flag-driven prompts, `--yes`, stable
  exit codes (section 7.3).
- **`primitiv list --json`** — the component index as data.
- **An `AGENTS.md` / `llms.txt`** describing the system, the contract, and
  the install recipes, so an agent can act without scraping prose docs.
- **(future)** an MCP server wrapping the CLI for agents that prefer tools
  over shelling out.

---

## 10. Decisions log (settled 2026-06-09)

| # | Decision |
|---|---|
| D1 | Hybrid model: logic = versioned package, styles = opt-in copy-in |
| D2 | No second "styled components" package |
| D3 | Styling contract = root class + modifier classes (visual variants) + `data-*` (state/behavioural) + `--primitiv-*` custom-property API; the data-vs-modifier rule decides which surface a given option uses |
| D4 | Example styles = copy-in **editable** source, owned by the consumer |
| D5 | Example styles = **polished default theme**, re-skinned via tokens, **ported from Figma** |
| D6 | One visual design, emitted in many formats (CSS/SCSS/Tailwind/…), all token-derived |
| D7 | CLI asks **whether** styles, then **which format**; persists to `primitiv.json` |
| D8 | Registry = **static** `registry.json` + files, no backend |
| D9 | Agent support is first-class: static manifest + non-interactive `--json` CLI |
| D10 | Capture as **split RFCs** 0004 / 0005 / 0006 (this doc seeds them) |
| D11 | Default theme's default primary = Primitiv's own primary colour; a default, not a lock-in — overridable via tokens / CSS custom properties / a Harmoni-generated palette (Rust lib or Figma plugin) |
| D12 | Token transform leans **custom emitter** (likely Rust, inside the CLI) over Style Dictionary, to preserve the single-binary story; language/location to confirm (§11) |

---

## 11. Open questions

To resolve before / within the RFCs:

1. **Re-add refresh semantics** (§5.2): overwrite, three-way diff, or
   skip-if-modified for copied style files the consumer may have edited.
2. **Transitive dep resolution** when the consumer's chosen format needs
   project-level wiring (e.g. registering the generated Tailwind preset in
   their `tailwind.config`): how much does `add` automate vs. instruct?
3. **Per-component subpath exports** for Dev 1's "install specific
   components" — confirm tree-shaking alone is sufficient, or add subpaths.
4. **Emitter language / location** (D12 leans custom): a Rust emitter inside
   the CLI (preserves the single-binary story) vs. a TS emitter in
   `@primitiv-ui/tokens` (reuses `dtcg.ts`, but `primitiv tokens` then needs
   Node). Ties directly to the CLI-distribution question (#5).
5. **CLI distribution**: a `create-primitiv` npm shim that downloads the
   Rust binary, a pure-npm fallback, `cargo install`, `pnpm dlx` — what's
   the canonical invocation, and how do we ship a Rust binary to JS users
   ergonomically?
6. **Dev 3 reach**: how far we go documenting / testing the contract against
   non-Primitiv components (Radix), vs. stating "best-effort, contract is
   the boundary."
7. **Workbench role**: extend `apps/workbench` into the styling authoring
   surface, or stand up a dedicated styled preview app.

---

## 12. How this seeds the RFCs

Per D10, this doc is promoted into three tightly-scoped RFCs (matching the
0001–0003 style):

- **RFC 0004 — Consumption distribution model & styling contract.**
  Sections 3 and 4. The foundation: the hybrid seam and the `data-*` +
  root-class contract. Settle first; the others depend on it.
- **RFC 0005 — The Primitiv CLI & `primitiv.json`.** Sections 7, 8, 9.
  Surface, config, registry, agent affordances.
- **RFC 0006 — Token & style pipeline.** Sections 5 and 6. DTCG → formats,
  the one-design-many-formats emitter, the Figma-sourced default theme, and
  Harmoni's role in theming.

---

## Appendix — Button, end to end

How each profile consumes the Button under this design.

**Dev 1 (headless only):**
```sh
pnpm add @primitiv-ui/react
```
```tsx
import { Button } from "@primitiv-ui/react";
// styled by their own system; no Primitiv CSS involved
```

**Dev 2 (complete solution, SCSS):**
```sh
npx primitiv init           # picks SCSS, sets brand → primitiv.json
primitiv add button         # ensures pkg, asks styles? yes → SCSS
```
```scss
// src/styles/primitiv/_button.scss copied in, owned, editable
// resolves to --primitiv-button-* custom properties from the token layer
```
```tsx
import { Button } from "@primitiv-ui/react";
<Button className="primitiv-button" />;   // contract root class
```

**Dev 3 (has Radix, wants only Button's look):**
```sh
primitiv add button --styles-only --format css
```
```css
/* button.css targets the contract: .primitiv-button + data-* state.
   Applied to a Radix button to the degree it emits the same contract. */
```

**Agent:**
```sh
curl …/registry.json                 # evaluate fit, read Button's contract + deps
primitiv add button --yes --json     # deterministic install, structured result
```
