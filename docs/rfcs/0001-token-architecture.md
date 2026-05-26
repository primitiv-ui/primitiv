# RFC 0001 — Primitiv Token Architecture

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-05-26
> **Supersedes:** the ChatGPT v1 RFC (in‑chat) and the v2 typography pivot

---

## 0. Summary

This RFC describes the target shape of the Primitiv design token system. It
exists because the current tokens (`packages/tokens/src/{primitives,
semantic, components}.json`) have a strong primitives layer, a partial
semantic layer (typography mostly right, colour skipped its intent middle),
and effectively no foundations or component anatomy. As we begin building
real components on top, the cracks will widen quickly.

The key architectural moves:

1. **A six‑pattern layered stack** — primitives, intent, role, anatomy,
   interaction, component — where each pattern has a name, a single
   concern, and a defined direction of dependency.
2. **A semantic colour intent layer** — `action`, `surface`, `content`,
   `border`, `focus` — sits between palette ramps and component wiring.
   Structure first; hex values land later once the Harmoni palette engine
   settles.
3. **Typography is role‑first, not component‑first.** `label`, `body`,
   `heading`, `display`, `mono`. Components consume roles; the type system
   stays finite. The existing `typography.<context>.ui.button` and
   `typography.<context>.ui.label` groups are removed.
4. **Four contexts (`dense`, `compact`, `comfortable`, `spacious`) bundle
   typography AND anatomy.** Density is not a separate axis; it is folded
   into the context. Per‑component overrides remain possible.
   **Figma free‑tier constraint:** each context ships as its own
   single‑mode collection; Figma Pro's multi‑mode collections are a
   future migration target, not a v1 dependency.
5. **Anatomy patterns are first‑class.** `framed-control`, `label-control`,
   `nav-item`, `container` are named anatomy patterns (after Alexander)
   that components compose. Most controls do not invent their own
   dimensions.
6. **Interaction is centralised.** Hover / active / disabled opacity and
   focus‑ring geometry live once, are reused everywhere.
7. **Component tokens become a wiring layer.** No raw values; only
   references to intent + role + anatomy + interaction.

The Button is worked through end‑to‑end in §8 as the canonical example.

---

## 0.1 Scope and source of truth

This RFC is constrained to a specific v1 scope. Stating it explicitly
because the architecture choices below only make sense within it.

**In scope for v1:**

- The shape and naming of design tokens.
- The Figma collection layout that holds them.
- A `Button` component **authored in Figma** that consumes those
  tokens, with working context / size / variant / state.
- The DTCG sync plugin reading Figma → emitting JSON into
  `packages/tokens/src/*.json` for backup.

**Out of scope for v1 (deferred, named so they don't accumulate):**

- Any frontend build pipeline (CSS variable generation, Tailwind
  config, JS module emission, Style Dictionary integration).
- Storybook, the workbench app, or any other code‑level rendering
  surface.
- React component implementations that consume these tokens.
- Any push direction repo → Figma. The sync is one‑way pull for now.

**Source of truth: Figma.** All authoring happens in Figma. The repo's
`packages/tokens/src/*.json` files are a **backup snapshot**, regenerated
by the sync plugin. If the JSON and Figma disagree, Figma wins.

This direction may invert later, once a build pipeline ships and the
repo becomes the authoring surface. The RFC's architecture is designed
to survive that inversion without restructuring — the layer names,
patterns, and reference shapes are identical either way. Only the
*direction of edits* changes.

---

## 1. Principles

These are the principles every decision below derives from. Borrowed from
Alexander's *A Pattern Language*: every pattern is a named, recurring
problem‑in‑context paired with a generic solution; patterns nest, and they
become the vocabulary the team uses to talk.

### Principle 1 — Each pattern has a single concern

Typography names text styles. Anatomy names control dimensions. Intent
names meaning. Components compose. A pattern that does two things will
eventually do three, and then be unmaintainable.

### Principle 2 — Patterns are named for what they *are*, not where they sit

`action.primary` is a pattern. `color.primary.500` is a value. We index
by role, not by storage path, because the role survives reorganisations
and value changes.

### Principle 3 — Dependencies flow one way

```
primitives  →  intent  →  role  →  anatomy  →  interaction  →  component
```

A higher layer never references a lower layer indirectly through a higher
one. Components never reach past intent/role/anatomy down to primitives.
This is the single most important rule.

### Principle 4 — Patterns must be finite

If `typography.label.*` accumulates per‑component tiers, it stops being a
pattern and becomes a dumping ground. The same applies to intent, surface,
border, and anatomy. We resist adding tokens *for* a specific component;
we add tokens that *describe* a recurring need.

### Principle 5 — Composition before invention

A component should not invent values; it should compose existing ones. The
exception is documented per‑component overrides, which are rare and
deliberate (§8.5).

### Principle 6 — Reversible decisions stay local; structural decisions go
in this RFC

If we can change something inside one file without breaking aliases, it
doesn't need an RFC. The shape of the layers, the names of the patterns,
and the direction of dependencies do.

---

## 2. The six‑pattern stack

```
┌──────────────────────────────────────────────────────────┐
│ 6. Component        button, input, badge, card, tabs…    │
├──────────────────────────────────────────────────────────┤
│ 5. Interaction      hover · active · disabled · focus    │
├──────────────────────────────────────────────────────────┤
│ 4. Anatomy          framed-control · label-control ·     │
│                     nav-item · container                 │
├──────────────────────────────────────────────────────────┤
│ 3. Role             typography (label/body/heading/…)    │
├──────────────────────────────────────────────────────────┤
│ 2. Intent           action · surface · content ·         │
│                     border · focus                       │
├──────────────────────────────────────────────────────────┤
│ 1. Primitives       palette · size scale · font scale …  │
└──────────────────────────────────────────────────────────┘
```

**Note on layer count.** The ChatGPT v1 RFC counted five layers; this RFC
splits "semantic" into **intent** (colour meaning) and **role**
(typography roles). They are different patterns and earn separate
treatment. "Implementation" (React, CSS, Figma) is not a token layer; it
is a consumer of the token layers.

---

## 3. Layer 1 — Primitives

### 3.1 Current state — what's good

`packages/tokens/src/primitives.json` already contains clean DTCG groups:

- `color.{neutral,gold,red}.{50..900}` (plus `white`, `black`, `transparent`)
- `font-family.{sans, serif}`
- `font-weight.{thin, extralight, light, regular, medium, semibold, bold}`
- `font-size.{10..160}`
- `line-height.{12..168}`
- `letter-spacing.{wide, tight, tighter}`
- `space.{0..344}`
- `size.{0..344}`
- `radii.{0..48, full}`
- `opacity.{10..100, transparent}`
- `border-width.{0..8}`

All single‑mode. Consumers never read primitives directly (this rule is
enforced socially today; it should be enforced by the architecture).

### 3.2 Changes

1. **Deduplicate `space` and `size`.** They are identical scales with
   identical values. Pick one. Recommendation: keep `size` for raw
   dimension values (control heights, icon sizes, max‑widths) and keep
   `space` for layout gaps and paddings, **and let them diverge** as
   needed — but they must not be silent mirrors of each other. If they
   stay equal, fold one into the other now.

2. **Remove the gold/red specific naming from intent‑adjacent consumers.**
   Primitives keep their palette identity (`color.gold.500`), but every
   non‑primitive layer references intent (§4), never the palette name.
   This is the rule the current `semantic.json` doesn't yet enforce.

3. **Reserve names** in primitives for future palette additions:
   `color.green.*` (success), `color.blue.*` (info), `color.amber.*`
   (warning). They don't need to land in this RFC; reserving them keeps
   intent additions cheap.

4. **Do not add `palette.brand.*` aliases inside primitives.** Aliasing
   the brand belongs in intent (§4). Primitives stay raw.

5. **Reserve names for future primitive groups.** Each of the following
   is a primitive group that will land eventually; declaring them here
   prevents accidental introduction at the wrong layer (e.g. a future PR
   inlining `duration: 200ms` inside a component file):

   - `shadow.*` — drop-shadow recipes (offset, blur, spread, colour)
   - `z-index.*` — layered stacking
   - `duration.*` — motion durations (`fast`, `default`, `slow`)
   - `easing.*` — motion curves (`standard`, `accelerate`, `decelerate`)
   - `breakpoint.*` — viewport thresholds

   None of these are required for Button, Input, or the rest of the
   Phase 1–2 components. They are listed so that when the first
   elevation/motion/responsive request arrives, the layer answer is
   pre‑decided.

---

## 4. Layer 2 — Intent (semantic colour)

This is the layer that is missing today and that everything else depends
on. We design the **structure** now; **values** land later, once the
Harmoni palette engine is built out and the brand palette stabilises.

### 4.1 Pattern set

Five intent groups. Each group is a named pattern with a single concern.

#### `action.*` — interactive surfaces that *do* something

```
action.primary.{default, hover, active, disabled}
action.primary.foreground.{default, disabled}
action.primary.border.{default, hover, active, disabled}

action.secondary.{…}
action.secondary.foreground.{…}
action.secondary.border.{…}

action.danger.{…}
action.danger.foreground.{…}
action.danger.border.{…}
```

> Future: `action.success`, `action.warning`, `action.info` once palette
> ramps exist. The structure is identical.

Each `action.*` group owns four state colours for background and border,
and two for foreground (default + disabled — hover/active foregrounds are
almost never used in practice; if a component needs them, it is a sign of
trouble, not a sign we need more tokens).

#### `surface.*` — non‑interactive containing surfaces

```
surface.default        // app/page background
surface.subtle         // alt rows, sunken panels
surface.raised         // cards, popovers (with elevation)
surface.overlay        // dialogs, sheets, scrims
surface.inverse        // for inverse content blocks (footer, nav drawer)
```

#### `content.*` — text and icons

```
content.primary        // primary copy
content.secondary      // supporting copy
content.muted          // captions, meta
content.disabled       // disabled text
content.inverse        // text on inverse surfaces
content.on-action      // text/icon on action.* surfaces (= action.*.foreground)
```

The `on-action` role is the explicit pattern for "text on a coloured
button" — components reference it instead of duplicating
`action.*.foreground` everywhere.

#### `border.*` — separators and outlines

```
border.subtle          // hairlines, divider rules
border.default         // form fields, cards
border.strong          // emphatic outlines
border.focus           // see also focus.ring; this is the colour, focus has
                       // the geometry
```

#### `focus.*` — accessibility focus indicator

```
focus.ring             // colour token, paired with foundations.interaction.focus
```

### 4.2 Structure, not values

The Harmoni palette is in active development. This RFC does **not** pin
hex values. It pins:

- The names above (the *patterns*).
- The shape under each name (which states/sub‑roles exist).
- The direction of dependency: `intent → primitives`, never the reverse.

When palette values land, every intent token receives an alias to a
primitive palette ramp. Components do not change.

### 4.3 What the existing `semantic.json` becomes

The existing `color.primary.{50..900}` and `color.danger.{50..900}` in
`semantic.json` are **not intent tokens**. They are palette aliases. They
either move down into primitives (as named brand ramps) or are removed
once intent is wired through. Recommendation: rename today's
`semantic.color.primary` → `palette.brand` and `semantic.color.danger` →
`palette.danger` if you want a brand‑named alias layer, and have intent
reference *those* aliases instead of `color.gold.*` directly. This keeps
intent insulated from the eventual palette rename.

---

## 5. Layer 3 — Role (typography)

### 5.1 Pattern set

Five typography roles, each a finite, well‑bounded ladder:

```
label       xs · sm · md · lg · xl       interactive control labels (buttons,
                                          tabs, badges, chips, menu items)
body        xs · sm · md · lg            running prose, paragraphs, lists
heading     h1 · h2 · h3 · h4 · h5 · h6  page and section headings
display     lg · xl                      hero / marketing display sizes
overline    (single tier)                small uppercase labels above sections
mono        sm · md · lg                 code, data, tabular numerals
                                         (reserved; add when needed)
```

Each tier defines: `font-family`, `font-weight`, `font-size`,
`line-height`, `letter-spacing` (optional).

### 5.2 Removals

Delete from `semantic.json`:

- `typography.<context>.ui.button` (each context — four occurrences)
- `typography.<context>.ui.label` (each context — four occurrences)

Today they are identical and would diverge per‑component the moment a
designer asks "can we make the button text slightly heavier than the
label?". The architecture answers that question by saying: the *role* is
`label`; if buttons need a heavier label, add a `label.bold` variant to
the typography role, not a `button` typography subtree.

### 5.3 Why role and not component

Adobe Spectrum, Atlassian, Polaris, Carbon — every mature system —
landed here. Component → role → typography is one degree of indirection
that pays off the moment a second component (badge, tab, chip) reuses the
same text style. Without role names, the typography tree grows linearly
with component count; with role names, it grows linearly with text needs.

---

## 6. Layer 4 — Anatomy

### 6.1 The four anatomy patterns

After Alexander: name the patterns, then build with them.

#### `framed-control.*` — Buttons, Inputs, Selects, Comboboxes

A control with a border/background frame, a single text run, optional
leading/trailing icons.

```
framed-control.xs · sm · md · lg · xl
  └── height · padding-inline · gap · icon-size · radius
```

#### `label-control.*` — Badges, Tags, Chips

A small label with optional dot/icon, no enforced height (it sizes to its
content), and tighter padding semantics.

```
label-control.xs · sm · md · lg
  └── padding-inline · padding-block · gap · icon-size · radius
```

#### `nav-item.*` — Tabs, Menu Items, Segmented Controls

A horizontal/vertical strip member. Height‑driven, but with a distinct
hit area and indicator semantics.

```
nav-item.xs · sm · md · lg
  └── height · padding-inline · gap · icon-size
```

#### `container.*` — Cards, Dialogs, Sheets, Popovers

A block that holds other content. **Typography does not drive its size**
(important; this is the cleanest place to enforce Principle 1).

```
container.sm · md · lg · xl
  └── padding · gap · radius
```

### 6.2 Why these four and not more

These cover every framed UI primitive that has appeared in mature
systems. If a future component genuinely doesn't fit (e.g. a slider, a
toggle, a progress bar), we introduce a fifth named pattern at that
moment — not pre‑emptively. Pattern Language: don't name what you don't
yet need.

---

## 7. The context model

This is the most opinionated decision in the RFC.

### 7.1 Four contexts, bundled

Four named contexts. Each context defines **both** the typography ramp
**and** the anatomy ramp.

```
dense          information-dense screens, plugins, dashboards
compact        SaaS app default, desktop‑first UI
comfortable    standard product UI, websites, mobile-friendly
spacious       marketing, editorial, hero surfaces
```

Selecting a context picks both type and dimensions. There is no separate
`density.{dense,regular}` foundation. This is a deliberate departure from
the ChatGPT v1 RFC's orthogonal axes and is justified by:

- A single mental model: "we are in `comfortable`" tells you everything.
- No 4 × 2 product surface to maintain (typography contexts × component
  densities). Just 4.
- Matches how the team will actually pick: themes ship as bundles.

### 7.2 The escape hatch

Per‑component overrides remain possible. A component MAY define:

```
button.size.md.height: {…override…}
```

These overrides are documented per component (§8.5). They exist for the
rare case where the bundled anatomy doesn't fit a specific control. They
are reviewed; they don't multiply silently.

### 7.3 In the JSON tree

The architectural ideal and the v1 implementation diverge here, because
Figma free‑tier collections are single‑mode. We adopt a hybrid:
**Shape A in Figma + DTCG, with a small alias layer that keeps
components context‑agnostic.**

**Shape A — context-as-root (one collection per context, single mode each):**

```
semantic.context.compact.typography.label.md
semantic.context.compact.anatomy.framed-control.md.height
semantic.context.comfortable.typography.label.md
semantic.context.comfortable.anatomy.framed-control.md.height
semantic.context.spacious.typography.label.md
semantic.context.dense.typography.label.md
…
```

**Shape B — concern-as-root with mode-based override (one collection,
four Figma modes):**

```
semantic.typography.label.md          ← four values, one per mode
semantic.anatomy.framed-control.md    ← four values, one per mode
```

**v1 recommendation: Shape A in Figma and DTCG, with role‑name aliases
on top.** Free‑tier Figma is one mode per collection, so Shape B is
not available without a plan upgrade. To preserve the architectural
property that *components are context‑agnostic*, we add a thin alias
layer:

```
semantic.typography.label.md   → {semantic.context.<default>.typography.label.md}
semantic.anatomy.framed-control.md
                               → {semantic.context.<default>.anatomy.framed-control.md}
```

Components reference the short forms (`{semantic.typography.label.md}`,
`{semantic.anatomy.framed-control.md}`) — they never name a context.
The `<default>` is `comfortable` for v1 and is the only place
"current context" is hard‑coded. Switching the default is a one‑line
change in the alias group.

How the four contexts are reached at consumption:

- **In Figma (v1, in scope):** four single‑mode collections —
  `Context / Compact`, `Context / Comfortable`, `Context / Spacious`,
  `Context / Dense`. Designers pick a context by selecting a Button
  **component variant** whose nested text styles bind to that
  context's variables. The context choice is encoded as a Figma
  component property, not a collection mode.
- **In CSS (deferred, out of v1 scope):** when the build pipeline
  lands, it will emit four sets of CSS custom properties, one per
  `.context-*` selector. Component CSS reads the short‑form role
  name; the active class swap retargets it. The alias layer's choice
  of `comfortable` becomes the unscoped fallback. None of this is
  built for v1 — it is described so that the JSON shape committed now
  is a happy input for it later (§0.1).

**Future migration to Shape B (Figma Pro):** when the team upgrades,
the four `Context / *` collections collapse into one `Context`
collection with four modes. The DTCG export adds multi‑mode support to
`dtcg.ts` (the noted follow‑up in `figma-token-sync`). The short‑form
alias layer survives unchanged; components don't move. The migration is
a Figma‑side reorganisation plus one transform change. See §10 for the
detailed plan and §11 for where it sits in the migration order.

**Why Shape A is acceptable as v1, not just a fallback.** It actually
forces clearer thinking: the four contexts are visible as distinct
trees in the JSON, which makes diffing context‑specific values trivial
and surfaces accidental drift loudly. Shape B's elegance only pays off
once mode‑aware tooling exists at every consumer; until then Shape A is
the more debuggable shape.

### 7.4 What this replaces

- Drops `density.{dense, regular}` as a separate axis.
- Drops `typography.{context}.ui.*` (already covered in §5).
- The four existing typography collections (`Typography / Compact`,
  `Typography / Comfortable`, `Typography / Spacious`, `Typography /
  Dense`) become **modes** of a single semantic collection in Figma, or
  remain four collections that emit into the same DTCG modes — see §9.

---

## 8. Layer 5 — Interaction

Centralised state modifiers and focus geometry. Lives once, applied
everywhere.

```
interaction.hover.opacity         0.92
interaction.active.opacity        0.84
interaction.disabled.opacity      0.40
interaction.focus.ring.width      2
interaction.focus.ring.offset     2
```

**Implication for `components.json` today:** the per‑variant `disabled`
colour entries that currently restate the default colour
(`button.primary.foreground.disabled = {color.primary.900}`, identical to
`default`) go away. Disabled is an interaction overlay (opacity
modifier), not a colour decision per variant.

Where a variant genuinely needs a different disabled colour (rare, but
e.g. a danger variant whose disabled state should not look "ready to fire"),
that is an explicit override in the component layer (§8.5).

---

## 9. Layer 6 — Component (Button, worked example)

### 9.1 Variant inventory

Six variants:

```
primary       brand action, default CTA
secondary     low‑emphasis, paired with primary
outline       transparent with border
ghost         transparent with no border, hover-only background
danger        destructive actions
link          text-only, inline-friendly
```

`link` is unusual as a button variant. We keep it because the team will
use it. Its anatomy still flows through `framed-control` (so a link
button still has a hit area), but its background and border resolve to
transparent in every state.

### 9.2 The Button token shape

The Button has four axes: **variant × size × slot × state**. Density
folds into context (§7), so it does not appear as a Button axis.

Per variant, the component tokens are pure references:

```jsonc
{
  "button": {
    "primary": {
      "foreground": {
        "default":  { "$value": "{color.action.primary.foreground.default}" },
        "disabled": { "$value": "{color.action.primary.foreground.disabled}" }
      },
      "background": {
        "default":  { "$value": "{color.action.primary.default}" },
        "hover":    { "$value": "{color.action.primary.hover}" },
        "active":   { "$value": "{color.action.primary.active}" },
        "disabled": { "$value": "{color.action.primary.disabled}" }
      },
      "border": {
        "default":  { "$value": "{color.action.primary.border.default}" },
        "hover":    { "$value": "{color.action.primary.border.hover}" },
        "active":   { "$value": "{color.action.primary.border.active}" },
        "disabled": { "$value": "{color.action.primary.border.disabled}" }
      }
    },
    /* secondary, outline, ghost, danger, link — same shape */

    "size": {
      "xs": {
        "typography": { "$value": "{typography.label.xs}" },
        "anatomy":    { "$value": "{anatomy.framed-control.xs}" }
      },
      "sm": { "typography": "{typography.label.sm}", "anatomy": "{anatomy.framed-control.sm}" },
      "md": { "typography": "{typography.label.md}", "anatomy": "{anatomy.framed-control.md}" },
      "lg": { "typography": "{typography.label.lg}", "anatomy": "{anatomy.framed-control.lg}" },
      "xl": { "typography": "{typography.label.xl}", "anatomy": "{anatomy.framed-control.xl}" }
    }
  }
}
```

(Note: the size group above is conceptual. DTCG aliases reference whole
token groups by path; the consumer expands `{anatomy.framed-control.md}`
into `height`, `padding-inline`, `gap`, `icon-size`, `radius`. If a
flatter shape is preferred for tooling, each leaf can alias individually.)

### 9.3 Resolution example

The chain below describes how an instance resolves. In v1 the consumer
is a Figma component instance; the chain still applies but the
"resolution" is Figma's alias graph rather than CSS custom property
fallthrough. Same shape, different runtime.

Input:

```
<Button variant="primary" size="md" />
context: comfortable
state: hover
```

Resolution chain:

```
button.primary.background.hover
  → action.primary.hover                            (intent)
  → palette.brand.600                               (primitive alias)
  → #… (real hex, defined by Harmoni)               (primitive)

button.size.md.anatomy.height
  → anatomy.framed-control.md.height                (anatomy role)
  → (resolved per context: comfortable.md = 40)     (mode-driven primitive ref)
  → size.40                                         (primitive)
  → 40                                              (raw)

button.size.md.typography
  → typography.label.md                             (role)
  → (resolved per context: comfortable.label.md)
  → font-family.sans, font-weight.semibold,
    font-size.16, line-height.24                    (primitives)

(applied)
  hover opacity = interaction.hover.opacity = 0.92  (if used)
  focus ring   = interaction.focus.ring.width/offset + color.focus.ring
```

### 9.4 What the Button never references

- A primitive directly (no `{color.gold.500}` in `components.json`)
- A context (no `{semantic.context.comfortable.*}` in `components.json`)
- A state opacity (no `0.40` in `components.json`)
- A typography measurement (no `font-size: 16` in `components.json`)
- Another component

If a future Button PR touches any of those, the review catches it.

### 9.5 Per‑component overrides

Reserved escape hatch. Documented per component. Example:

```jsonc
{
  "button": {
    "overrides": {
      "danger": {
        "background": {
          "disabled": { "$value": "{color.neutral.grey.200}" }
        }
      }
    }
  }
}
```

This is what the override mechanism is for. It is not where new patterns
hide.

---

## 10. Figma collection layout

The DTCG sync (`packages/tokens/src/dtcg.ts`) routes by Figma collection
name. The current routing is:

```
Primitives                   → primitives.json
Semantic                     → semantic.json
Components                   → components.json
Typography / Compact         → semantic.json (typography.compact.*)
Typography / Comfortable     → semantic.json (typography.comfortable.*)
Typography / Spacious        → semantic.json (typography.spacious.*)
Typography / Dense           → semantic.json (typography.dense.*)
```

### 10.1 Target Figma layout (free‑tier, v1)

All collections are single‑mode. There is one collection per context
(four for typography+anatomy), and intent splits per theme mode (one
for light, one for dark when it lands).

```
Primitives                   single mode
Intent / Light               single mode  (today)
Intent / Dark                single mode  (when dark mode lands)
Context / Compact            single mode  (typography roles + anatomy patterns)
Context / Comfortable        single mode
Context / Spacious           single mode
Context / Dense              single mode
Interaction                  single mode
Components                   single mode
```

The four `Context / *` collections each contain the **same set of
variable names** — `typography.label.md`, `typography.body.md`,
`anatomy.framed-control.md.height`, etc. — but with different values.
Same shape, four payloads.

### 10.2 Target Figma layout (post‑upgrade to Pro)

When the team upgrades:

```
Primitives                   single mode
Intent                       two modes  (light, dark)
Context                      four modes (compact, comfortable, spacious, dense)
Interaction                  single mode
Components                   single mode  (eventually: per-product modes)
```

The four `Context / *` collections collapse into one `Context`
collection with four modes. `Intent / Light` and `Intent / Dark`
collapse into one `Intent` collection with two modes. The variable
names don't change; only the storage shape does.

### 10.3 Required `dtcg.ts` changes (v1, free‑tier)

1. Add `Intent / Light` → `semantic.json` under `color.intent.*` (or
   `intent.*`; see §13). Mirror under `Intent / Dark` when it lands.
2. Add the four `Context / <ctx>` collections → `semantic.json` under
   `context.<ctx>.typography.*` and `context.<ctx>.anatomy.*`. Each is
   a regular single‑mode read; no multi‑mode logic required.
3. **Synthesise the short‑form alias layer** at the end of the
   transform: emit `semantic.typography.*` and `semantic.anatomy.*` as
   DTCG aliases pointing at the v1 default context (`comfortable`). The
   default context is a constant in `dtcg.ts`; changing it is one line.
   This is the only piece of *generated* output in the transform —
   everything else is a direct read.
4. Add `Interaction` → `semantic.json` under `interaction.*`.
5. Retire the existing four `Typography / <context>` collection routes
   once the new `Context / <ctx>` collections supersede them.

The DTCG transform is pure, has tests in
`packages/tokens/src/dtcg.test.ts`, and is the right place to do the
work. None of the above requires multi‑mode handling — the v1 export
stays single‑mode end to end.

### 10.4 The multi‑mode follow‑up (deferred to Pro upgrade)

The figma-token-sync skill already notes multi‑mode export as the next
extension to `dtcg.ts`. It is **not** required for v1 and is removed
from the Phase 3 migration scope. When the team upgrades to Pro:

- Add multi‑mode reading to `dtcg.ts` (read every mode of each
  collection rather than `collection.defaultModeId` alone).
- Emit `context.<ctx>.*` from the modes of a single `Context` collection
  instead of from four collections.
- Emit `color.intent.<theme>.*` from the modes of a single `Intent`
  collection instead of two.
- The short‑form alias layer (`semantic.typography.*`,
  `semantic.anatomy.*`, `color.intent.*`) does not change — it still
  points at the v1 default context / theme. Switching defaults remains
  a one‑line change.

Component tokens are untouched by the upgrade.

### 10.3 The sync server stays as is

`packages/tokens/src/server.ts` keeps the same `/sync` contract; it just
writes a bigger `semantic.json`. No changes needed.

---

## 11. Migration plan

Figma is the source of truth (§0.1), so authoring leads and repo sync
follows. The plan is ordered accordingly: each phase produces something
working in Figma, and the repo JSON catches up via the sync plugin at
the end of each phase. Every step is independently safe to land and
reversible.

### Phase 0 — Paper validation (one short session)

1. **Walk one Button variant end‑to‑end on paper.** Pick
   `Button / primary / md / comfortable / hover` and write out the full
   resolution chain by hand against the RFC (intent → role → anatomy →
   interaction → primitive). The goal is to surface naming or shape
   bugs before any Figma work. Drop or revise anything that doesn't
   resolve cleanly. No file changes.

### Phase 1 — Figma authoring: foundations (one context first)

2. **Create the `Intent / Light` collection** in Figma with the §4
   pattern set as variables (no values yet — alias placeholders to
   existing palette ramps). This is the structural pour.
3. **Create the `Context / Comfortable` collection** with the typography
   roles (label, body, heading, display, overline) and the anatomy
   patterns (framed‑control, label‑control, nav‑item, container) as
   variables. Hand‑pick values for `label.*` and `framed-control.*`
   from the current `typography.comfortable.*` tokens — the rest
   already exist in primitives.
4. **Create the `Interaction` collection** with the five values from §8.
5. **Author the text styles** in Figma for the comfortable context,
   binding `fontSize`, `lineHeight`, `fontFamily`, and `fontWeight` to
   the variables from step 3. Naming: `Comfortable / Label / md`, etc.
   Variable binding is what makes this resilient to future typography
   refactors — value changes propagate automatically.

### Phase 2 — Figma authoring: the Button

6. **Build the Button component in Figma** under the comfortable
   context. Variant properties: `variant` (primary/secondary/outline/
   ghost/danger/link), `size` (xs/sm/md/lg/xl), and state surfaced via
   interactive component states (default/hover/pressed/disabled/focus).
   Fills, strokes, padding, gaps, radii, and text styles all bind to
   variables from Phase 1 — no raw values anywhere.
7. **Validate the Button** by changing a single primitive (e.g.
   `palette.brand.500`) and confirming every state in every variant
   updates correctly via the alias chain. If anything doesn't update,
   it's holding a raw value — fix at the source.

### Phase 3 — Repo sync: extend `dtcg.ts`

8. **Extend `dtcg.ts`** for the new collection routes (§10.3). No
    multi‑mode logic; each collection is a single‑mode read. Add the
    short‑form alias synthesis step (`semantic.typography.*`,
    `semantic.anatomy.*` → `comfortable`). Update tests in
    `dtcg.test.ts`. The four existing `Typography / <ctx>` routes
    retire here.
9. **Re‑sync from Figma** end‑to‑end. The new `semantic.json` and
   `components.json` reflect Phase 1–2 authoring. Commit the
   regenerated JSON as the v2 backup baseline.
10. **Decide `space` vs `size`** in `primitives.json`. Either delete
    one or document the divergent purpose. This is the only Phase 3
    edit made directly in JSON; it is a primitive cleanup and doesn't
    affect Figma.

### Phase 4 — Figma authoring: the other three contexts

11. **Duplicate `Context / Comfortable`** to `Context / Compact`,
    `Context / Spacious`, `Context / Dense`. Adjust the values per the
    existing context tables in `semantic.json` (already designed —
    just being re‑homed in the new collection shape).
12. **Author the text styles** for the other three contexts, binding
    to the new context collections' variables. Naming pattern as in
    Phase 1 step 5.
13. **Extend the Button component** to use the new contexts. Either
    (a) one Button master with a `context` variant property whose
    combinations bind to each context's text styles, or (b) four
    Button masters, one per context. See §13 open question 10. Re‑sync.

### Phase 5 — Real values

14. **Wire Harmoni outputs into `color.intent.*`** once the palette
    engine provides stable ramps. Until then, `color.intent.*` aliases
    point at the existing `color.gold.*` / `color.red.*` ramps as a
    holding pattern.

### Phase 6 — Pro upgrade (deferred)

Not part of v1. Triggered by a Figma plan upgrade.

15. **Collapse the four `Context / <ctx>` collections** into a single
    `Context` collection with four modes. Collapse `Intent / Light`
    and `Intent / Dark` into a single `Intent` collection with two
    modes.
16. **Add multi‑mode reading to `dtcg.ts`** (§10.4). Re‑emit
    `context.<ctx>.*` and `color.intent.<theme>.*` from collection
    modes rather than separate collections.
17. **Re‑sync and verify byte‑identical output** for `semantic.json`
    and `components.json`. The upgrade should be invisible to
    consumers.

### Phase 7 — Build pipeline (further deferred)

Not part of v1. Triggered by the first non‑Figma consumer (a React app,
a Storybook surface, a marketing site). At that point the source of
truth inversion (§0.1) becomes worth considering.

Each phase ships on the working branch. No big bang.

### Phase status — snapshot

Reality vs the plan above. Updated as work lands.

| Phase | State |
| --- | --- |
| **0** Paper validation | ✅ Done in‑chat. |
| **1** Foundations | Partial. ✅ `Context / Comfortable` with the full §5 typography roles **and all four** §6 anatomy patterns (framed‑control, label‑control, nav‑item, container) — overshooting the original Phase 1 scope of framed‑control‑only. ✅ `font-style/*` STRING primitive group + bound `fontStyle` on every text style; §15.11 item 3 closed. ⬜ `Intent / Light` deferred (waits on Harmoni — §13.5). ⬜ `Interaction` collection not authored; Button states wait on this. |
| **2** The Button | ✅ Single Button component set in Figma with `variant × size × context` variant properties (6 × 5 × 4 = 120 cells). Every dimension bound: height, padding‑inline, gap, corner radii, icon width/height — all resolving through the active context's `framed-control/<size>/*`. Text style binds to `<Ctx> / Label / <size>`. Component properties expose the icon slots (toggle + swap) and the label text. Per‑variant colours wired to existing primitives (gold/red/grey) pending the intent layer; demo set on the **Button — Context Demo** page renders all 120 cells. ⬜ States (hover / active / focus / disabled) and focus‑ring geometry (§8) deferred until the Interaction collection lands. |
| **3** Repo sync | Partial. ✅ `Context / X` routing in `dtcg.ts` and tests; ✅ `semantic.context.{comfortable,compact,spacious,dense}.*` exported. ⬜ Short‑form alias synthesis (§10.3 step 3) — the next live step. ⬜ `Typography / X` route retirement (§10.3 step 5). ⬜ `space` vs `size` decision (§11 step 10). |
| **4** Other three contexts | ✅ Compact, Spacious, Dense all populated via the `Bootstrap context` action; ✅ Button consumes all four through its `context` variant property. |
| **5** Harmoni → intent | ⬜ Waiting on the Harmoni ramp prototype. |
| **6, 7** | ⬜ Untouched. |

**Next live cycle** — Phase 3 remaining work: synthesise the short‑form
alias layer, retire the legacy Typography routes, decide `space` vs
`size`, then author the Interaction collection so Button states can
land.

---

## 12. Naming conventions

Settle these once; never re‑litigate.

### 12.1 Casing

- Token paths are **kebab-case** at every level (`framed-control`,
  `padding-inline`, `font-weight`). DTCG convention; consistent with
  current files.
- DTCG aliases use **dots** between path segments
  (`{intent.action.primary.default}`). Consistent with current files.

### 12.2 Tier ladders

- Controls use **t-shirt sizes**: `xs sm md lg xl`. Five tiers, no more,
  no fewer.
- Body type uses `xs sm md lg`. Four tiers; there is no `xl` body.
- Headings use **`h1..h6`** (semantic HTML mapping). Six tiers.
- Display uses `lg xl`. Two tiers.
- Containers use `sm md lg xl`. Four tiers.

If a future request asks for `xxs` or `xxl`, the answer is: redefine the
ladder or use an override. We do not extend tiers ad hoc.

### 12.3 State suffixes

- `default · hover · active · disabled` for interactive surfaces.
- Foreground only has `default · disabled`. Hover/active foregrounds are
  banned.
- Focus is a separate concern (`focus.ring`, `interaction.focus.*`), not
  a state suffix on every variant.

### 12.4 Reserved names and forbidden aliases

- `default` is the resting state; we never overload it to mean "fallback
  variant".
- `base` (currently used in `typography.<ctx>.body.base`) gets renamed to
  `md` for ladder consistency. Body tiers become `xs sm md lg`.
- **Forbidden synonyms.** One name per concept; PR reviews reject the
  alternatives:
  - Use `h1`, never `heading-1` or `h-1`.
  - Use `md`, never `base`, `default-size`, `regular`, or `normal`.
  - Use `default`, never `idle`, `rest`, `normal`, or `base-state`.
  - Use `disabled`, never `disable`, `inactive`, or `off`.
  - Use `padding-inline` / `padding-block`, never `padding-x` /
    `padding-y` (CSS logical names match the platform).
- **One verb per state.** A token suffix is either a state
  (`hover`/`active`/`disabled`) or a sub‑role (`foreground`/`border`),
  never both fused into one segment.

---

## 13. Open questions

To resolve in follow‑up RFCs or before Phase 2:

1. **`intent.*` vs `color.*` at the semantic root.** Whether the root key
   in `semantic.json` is `intent` (clearer pattern naming) or `color`
   (familiar, matches Figma collection "Color" if we name it that way).
   Recommendation: keep `color` at the root and nest intent groups under
   it (`color.action.primary.default`) for migration ease.
2. **Dark mode.** The intent layer is the only layer that needs modes for
   theming. **On free‑tier Figma** (one mode per collection), dark mode
   ships as a second collection — `Intent / Dark` — alongside
   `Intent / Light`, with `dtcg.ts` emitting `color.intent.light.*` and
   `color.intent.dark.*` from the two collections. The short‑form alias
   `color.intent.*` points at the light theme as the v1 default,
   mirroring the context default in §7.3. On Pro tier the two
   collections collapse into one `Intent` collection with two modes
   (§10.4). Out of scope for this RFC beyond reserving the shape.
3. **Elevation and motion.** Future foundations. Not blocking.
4. **Brand multi‑tenancy.** If Primitiv ever powers more than one
   product, `intent` gains per‑product modes. Designed for, not built
   for.
5. **The Harmoni → intent wiring.** How generated palettes become alias
   targets. Lives in the Harmoni README, not here.
6. **`mono` typography role.** Listed but unscaffolded. Add when first
   consumed (likely Code, Kbd, TabularNumber components).
7. **Per‑variant border policy for `outline` and `ghost`.** Whether
   `outline.border.hover` actually changes colour or just borrows a
   background hover. Visual design call.

8. **A composition layer above components.** Components are
   context‑agnostic by design (§7.3, Shape B). Consumers (a dashboard
   app, a marketing site, a Figma plugin UI) compose **a context + a
   brand + a mode** into a coherent theme. Today that composition is
   implicit ("we are in `comfortable`, with the gold brand, in light
   mode"). As more products land, this earns an explicit name —
   provisional working name `theme.*` — sitting above components and
   resolving the three choices in one place. Out of scope for this RFC;
   reserved here so it doesn't get invented ad hoc.

9. **Downstream consumption / tooling.** Out of v1 scope (§0.1). When
   a build pipeline ships and the source of truth inverts from Figma to
   the repo, the JSON shape committed here must be a happy input for
   either a custom transformer or a tool like Style Dictionary. Two
   invariants to honour either way: (a) every leaf carries a `$type`,
   (b) aliases use the canonical `{group.sub.name}` form. Both are
   already true of the current files.

10. **Figma Button authoring: one master with `context` variants, or
    four masters? — Resolved: one master.** Shipped as a single
    component set with `variant × size × context` variant properties
    (6 × 5 × 4 = 120 cells). Component properties expose the leading
    and trailing icon slots (instance‑swappable, individually
    toggleable) plus the label text as per‑instance overrides. The
    cell count is tractable in Figma's variant panel today; revisit
    the four‑masters split only if adding states pushes it past a
    workable ceiling (states alone would take it to ~480 cells).

---

## 14. Decision record

The non‑negotiables this RFC commits to:

1. **Six layers, named patterns.** Primitives → intent → role → anatomy
   → interaction → component.
2. **A Button owns no values.** Only references.
3. **Typography is role‑first.** No component subtrees inside the
   typography ramp.
4. **Four contexts bundle typography and anatomy.** No separate density
   axis; per‑component overrides as the escape hatch.
5. **Intent gets a structural home now**, values when Harmoni is ready.
6. **Interaction is centralised.** Disabled is opacity, not duplicated
   per variant.
7. **Anatomy patterns are named** (`framed-control`, `label-control`,
   `nav-item`, `container`). Components compose them; they don't invent
   dimensions.
8. **Figma collections mirror the layers**, with multi‑mode for `Role`
   and `Anatomy`. The `dtcg.ts` multi‑mode extension is the one piece of
   transform code that needs writing.
9. **The migration is twelve small steps**, not a rewrite.
10. **No big bang.** Each phase ships behind real components on the
    working branch.

The success criterion for this architecture is the one in §13 of the v1
RFC, restated: when a designer adds a new framed control (say,
`SearchInput`), the only token additions should be `components.search-
input.*`, and they should be pure references. If the new component
forces additions in primitives, intent, role, anatomy, or interaction —
either it is a genuinely new pattern (and we name it deliberately), or
we are violating the architecture.

---

## 15. Synchronisation operations

The sync plugin (`apps/primitiv-sync-figma-plugin`) currently does one
thing: read Figma → emit DTCG JSON. That stays. This section describes
the **write‑side** operations we'll need to make structural refactors
reproducible — so that "rename a typography role" or "rebind every text
style to the new variable" is a scripted operation, not a manual sweep.

### 15.1 The problem this solves

The previous Typography refactor required hand‑updating every text
style in Figma. That was the warning. The Figma Plugin API can write
variables, variable collections, text styles, **and** variable bindings
on text‑style properties — so a future refactor of the same shape
should be a one‑command operation.

The single most important change is: **every text‑style property that
*can* be bound to a variable, *is*** (font‑size, line‑height,
letter‑spacing — and font‑weight on recent Figma versions). Once
that's in place, value changes propagate from one variable edit to
every bound style and every instance using those styles. The hand
sweep doesn't recur.

### 15.2 What changes versus today's sync

Today (read‑only):

```
Figma  ──── export ────▶  packages/tokens/src/*.json
```

Adding (write side):

```
script / plugin action  ──── apply ────▶  Figma variables + text styles
```

Note the absence of an arrow from the repo into Figma. The repo is not
the source of truth (§0.1). The write side is **operator‑initiated
inside Figma**, sometimes with the script's input checked into the
repo for review, sometimes pasted ad hoc into the dev console.

### 15.3 Tier ladder

Three tiers, picked per operation by how often it'll be run:

**Tier 1 — Dev‑console script.** One‑off prototypes. Paste into Figma's
developer console (the `figma-console-scripts` skill covers the
mechanics — "allow pasting", font loading, plugin API access). Cheap
to write, no maintenance. Right tool for a refactor you'll do once.
When working from terminal Claude Code with the `figma-console-mcp`
tool available, scripts can be authored and executed directly against
a live Figma session — that is the intended implementation channel
for Tier 1 prototyping.

**Tier 2 — Sync plugin action.** Promoted from Tier 1 once an
operation proves reusable. Add a button in the plugin UI, route via
`shared/messages.ts`, handle in `code/handleMessage.ts`. Tested with
the same vitest setup the rest of the plugin uses. Right tool for
"recreate the bound text styles" after any structural change.

**Tier 3 — Declarative manifest (deferred).** A JSON manifest in the
repo describing the desired Figma state, with the plugin reconciling
diffs. Closest to "infrastructure as code", but contradicts the
Figma‑as‑source rule (§0.1) — the manifest would itself become a
competing source of truth. Park until that inversion happens.

V1 lives in Tiers 1 and 2 only.

### 15.4 Operation taxonomy

Three kinds of operations, each with a defined home on the ladder.

**Bootstrap** — structural creation. Nominally "one‑shot" per phase,
but **promoted to Tier 2 from the start**:
- Create `Intent / Light`, four `Context / *`, and `Interaction`
  collections per §10.1.
- Populate variables for the §4 intent groups, the §5 typography
  roles, the §6 anatomy patterns, the §8 interaction tokens.
- Create text styles per (context × role × tier), each bound to the
  matching context's variables.
- Used in migration phases 1, 2, 4. **Live as plugin actions, not
  console scripts** — even though each phase runs them once, the
  inputs (the role/anatomy spec) keep evolving and rerunning a
  vetted, idempotent plugin action is safer than re‑pasting a console
  script. Tier 1 prototypes still earn their keep during *authoring*
  of these actions; they don't graduate to the archive.

**Maintenance** — recurring, idempotent.
- Update a variable's value (e.g. Harmoni produces a new palette ramp).
- Rename a variable while preserving every binding pointed at it.
- Add a new tier to an existing role (e.g. `label.xxl`).
- Rebind text styles after a structural rename (the rebuilt safety
  net).
- Tier 2. These earn a plugin action because the next refactor will
  need them again.

**Read** — existing export.
- Already works. No changes.

### 15.5 Plugin API surface

A focused list of the calls these operations rely on. (Exact method
signatures vary slightly across Figma plugin API versions; verify
against the current Plugin API docs before writing.)

**Collections and variables**

```ts
figma.variables.createVariableCollection(name)
figma.variables.createVariable(name, collection, resolvedType)
variable.setValueForMode(modeId, value)          // literal or alias
variable.name = newName                          // rename in place
variable.remove()                                // explicit delete only
```

Aliases:

```ts
variable.setValueForMode(modeId, {
  type: 'VARIABLE_ALIAS',
  id: targetVariable.id,
})
```

**Text styles**

```ts
const style = figma.createTextStyle()
style.name = 'Comfortable / Label / md'         // forward slashes = folders
style.fontName = { family: 'Inter', style: 'Semibold' }   // must be loaded
style.fontSize = 16                              // direct, or bind below
style.lineHeight = { value: 24, unit: 'PIXELS' }
style.letterSpacing = { value: 0, unit: 'PIXELS' }
```

**Variable binding on text styles** — the crucial bit:

```ts
style.setBoundVariable('fontSize', fontSizeVariable)
style.setBoundVariable('lineHeight', lineHeightVariable)
style.setBoundVariable('letterSpacing', letterSpacingVariable)
// fontWeight binding is supported on recent versions;
// fontFamily binding has caveats — see §15.8.
```

**Font loading** — required before any text style touches a font:

```ts
await figma.loadFontAsync({ family: 'Inter', style: 'Semibold' })
```

Forgetting this is the most common cause of "my script half‑worked".
Every Tier 1 prototype starts with a `loadFontAsync` for every font
combination it'll use.

### 15.6 Idempotency rule

The single safety mechanism that prevents another hand‑sweep refactor:

> **Find or create, mutate in place. Delete only when explicitly told
> to.**

Concretely:

1. Before creating a variable or style, look it up by name (or by a
   stable ID stored in plugin client storage). If it exists, mutate.
2. Never delete by absence ("the manifest doesn't mention it, so
   remove it"). Deletes need an explicit operation name.
3. Renames keep the same Figma node, so bindings survive. A "rename"
   is `variable.name = …`, **not** `delete + create`.
4. If a script can't find a variable it expects, it errors loudly and
   bails — it does not invent state.

This is why even Tier 1 console scripts should compose `findOrCreate`
helpers rather than start with `figma.variables.createVariable(...)`
unconditionally.

### 15.7 Worked example: change `comfortable label/md` font‑size

The whole point of the binding setup is that this is now mechanical.

**Setup (one‑time, Tier 1 script during Phase 1):**

```
Context / Comfortable collection
  variable: typography.label.md.font-size = 16
  variable: typography.label.md.line-height = 24
  variable: typography.label.md.font-weight = 600

Text style: "Comfortable / Label / md"
  bound: fontSize    → typography.label.md.font-size
  bound: lineHeight  → typography.label.md.line-height
  bound: fontWeight  → typography.label.md.font-weight
  direct: fontName.family = "Inter"
```

**The change (any time after):**

1. Designer (or Harmoni, or a plugin action) sets
   `typography.label.md.font-size = 17`.
2. The "Comfortable / Label / md" text style re‑renders at 17/24.
3. Every Button instance using that style — across every variant cell
   that includes `context=Comfortable, size=md` — re‑renders at 17/24.
4. Designer clicks **Export tokens**. `packages/tokens/src/semantic.json`
   updates: `context.comfortable.typography.label.md.font-size` is now
   `{font-size.17}` (or the value is updated upstream in primitives,
   depending on which layer changed).
5. Commit. No text styles touched by hand.

Compare to the pre‑binding world: step 2 would have required reopening
every text style and changing the number; step 3 would have required
no action only because step 2 propagated correctly. Both steps now
collapse to "the variable changed".

### 15.8 Notes and gotchas

- **Font family / weight as variables.** Numeric properties bind
  cleanly. Font family is a string variable, supported but younger in
  the API — verify on the current Figma version before relying on it.
  Font weight binding works when the family has a matching variant
  style at that weight; missing variants fall back unpredictably.
  Safe default: bind size/line‑height/letter‑spacing; keep family and
  weight direct until a specific need overrides them.
- **Single‑mode collections.** Every `setValueForMode` call on a
  free‑tier collection uses `collection.defaultModeId`. The plugin
  helper can hide this so scripts read `setValue(variable, value)`
  without thinking about modes; the multi‑mode upgrade (Phase 6)
  swaps the helper, not the call sites.
- **Reload after structural changes.** Some Figma states (active
  selection, instance overrides) need a manual reload to pick up
  newly bound variables. Script should report this in the plugin UI.
- **Plugin client storage for stable IDs.** Naming‑based lookups are
  brittle to renames. For Tier 2 maintenance operations, store the
  stable Figma variable IDs in `figma.clientStorage` keyed by the
  canonical token path; rename operations then update the *name* but
  preserve the *ID*.
- **Backup before destructive operations.** Any operation that
  removes a variable or rebinds many styles should call **Export
  tokens** first and prompt the user to commit the resulting JSON.
  The DTCG snapshot becomes the undo point.

### 15.9 Scope for v1

In scope:

- **Tier 2 plugin actions** for the Phase 1, 2, 4 bootstrap operations
  and for the maintenance set — at minimum: **Bootstrap context**,
  **Rebind text styles**, **Apply a variable rename**.
- Tier 1 dev‑console scripts as throwaway prototypes during authoring
  of the above (typically via `figma-console-mcp` in a terminal Claude
  Code session). They never become the production implementation.
- The idempotency rule (§15.6) applies to every operation, however
  small.

Plugin UI policy: **minimal, grown one action at a time**. New
buttons land in the sync plugin's UI only when the underlying action
is implemented and tested. No placeholder buttons, no disabled
"coming soon" surface. Each promoted Tier 2 action ships as a single
commit: action code, tests, button.

Out of scope:

- Tier 3 manifest.
- Continuous push‑from‑repo synchronisation.
- Multi‑mode operations (Phase 6).
- A second plugin. The existing `primitiv-sync-figma-plugin` absorbs
  the write operations alongside the export; we do not split it.

### 15.10 Concrete next step

Before any RFC‑driven Figma work begins, the first operation worth
implementing is **Bootstrap context** (Tier 2, plugin action). The
workflow:

1. In a terminal Claude Code session with `figma-console-mcp`
   available, write a Tier 1 prototype that creates
   `Context / Comfortable` from scratch with every variable in §5 +
   §6, the corresponding bound text styles, and a small smoke test
   (a temporary frame demonstrating that changing one variable
   updates all bound surfaces).
2. Verify the binding setup end to end against the live Figma file.
3. Promote the prototype directly into the sync plugin as the
   **Bootstrap context** action, wired into `shared/messages.ts` and
   `code/handleMessage.ts`, with unit tests. The action takes a
   `context` argument so the same code creates Compact, Spacious, and
   Dense in Phase 4 without rewriting.
4. Run the promoted action from the plugin UI to actually create
   `Context / Comfortable` in Figma. Export tokens; commit the JSON.

The Tier 1 prototype from step 1 is throwaway scaffolding — it never
ships, it never gets archived as the source of truth. Step 3 is where
the production implementation lands.

### 15.11 Deferred from the first Bootstrap context cut

The first Tier‑2 *Bootstrap context* action ships a deliberately narrow
slice so the Button (Phase 2) validates the end‑to‑end loop quickly.
The following items are explicitly deferred to follow‑up commits, in
this order:

1. **Anatomy patterns beyond `framed-control` — landed.** All four
   anatomy patterns from §6.1 are now in `contextSpec`:
   `framed-control` (xs/sm/md/lg/xl), `label-control`
   (xs/sm/md/lg, no height — sizes to content), `nav-item`
   (xs/sm/md/lg, no radius), and `container` (sm/md/lg/xl, only
   padding/gap/radius). Each pattern has its own tier table and
   expander so the field sets stay distinct. Values seeded from the
   existing `space/space-N`, `size/size-N`, and `radii/N` primitives;
   tuning happens via editing the tier tables.

2. **The `mono` typography role.** Reserved in §5.1, deferred in
   §13.6. The first action skips it; `overline` is included.

3. **Font‑weight binding — landed via `fontStyle`.** The Tier‑1
   console probe (run against the working Figma desktop on
   2026‑05‑26) confirmed that `setBoundVariable('fontWeight', …)` is
   a **silent no‑op** on the current Plugin API — the call returns
   without throwing, but the binding never appears in
   `style.boundVariables`. The supported alternative is
   `setBoundVariable('fontStyle', …)` against a **STRING** variable
   whose value is a font style name (`"SemiBold"`, `"Medium"`,
   `"Regular"`). The action now binds `fontStyle` against a parallel
   `font-style/*` STRING primitive group; the existing numeric
   `font-weight/*` stays in place for DTCG consumers. Each
   typography tier therefore owns five variables: `font-family`,
   `font-weight` (numeric, for DTCG), `font-size`, `line-height`,
   and `font-style` (the Figma‑binding string). All four bindable
   fields (`fontFamily`, `fontStyle`, `fontSize`, `lineHeight`) are
   bound on every authored text style; nothing is direct on the
   style except the initial fallback values used before the
   bindings resolve.

4. **`dtcg.ts` routing for `Context / *` collections — landed.** The
   `routeCollection` regex now matches `Context / <name>` and routes
   into `semantic.context.<name>`. `semantic.json` carries the full
   `context.{comfortable,compact,spacious,dense}.*` tree. The
   short‑form alias layer (`semantic.typography.*`,
   `semantic.anatomy.*` pointing at the default context per §10.3
   step 3) and retirement of the legacy `Typography / *` routes
   (§10.3 step 5) are the remaining Phase 3 work.

These are scope deferrals, not architectural changes. The RFC's
target shape (§10.1) and the operation tiers (§15.3) are unchanged.

---

## 16. Appendix — Pattern map (Alexander‑style)

A quick‑reference index of the named patterns. Use these names in
conversation, in code review, and in component READMEs.

| Pattern                       | Layer       | Concern                          |
|-------------------------------|-------------|----------------------------------|
| `palette.brand`               | 1           | Brand colour ramp                |
| `palette.danger`              | 1           | Danger colour ramp               |
| `space.*` / `size.*`          | 1           | Raw spatial scales               |
| `font-size.*` / `line-height.*` | 1         | Raw typographic scales           |
| `action.*`                    | 2 (intent)  | Interactive coloured surfaces    |
| `surface.*`                   | 2 (intent)  | Non‑interactive surfaces         |
| `content.*`                   | 2 (intent)  | Text/icon colour                 |
| `border.*`                    | 2 (intent)  | Separators and outlines          |
| `focus.ring`                  | 2 (intent)  | A11y focus colour                |
| `typography.label`            | 3 (role)    | Interactive control text         |
| `typography.body`             | 3 (role)    | Prose                            |
| `typography.heading`          | 3 (role)    | Page/section headings            |
| `typography.display`          | 3 (role)    | Hero/marketing                   |
| `typography.overline`         | 3 (role)    | Small uppercase labels           |
| `typography.mono`             | 3 (role)    | Code/data (reserved)             |
| `framed-control.*`            | 4 (anatomy) | Buttons, inputs, selects         |
| `label-control.*`             | 4 (anatomy) | Badges, tags, chips              |
| `nav-item.*`                  | 4 (anatomy) | Tabs, menu items                 |
| `container.*`                 | 4 (anatomy) | Cards, dialogs, sheets           |
| `interaction.hover/active/disabled` | 5     | State opacity modifiers          |
| `interaction.focus.ring`      | 5           | Focus ring geometry              |
| `button.*`                    | 6           | Button wiring                    |
| (future) `input.*`, `badge.*`, `card.*`, `tabs.*` | 6 | …    |

End.
