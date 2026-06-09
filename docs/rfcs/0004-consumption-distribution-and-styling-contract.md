# RFC 0004 — Consumption distribution model & styling contract

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-09
> **Seeds from:** `docs/consumption-design.md` (the consumption design doc)
> **Relates to:** RFC 0001 (Token Architecture) §4.1, §9 — the intent set and
> Button variant inventory this contract styles against.
> **Followed by:** RFC 0005 (the Primitiv CLI), RFC 0006 (token & style
> pipeline), which both build on the model and contract settled here.

---

## 0. Summary

This RFC settles the two foundational decisions of the Primitiv consumption
layer: **how the system is distributed**, and **the surface that styles attach
to**. Everything downstream — the CLI (0005), the token/style pipeline (0006) —
targets what is defined here, so it is the keystone RFC and is meant to be
settled first.

The two moves:

1. **A hybrid distribution model split on the logic/style seam.** Component
   *logic* ships as versioned npm/JSR packages (`@primitiv-ui/react`, `/icons`,
   `/tokens`); component *styles* are an opt-in, copy-in layer the CLI delivers
   from a registry. We do **not** ship a second "styled components" package.
2. **A documented styling contract per component** — a root class, modifier
   classes for visual variants, the `data-*` attributes the headless layer
   already emits for state and behaviour, and a CSS custom-property API. The
   styles couple to *this contract*, not to Primitiv's component internals,
   which is what makes them portable and what makes the copy-in layer possible.

The Button is worked end-to-end in §4 against RFC 0001's variant inventory.

## 0.1 Scope

In scope: the distribution model, the styling contract, and how the four
consumer profiles (Dev 1 / Dev 2 / Dev 3 / Agent) consume against them. The
CLI surface, `primitiv.json`, the registry format, and the token transform are
named where they touch the contract but specified in 0005 / 0006. Publishing
mechanics live in `RELEASING.md`.

---

## 1. Principles

### Principle 1 — Logic is versioned; styles are owned

Behaviour (a11y, keyboard, focus, roving tabindex) is patched centrally and
reaches every consumer through a version bump. Appearance is copied into the
consumer's repo, where they own and edit it. The seam between them is the whole
design.

### Principle 2 — Styles couple to a contract, never to internals

A stylesheet targets a documented surface — a class and a set of attributes —
that is part of the component's public API. It never reaches into Primitiv's
component structure, prop names, or DOM shape. The contract is the boundary; if
it is stable, the styles are stable.

### Principle 3 — One way to express each thing

State that the headless layer already reflects is styled through its `data-*`
attribute; a look-only variant the headless layer does not model is styled
through a modifier class. A given option lives on exactly one surface, never
both. (Principle made operational by the rule in §3.2.)

### Principle 4 — Opt-in, not opt-out

The headless package is useful and complete on its own. Every styling artifact
is something a consumer asks for; nothing styled is installed, imported, or
required by default.

### Principle 5 — Reach is honest

Primitiv guarantees the contract on its own headless components. Applying the
styles to a *different* component (Radix, etc.) works to the degree that
component emits the same contract — a documented best-effort, not a promise.

---

## 2. The hybrid distribution model

### 2.1 Two models, and why neither alone

- **Package model** (versioned npm/JSR install): dependency-managed,
  tree-shaken, centrally patchable. Correct for *logic* — the behaviour in
  `@primitiv-ui/react` must not be copy-pasted into thousands of repos a
  bugfix can never reach.
- **Registry / copy-in model** (shadcn-style): a CLI writes source into the
  consumer's repo; they own and edit it. Correct for *styles* — visual
  customisation is the point, and CSS is inseparable from the consumer's build
  (Tailwind? SCSS? plain CSS?).

A pure package locks consumers into one styling approach; a pure copy-in model
has no central place to fix behaviour. Primitiv has both a real headless engine
*and* a token engine (Harmoni), so it can take the better half of each.

### 2.2 The logic/style seam

**Decision:** split distribution on the logic/style seam.

- **Logic = versioned package.** `@primitiv-ui/react` is the headless engine;
  `@primitiv-ui/icons` and `@primitiv-ui/tokens` likewise. Fixes ship as
  version bumps. Published to npm and JSR.
- **Styles = opt-in copy-in.** The CLI (0005) delivers example styles *into*
  the consumer's repo, targeting the contract (§3). Owned and editable once
  installed.

### 2.3 What ships where

| Layer | Mechanism | Where |
|---|---|---|
| Headless components | versioned package | `@primitiv-ui/react` (npm + JSR) |
| Icons | versioned package | `@primitiv-ui/icons` (npm + JSR) |
| Tokens (DTCG + emitted formats) | versioned package + CLI emit | `@primitiv-ui/tokens` (npm + JSR); formats via CLI (0006) |
| Example styles | opt-in copy-in | registry → consumer repo (0005) |

**Subset installs (Dev 1).** "Install specific components" is served two ways,
both via the single package:

- **Tree-shaking** — importing `{ Button }` from the barrel drops the rest.
  This is the baseline and is sufficient on its own.
- **Per-component subpath exports** — `@primitiv-ui/react/button` — as an
  ergonomic addition, generated at build time from the existing per-component
  folders. *Proposed* (see §7), not load-bearing: tree-shaking already
  satisfies the requirement.

### 2.4 Rejected — a second "styled components" package

Shipping `@primitiv-ui/react-styled` was considered and rejected. It would
reintroduce the lock-in the copy-in model exists to avoid (a fixed styling
approach, updated only by version bump) and split the source of truth for
appearance across two delivery mechanisms. Styles are opt-in copy-in, full
stop.

---

## 3. The styling contract

Because CSS is coupled to DOM structure and component state, a stylesheet is
only reusable if both sides expose the same surface. The contract *is* that
surface, and it is part of each component's public API.

### 3.1 The four parts

1. **Root class** — identifies the component: `.primitiv-button`,
   `.primitiv-tabs`. One per component (or per anatomical part where a compound
   component has several, e.g. `.primitiv-tabs__trigger`).
2. **Modifier classes** — *purely visual variants the headless layer does not
   model*: tone/intent, size, emphasis. `.primitiv-button--primary`,
   `.primitiv-button--lg`, `.primitiv-tabs--underline`. Applied by the consumer
   or by a copied-in recipe.
3. **`data-*` attributes** — *state and behavioural options the headless layer
   already emits*: `data-state`, `data-disabled`, `data-loading`,
   `data-orientation` (the `data-*` styling surface from the
   `react-component-patterns` conventions). Styling reads them automatically;
   the consumer wires nothing.
4. **CSS custom-property API** — the themable seam (§3.3).

```css
.primitiv-tabs { /* base, reads tokens via --primitiv-tabs-* */ }
.primitiv-tabs--underline { /* visual variant → modifier class */ }
.primitiv-tabs[data-orientation="vertical"] { /* behavioural → data attr */ }
.primitiv-button[data-disabled] { /* state → data attr */ }
```

### 3.2 The data-vs-modifier rule

The operational form of Principle 3:

> If the headless component already reflects it — orientation flips keyboard
> navigation, `disabled`, open/closed state — style the **`data-*`** attribute;
> it is emitted for free and stays in sync with behaviour. If it is a look-only
> choice the headless layer does not know about — intent colour, size,
> emphasis — use a **modifier class**.

This is the class-variance-authority / shadcn split, and it guarantees one
surface per option. Concretely: vertical tabs are `[data-orientation="vertical"]`,
**not** `.primitiv-tabs--vertical`, because orientation is behavioural;
`--primary` *is* a modifier, because the headless Button has no notion of
intent colour.

### 3.3 The CSS custom-property API

Two namespaces of custom property, both prefixed `--primitiv-`:

- **Theme tokens** — `--primitiv-<token-path>`, e.g. `--primitiv-color-primary`.
  The output of the token pipeline (0006); the global re-skin surface.
- **Per-component API** — `--primitiv-<component>-<part>`, e.g.
  `--primitiv-button-bg`, `--primitiv-button-radius`. Each component's stylesheet
  resolves its visuals through these, which in turn default to theme tokens.

This is what lets the *polished default theme* (design doc §5.3) stay stable
while consumers recolour and re-scale by overriding properties rather than
editing component CSS — and it is the seam a Harmoni-generated palette overrides
(design doc §5.3, D11).

### 3.4 Per-component contract documentation

**Deliverable.** Every component documents its contract: root class and part
names, the modifier classes it offers, the `data-*` attributes it emits, and
its `--primitiv-*` custom properties. This `contract.json` ships in the registry
(0005, §8 of the design doc) and is what both the example CSS and any external
consumer code against. The contract doc is generated/verified from the headless
component so it cannot drift from the attributes actually emitted.

---

## 4. Worked example — the Button

Aligning with RFC 0001 §9: the Button's intents are `primary`, `secondary`,
`danger`, `link`; its sizes are the `xs–xl` slots.

**Contract.**

- Root class: `.primitiv-button`
- Modifier classes (visual, not modelled by the headless layer):
  - intent — `--primary`, `--secondary`, `--danger`, `--link`
  - size — `--xs`, `--sm`, `--md`, `--lg`, `--xl`
- `data-*` (emitted by the headless Button): `data-disabled`, `data-loading`
- Custom properties: `--primitiv-button-bg`, `--primitiv-button-fg`,
  `--primitiv-button-radius`, `--primitiv-button-padding-x`, … (defaulting to
  theme tokens)

**How each profile consumes it.**

- **Dev 1 (headless, own styles).** `pnpm add @primitiv-ui/react`; `import
  { Button }`. No Primitiv CSS; they style `.primitiv-button` or their own
  classes however they like.
- **Dev 2 (complete solution).** `primitiv add button` → ensures the package,
  asks styles? yes → format → copies `button.<fmt>` in. `<Button
  className="primitiv-button primitiv-button--primary primitiv-button--md" />`;
  state (`[data-loading]`) styles itself.
- **Dev 3 (styles only, has Radix).** `primitiv add button --styles-only`. The
  CSS targets the contract; it applies to a Radix button to the degree that
  button emits the same root class + `data-*` (§5).
- **Agent.** Reads `button/contract.json` from the registry to learn the exact
  classes and attributes, then `primitiv add button --yes --json`.

---

## 5. Reach beyond Primitiv-headless (Dev 3)

The contract is deliberately built from conventions other headless libraries
share — a root class plus `data-*` state attributes — so the example styles are
*not* Primitiv-only by construction. But reuse on a non-Primitiv component is
bounded by Principle 5:

- **On Primitiv-headless:** guaranteed. The component emits exactly the contract
  its stylesheet targets.
- **On Radix / others:** works for every part of the contract that component
  also emits. Where Radix uses the same `data-state` / `data-disabled`
  conventions, state styling carries over; modifier classes (consumer-applied)
  always carry over; gaps are where the other library names things differently.

**v1 position:** document the contract precisely and state the best-effort
boundary. We do **not** commit to testing the styles against Radix or shimming
attribute differences for v1 (see §7).

---

## 6. What this RFC does not cover

- The CLI surface, prompts, `primitiv.json`, and the registry file format —
  RFC 0005.
- The token transform, the emitted formats, the multi-format "one look" build,
  and Harmoni's role in theming — RFC 0006.
- Re-add / refresh semantics for copied files — RFC 0005.
- Publishing mechanics and publish-readiness — `RELEASING.md`.

---

## 7. Open questions

1. **Per-component subpath exports (§2.3).** Confirm whether to ship
   `@primitiv-ui/react/button`-style subpaths in addition to the barrel, or rely
   on tree-shaking alone. Leaning: add them (cheap, generated), but not
   load-bearing.
2. **Compound-component part naming (§3.1).** Settle the convention for
   multi-part components — `.primitiv-tabs__trigger` (BEM-ish) vs. nested data
   parts vs. separate root classes per part — and apply it uniformly.
3. **`contract.json` generation (§3.4).** How the contract doc is derived from /
   verified against the headless component so it cannot drift (a test? a
   generator? both).
4. **Dev 3 reach investment (§5).** Whether v1 does anything beyond documenting
   the boundary — e.g. a compatibility note per component, or an explicit
   "contract diff" against Radix. Leaning: documentation only for v1.

---

## 8. Decision record

| # | Decision | Maps to design-doc |
|---|---|---|
| 1 | Hybrid model: logic = versioned package, styles = opt-in copy-in | D1 |
| 2 | No second "styled components" package | D2 |
| 3 | Styling contract = root class + modifier classes (visual) + `data-*` (state/behavioural) + `--primitiv-*` custom-property API | D3 |
| 4 | The data-vs-modifier rule decides an option's surface; one surface per option | D3 |
| 5 | Custom-property API in two namespaces: `--primitiv-<token-path>` (theme) and `--primitiv-<component>-<part>` (per-component) | D3, D11 |
| 6 | Per-component `contract.json` is the public, drift-proof description styles and consumers code against | D3 |
| 7 | Subset installs via tree-shaking (baseline) + proposed per-component subpaths (ergonomic) | §11.3 |
| 8 | Dev 3 reach is honest best-effort; document the boundary, no Radix shimming for v1 | §11.5 |
