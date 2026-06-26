# RFC 0016 — Spacing & flow rhythm

> **Status:** Draft — **counter-proposal.** Argues to revise work already landed
> on `main` (RFC 0008 D60 / the base element stylesheet, `crates/primitiv-emit/
> assets/base.{css,scss}`): it proposes **removing the global block-level
> margins** that work put in `primitiv.reset` and re-homing inter-block rhythm in
> an opt-in flow context. Not yet accepted; supersedes nothing until it is.
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-23 (rebased onto the landed prose-base-styles work, 2026-06-26)
> **Seeds from:** the 2026-06-23 spacing-strategy discussion (this session),
> following the typography & text-elements build checklist
> (`docs/figma-typography-checklist.html`).
> **Relates to / contends with:** RFC 0008 (CSS architecture — **D60 populated
> `primitiv.reset` with the base element stylesheet, including the block margins
> this RFC disputes**) §2.1–2.2, §7.1; the landed `prose-base-styles` work
> (`docs/prose-base-styles-plan.md`, `crates/primitiv-emit/assets/base.css`).
> Builds on: RFC 0004 (the `--primitiv-*` custom-property API the flow tokens
> join) §3; RFC 0009 (mode scoping — flow rhythm is governed by the same `Context`
> collection and densifies with `data-density`) §2, §6. Skills:
> `figma-variable-architecture` (the Context collection, the `dropdown/*`
> precedent), `registry-stylesheet-conventions` (no-magic-numbers).

---

## 0. Summary

Primitiv has solved **proportion** (the per-density type scale) and **density**
(RFC 0009: an ambient, inheritable `data-density` context). The question of the
spacing *between* content blocks — the vertical rhythm of an article, a form, a
card's stacked contents — was answered in code by the `prose-base-styles` work:
**global default margins on bare elements** (`p { margin-block: 0 16px }`,
`h1–h6 { margin-block: 24px 8px }`, `ul`/`blockquote`/`hr`/`figure`/`dd`/`li + li`),
emitted into `primitiv.reset` as a foundation file and recorded as RFC 0008 **D60**
(the deliberate reversal of D49's "no global reset").

**This RFC is a counter-proposal to that block-margin layer.** It does not dispute
the rest of the base stylesheet — the element *typography* (font/colour on `p`,
`h1–h6`, …) and the *inline marks* (`strong`, `em`, `mark`, `del`, `code`, `kbd`,
…) are good as global element styles and **stay**. It disputes one thing: that
**inter-block rhythm is expressed as collapsing, element-owned `margin-block`**.
The proposal is to **remove those outer-margin declarations** and re-home rhythm in
an **opt-in flow context**:

1. **Surgical scope** (§1): revert only the outer `margin-block` / `margin-inline`
   declarations on block elements in `reset`. Element typography, inline marks, and
   *inner* spacing (padding, borders) are untouched — bare prose still looks
   typographically right; it just no longer carries inter-block margins.
2. **Three spacing kinds, three mechanisms** (§2.1): component-internal spacing is
   `gap`; content-flow rhythm is a one-directional *flow* rule on a container; a
   bare block carries **no outer margin**.
3. **Flow rhythm is an opt-in container context** (`.primitiv-flow`), the
   architectural sibling of `data-density` (RFC 0009): drop it on a subtree,
   everything inside gets rhythm, the elements stay agnostic.
4. **A one-directional owl** (`> * + *`, `margin-block-start`) over a
   **density-scoped `flow/*` token scale** — eliminating the two defects of the
   landed model: **margin-collapse non-determinism** and **first/last-child bleed**
   (§1.2).

The honest cost — a real one — is that **zero-markup prose loses its default
spacing** (it gains it back with one class on the article). §1.3 weighs that
trade-off; it is the crux of whether this RFC should be accepted.

## 0.1 Scope

In scope: the case against the landed block-margin layer, the surgical revert, the
flow-context model, the owl mechanism, the `flow/*` namespace and its density
scoping, the two registry surfaces, and the acceptance trade-off. Out of scope: the
rest of the base element stylesheet (typography + inline marks + inner spacing —
**kept**), the per-density flow *values* (Figma Context collection), and the
emitter mechanics (RFC 0006). This RFC defines a *spacing model* and asks to swap
one layer of the landed one for it.

---

## 1. The contention — what landed, and why change it

### 1.1 What landed (RFC 0008 D60)

`crates/primitiv-emit/assets/base.css` styles bare block elements in
`primitiv.reset`, including outer margins:

```css
@layer primitiv.reset {
  p          { /* …type… */ margin-block: var(--primitiv-space-space-0) var(--primitiv-space-space-16); }
  h1,h2,h3,h4,h5,h6 { /* …type… */ margin-block: var(--primitiv-space-space-24) var(--primitiv-space-space-8); }
  ul,ol      { /* …type… */ margin-block: var(--primitiv-space-space-0) var(--primitiv-space-space-16); }
  blockquote { /* …type… */ margin-block: var(--primitiv-space-space-16); }
  hr         { /* …line… */ margin-block: var(--primitiv-space-space-24); }
  /* figure, dd, li + li … */
}
```

Credit where due: it is fully tokenised, density-flows via `[data-density]`, sits
in the lowest sublayer (so a consumer overrides it cheaply), and already does
**heading asymmetry** (`24` above / `8` below). It gives correct zero-markup prose.
The disagreement is narrow and specific.

### 1.2 The two defects this RFC fixes

Both are intrinsic to *element-owned, two-directional `margin-block`*, and neither
is solved by the lowest-layer placement:

1. **Margin collapse is non-deterministic.** Adjacent vertical margins collapse to
   the *larger* of the two, not the sum — so the gap between a `16px`-bottom `p`
   and a `24px`-top `h2` is `24px`, and any consumer reasoning about spacing has to
   know the collapse rules of *both* siblings. Worse, collapse **breaks across
   nesting**: wrap a block in a `<div>`, a flex/grid parent, or anything that
   creates a block-formatting context, and the margins stop collapsing — the same
   markup spaces differently by container. Primitiv does not own the consumer's DOM,
   so it cannot predict which.
2. **First/last-child bleed.** A `p`'s bottom margin and an `h2`'s top margin push
   space *outside* their container — the last `p` in a card bleeds `16px` into the
   card's own padding; a first `h2` adds `24px` above the content box. The landed
   stylesheet has no `:first-child`/`:last-child` resets, so this bleed is live.

The one-directional owl (`> * + *`, `margin-block-start` only, §2.4) removes both
by construction: exactly one margin exists between two siblings (nothing to
collapse), and `+ *` never targets a first or last child (nothing to bleed).

A third, softer argument: element-owned margins **scatter rhythm decisions across
selectors** (each element hard-codes which `space-*` it takes), where a `flow/*`
semantic scale (§3) centralises them as named roles.

### 1.3 The cost — and why it's acceptable

Removing the global block margins means **bare prose with no flow wrapper has no
inter-block spacing.** This is the real price, and the strongest argument *for*
keeping the landed approach. Three reasons it is acceptable:

- **Typography still lands for free.** The revert is surgical (§1.4): bare `p`,
  `h1–h6`, and the inline marks keep their global font/colour styling. Unstyled
  prose looks *typographically* correct; it is only inter-block *spacing* that
  needs the wrapper.
- **The wrapper is one class.** `<article class="primitiv-flow">` (or `<Prose>`),
  applied once at the region root, restores rhythm — and a *better* rhythm
  (deterministic, density-scoped, role-tuned).
- **Determinism is worth a class.** The failure mode of the landed approach
  (spacing that silently changes when markup is nested or moved) is the kind of bug
  that is hard to see and harder to explain. Trading an implicit default for an
  explicit, predictable one is the system's standing bias (cf. RFC 0009 choosing
  explicit `data-*` scopes over implicit `prefers-*`).

> **If the team values zero-markup rhythm more than determinism, the counter-
> proposal should be rejected and D60 left standing.** That is the decision §8
> puts up for acceptance. An intermediate exists (§6): emit the owl globally under
> a low-specificity `:where(:not(.primitiv-flow *))` default so zero-markup prose
> keeps rhythm *via the owl* (deterministic) rather than via collapsing margins —
> capturing most of the benefit without the regression. It is offered as the
> compromise position.

### 1.4 Surgical scope — what is reverted vs kept

| In `primitiv.reset` today | This RFC |
|---|---|
| `p`/`h1–h6`/`ul`/`ol`/`dd` **font, colour** | **keep** (global element typography) |
| inline marks `strong`/`em`/`mark`/`del`/`ins`/`abbr`/`small`/`sub`/`sup`/`q`/`kbd` | **keep** (global, unaffected) |
| `blockquote` border + `padding-inline`; `kbd`/`code` padding + border; list `padding-inline-start` | **keep** (*inner* spacing, not rhythm) |
| `li + li { margin-block-start: list/item-gap }` | **keep** (already one-directional intra-cluster rhythm — the owl shape) |
| `p`/`h1–h6`/`ul`/`ol`/`blockquote`/`hr`/`figure`/`dd` **outer `margin-block`/`margin-inline`** | **remove** → re-homed in the flow context (§2) |

So the blast radius is a handful of `margin-block` lines, not the stylesheet.

---

## 2. The spacing model

### 2.1 Three kinds, three mechanisms

| Kind | Mechanism | Owner | Examples |
|---|---|---|---|
| **Component-internal** | `gap` (flex/grid) | the component | `list/item-gap`, `framed-control/gap`, Field label→control, button icon→label |
| **Content-flow rhythm** | one-directional flow rule (`> * + *`, `margin-block-start`) | an opt-in **flow context** (`.primitiv-flow`) | paragraph → heading → list → blockquote in an article; stacked card contents |
| **Bare block** | **no outer margin** | the consumer / a flow ancestor | a heading dropped into a bespoke layout |

`li + li` in the landed stylesheet is already exactly the third mechanism's shape
(one-directional, intra-cluster) — evidence the owl is the natural form; this RFC
generalises it from "between list items" to "between all flow siblings."

### 2.2 Why not `gap` for everything

`gap` is the right tool for component-internal layout and Primitiv already uses it
(`list/item-gap`, `framed-control/gap`). But `gap` is **uniform** — one value for
every child. Long-form content needs **variable rhythm**: the space *before* an
`h2` exceeds the space *between two paragraphs*, which differs again from
*paragraph → list*. `gap` cannot express that; a flow rule with role-aware
overrides (§2.5) can. So `gap` governs uniform component-internal spacing; flow
governs variable content rhythm.

### 2.3 The flow mechanism — one-directional owl

```css
@layer primitiv.base {
  .primitiv-flow > * + * {
    margin-block-start: var(--primitiv-flow-normal);   /* default sibling rhythm */
  }
}
```

The single-direction "lobotomised owl" is chosen deliberately:

- **No collapse, ever.** One margin between two siblings — nothing to collapse, no
  `max()` surprise, no nesting-dependent behaviour (the §1.2 fix).
- **No first/last bleed.** `+ *` never targets the first child; the container's own
  padding owns its edges (the §1.2 fix).
- **Logical-property native.** `margin-block-start` inherits the system's
  `padding-inline` writing-mode/RTL discipline — vertical and RTL modes work with
  no second ruleset (and subsume any "horizontal rhythm," §6).
- **Low specificity, overridable.** A single child-combinator class; a consumer's
  unlayered rule beats it outright (RFC 0008 §2.5).

### 2.4 Where it lives in the cascade

The owl rule and role overrides ship in **`primitiv.base`** (component-rule
precedence), *above* the typography that stays in `primitiv.reset`. The `flow/*`
**tokens** live in `primitiv.tokens` (§3). This keeps the revert clean: pull the
margins *down and out* of `reset`, and the rhythm rules sit with the component
layer that owns them.

### 2.5 Variable rhythm via role overrides

```css
@layer primitiv.base {
  /* discrete proportionality: larger headings get more leading air */
  .primitiv-flow > * + :where(h1, h2) { margin-block-start: var(--primitiv-flow-region); }
  .primitiv-flow > * + :where(h3, h4) { margin-block-start: var(--primitiv-flow-section); }

  /* heading asymmetry: tight space *below* a heading binds it to its content */
  .primitiv-flow > :where(h1, h2, h3, h4) + * { margin-block-start: var(--primitiv-flow-tight); }

  /* self-contained blocks own their breathing room */
  .primitiv-flow > hr { margin-block: var(--primitiv-flow-region); }
}
```

This reproduces — deterministically — what the landed stylesheet does with
collapsing margins:

- **Heading asymmetry.** Large space *above* a heading (`section`/`region`), tight
  space *below* (`tight`), so it binds to the content it introduces. The landed
  `24 / 8` becomes "the element *after* a heading gets `tight`," with no reliance on
  collapse to resolve the heading-meets-paragraph boundary.
- **Discrete proportionality.** `h1`/`h2` pull `region`, `h3`/`h4` pull `section` —
  larger headings, more air — without `em`/`lh` derivation (§9/D72). The `* +`
  prefix gives a first-child heading `0`: no leading bleed.

`:where()` keeps every rule at zero specificity, and each value is a
`--primitiv-flow-*` token. The rules target **semantic children** (`h1`–`h6`, `hr`,
…), as Tailwind Typography's `.prose` does; non-semantic wrappers fall back to flat
`normal` rhythm. The mapping is shipped, opinionated, and overridable (§9/D73).

---

## 3. Token governance — the `flow/*` namespace

### 3.1 A named scale in the Context collection

Following the `dropdown/*` precedent, flow rhythm is a namespace **inside the
Context collection**, each value aliasing a `space-*` primitive, **per density
mode**. Four steps, named by the **relationship** they express (matching the
system's semantic-naming house style — `content/primary`, never `grey-2`):

| Flow token | Relationship | Default role mapping (§2.5) |
|---|---|---|
| `flow/tight` | intra-cluster | list items (the existing `li + li`), `dl` pairs, the element after a heading |
| `flow/normal` | default block rhythm | paragraph → paragraph (the base `> * + *`) |
| `flow/section` | new sub-section | before `h3`/`h4` |
| `flow/region` | major break | before `h1`/`h2`, around `hr`, pull quotes |

> The per-density values live in Figma's Context collection and flow through DTCG
> unchanged, like the type scale and `framed-control/*`. Whether `region` earns its
> place beside `section` (collapse to three?) and the exact `space-*` alias per
> density are the **one open value-question** (§8) — to be validated against real
> layouts. The seed values can be taken straight from the landed stylesheet
> (`normal` = `space-16`, the heading steps from `24`/`8`), so the revert is
> visually near-neutral for wrapped prose.

### 3.2 Density scoping — rhythm densifies with the page

`flow/*` emits as density-neutral names swapped by `[data-density]` (RFC 0009 §2.2)
in `primitiv.tokens`:

```css
@layer primitiv.tokens {
  :root, [data-density="comfortable"] {
    --primitiv-flow-normal: 1rem;       /* space-16 */
    --primitiv-flow-section: 1.5rem;    /* space-24 */
  }
  [data-density="dense"] {
    --primitiv-flow-normal: 0.5rem;     /* space-8 */
    --primitiv-flow-section: 0.75rem;   /* space-12 */
  }
  /* compact, spacious … */
}
```

A `.primitiv-flow` subtree under `data-density="dense"` tightens automatically —
same name, density-swapped value. Rhythm becomes a third thing the Context
collection governs, alongside type size and control anatomy, scaling by the same
engine. (The landed approach already gets this via tokens; the difference is the
*mechanism* carrying the value, not the density behaviour.)

---

## 4. The consumer API

### 4.1 One class, any subtree

- **Prose region:** `<article class="primitiv-flow">` — every direct child is
  rhythm-spaced.
- **Card body:** `<div class="primitiv-flow">` around stacked contents.
- **Override locally:** set `--primitiv-flow-normal` on any ancestor (inheritance,
  RFC 0009 §2.3).
- **Beat it entirely:** an unlayered consumer rule wins with no `!important`.

### 4.2 Two surfaces ship from the **registry**, not the headless package

Unlike RFC 0009's planned `DensityProvider`, both surfaces live in the copy-in
registry (`primitiv add prose`):

- **`.primitiv-flow`** — the bare class and the contract: the owl rule + role
  mapping as the registry component's styled surface (`styles.css`/`styles.scss`,
  tokenised per `registry-stylesheet-conventions`). Framework-agnostic; a
  styles-only consumer runs `primitiv add prose --styles-only` (RFC 0004 §4, Dev
  3) and gets the CSS with no `prose.tsx`. Because `.primitiv-flow` is a *context
  class the consumer applies to their own markup* — not an identity class a
  component must emit — it is the **cleanest styles-only case in the registry**:
  nothing to miss (contrast the best-effort reach onto non-Primitiv components,
  RFC 0004 §5).
- **`<Prose>`** — the React surface (`prose.tsx`): a thin `asChild` (Slot) wrapper
  that applies `primitiv-flow`, renders any semantic element (`<article>`,
  `<section>`, `<main>`), and self-imports its stylesheet.

**Why the registry, not `@primitiv-ui/react`.** The headless package is the
*behaviour* layer (roving tabindex, controllable state). `<Prose>` has **zero
behaviour** — it applies a class — so it belongs with the styled copy-in surface
beside Button/Field/Tabs. The registry also keeps the flow *CSS* (which the bare
class needs) and the *wrapper* in one unit. The `flow/*` **tokens** stay in the
shared token layer, present regardless of which components are installed.

The component is **not load-bearing** (the class is the contract) and follows the
registry build path (`registry-stylesheet-conventions` + a CLI rebuild — CLAUDE.md's
"Embedded registry gotcha"), not the `packages/react` new-component cycle.

---

## 5. Compatibility across formats

"Add a class; custom properties inherit; one owl rule applies margin" carries
across the RFC 0006 formats with no per-format reinvention, as density does:

| Format | Carries? | How |
|---|---|---|
| **CSS** (canonical) | yes | the `.primitiv-flow` rule in `primitiv.base`; `--primitiv-flow-*` in `primitiv.tokens` |
| **SCSS** | yes | same `@layer` blocks; `$`-vars/maps resolve into the inherited custom properties |
| **Tailwind** | yes | `--primitiv-flow-*` via `@theme`; v4 utilities resolve them, so a `[data-density]` ancestor re-rhythms automatically; an optional `flow` variant can wrap the owl |
| **TS/JS token object** | N/A (dropped, D50) | values only, no cascade |

---

## 6. The compromise position (global owl)

If zero-markup rhythm must be preserved, the owl can be emitted **globally** at low
specificity instead of (or in addition to) the opt-in class:

```css
@layer primitiv.reset {
  /* deterministic global rhythm, owl-shaped, still overridable */
  :where(body) > * + * { margin-block-start: var(--primitiv-flow-normal); }
  /* role overrides as in §2.5, scoped to :where(body) */
}
```

This keeps the §1.2 determinism win (one-directional, no collapse, no bleed) while
restoring zero-markup spacing — strictly better than the landed collapsing margins,
at the cost of the "opt-in, never global" purity. **Recommended fallback** if the
acceptance vote (§8) favours zero-markup rhythm: adopt the *owl mechanism*
globally even if the *opt-in container* is rejected. The mechanism is the load-
bearing improvement; the opt-in is the preference.

---

## 7. What this RFC does not cover

- The rest of the base element stylesheet — typography, inline marks, inner
  spacing — **kept as-is** (§1.4).
- The per-density flow *values* — Figma Context collection / `figma-variable-architecture`.
- The **emitter** mechanics — RFC 0006.

---

## 8. Open questions

1. **Acceptance — revert the landed block margins?** This is the load-bearing
   question, because tested code already ships the other way (RFC 0008 D60). Three
   outcomes: **(a)** accept the opt-in flow model and revert the `reset` block
   margins (§1.4); **(b)** reject and keep D60 as-is; **(c)** take the compromise
   (§6) — adopt the owl *mechanism* globally, keeping zero-markup rhythm but losing
   the collapse/bleed defects. The author's lean: **(a)**, fallback **(c)**;
   plain (b) keeps a known determinism hazard.
2. **Flow-scale step count and per-density values.** The four-step set
   (`tight · normal · section · region`) is the working proposal; whether `region`
   collapses into `section`, and the exact `space-*` aliases per density, are to be
   validated against an article, a form, and a card body. Seed values come from the
   landed stylesheet (§3.1) so a wrapped-prose revert is visually near-neutral.

---

## 9. Decision record

> **Proposed, not ratified** — this is a counter-proposal; every entry is
> contingent on the §8.1 acceptance outcome. Decision IDs start at **D66** to avoid
> collision with the landed work (D60 is the reset reversal this RFC contends with;
> D1–D55, D60, D65 are otherwise taken).

| # | Decision (proposed) | Maps to |
|---|---|---|
| 1 | **Revert, surgically.** Remove the global outer `margin-block`/`margin-inline` declarations the prose-base-styles work put on block elements in `primitiv.reset` (RFC 0008 D60); **keep** element typography, inline marks, inner spacing, and the existing one-directional `li + li` gap | D66 |
| 2 | **Why:** element-owned two-directional `margin-block` carries two intrinsic defects the lowest-layer placement does not fix — **margin-collapse non-determinism** (nesting-dependent) and **first/last-child bleed**; the one-directional owl removes both by construction | D67 |
| 3 | **Three spacing kinds, three mechanisms:** component-internal = `gap`; content-flow rhythm = a one-directional owl on a flow context; a bare block has no outer margin | D68 |
| 4 | Flow rhythm is an **opt-in container context** (`.primitiv-flow`), the sibling of `data-density` — applied by descent, no element cooperation, no JS; opt-in, **not** global (modulo the §6 compromise) | D69 |
| 5 | The mechanism is the **single-direction owl** (`> * + *`, `margin-block-start`): no collapse, no bleed, logical-property, low-specificity; ships in `primitiv.base`, above the kept typography in `reset` | D70 |
| 6 | The rhythm scale is a **`flow/*` namespace in the Context collection** (the `dropdown/*` precedent) → density-neutral `--primitiv-flow-*` in `primitiv.tokens`, densifying with `[data-density]`; seed values taken from the landed stylesheet for a near-neutral revert | D71 |
| 7 | **Fixed token scale; runtime type-derivation rejected** (`em`/`lh` floats off the `space-*` grid, saves no authoring, harder to override); proportionality-to-heading-size via **discrete heading-role steps** | D72 |
| 8 | The role→step **mapping is shipped, opinionated, and overridable** (heading asymmetry + discrete proportionality; targets semantic children; `:where()` + token keeps it sovereign) | D73 |
| 9 | **Both surfaces ship from the registry — not the headless package:** the `.primitiv-flow` class and an `asChild` `<Prose>` wrapper are a copy-in registry component (`primitiv add prose`); `<Prose>` has zero behaviour; `@primitiv-ui/react` is unchanged | D74 |
| 10 | **No separate horizontal-rhythm model** — inline spacing is `gap`/`padding-inline`; the logical `margin-block-start` rotates to horizontal under vertical writing modes | D75 |
| 11 | **Compromise fallback (if §8.1 favours zero-markup rhythm):** adopt the owl *mechanism* globally at low specificity (§6) rather than reverting to collapsing margins — the mechanism is the improvement; the opt-in container is the preference | D76 |
