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

Two equally valid shapes:

**Shape A — context-as-root (one tree per context):**

```
semantic.context.compact.typography.label.md
semantic.context.compact.anatomy.framed-control.md.height
semantic.context.comfortable.typography.label.md
…
```

**Shape B — concern-as-root with mode-based override (one tree, four
Figma modes):**

```
semantic.typography.label.md          ← four values, one per mode
semantic.anatomy.framed-control.md    ← four values, one per mode
```

**Recommendation: Shape B.** Components reference role and anatomy by
name only (`{semantic.typography.label.md}`, not
`{semantic.context.comfortable.typography.label.md}`). Context selection
happens at the consumer:

- In Figma: a single multi‑mode collection per concern (one mode per
  context).
- In CSS: a `.context-comfortable` class swaps the CSS custom property
  values; component CSS references the role name and never the context.

Shape B forces the right dependency direction: components are
context‑agnostic. Shape A makes it tempting to reference a specific
context in component tokens, which couples them.

**Caveat (Figma sync):** the current
`packages/tokens/src/dtcg.ts#routeCollection` routes by collection name
and reads only `collection.defaultModeId`. Multi‑mode export is the noted
follow‑up in the figma-token-sync skill. Shape B requires that follow‑up
before the export reflects all four contexts. See §10 for the migration
plan.

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

### 10.1 Target Figma layout

```
Primitives                   single mode
Intent                       single mode (eventually: light + dark modes)
Role                         four modes (dense, compact, comfortable, spacious)
Anatomy                      four modes (dense, compact, comfortable, spacious)
Interaction                  single mode
Components                   single mode (eventually: per-product modes)
```

### 10.2 Required `dtcg.ts` changes

1. Add `Intent` → `semantic.json` under `intent.*` (or merge under
   `semantic.color.*` — naming TBD; see §13).
2. Add `Role` → `semantic.json` under `typography.*`, **with mode
   support**, one set of values per context (the noted multi‑mode
   follow‑up).
3. Add `Anatomy` → `semantic.json` under `anatomy.*`, with mode support.
4. Add `Interaction` → `semantic.json` under `interaction.*`.
5. Retire the four `Typography / <context>` collection routes once `Role`
   replaces them.

The DTCG transform is pure, has tests in
`packages/tokens/src/dtcg.test.ts`, and is the right place to do the
work. The multi‑mode extension is the one piece of net‑new transform
logic.

### 10.3 The sync server stays as is

`packages/tokens/src/server.ts` keeps the same `/sync` contract; it just
writes a bigger `semantic.json`. No changes needed.

---

## 11. Migration plan

Twelve small steps, each independently safe to land. Each becomes its
own commit; each is reversible without rewriting the world.

### Phase 1 — Names and stubs (no Figma changes yet)

1. **Add `intent.*` stubs to `semantic.json`** with placeholder aliases
   pointing at existing palette ramps. No new Figma variables yet — this
   is JSON‑only, to prove the shape and let component tokens start
   referencing intent names.
2. **Add `interaction.*` to `semantic.json`** with the five values from §8.
3. **Add `anatomy.*` to `semantic.json`** with values lifted from the
   ChatGPT v1 RFC's regular density table for the comfortable context.
   Single mode for now.
4. **Rename `typography.<ctx>.ui.label` → `typography.<ctx>.label.md`**
   and **drop `typography.<ctx>.ui.button`** in `semantic.json`. Update
   the `dtcg.ts` Typography routing accordingly. Tests updated.
5. **Add `typography.<ctx>.label.{xs,sm,md,lg,xl}`** to fill the ladder
   (currently only `md` exists as `ui.label`).
6. **Decide `space` vs `size`** in `primitives.json`. Either delete one
   or document the divergent purpose.

### Phase 2 — Component rewiring

7. **Rewrite `components.json`** so every Button token references
   `intent.action.*`, not `color.primary.*`. Drop the per‑variant
   `disabled` colour repetitions (covered by `interaction.disabled`).
   Add `button.size.{xs..xl}` referencing role + anatomy.
8. **Add `button.outline` and `button.ghost`** variants now that the
   wiring layer is sane.

### Phase 3 — Figma

9. **Restructure Figma collections** to match §10.1. Create `Intent`,
   `Role`, `Anatomy`, `Interaction` collections; migrate variables.
10. **Extend `dtcg.ts` for multi‑mode collections** — the noted
    follow‑up. Add tests for the four‑mode export of `Role` and
    `Anatomy`. The Typography‑by‑collection routing retires here.
11. **Re‑sync from Figma** end‑to‑end. Compare the new
    `semantic.json` against the hand‑authored stubs from Phase 1; resolve
    any drift.

### Phase 4 — Real values

12. **Wire Harmoni outputs into `intent.*`** once the palette engine
    provides stable ramps. Until then, `intent.*` aliases point at the
    existing `color.gold.*` / `color.red.*` ramps as a holding pattern.

Each phase ships behind real components on the working branch. No big
bang.

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

### 12.4 Reserved names

- `default` is the resting state; we never overload it to mean "fallback
  variant".
- `base` (currently used in `typography.<ctx>.body.base`) gets renamed to
  `md` for ladder consistency. Body tiers become `xs sm md lg`.

---

## 13. Open questions

To resolve in follow‑up RFCs or before Phase 2:

1. **`intent.*` vs `color.*` at the semantic root.** Whether the root key
   in `semantic.json` is `intent` (clearer pattern naming) or `color`
   (familiar, matches Figma collection "Color" if we name it that way).
   Recommendation: keep `color` at the root and nest intent groups under
   it (`color.action.primary.default`) for migration ease.
2. **Dark mode.** The intent layer is the only layer that needs modes for
   theming. When dark mode lands, `intent` gains light/dark modes; nothing
   else changes. Out of scope for this RFC.
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

## 15. Appendix — Pattern map (Alexander‑style)

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
