# RFC 0008 — CSS architecture: cascade layers & token scoping

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-10
> **Seeds from:** the 2026-06-10 CSS-architecture follow-up to the consumption
> design session.
> **Relates to:** RFC 0004 (the styling contract — the surface these layers
> wrap) §3, §7.5; RFC 0006 (token & style pipeline — the emitter that produces
> the layered output) §4, §5, §6, §10.4; RFC 0005 (the `add` flow that writes the
> shared token file) §4.2, §4.4.
> **Informs:** RFC 0006 §10.4 (theme-file location) and §10.6 (CSS Modules);
> RFC 0004 §7.5 (root-class emission — shown here to be orthogonal).

---

## 0. Summary

RFC 0004 settled the styling *surface* (root class + modifier classes + `data-*`
+ a `--primitiv-*` custom-property API) and RFC 0006 settled the *pipeline* that
emits it. Neither settled two architectural questions that the emitter has to
answer in its very first golden file:

1. **How is the emitted CSS ordered against itself and against the consumer's
   own CSS?** The copy-in model (RFC 0004 §2.2) writes styles into a repo that
   already has its own CSS — and possibly Tailwind, possibly Radix styles (the
   Dev 3 profile, RFC 0004 §5). Without a deliberate cascade strategy, consumers
   fight specificity wars they cannot see.
2. **When a consumer installs only the Button, do they have to carry every token
   in the system?** RFC 0004 §2.3 tree-shakes the *logic* package, but the token
   *CSS* is otherwise a single monolithic file pulled in whole by every `add`.

The two moves:

1. **All Primitiv CSS is emitted inside one top-level `@layer primitiv`**, with a
   documented sublayer order (`tokens → theme → base → variants → states`). A
   consumer's own unlayered CSS beats anything Primitiv ships, regardless of
   specificity — so "you own and edit it" (RFC 0004, Principle 1) stops meaning
   "you fight the cascade." The sublayer order also makes the
   *state-beats-variant* precedence explicit instead of accidental.
2. **The token output is two-tier.** The shared **theme tokens**
   (`--primitiv-<token-path>`) are emitted once and never pruned — they are the
   global re-skin surface. The **per-component API tokens**
   (`--primitiv-<component>-<part>`) ship *inside each component's stylesheet*, so
   a partial install carries only the components actually added. That answers
   "do I need every custom property?" honestly: you carry the full *theme* layer
   (shared, tiny, load-bearing) and only the per-component tokens for what you
   installed.

## 0.1 Scope

In scope: the cascade-layer model, the no-`!important` rule, consumer/Tailwind
interop, the two-tier token split, partial-install behaviour, and how all four
RFC 0006 formats carry (or don't carry) layers. Out of scope: the styling
*contract* itself (RFC 0004), the emitter *language/location* and format
*inventory* (RFC 0006 §4, D23), and the CLI *commands* (RFC 0005). This RFC
constrains the *shape* of what RFC 0006's emitter produces; it does not change
what formats exist.

---

## 1. Principles

### Principle 1 — The consumer's cascade is sovereign

Primitiv writes into a repo the consumer owns. Its CSS must be *overridable by
default*: a plain rule the consumer writes should win without `!important` and
without a specificity arms race. Cascade layers make this structural rather than
a matter of load order.

### Principle 2 — Order is authored, not accidental

Where two Primitiv rules can target the same property (a disabled primary
button: `[data-disabled]` vs `--primary`), which wins is a *decision*, not a
by-product of source order. The sublayer order encodes that decision once.

### Principle 3 — Pay for what you install

The logic package tree-shakes (RFC 0004 §2.3); the styles should follow the same
spirit. A component's *own* knobs travel with that component; only the genuinely
shared surface is global.

### Principle 4 — Names are the contract (inherited)

Per RFC 0006, Principle 2, consumers depend on `--primitiv-*` *names*. The shared
theme-token surface is therefore kept whole and stable; we do not prune names per
install (§3.4).

---

## 2. The cascade-layer model

### 2.1 One top-level `primitiv` layer

Every selector Primitiv emits — token declarations, base component rules,
modifier classes, state styling — lives inside a single top-level cascade layer
named `primitiv`, subdivided into ordered sublayers:

```css
@layer primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states;
```

The emitter declares this statement once (in the shared token output, §3.1) so
the order is fixed regardless of the order in which component stylesheets are
later imported. Anything **outside** the `primitiv` layer — the consumer's own
CSS — wins over everything inside it, by the cascade-layer rule that unlayered
styles outrank layered ones.

> **Reserved:** `primitiv.reset` is reserved as the lowest sublayer for a future
> opt-in reset; v1 ships no global reset (the components are headless), so it is
> named here only to keep the order stable if one is added.

### 2.2 What lives in each sublayer

| Sublayer | Contents | Example |
|---|---|---|
| `tokens` | shared theme-token defaults + dark-mode token overrides (§5) | `:root { --primitiv-color-primary: … }` |
| `theme` | `primitiv theme --brand` overrides (§5) | `:root { --primitiv-color-primary: <derived> }` |
| `base` | a component's base rule **and its per-component API tokens** (§3.2) | `.primitiv-button { --primitiv-button-bg: var(--primitiv-color-primary); background: var(--primitiv-button-bg) }` |
| `variants` | modifier classes (RFC 0004 §3.1.2) | `.primitiv-button--secondary { … }` |
| `states` | `data-*` state/behavioural styling (RFC 0004 §3.1.3) | `.primitiv-button[data-disabled] { … }` |

### 2.3 Why this order — the data-vs-modifier precedence, resolved

RFC 0004 §3.2 names two surfaces (modifier class for look-only variants, `data-*`
for state the headless layer reflects) but does **not** say which wins when they
collide on a property. A disabled primary button must read *disabled*, not
*primary*; both selectors have equal specificity, so without a layer split the
winner is whichever the emitter happened to write last.

Placing `states` **after** `variants` makes the precedence authored and
guaranteed: state styling always beats variant styling, variant beats base,
regardless of source order. This is the operational completion of RFC 0004's
data-vs-modifier rule.

### 2.4 No `!important` in emitted CSS

Cascade layers invert under `!important`: an important declaration in a *lower*
layer beats an important one in a higher layer, and an important declaration in
*any* Primitiv layer would beat a consumer's *non-important* unlayered rule —
defeating Principle 1. Therefore **Primitiv-emitted CSS contains no
`!important`.** The layer is the override mechanism; consumers reach for
`!important` only against their *own* CSS, never to escape ours.

### 2.5 Consumer interop

- **Plain-CSS consumer (the common case).** Their unlayered rules already win.
  They write `.my-button { background: red }` and it beats
  `.primitiv-button--primary` — nothing to configure.
- **Layered consumer.** If they organise *their* CSS into layers and want those
  to outrank Primitiv, they declare the order with Primitiv first:
  ```css
  @layer primitiv, app;   /* app's layer now outranks primitiv */
  ```
- **Tailwind v4 (RFC 0006 §4.2).** Tailwind v4 is itself layer-native
  (`@layer theme, base, components, utilities`). The recommended consumer
  ordering slots Primitiv below utilities so utility classes still win:
  ```css
  @import "tailwindcss";
  @layer theme, base, components, primitiv, utilities;
  ```
  This is guidance the Tailwind preset documents, not a hard promise — the
  consumer owns their layer order.

### 2.6 Orthogonal to root-class emission (RFC 0004 §7.5)

A cascade layer wraps *rule blocks* (`.primitiv-button { … }`), not the act of
applying a class. So the layer model holds **identically** whether the headless
component hard-emits `.primitiv-button` or the consumer applies it via
`className`. RFC 0004 §7.5 therefore stays open on its own merits; this RFC does
not depend on it and does not settle it. (The genuinely class-emission-sensitive
question is the **CSS Modules** output, RFC 0006 §10.6 — unaffected here because
v1 ships no module format.)

---

## 3. Token scoping — two tiers

### 3.1 Theme tokens — shared, emitted once, never pruned

The `--primitiv-<token-path>` surface (palette, spacing, radii, typography) is
the **global re-skin surface** (RFC 0004 §3.3) and the thing `primitiv theme`
overrides (RFC 0006 §5). It is emitted as a single shared file in the
`primitiv.tokens` layer, written by `primitiv tokens` and by the token-layer
dependency of `add` (RFC 0005 §4.4):

```css
/* primitiv.tokens.css — shared, emitted once */
@layer primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states;

@layer primitiv.tokens {
  :root {
    --primitiv-color-primary: oklch(0.55 0.13 162);
    --primitiv-radius-md: 0.5rem;
    /* … the full theme-token surface … */
  }
}
```

This file is **not** subset per component (§3.4). It is the foundation every
component and every re-skin resolves against.

### 3.2 Per-component API tokens — inside the component stylesheet

The `--primitiv-<component>-<part>` knobs (RFC 0004 §3.3) default to theme tokens
and are *local to one component*. They ship **inside that component's
stylesheet**, in `primitiv.base`, not in the shared token file:

```css
/* button.css — copied by `primitiv add button` */
@layer primitiv.base {
  .primitiv-button {
    --primitiv-button-bg: var(--primitiv-color-primary);
    --primitiv-button-fg: var(--primitiv-color-on-primary);
    --primitiv-button-radius: var(--primitiv-radius-md);
    background: var(--primitiv-button-bg);
    color: var(--primitiv-button-fg);
    border-radius: var(--primitiv-button-radius);
  }
}
@layer primitiv.variants {
  .primitiv-button--secondary { --primitiv-button-bg: var(--primitiv-color-secondary); }
}
@layer primitiv.states {
  .primitiv-button[data-disabled] { opacity: 0.5; pointer-events: none; }
}
```

Because the API tokens travel with the component, `primitiv add button` brings
`--primitiv-button-*` and nothing else; it never carries `--primitiv-switch-*`.

### 3.3 Partial install, worked (Button only)

`primitiv add button` yields exactly:

- `primitiv.tokens.css` — the shared theme surface (once; idempotent, §3.5).
- `button.css` — Button's base rule, its `--primitiv-button-*` API tokens, its
  modifier classes, its `data-*` states.

It does **not** yield any other component's per-component tokens or rules. A
later `primitiv add switch` adds `switch.css` and refreshes nothing in
`primitiv.tokens.css`. This is the honest answer to the original question: you
carry the whole *theme* layer (shared, small, required for re-skin and
cross-component consistency) and only the per-component surface you asked for.

### 3.4 Rejected — subsetting the theme-token file

Pruning the shared theme tokens to "just what Button references" was considered
and rejected for v1:

- **It breaks `primitiv theme`.** A Harmoni brand re-skin (RFC 0006 §5) overrides
  the *whole* palette surface; a pruned base would leave dangling references the
  moment a second component or a brand override is added.
- **It breaks cross-component consistency.** The shared surface is exactly what
  keeps an independently-added Switch matching an earlier Button.
- **The win is negligible.** Custom properties have no runtime cost unless
  referenced, and the file gzips small; the names-are-the-contract principle
  (RFC 0006, Principle 2) wants the name surface whole and stable, not
  install-dependent.

The two-tier split (§3.1–3.2) already delivers "pay for what you install" where
it actually has weight — the per-component rules — without these costs.

### 3.5 Idempotent emit

The shared theme-token file is **write-once**: `add` ensures it exists and is at
the registry version, but adding N components writes it once, not N times. This
extends RFC 0005 §4.4 (transitive token dependency) and §4.2 (refresh): the token
layer is a single managed artifact, refreshed under the same detect-and-prompt
rules as any other copied file, never duplicated per component.

---

## 4. Per-format emission

The RFC 0006 formats (D23) carry the layer model as their medium allows:

| Format | Layers? | How |
|---|---|---|
| **CSS** (canonical) | yes | native `@layer` blocks as shown above |
| **SCSS** | yes | compiles to the same `@layer` blocks (Dart Sass passes `@layer` through); `$`-vars/maps resolve into the layered custom properties |
| **Tailwind** | yes (consumer-ordered) | preset maps `--primitiv-*` via `@theme`; recipes document the recommended `@layer … primitiv … utilities` order (§2.5) |
| **TS/JS token object** | N/A | values only, no cascade — layers do not apply |

One design, emitted per format (RFC 0006 §6.1); the layer structure is part of
that one design, not a per-format reinvention.

---

## 5. Dark mode & theme overrides in the layer model

- **Dark tokens** (RFC 0006 §5.2) are token *values*, so they live in
  `primitiv.tokens` alongside the light defaults. The `[data-theme="dark"]`
  scope wins over `:root` by normal source order *within* the layer — no
  cross-layer interaction needed. The **density** scopes (`[data-density="…"]`,
  RFC 0009) are the sibling mode axis and live in the same `primitiv.tokens`
  layer on identical terms; both rely on plain custom-property inheritance, not
  cascade-layer ordering, so nesting a scope works regardless of layers.
- **Brand overrides** from `primitiv theme --brand` (RFC 0006 §5.1) go in the
  `primitiv.theme` sublayer, which sits *above* `primitiv.tokens`. Because layer
  order — not file load order — decides, the brand override reliably beats the
  base palette **and** is still beaten by a consumer's unlayered `:root`. This
  makes the override file robust regardless of import order, and is this RFC's
  recommendation for **RFC 0006 §10.4** (separate overrides file vs merge): a
  *separate file in the `primitiv.theme` layer*.

---

## 6. What this RFC does not cover

- The styling **contract** (root class, modifiers, `data-*`, custom-property
  API) — RFC 0004 §3.
- The emitter's **language, location, and format inventory** — RFC 0006 §4 / D23.
- The **CLI commands** that drive emission and copy — RFC 0005.
- The **dark engine** work (chroma/contrast) — `dark-mode-palettes` skill; this
  RFC only places the dark *tokens* in the layer model.

---

## 7. Open questions

1. **Reset layer.** Whether v1 ships any opt-in `primitiv.reset` content (e.g. a
   `box-sizing` normaliser scoped to contract classes) or leaves the sublayer
   reserved-and-empty. Leaning empty — the components are headless and a reset is
   the consumer's concern.
2. **Anonymous vs named nested layers.** The sublayer statement is written once
   in the shared token file (§2.1); confirm every per-component stylesheet
   re-states `@layer primitiv.base { … }` (re-opening a named layer is safe and
   order-stable) rather than relying on a single concatenated bundle, since
   copy-in files are imported independently.
3. **Tailwind layer-order enforcement.** Whether the `add` wiring step (RFC 0005
   §4.3) *offers to write* the recommended `@layer … primitiv … utilities`
   statement into the consumer's entry CSS, or only documents it. Ties to the
   Tailwind-version open question (RFC 0006 §10.3).

---

## 8. Decision record

| # | Decision | Maps to |
|---|---|---|
| 1 | All Primitiv CSS is emitted inside one top-level `@layer primitiv` with the ordered sublayers `tokens → theme → base → variants → states`; consumer **unlayered** CSS always wins | D33 |
| 2 | Sublayer order encodes precedence: `data-*` **state** > **variant** modifier class > **base**; resolves the ordering left open by RFC 0004 §3.2 | D34 |
| 3 | Primitiv-emitted CSS contains **no `!important`** — the layer is the override mechanism (important would invert layer precedence) | D35 |
| 4 | Token output is **two-tier**: shared theme tokens (`--primitiv-<token-path>`) emitted once in `primitiv.tokens`; per-component API tokens (`--primitiv-<component>-<part>`) ship inside each component stylesheet (`primitiv.base`), so partial installs carry only added components | D36 |
| 5 | **Reject** subsetting the shared theme-token file for v1 (breaks `theme`/consistency, negligible size win, names are the contract) | D37 |
| 6 | Shared theme-token emit is **idempotent** (write-once, refreshed under existing rules); `primitiv theme` overrides occupy the `primitiv.theme` sublayer → a separate file beats base tokens by layer order, recommending the resolution of RFC 0006 §10.4 | D38 |
