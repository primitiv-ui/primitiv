# RFC 0016 — Spacing & flow rhythm

> **Status:** **Implemented (2026-06-26).** The decision is **no default
> margins.** The global block-level margins the prose-base-styles work put in
> `primitiv.reset` (RFC 0008 D60) are **reverted** (zeroed, so no UA margins
> return), and inter-block rhythm is now **opt-in** (the `.primitiv-flow` class /
> `<Prose>`). The §6 global-owl compromise is **rejected** — a global owl is still
> a default. This RFC supersedes the block-margin half of D60.
>
> **What landed:** (1) the base block margins zeroed in `primitiv.reset`
> (`crates/primitiv-emit/assets/base.{css,scss}`, D66); (2) the `flow/*` scale in
> the Context collection (`packages/tokens/src/context.json`, D71) emitting
> density-scoped `--primitiv-flow-*`; (3) the `prose` registry component
> (`registry/components/prose/`, `primitiv add prose`, D74) — the `.primitiv-flow`
> owl + role overrides in `@layer primitiv.base` and an `asChild` `<Prose>` wrapper
> over the newly-exported `Slot`. **Follow-ups:** the `flow/*` **Figma** Context
> variables still need creating + a re-sync (the repo backup leads here, §7); and
> rhythm inherits **RFC 0009 §5 responsive (container-query) density** for free
> when that lands — no breakpoint scale exists yet, so viewport responsiveness is
> deferred to it (§8).
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

The honest cost — accepted deliberately — is that **bare prose has no default
inter-block spacing.** That is the point, not a regression: with no defaults to
fight, a consumer has three clean paths — **wrap** a region in `.primitiv-flow` /
`<Prose>` for system rhythm, **write their own** margins, or **mix** the two
(§4.1). §1.3 records the rationale.

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

### 1.3 The accepted trade-off — no default margins

Removing the global block margins means **bare prose has no inter-block spacing
until a consumer asks for it.** This is the maintainer's decision (2026-06-26),
deliberate rather than a regression. Three reasons it holds up:

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

> **Decided: no defaults — including no global owl.** The §6 global-owl
> compromise (a low-specificity global default) was considered and **rejected**:
> any global rhythm, even a deterministic owl, is still a default the consumer did
> not opt into. The flexibility the maintainer wants comes precisely from shipping
> *nothing* by default — the three composable paths in §4.1.

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
  no second ruleset (and subsume any "horizontal rhythm" — §9/D75).
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

### 4.1 Spacing is opt-in — three composable paths

Because nothing carries a default outer margin, the consumer chooses how to space
content, and the three approaches compose freely — this *is* the flexibility the
no-defaults stance buys:

1. **Wrap for system rhythm** — put `.primitiv-flow` (or `<Prose>`) on a region;
   its direct children get the density-scoped, role-tuned rhythm.
2. **Write your own** — author margins / `gap` directly; there are no Primitiv
   defaults to override or fight.
3. **Mix both** — flow for prose regions, hand-authored spacing elsewhere, in the
   same document. With no defaults in play, the two never collide.

Within the wrap path:

- **Prose region:** `<article class="primitiv-flow">` — every direct child is
  rhythm-spaced.
- **Card body:** `<div class="primitiv-flow">` around stacked contents.
- **Override a flow value locally:** set `--primitiv-flow-normal` on any ancestor
  (inheritance, RFC 0009 §2.3).
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

## 6. Considered and rejected — the global-owl compromise

To preserve zero-markup rhythm, the owl *could* be emitted **globally** at low
specificity instead of behind the opt-in class:

```css
@layer primitiv.reset {
  /* deterministic global rhythm, owl-shaped, still overridable */
  :where(body) > * + * { margin-block-start: var(--primitiv-flow-normal); }
  /* role overrides as in §2.5, scoped to :where(body) */
}
```

It would keep the §1.2 determinism win (one-directional, no collapse, no bleed)
while restoring zero-markup spacing — strictly better than the landed collapsing
margins. **Rejected (2026-06-26):** it is still a *default* the consumer did not
opt into, and the decision is no defaults at all. Documented here as the road not
taken; the load-bearing improvement (the owl mechanism) is retained, but only
inside the opt-in flow context, never globally.

---

## 7. What this RFC does not cover

- The rest of the base element stylesheet — typography, inline marks, inner
  spacing — **kept as-is** (§1.4).
- The per-density flow *values* — Figma Context collection / `figma-variable-architecture`.
- The **emitter** mechanics — RFC 0006.
- **Figma layout translation.** The web owl has no Figma equivalent (auto-layout
  `itemSpacing` is uniform per frame), so prose spacing translates *structurally*:
  bind gaps/spacers to the same `flow/*` variables and express heading asymmetry
  through nested frames. The operational playbook is the **`figma-prose-layout`**
  skill; the parity bar is "web = runtime truth, Figma = design intent, agree at
  the token level."

---

## 8. Open questions

> **Acceptance is settled (2026-06-26): outcome (a)** — no default margins; revert
> the `reset` block margins (§1.4); rhythm is opt-in. The §6 global-owl compromise
> was rejected. The value-question below is now **resolved**.

1. **Flow-scale step count and per-density values — resolved.** All **four**
   steps are kept (`region` reads as a deliberate hierarchy above `h1`/`h2` vs
   `section` above `h3`/`h4`). Validated against an article, a form, and a card
   body in a throwaway Vite harness rendering the real type system, then scaled up
   one step from the first seeds on review. The landed `space-*` aliases per
   density:

   | flow token | dense | compact | comfortable | spacious |
   |---|---|---|---|---|
   | `tight`   | space-8  | space-10 | space-12 | space-16 |
   | `normal`  | space-12 | space-16 | space-20 | space-28 |
   | `section` | space-16 | space-24 | space-32 | space-40 |
   | `region`  | space-24 | space-32 | space-48 | space-56 |

---

## 9. Decision record

> **Design accepted and implemented (2026-06-26).** Outcome (a) — **no default
> margins** — is settled and shipped; the entries below stand. Decision IDs start
> at **D66** to avoid collision with the landed work (D60 is the reset reversal this
> RFC contends with; D1–D55, D60, D65 are otherwise taken).

| # | Decision (proposed) | Maps to |
|---|---|---|
| 1 | **Revert, surgically.** Remove the global outer `margin-block`/`margin-inline` declarations the prose-base-styles work put on block elements in `primitiv.reset` (RFC 0008 D60); **keep** element typography, inline marks, inner spacing, and the existing one-directional `li + li` gap | D66 |
| 2 | **Why:** element-owned two-directional `margin-block` carries two intrinsic defects the lowest-layer placement does not fix — **margin-collapse non-determinism** (nesting-dependent) and **first/last-child bleed**; the one-directional owl removes both by construction | D67 |
| 3 | **Three spacing kinds, three mechanisms:** component-internal = `gap`; content-flow rhythm = a one-directional owl on a flow context; a bare block has no outer margin | D68 |
| 4 | **No default margins.** Flow rhythm is an **opt-in container context** (`.primitiv-flow`), the sibling of `data-density` — applied by descent, no element cooperation, no JS; opt-in, **never** global | D69 |
| 5 | The mechanism is the **single-direction owl** (`> * + *`, `margin-block-start`): no collapse, no bleed, logical-property, low-specificity; ships in `primitiv.base`, above the kept typography in `reset` | D70 |
| 6 | The rhythm scale is a **`flow/*` namespace in the Context collection** (the `dropdown/*` precedent) → density-neutral `--primitiv-flow-*` in `primitiv.tokens`, densifying with `[data-density]`; seed values taken from the landed stylesheet for a near-neutral revert | D71 |
| 7 | **Fixed token scale; runtime type-derivation rejected** (`em`/`lh` floats off the `space-*` grid, saves no authoring, harder to override); proportionality-to-heading-size via **discrete heading-role steps** | D72 |
| 8 | The role→step **mapping is shipped, opinionated, and overridable** (heading asymmetry + discrete proportionality; targets semantic children; `:where()` + token keeps it sovereign) | D73 |
| 9 | **Both surfaces ship from the registry — not the headless package:** the `.primitiv-flow` class and an `asChild` `<Prose>` wrapper are a copy-in registry component (`primitiv add prose`); `<Prose>` has zero behaviour; `@primitiv-ui/react` is unchanged | D74 |
| 10 | **No separate horizontal-rhythm model** — inline spacing is `gap`/`padding-inline`; the logical `margin-block-start` rotates to horizontal under vertical writing modes | D75 |
| 11 | **Rejected — no global default, including a global owl.** The §6 compromise (a low-specificity global owl) is declined: any global rhythm is still a default. Flexibility comes instead from three composable paths — wrap (`.primitiv-flow`/`<Prose>`), write your own margins, or mix the two (§4.1) | D76 |
