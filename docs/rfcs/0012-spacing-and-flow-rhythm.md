# RFC 0012 — Spacing & flow rhythm

> **Status:** Draft — under active discussion (the model below is the
> recommendation, not a settled decision; §8 holds the open forks).
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-23
> **Seeds from:** the 2026-06-23 spacing-strategy discussion (this session),
> following the typography & text-elements build checklist
> (`docs/figma-typography-checklist.html`).
> **Relates to:** RFC 0004 (the styling contract — the `--primitiv-*` custom-
> property API the flow tokens join) §3; RFC 0008 (CSS architecture — flow tokens
> live in `primitiv.tokens`, the owl rule in `primitiv.base`) §2, §3, §5; RFC 0009
> (mode scoping — flow rhythm is governed by the same `Context` collection and
> densifies with `data-density`) §2, §6. Skills: `figma-variable-architecture`
> (the 4-mode Context collection, the `dropdown/*` namespace precedent),
> `registry-stylesheet-conventions` (no-magic-numbers; every literal tokenised).

---

## 0. Summary

Primitiv has solved **proportion** (the per-density type scale) and **density**
(RFC 0009: an ambient, inheritable `data-density` context). It has **not** settled
the spacing *between* content blocks — the vertical rhythm of an article, a form,
a card's stacked contents. The typography checklist exposes the gap: it sprinkles
ad-hoc per-element block margins (`divider/margin-block`, pull-quote
`space-32/48`, `quote/*`) with no governing model.

This RFC proposes that model. The core move: **margins between sibling blocks are
not owned by the elements.** They are owned by an **ambient flow context** — the
same architectural shape as density — and driven by **density-scoped flow
tokens**. Concretely:

1. **Three spacing kinds, three mechanisms, named explicitly** (§2.1):
   component-internal spacing is `gap`; content-flow rhythm is a one-directional
   *flow* rule on a container; a bare element carries **zero** intrinsic outer
   margin.
2. **Flow rhythm is an ambient, opt-in container context** (`.primitiv-flow`),
   not a property of each element — mirroring `data-density` (RFC 0009): drop it
   on a subtree, everything inside gets rhythm, the elements stay agnostic and
   need no cooperation.
3. **The rhythm scale is governed by the `Context` collection** (a new `flow/*`
   namespace, the `dropdown/*` precedent), one alias per density mode, so rhythm
   densifies and relaxes in lockstep with type and control anatomy — automatic
   consistency by the engine the system already trusts.
4. **The system owns the values; the consumer owns the placement.** The flow
   *scale* (and how it tracks density) is a system consistency guarantee; *where*
   flow applies, and any per-subtree override, is the consumer's, via the
   `--primitiv-flow-*` API and cascade sovereignty (RFC 0008).

## 0.1 Scope

In scope: the spacing taxonomy (gap vs flow vs zero), the flow-context model, the
one-directional owl mechanism, the `flow/*` token namespace and its density
scoping, the consumer API, and how this reframes the checklist's per-element
margins. Out of scope: the per-density *values* of the flow scale (they live in
Figma's Context collection like every other density-dependent value), the type
scale itself (the typography checklist / `figma-variable-architecture`), and the
emitter mechanics (RFC 0006). This RFC defines the *spacing model*; RFC 0006 emits
it and RFC 0008 places it in the cascade.

---

## 1. Principles

### Principle 1 — Spacing between blocks is a container concern, not an element one

An element does not know what sits above or below it; only its container does.
Baking outer margin into the element (`h2 { margin-block: 1em }`) asserts a
relationship the element cannot see, and on the web that assertion is *fragile* —
it collapses, bleeds past first/last children, and resists override. The
container is the only honest owner of inter-sibling spacing.

### Principle 2 — Rhythm is ambient context, like density

Density (RFC 0009) is set on an ancestor and inherited; components stay
mode-agnostic. Flow rhythm is the same shape: an ancestor declares "this subtree
is prose/flow," and the rhythm applies by descent with no element cooperation.
The two are siblings — both inheritable contexts that the elements beneath never
have to be aware of.

### Principle 3 — The consumer's cascade stays sovereign (inherited)

Per RFC 0008, Principle 1, a consumer's plain unlayered rule must win without an
`!important` or specificity war. Default *element* margins are historically the
single worst offender against this (`:first-child` resets, collapse surprises).
Keeping margin off elements and inside an opt-in, token-driven, low-specificity
flow rule preserves sovereignty by construction.

### Principle 4 — The system owns values, the consumer owns placement

The rhythm *scale* and its density tracking are a system guarantee (consistency).
*Where* rhythm is applied, and any local override of a value, is the consumer's.
This is the same division of labour as the rest of Primitiv: the Context
collection owns the numbers; the consumer owns the markup and can re-skin any
`--primitiv-*` name.

---

## 2. The spacing model

### 2.1 Three kinds, three mechanisms

| Kind | Mechanism | Owner | Examples |
|---|---|---|---|
| **Component-internal** | `gap` (flex/grid) | the component | `list/item-gap`, `framed-control/gap`, Field label→control, media→caption, button icon→label |
| **Content-flow rhythm** | one-directional flow rule (`> * + *`, `margin-block-start`) | an opt-in **flow context** (`.primitiv-flow`) | paragraph → heading → list → blockquote in an article; stacked card contents |
| **Bare element** | **none** (zero intrinsic outer margin) | the consumer placing it | a heading dropped into a bespoke layout |

The split *is* the governance. Each kind has exactly one mechanism; there is no
"sometimes margin, sometimes gap" judgement call left to the person building a
component.

### 2.2 Why not default element margins (the web question)

The checklist asks directly: *on the web, do we even rely on default margins?*
**No — deliberately not.** Two web-specific reasons make element margins the wrong
default in a headless, copy-in system:

- **Margin collapse is non-deterministic in foreign markup.** Adjacent vertical
  margins collapse to the *larger* of the two (not the sum), margins bleed out of
  non-flow containers, and `margin-block-start: 0` on a first child is a perennial
  patch. Primitiv does not control the surrounding DOM, so it cannot predict the
  collapse outcome.
- **It re-opens the cascade war RFC 0008 closed.** Element margins are exactly
  what consumers override most often; shipping them as defaults forces the
  specificity fights the layer model exists to prevent.

### 2.3 Why not `gap` for everything

`gap` is the right tool for component-internal layout and Primitiv already uses it
(`list/item-gap`, `framed-control/gap`). But `gap` is **uniform** — one value for
every child of the container. Long-form content needs **variable rhythm**: the
space *before* an `h2` should exceed the space *between two paragraphs*, which
differs again from *paragraph → list*. `gap` cannot express that; a flow rule with
role-aware overrides (§3.2) can. So `gap` governs uniform component-internal
spacing; flow governs variable content rhythm. They do not compete.

### 2.4 The flow mechanism — one-directional owl

```css
@layer primitiv.base {
  .primitiv-flow > * + * {
    margin-block-start: var(--primitiv-flow-normal);   /* default sibling rhythm */
  }
}
```

The single-direction "lobotomised owl" (`> * + *`, `margin-block-start` only) is
chosen deliberately:

- **No collapse, ever.** Only one margin exists between any two siblings, so there
  is nothing to collapse and no `max()` surprise.
- **No first/last bleed.** `+ *` never targets the first child, so a flow
  container needs no `:first-child` reset and never pushes space outside itself.
- **Logical-property native.** `margin-block-start` inherits the same
  writing-mode / RTL discipline as the system's `padding-inline` usage — vertical
  and right-to-left writing modes work without a second ruleset.
- **Low specificity, overridable.** A single child-combinator class sits in
  `primitiv.base`; a consumer's unlayered rule beats it outright (RFC 0008 §2.5).

### 2.5 Variable rhythm via role overrides

Different block roles get different leading space, still inside the flow context:

```css
@layer primitiv.base {
  .primitiv-flow > :where(h2, h3, h4) {
    margin-block-start: var(--primitiv-flow-section);  /* more air before headings */
  }
  .primitiv-flow > :where(hr) {
    margin-block: var(--primitiv-flow-section);         /* dividers own their breathing room */
  }
}
```

`:where()` keeps these at zero specificity so the override surface stays flat and
consumer-overridable. The *set* of roles and which flow step each maps to is a
content-design decision captured per-element in the component descriptions, not
hard-coded numbers — every value is a `--primitiv-flow-*` token.

---

## 3. Token governance — the `flow/*` namespace

### 3.1 A named scale in the Context collection

Following the `dropdown/*` precedent (`figma-variable-architecture`), flow rhythm
is a component-style namespace **inside the Context collection**, each value
aliasing an existing `space-*` primitive, **set per density mode**. A small named
scale — not a per-element sprawl:

| Flow token | Role | Aliases (illustrative — tune per density) |
|---|---|---|
| `flow/tight` | dense lists, related lines | `space-*` (small) |
| `flow/normal` | default paragraph→paragraph | `space-*` (medium) |
| `flow/loose` | relaxed body / lead-in | `space-*` (medium-large) |
| `flow/section` | before a heading, around a divider | `space-*` (large) |

> The illustrative values are intentionally omitted here — they live in Figma's
> Context collection per density mode and flow through DTCG unchanged, exactly
> like the type scale and `framed-control/*`. §8.1 holds the fixed-vs-derived
> question for how those numbers are chosen.

### 3.2 Density scoping — rhythm densifies with the page

Because `flow/*` is a Context-collection namespace, it emits as density-neutral
names swapped by the `[data-density]` scope (RFC 0009 §2.2), in the
`primitiv.tokens` layer (RFC 0008 §5):

```css
@layer primitiv.tokens {
  :root,
  [data-density="comfortable"] {
    --primitiv-flow-normal: 1rem;       /* space-16 */
    --primitiv-flow-section: 2rem;      /* space-32 */
  }
  [data-density="dense"] {
    --primitiv-flow-normal: 0.5rem;     /* space-8 */
    --primitiv-flow-section: 0.75rem;   /* space-12 */
  }
  /* compact, spacious … */
}
```

A `.primitiv-flow` subtree inside a `data-density="dense"` ancestor tightens its
rhythm automatically — same name, density-swapped value, no rebinding. **This is
the consistency mechanism the checklist asks for:** rhythm is a third thing the
Context collection governs, alongside type size and control anatomy, so it scales
by the same engine and stays in proportion at every density.

### 3.3 Reframing the checklist's per-element margins

The typography checklist currently proposes per-element block margins
(`divider/margin-block`, pull-quote `space-32/48`, `quote/*` padding). This RFC
reframes them:

- **Between-sibling spacing → flow context**, not per-element margin. Per-element
  margins *plus* flow rhythm would double-space, and re-introduce the per-element
  guesswork the flow scale exists to remove.
- **Element-*intrinsic* spacing stays element-local** only where it is genuinely
  self-contained and not a sibling relationship — e.g. a blockquote's
  `padding-inline` (indent), a code block's inner `padding`. These are *inner*
  spacing, not *outer* rhythm, and are unaffected.
- **Self-contained blocks that look like they need outer margin** (a `<hr>`'s
  breathing room) become **flow roles** (§2.5), not standalone margin tokens, so
  they participate in the one rhythm system instead of competing with it.

---

## 4. The consumer API

### 4.1 One class, any subtree

- **Prose region:** `<article class="primitiv-flow">` — every direct child is
  rhythm-spaced.
- **Card body:** `<div class="primitiv-flow">` around stacked card contents.
- **Override a value locally:** set `--primitiv-flow-normal` on any ancestor; the
  subtree beneath re-resolves (custom-property inheritance, RFC 0009 §2.3).
- **Beat it entirely:** an unlayered consumer rule wins with no `!important`
  (RFC 0008 §2.5).

### 4.2 No element cooperation, no JS

Like density, flow propagates through the cascade from a wrapper the consumer
already controls. The headless components inside need not forward, accept, or be
aware of a flow prop. A `<Flow>` / `<Prose>` React convenience is possible but
**not load-bearing** — the bare class is the floor (mirrors RFC 0009 §3.2's
`DensityProvider` stance). §8.2 holds that question.

---

## 5. Compatibility across formats

The model is "add a class; custom properties inherit; one owl rule applies
margin" — so it carries across the RFC 0006 formats with no per-format
reinvention, exactly as density does (RFC 0009 §4):

| Format | Carries? | How |
|---|---|---|
| **CSS** (canonical) | yes | the `.primitiv-flow` rule in `primitiv.base`; `--primitiv-flow-*` tokens in `primitiv.tokens` |
| **SCSS** | yes | compiles to the same `@layer` blocks; `$`-vars/maps resolve into the same inherited custom properties |
| **Tailwind** | yes | `--primitiv-flow-*` exposed via `@theme`; v4 utilities resolve them, so a `[data-density]` ancestor re-rhythms automatically. An optional `flow` utility/variant can wrap the owl rule for consumers who prefer utilities |
| **TS/JS token object** | N/A (dropped, D50) | values only, no cascade — the owl selector and density scope cannot be expressed |

---

## 6. Defaults & values

- **No flow by default.** `.primitiv-flow` is **opt-in**; an element outside a
  flow context has zero intrinsic outer margin (§2.1, Principle 1). The system
  does not impose rhythm on markup that did not ask for it.
- **Default rhythm = the `comfortable` density's `flow/*` values** (unscoped
  `:root`), matching RFC 0009 §6's default density.
- **The flow scale tracks density**, not theme — rhythm is a sizing concern, so it
  lives in Context (density), never Intent (colour).

---

## 7. What this RFC does not cover

- The per-density **values** of the `flow/*` scale — Figma Context collection /
  `figma-variable-architecture`; §8.1 frames how they're chosen.
- Component-**internal** `gap` values — those stay per-component (`list/*`,
  `framed-control/*`) and are unchanged here.
- The **emitter** that produces the scoped output — RFC 0006.
- The cascade-**layer** placement rules — RFC 0008 (this RFC only states which
  sublayer the flow rule and tokens occupy).

---

## 8. Open questions  *(actively under discussion — none settled)*

1. **Fixed flow scale vs. type-derived rhythm.** v1-pragmatic: a small named
   `flow/*` scale aliasing `space-*` per density, hand-authored like the type
   scale. Purist follow-on: *derive* each rhythm value from the following
   element's line-height / font-size so type and rhythm are mathematically locked
   (the relationship of responsive-density to attribute-density in RFC 0009 §5).
   Leaning fixed-scale-first; derived as a documented follow-on.
2. **`<Flow>` / `<Prose>` React component, or class + docs only?** The bare
   `.primitiv-flow` class is the floor either way (§4.2). Whether
   `@primitiv-ui/react` ships an ergonomic wrapper is the same shape as RFC 0009
   §8.1's `DensityProvider` question — likely deferred to the same post-v1
   ergonomics pass.
3. **How many flow steps, and their names.** `tight / normal / loose / section`
   is a starting proposal (§3.1). The real count and naming should fall out of
   designing 2–3 real prose layouts (article, form, card) against it — to be
   validated, not fixed here.
4. **Role-to-step mapping.** Which block roles get `section` vs `normal` leading
   space (§2.5), and whether that mapping is part of the emitted flow stylesheet
   or left entirely to the consumer's content design. Ties to Q3.
5. **Horizontal rhythm.** This RFC is vertical-only (`margin-block-start`).
   Whether an inline-axis analogue is ever needed (it usually is not — inline
   spacing is `gap` or inner padding) is left open and currently presumed **no**.

---

## 9. Decision record

> **Provisional** — recorded as the current recommendation to give the model a
> stable reference surface; *not* ratified. Entries may change as §8 resolves.

| # | Decision (provisional) | Maps to |
|---|---|---|
| 1 | Inter-sibling spacing is a **container concern, not an element one**; elements ship with **zero intrinsic outer margin**; default element margins are rejected (collapse non-determinism + cascade-sovereignty cost) | D51 |
| 2 | **Three spacing kinds, three mechanisms:** component-internal = `gap`; content-flow rhythm = a one-directional owl rule on a **flow context**; bare element = none | D52 |
| 3 | Flow rhythm is an **ambient, opt-in container context** (`.primitiv-flow`), the architectural sibling of `data-density` — applied by descent, no element cooperation, no JS | D53 |
| 4 | The flow mechanism is the **single-direction owl** (`> * + *`, `margin-block-start`) for no-collapse / no-bleed / logical-property / low-specificity behaviour; variable rhythm via zero-specificity `:where()` role overrides | D54 |
| 5 | The rhythm scale is a **`flow/*` namespace in the Context collection** (the `dropdown/*` precedent), one alias per density mode → emits density-neutral `--primitiv-flow-*` in `primitiv.tokens`, so rhythm densifies with `data-density` automatically | D55 |
| 6 | **System owns the values, consumer owns the placement:** the flow scale + its density tracking are a system consistency guarantee; where flow applies and any per-subtree override are the consumer's (custom-property API + cascade sovereignty) | D56 |
| 7 | The checklist's per-element block margins are **reframed**: between-sibling spacing comes from the flow context; only genuinely *inner* element spacing (quote indent, code padding) stays element-local; self-contained "needs outer margin" blocks become flow **roles** | D57 |
</content>
</invoke>
