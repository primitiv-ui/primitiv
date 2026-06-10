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
styles to a *different* component (Radix is one example; the same holds for any
styleable third-party or in-house component) works to the degree that component
emits the same contract — a documented best-effort, not a promise.

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
- **Per-component subpath exports** — `@primitiv-ui/react/button` — generated
  at build time from the existing per-component folders. **Decided (D16):**
  shipped alongside the barrel. Tree-shaking still satisfies subsets either way,
  so subpaths are an ergonomic clarity win, not load-bearing.

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
   `.primitiv-tabs`. A compound component names its parts **BEM-style** off the
   root — `.primitiv-tabs__trigger`, `.primitiv-tabs__panel` (decided, D14).
   Each part is directly selectable, with no descendant selector and no extra
   emitted attribute needed to target it. (*Whether the headless component
   emits this class or the consumer applies it is an open question — §7.5.*)
2. **Modifier classes** — *purely visual variants the headless layer does not
   model*: tone/intent, size, emphasis. `.primitiv-button--primary`,
   `.primitiv-button--lg`, `.primitiv-tabs--underline`. Applied by the consumer
   or by a copied-in recipe.
3. **`data-*` attributes** — *state and behavioural options the headless layer
   already emits*: `data-state`, `data-disabled`, `data-loading`,
   `data-orientation` (the `data-*` styling surface from the
   `react-component-patterns` conventions). Styling reads them automatically;
   the consumer wires nothing. *(Distinct from these per-component **state**
   attributes are the global **mode-scope** attributes `data-theme` and
   `data-density` — an ambient, inherited theming surface set on any ancestor,
   not per-component state. They are specified in RFC 0009.)*
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

The rule pins *which surface* an option uses, but not *which wins* when a state
and a variant collide on the same property (a disabled primary button:
`[data-disabled]` vs `--primary`, equal specificity). That precedence — state
beats variant beats base — is made authored and guaranteed by the cascade-layer
order in **RFC 0008 §2.3**.

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
(design doc §5.3, D11). **How these two namespaces are scoped on emit** — the
theme tokens shared and emitted once, the per-component API tokens shipped inside
each component stylesheet so a partial install carries only what it added — is
RFC 0008 §3.

### 3.4 Per-component contract documentation

**Deliverable.** Every component documents its contract: root class and part
names, the modifier classes it offers, the `data-*` attributes it emits, and
its `--primitiv-*` custom properties. This `contract.json` ships in the registry
(0005, §8 of the design doc) and is what both the example CSS and any external
consumer code against.

**Generation — hybrid (decided, D15).** The contract has two halves with two
sources of truth, so it is produced from both:

- The **`data-*` half** is derived from and asserted against the *rendered
  headless component* by a test, so it cannot drift from what is actually
  emitted.
- The **modifier classes and custom-property API** are authored alongside the
  stylesheet, since they are styling conventions the headless layer does not
  emit and cannot be machine-detected from a render.

The two halves are assembled into one `contract.json` per component.

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
*not* Primitiv-only by construction. Radix appears here as a concrete example,
but the point generalises to **any component library whose elements you can
apply classes and attributes to** — Headless UI, Ark, React Aria, a bespoke
in-house component, and so on. Reuse on a non-Primitiv component is bounded by
Principle 5:

- **On Primitiv-headless:** guaranteed. The component emits exactly the contract
  its stylesheet targets.
- **On any other styleable component:** works for every part of the contract
  that component also emits. Where it uses the same `data-state` /
  `data-disabled` conventions, state styling carries over; modifier classes
  (consumer-applied) always carry over; gaps are where it names things
  differently.

**v1 position (decided, D17):** document the contract precisely and state the
best-effort boundary. We do **not** commit to testing the styles against Radix
or shimming attribute differences for v1.

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

All four questions raised in drafting were resolved on 2026-06-09 (see the
decision record):

1. ~~Per-component subpath exports (§2.3)~~ — **resolved (D16):** ship subpaths
   alongside the barrel.
2. ~~Compound-component part naming (§3.1)~~ — **resolved (D14):** BEM-style part
   classes off the root.
3. ~~`contract.json` generation (§3.4)~~ — **resolved (D15):** hybrid — `data-*`
   auto-verified against the render, modifiers and custom properties authored
   with the stylesheet.
4. ~~Dev 3 reach investment (§5)~~ — **resolved (D17):** document the boundary;
   no Radix testing or shimming for v1.

One question surfaced later, during the token-pipeline discussion:

5. **Who emits the root class (§3.1.1)?** The contract names `.primitiv-button`
   as the root but doesn't pin down whether the **headless component emits it**
   or the **consumer applies it** via `className`. This is load-bearing for two
   dependents: the contract's own portability story, and any future **CSS
   Modules** output (parked, RFC 0006 §10.6) — a module can own a
   consumer-applied class cleanly, whereas a component-emitted *global* class
   would need `:global()`. To settle on the next RFC 0004 pass. *(Note: the
   cascade-layer model of RFC 0008 is **orthogonal** to this question — a layer
   wraps the rule block, not the class application — so it neither depends on nor
   blocks this decision; RFC 0008 §2.6.)*

CLI- and pipeline-level details live in RFC 0005 / 0006.

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
| 7 | Subset installs via tree-shaking (baseline) + per-component subpaths shipped alongside the barrel (ergonomic) | D16 |
| 8 | Dev 3 reach is honest best-effort; document the boundary, no Radix shimming for v1 | D17 |
| 9 | Compound components name parts BEM-style off the root (`.primitiv-tabs__trigger`) | D14 |
| 10 | `contract.json` is hybrid: `data-*` auto-verified against the render, modifiers + custom properties authored with the stylesheet | D15 |
