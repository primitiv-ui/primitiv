---
name: figma-variable-architecture
description: Architecture of the Figma variable collections — the unified Context collection (4 density modes Dense/Compact/Comfortable/Spacious), framed-control anatomy tokens, size slots (xs–xl) with resolved values per mode, the focus ring radius formula, the unified Intent collection (Light/Dark), the surface/border/content families for non-action controls, and the text-style/typography gotchas. TRIGGER when adding new variables, binding a layer property to a token, extending framed-control to a new component, debugging focus ring geometry, checking a radius/size value for a density and slot, picking a token for a form-input control, or working with text styles and mode overrides. SKIP for token export/backup work (see figma-token-sync) and wireframe styling lookups (see figma-wireframe-tokens).
---

# Figma variable architecture

This file is the entry point. Read the reference file for the area you're
working in — don't load all of them:

- `references/resolved-values.md` — framed-control and label typography
  resolved values for all 4 density modes, Primitives variable IDs, Context
  collection/mode IDs, deprecated collections.
- `references/focus-ring.md` — full focus ring anatomy, stroke spec, the
  canonical build recipe, and the radius-slip / STRETCH-constraint gotchas.
- `references/intent-tokens.md` — action/surface/border/content token
  structure and alias targets, the link variant, non-action control patterns,
  the dropdown/* namespace, planned elevation/*, danger-semantic tokens, and
  the white/black anchor variables.
- `references/typography-and-text-styles.md` — font family resolution
  (Khand / Asta Sans), the mixed resolvedType gotcha, and why text styles
  silently break density.

## Collection hierarchy

| Figma collection name        | Modes          | DTCG output file  | Path prefix in DTCG           | Purpose                                               |
| ---------------------------- | -------------- | ----------------- | ----------------------------- | ----------------------------------------------------- |
| `Primitives`                 | single         | `primitives.json` | (none)                        | Raw scale values: radii, spacing, colour, typography  |
| `Primitives / Palette`       | Light, Dark    | `primitives.json` | (none)                        | Colour ramps: brand, neutral, danger, white, black; plus absolute-white/black constants (excluded from DTCG) |
| `Semantic`                   | single         | `semantic.json`   | (none)                        | Named decisions: typography scales, anatomy patterns  |
| `Intent` (2 modes)           | Light, Dark    | `semantic.json`   | `color.<modeName>`            | Semantic colour decisions: action, surface, content   |
| `Context` (4 modes)          | Dense–Spacious | `semantic.json`   | `context.<modeName>`          | Component sizing for all 4 densities                  |
| `Interaction`                | single         | `semantic.json`   | `interaction`                 | Interaction-state tokens                              |
| `Components`                 | single         | `components.json` | (none)                        | Per-component token decisions (wired to aliases)      |

**`Primitives / Palette`** is kept separate from `Primitives` because it
requires two modes (Light and Dark) while all other Primitives are
mode-agnostic. Merging them would force every spacing and radius variable into
a two-mode collection unnecessarily.

**`Intent`** has two modes — **Light** and **Dark** — and the two modes alias
**different** `Primitives / Palette` steps (e.g. `surface/default` → `absolute-white`
in Light, `color/black` in Dark; `content/primary` → `neutral/900` in Light,
`neutral/50` in Dark).

**The active theme is driven by the `Intent` mode override ALONE — leave
`Primitives / Palette` in its `Light` mode.** The Intent Dark aliases are chosen so
that, resolved through the **Light** palette, they already produce dark-theme
colours (`content/primary` → `neutral/50` → `[229]` light text on a
`color/black` `[20]` page). This is the single most common theming mistake:

> **Do NOT also set `Primitives / Palette` to Dark.** The palette ramp is a
> *palindrome* across its own modes (`neutral/50` Light `[229]` == `neutral/900`
> Dark `[229]`), so overriding the palette to Dark **double-inverts** — a Dark-Intent
> alias to `neutral/50` then resolves to `[18]` and your body text goes near-black,
> recessed surfaces collide with the text sitting on them, and the whole dark
> theme reads as broken-but-not-obviously-so. Verified 2026-07-01 while building the
> ToggleGroup dark demo. The `Primitives / Palette` **Dark** mode exists for a
> genuinely different Harmoni-generated dark *ramp*, not for standard light/dark
> theming.

Frame-level mode overrides on `Intent` control the active theme; a demo that
shows both themes sets `Intent=Light` on one frame and `Intent=Dark` on the
other, both keeping `Palette=Light`.

The `Context` collection has 4 modes: **Dense**, **Compact**, **Comfortable**,
**Spacious**. Frame-level mode overrides let any frame switch density without
rebinding variables. It is the collection you'll touch most when building or
updating components — it holds the full `framed-control/*` anatomy for every
size slot across all 4 modes.

## The framed-control token anatomy

`framed-control/*` tokens encode the sizing decisions for any framed (bordered)
control — Button, Checkbox, Toggle, Tabs/Trigger, etc. Every context collection
holds a complete set for five size slots: `xs · sm · md · lg · xl`.

| Token                              | Role                                                           |
| ---------------------------------- | -------------------------------------------------------------- |
| `framed-control/{size}/height`     | Overall height of the control                                  |
| `framed-control/{size}/padding-inline` | Horizontal padding (applied to both sides)                 |
| `framed-control/{size}/gap`        | Space between icon and label within the control                |
| `framed-control/{size}/icon-size`  | Icon width/height when placed inside the control               |
| `framed-control/{size}/radius`     | Corner radius of the control frame itself                      |
| `framed-control/{size}/focus-ring-gap-radius` | Corner radius of the white gap layer between control edge and ring |
| `framed-control/{size}/focus-ring-radius`     | Corner radius of the focus ring (blue stroke) layer            |
| `framed-control/border-width`                 | Stroke weight for all framed-control borders — see below |

**`framed-control/border-width`** is deliberately size- and density-invariant —
1px everywhere, aliasing `border-width/1` from Primitives. It does NOT nest
under `{size}/` because the value is uniform; thicker borders are reserved for
special-purpose components, not density scaling. All components bind their
stroke side weights here — never directly to `border-width/*` and never as a
hardcoded value. Applied to Button, Toggle, Input, Select, Checkbox, Radio,
Accordion/Item, Accordion/Panel, Tabs/Trigger, Tabs/Panel (2026-06-03).

## Focus ring formula

| Layer              | Token                                    | Formula          |
| ------------------ | ---------------------------------------- | ---------------- |
| Control frame      | `framed-control/{size}/radius`           | R                |
| Focus-ring-gap     | `framed-control/{size}/focus-ring-gap-radius` | R + 2       |
| Focus-ring         | `framed-control/{size}/focus-ring-radius`     | R + 4       |

The ring is two separate enlarged frames (+2 px/side gap, +4 px/side ring)
behind the content with INSIDE strokes — not an OUTSIDE stroke on the control.
Before building or auditing one, read `references/focus-ring.md` for the full
recipe and the two known gotchas (radius slips, STRETCH constraints).

## Always-on rules

- **Density is frame-owned.** Do NOT set explicit `Context` mode overrides on
  component variants — it locks instances to one density and breaks consumer
  frame-level switching.
- **True white is `color/absolute-white`**, not `color/white` (Harmoni's soft
  white-point) and never `color/neutral/50` (inverts in dark mode). Details in
  `references/intent-tokens.md`.
- **Never apply text styles to component text nodes** — bind `fontSize`,
  `fontStyle`, `fontFamily`, `lineHeight` inline via `setBoundVariable`, or
  density silently breaks. Details in
  `references/typography-and-text-styles.md`.
- **Form-input controls are not actions** — they use `surface/*`, `border/*`,
  `content/*`, not `action/*`. Details in `references/intent-tokens.md`.

## Adding a new framed-control property

1. Decide the value for each size slot across all 4 modes.
2. Check whether a `Primitives` alias exists for each value (prefer aliasing over raw numbers).
3. Use `figma_execute` with `getVariableCollectionByIdAsync` (async API required) to create the variable in the `Context` collection and `setValueForMode` for each of the 4 mode IDs (IDs in `references/resolved-values.md`).
4. Set each mode's value with `figma.variables.createVariableAlias(primitiveVar)`.
5. If the property also needs a DTCG entry, run the sync plugin to back up — the `Context` multi-mode route in `dtcg.ts` handles it automatically.

## Building components across contexts/variants — clone-and-rebind

> For the full build *process* (pre-flight checks, the incremental audit loop,
> laying out the set, and verification), see the **`figma-framed-control-component`**
> skill. This section is the token-level mechanics it relies on.

The cheapest, lowest-error way to add a missing variant to a framed-control
component set is to **clone an already-correct variant and rebind its Context
variables to the unified `Context` collection's same-named vars**. Colour
(`action/*`), border-width, and the focus-ring stroke token live outside
`Context`, so they carry over untouched. The focus ring is intent-neutral, so a
per-variant clone keeps the right ring.

Recipe (run via `figma_execute`, async API throughout):

1. Build `name→ Variable` map for the unified `Context` collection
   (`getVariableCollectionByIdAsync('VariableCollectionId:369:31958')`, then
   `getVariableByIdAsync` per `variableIds`).
2. `const clone = src.clone(); set.appendChild(clone);`
3. `clone.name = "Context=<ctx>, Variant=<v>, Size=<s>, State=<st>"` — setting the
   name in `prop=value, …` form is what sets `variantProperties`.
4. Walk every node depth-first and rebind:
   - read `node.boundVariables`; **skip `fills` and `strokes`** (colour paints —
     not context-bound);
   - text typography fields (`fontSize`/`fontStyle`/`fontFamily`/`lineHeight`)
     arrive as **arrays** — take element `[0]`; layout fields are scalar `{id}`;
   - resolve the source var; if its `variableCollectionId` is `369:31958` (the
     unified Context collection), it is already on the right collection — no
     rebind needed; just proceed to step 5.
   - if the source var is still on one of the old deprecated collections, look up
     the same `name` in the target map and `node.setBoundVariable(field, targetVar)`.
5. Idempotency: before a batch, remove any pre-existing clones for that
   variant so re-runs don't duplicate.

**Efficient rebind pattern:** instead of pre-fetching all collection variables,
do a synchronous walk first to collect unique `boundVariable` IDs, batch-fetch
only those in parallel, then filter to old-collection vars and build the rebind
map. This keeps async overhead minimal even for large component sets.

### Layout & arrange

Arrange scripts lay sets out into a size-rows × variant/state-columns grid.
Props are `Variant/Size/State` (no Context dimension). `md` is placed first
(top row) so `md/primary/default` is top-left; the script `insertChild(0, …)`
that component so Figma uses it as the **default instance**.
