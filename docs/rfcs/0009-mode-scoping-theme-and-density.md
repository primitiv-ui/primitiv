# RFC 0009 — Mode scoping: theme & density as inheritable attributes

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-10
> **Seeds from:** the 2026-06-10 density-scoping discussion (this session).
> **Relates to:** RFC 0004 (the styling contract — adds the scope attributes as
> documented surface) §3; RFC 0006 (token & style pipeline — density emits like
> dark; resolves §10.1) §5, §10.1; RFC 0008 (CSS architecture — mode scopes live
> in `primitiv.tokens`) §5. Skills: `figma-variable-architecture` (the 4-mode
> Context collection), `dark-mode-palettes`.
> **Resolves:** RFC 0006 §10.1 (the `data-*`-vs-`.class` selector question), for
> both the theme and density axes.

---

## 0. Summary

Primitiv models **density** in Figma as a 4-mode `Context` collection
(Dense / Compact / Comfortable / Spacious), where density is *frame-owned* and
child objects inherit their parent's density (`figma-variable-architecture`).
RFC 0006 §5.2 already emits **dark mode** as a `[data-theme="dark"]` scope. This
RFC generalises that one move into a single model — **mode scoping** — and adds
**density** as the second axis, with the explicit goal of maximum compatibility
across consumer architectures.

The moves:

1. **Two orthogonal mode axes, both expressed as inheritable DOM attributes:**
   `data-theme` (light / dark) and `data-density`
   (dense / compact / comfortable / spacious). A mode is set by an attribute on
   *any* element and inherited by everything beneath it — reproducing Figma's
   page → frame → child inheritance on the web.
2. **The mode is collapsed out of the token *name* and into a *scope*.** A
   density-dependent token emits under a density-neutral name
   (`--primitiv-framed-control-md-height`); the active value is swapped by the
   `[data-density="…"]` scope. Components read the neutral name and never know
   which mode is active.
3. **It is plain custom-property inheritance**, so it works identically in CSS,
   SCSS, and Tailwind v4, needs no JavaScript, and requires no cooperation from
   the components themselves — a consumer can scope a subtree with one attribute
   on a wrapper.
4. **Responsive density (container queries) is designed-in but deferred.** The
   attribute model is v1; making density respond to container size is a small
   additive follow-on on the same foundation (§5).

## 0.1 Scope

In scope: the mode-scope model for theme and density, the consumer API, format
compatibility (incl. the Tailwind wiring), defaults, and the responsive-density
trajectory. Out of scope: the *values* of each density (they live in Figma's
Context collection and flow through DTCG unchanged), the dark *engine* work
(`dark-mode-palettes`), and the emitter mechanics (RFC 0006 §4). This RFC defines
the *scoping surface*; RFC 0006 emits into it.

---

## 1. Principles

### Principle 1 — A mode is a scope, not a name

Theme and density multiply the token set; baking them into custom-property names
(`--primitiv-…-dense`) would force every component to branch on mode. Instead the
mode is a *selector* that swaps values behind stable names. One name, N modes —
the components stay mode-agnostic. (This is RFC 0006 Principle 2, "names are the
contract," applied to the mode axes.)

### Principle 2 — Inheritance is the mechanism

Custom properties inherit. A mode attribute on an ancestor re-declares the mode's
properties for that subtree, and everything beneath resolves the new values with
no further wiring. This is what makes Figma's frame inheritance reproducible and
what makes nesting (a dense table inside a comfortable page) free.

### Principle 3 — Compatible by default

The scope is a DOM attribute — the lowest common denominator across every
consumer architecture. No JS, no framework API, no build step is required to set
one. Richer integrations (Tailwind variants, a React helper) are *opt-in
conveniences layered on top*, never prerequisites.

---

## 2. The mode-scope model

### 2.1 Two orthogonal axes

| Axis | Attribute | Values | Default (unscoped `:root`) |
|---|---|---|---|
| Theme | `data-theme` | `light`, `dark` | `light` |
| Density | `data-density` | `dense`, `compact`, `comfortable`, `spacious` | `comfortable` |

They are **separate attributes** because they are independent: a subtree can go
dark without changing density, or denser without changing theme. Keeping them
apart avoids a combinatorial `data-mode="dark-dense"` explosion and lets each be
set, overridden, and nested on its own.

### 2.2 Collapse the mode out of the name

The Figma `Context` collection keys every sizing/type token by density
(`context.<density>.framed-control.<size>.<prop>`). The emitter drops the
`context.<density>` segment from the custom-property name and emits one scope per
density (exactly as Intent Light/Dark collapses into `[data-theme]`, RFC 0006
§5.2):

```css
@layer primitiv.tokens {
  :root,
  [data-density="comfortable"] {
    --primitiv-framed-control-md-height: 2.5rem;          /* size-40 */
    --primitiv-framed-control-md-padding-inline: 1rem;    /* space-16 */
    /* …every slot × every density-dependent property… */
  }
  [data-density="dense"] {
    --primitiv-framed-control-md-height: 1.5rem;           /* size-24 */
    --primitiv-framed-control-md-padding-inline: 0.5rem;
  }
  [data-density="compact"]  { /* … */ }
  [data-density="spacious"] { /* … */ }
}
```

A component resolves `--primitiv-framed-control-md-height` and gets whatever the
nearest `data-density` ancestor dictates — `2.5rem` under comfortable, `1.5rem`
under dense.

### 2.3 Inheritance = Figma's page/frame/child model

```html
<body data-theme="light" data-density="comfortable">  <!-- global defaults -->
  <main>
    <Button />                          <!-- comfortable -->
    <section data-density="dense">      <!-- this subtree goes dense -->
      <Table />                         <!-- inherits dense -->
      <Button />                        <!-- inherits dense -->
    </section>
    <Table data-density="spacious" />   <!-- one component, overridden locally -->
  </main>
</body>
```

A nested attribute re-declares the density properties for its subtree; cascade
inheritance carries them down. Arbitrary nesting works because each level just
overrides custom-property values — there is no special-casing.

### 2.4 Density is a different axis from size

Worth stating because they are easy to conflate: a component's **size slot**
(`xs–xl`) is a *per-instance visual variant* set by a **modifier class**
(`.primitiv-button--md`, RFC 0004 §3.1.2); **density** is an *ambient context*
set by a **scope attribute** and inherited. A single `--md` button renders taller
under comfortable and shorter under dense — same slot, different density. The two
axes compose; neither replaces the other.

### 2.5 Where it lives in the cascade (RFC 0008)

Mode scopes are token *value* declarations, so all of them — `[data-theme]` and
`[data-density]` alike — live in the **`primitiv.tokens`** sublayer (RFC 0008
§2.2, §5), emitted once with the shared theme tokens (RFC 0008 §3.1). Because the
declarations are unlayered-overridable and `!important`-free (RFC 0008 §2.4), a
consumer can still override any individual property for a scope without fighting
the cascade. Brand overrides from `primitiv theme` continue to sit in
`primitiv.theme` above them (RFC 0008 §5).

---

## 3. The consumer API

### 3.1 One attribute, any level

- **Global:** `<html data-density="comfortable" data-theme="light">`.
- **Subtree:** `<section data-density="dense">` — everything inside is dense.
- **Single component:** `<Table data-density="spacious" />`.

### 3.2 No JS, no component cooperation

Because the effect propagates through inheritance, the attribute can sit on a
*wrapper* the consumer already controls; the Primitiv components inside need not
forward or even be aware of it. There is no required runtime, context provider,
or prop. (A `DensityProvider` / `data-density` pass-through could be offered as
an ergonomic convenience later, but it is not load-bearing — the headless
components stay mode-agnostic.)

---

## 4. Compatibility across formats

The model is "set an attribute; custom properties inherit," so it carries across
the RFC 0006 formats with no per-format reinvention.

### 4.1 CSS / SCSS

Native. SCSS compiles to the same `@layer` + attribute-scope blocks; `$`-vars and
maps resolve into the same inherited custom properties. Nothing format-specific.

### 4.2 Tailwind

- **Utilities inherit automatically (v4).** Tailwind v4 is CSS-variable-native;
  its utilities resolve `--primitiv-*`, so a `[data-density]` / `[data-theme]`
  ancestor re-skins Tailwind-styled markup with no extra config.
- **Remap the `dark:` variant (wiring step).** Tailwind's built-in `dark:`
  variant defaults to `.dark` / `prefers-color-scheme`. To keep a consumer's
  `dark:` utilities in lockstep with our scope, the preset documents (and the
  `add` wiring step, RFC 0005 §4.3, can offer to write):
  ```css
  @custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
  ```
- **Optional density variants.** For consumers who want to opt a *utility* into
  density-awareness explicitly, the preset can ship matching custom variants:
  ```css
  @custom-variant dense (&:where([data-density="dense"], [data-density="dense"] *));
  ```
- **v3 (if supported, RFC 0006 §10.3).** Not variable-native, but `data-[theme=dark]:`
  / `data-[density=dense]:` variants still work; documented best-effort, not a v1
  promise.

### 4.3 TS/JS token object

The token object exposes *values*; mode selection is a DOM concern, so the object
is mode-agnostic (the same way it is layer-agnostic, RFC 0008 §4). Consumers
theming in JS read the value set and apply scopes in markup as above.

---

## 5. Responsive density (container queries) — designed follow-on

Making density respond to *container size* — a card that densifies when narrow —
is the natural next capability, and the attribute model gets most of the way
there. The remaining gap is precise: **CSS cannot set an attribute from a
`@container` query**, so responsive density needs each density also exposed as a
reusable *declaration block* a container query can apply:

```css
.primitiv-density-container { container-type: inline-size; }

@container (max-width: 30rem) {
  .primitiv-density-container {
    --primitiv-framed-control-md-height: 1.5rem;   /* the dense value-set */
    /* … */
  }
}
```

The value-sets are the *same* ones the attribute scopes use (one source of truth,
RFC 0006 Principle 1), so this is additive: the emitter exposes each density's
declaration block in a container-applicable form, plus a small `container-type`
helper. **v1 ships the attribute model; responsive density is documented as the
designed follow-on, not built.** (CSS *style queries* — `@container style(--primitiv-density: dense)`
— are the eventual purest path but have thin browser support today, so they are
post-v1.)

---

## 6. Defaults & values

- **Density values** are the Figma `Context` modes verbatim: `dense`, `compact`,
  `comfortable`, `spacious`. No new densities are invented here.
- **Default density** (unscoped `:root`) is **comfortable** — the system's
  resting density. A consumer makes the whole app denser by setting
  `data-density` once at the root.
- **Default theme** is **light**, per RFC 0006 §5.2.
- **`prefers-color-scheme`** remains an **opt-in** emitted variant (RFC 0006
  §5.2), not the default; explicit `data-theme` is the SSR-safe default. (No
  `prefers-*` analogue exists for density.)

---

## 7. What this RFC does not cover

- The per-density **values** and the DTCG source — `figma-variable-architecture`
  / `packages/tokens`.
- The **emitter** that produces the scoped output — RFC 0006 §4.
- The **dark engine** (chroma/contrast tuning) — `dark-mode-palettes`.
- The cascade-**layer** placement rules themselves — RFC 0008.

---

## 8. Open questions

1. **A `DensityProvider` convenience?** Whether `@primitiv-ui/react` ships an
   optional component/hook that sets `data-density` (and reads the active value)
   for ergonomic React use, or the bare attribute is left to the consumer. Bare
   attribute is the v1 floor either way (§3.2).
2. **Responsive-density emit shape.** When §5 is built, exactly how the emitter
   exposes each density block for container queries (a utility class per density,
   a documented mixin, a generated `@container` ruleset) — deferred with the
   feature.
3. **`add`-time Tailwind `dark:` remap.** Whether the wiring step (RFC 0005 §4.3)
   *offers to write* the `@custom-variant dark …` line or only documents it (ties
   to RFC 0008 §7.3, the analogous Tailwind layer-order wiring question).

---

## 9. Decision record

| # | Decision | Maps to |
|---|---|---|
| 1 | Theme and density are **two orthogonal, inheritable DOM-attribute scopes** (`data-theme`, `data-density`); a mode is a *scope*, not a token name; custom-property inheritance reproduces Figma's page/frame/child model | D39 |
| 2 | **Attributes, not classes**, for both axes — resolving RFC 0006 §10.1's selector question; kept as separate attributes (orthogonal, no `data-mode` combinatorial explosion) | D40 |
| 3 | Density values = Figma `Context` modes (`dense`/`compact`/`comfortable`/`spacious`); **default density = comfortable**, default theme = light; `prefers-color-scheme` stays opt-in | D41 |
| 4 | Density-dependent tokens emit under **density-neutral names**; the `context.<density>` axis collapses into `[data-density]` scopes in the `primitiv.tokens` layer (RFC 0008) | D42 |
| 5 | Model works across **all four formats**; Tailwind wiring documented — remap `dark:` to `[data-theme="dark"]`, optional `data-[density]` variants; v4 utilities inherit the active mode automatically | D43 |
| 6 | **v1 ships attribute-based density**; **responsive (container-query) density is designed-in but deferred** — additive on the same value-sets (emit each density as a container-applicable block + a `container-type` helper); CSS style-queries are the eventual purest path | D44 |
