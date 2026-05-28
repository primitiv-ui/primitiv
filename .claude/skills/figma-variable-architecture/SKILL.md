---
name: figma-variable-architecture
description: Architecture of the Figma variable collections — collection hierarchy, the framed-control anatomy tokens, size slots (xs–xl), density contexts (Comfortable / Compact), the focus ring radius formula, and the Intent / Light action token structure (primary, secondary, danger, link). TRIGGER when adding new variables, working out what token to bind to a layer property, extending the framed-control system to a new component, debugging a focus ring that looks geometrically wrong, checking the correct radius/size value for a given density and slot, or adding new intent/action tokens. SKIP for token export/backup work (see figma-token-sync) and for wireframe styling lookups (see figma-wireframe-tokens).
---

# Figma variable architecture

## Collection hierarchy

| Figma collection name        | DTCG output file  | Path prefix in DTCG           | Purpose                                               |
| ---------------------------- | ----------------- | ----------------------------- | ----------------------------------------------------- |
| `Primitives`                 | `primitives.json` | (none)                        | Raw scale values: radii, spacing, colour, typography  |
| `Semantic`                   | `semantic.json`   | (none)                        | Named decisions: typography scales, anatomy patterns  |
| `Context / Dense`            | `semantic.json`   | `context.dense`               | Component sizing for the dense density                |
| `Context / Compact`          | `semantic.json`   | `context.compact`             | Component sizing for the compact density              |
| `Context / Comfortable`      | `semantic.json`   | `context.comfortable`         | Component sizing for the comfortable density          |
| `Context / Spacious`         | `semantic.json`   | `context.spacious`            | Component sizing for the spacious density             |
| `Interaction`                | `semantic.json`   | `interaction`                 | Interaction-state tokens                              |
| `Components`                 | `components.json` | (none)                        | Per-component token decisions (wired to aliases)      |

### Why density levels are separate collections (not modes)

The slash in a Figma collection name is **purely visual grouping** in the collections panel — it creates no parent/child relationship. `Context / Compact` and `Context / Comfortable` are fully independent collections.

The correct Figma architecture for density switching is a **single `Context` collection with 4 modes** (Dense, Compact, Comfortable, Spacious). That enables frame-level mode overrides so any frame can switch density without rebinding variables. The current separate-collection structure is a **Figma free-tier workaround**: the free plan allows only 1 mode per collection, making multi-mode consolidation impossible.

The same pattern applies to `Primitives / Palette` and `Intent / Light` — these are standalone collections, not groups inside `Primitives` or `Intent`.

**Target architecture (Professional tier):** consolidate all `Context / *` collections into one `Context` collection with 4 modes. This will require rebinding component token references. Do this migration before building out further components to minimise rebinding scope.

The Context collections are the ones you'll touch most when building or updating components. Each holds the full `framed-control/*` anatomy for every size slot.

## The framed-control token anatomy

`framed-control/*` tokens encode the sizing decisions for any framed (bordered) control — Button, Checkbox, Toggle, Tabs/Trigger, etc. Every context collection holds a complete set for five size slots.

### Size slots

`xs · sm · md · lg · xl`

### Properties per slot

| Token                              | Role                                                           |
| ---------------------------------- | -------------------------------------------------------------- |
| `framed-control/{size}/height`     | Overall height of the control                                  |
| `framed-control/{size}/padding-inline` | Horizontal padding (applied to both sides)                 |
| `framed-control/{size}/gap`        | Space between icon and label within the control                |
| `framed-control/{size}/icon-size`  | Icon width/height when placed inside the control               |
| `framed-control/{size}/radius`     | Corner radius of the control frame itself                      |
| `framed-control/{size}/focus-ring-gap-radius` | Corner radius of the white gap layer between control edge and ring |
| `framed-control/{size}/focus-ring-radius`     | Corner radius of the focus ring (blue stroke) layer            |

### Resolved values — Context / Dense

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 16     | 4              | 2   | 10        | 2      | 4                     | 6                 |
| sm   | 20     | 6              | 4   | 12        | 4      | 6                     | 8                 |
| md   | 24     | 8              | 4   | 14        | 4      | 6                     | 8                 |
| lg   | 32     | 12             | 4   | 16        | 4      | 6                     | 8                 |
| xl   | 40     | 16             | 6   | 20        | 6      | 8                     | 10                |

### Resolved values — Context / Compact

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 20     | 6              | 4   | 12        | 4      | 6                     | 8                 |
| sm   | 28     | 10             | 4   | 14        | 6      | 8                     | 10                |
| md   | 32     | 12             | 4   | 16        | 6      | 8                     | 10                |
| lg   | 40     | 16             | 6   | 20        | 8      | 10                    | 12                |
| xl   | 48     | 20             | 8   | 24        | 8      | 10                    | 12                |

### Resolved values — Context / Comfortable

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 24     | 8              | 4   | 12        | 4      | 6                     | 8                 |
| sm   | 32     | 12             | 4   | 14        | 6      | 8                     | 10                |
| md   | 40     | 16             | 8   | 16        | 6      | 8                     | 10                |
| lg   | 48     | 20             | 8   | 20        | 8      | 10                    | 12                |
| xl   | 56     | 24             | 12  | 24        | 8      | 10                    | 12                |

### Resolved values — Context / Spacious

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 28     | 10             | 4   | 14        | 6      | 8                     | 10                |
| sm   | 40     | 14             | 6   | 16        | 8      | 10                    | 12                |
| md   | 48     | 20             | 8   | 20        | 8      | 10                    | 12                |
| lg   | 56     | 28             | 10  | 24        | 10     | 12                    | 14                |
| xl   | 68     | 32             | 12  | 28        | 12     | 14                    | 16                |

All values alias into `Primitives` (e.g. `radii/6`, `space-8`, `size-16`). `height`, `padding-inline`, and `gap` vary across all four densities. Radii are identical between Compact and Comfortable only — Dense uses smaller radii and Spacious uses larger ones, so focus-ring values differ across all four density collections.

## Focus ring anatomy and formula

Every framed control's focus state uses a three-layer anatomy:

```
[ focus-ring layer     ]  ← 2px brand-colour stroke (focus/ring token), enlarged frame
[ focus-ring-gap layer ]  ← 2px transparent stroke (color/neutral/transparent), enlarged frame
[ control frame        ]  ← the button/control itself
```

The two ring layers are **separate frames, larger than the control**, sitting
behind the content (children index 0 and 1), each centred over the control and
extending outward — *not* an OUTSIDE stroke on the control itself. The gap layer
is +2 px per side, the ring layer +4 px per side. Strokes are **INSIDE** on these
enlarged frames, so the visible stroke sits in the band outside the control edge.
(Verified against the live Button set, 2026-05-28.)

### Corner radii

| Layer              | Token                                    | Formula          |
| ------------------ | ---------------------------------------- | ---------------- |
| Control frame      | `framed-control/{size}/radius`           | R                |
| Focus-ring-gap     | `framed-control/{size}/focus-ring-gap-radius` | R + 2       |
| Focus-ring         | `framed-control/{size}/focus-ring-radius`     | R + 4       |

**Why R + 2 for the gap:** the gap layer extends 2 px beyond the control edge on all sides, so its corner arc must shift out by 2 px to remain concentric.

**Why R + 4 for the ring:** the ring frame extends +4 px per side, so its corner
arc must shift out by 4 px from the control radius to stay concentric.

### Focus ring stroke spec (live Button set)

- Width: **2 px**, bound to `focus/ring/width` (in the `Interaction` collection).
- Colour: bound to the **`focus/ring`** token, which aliases
  `action/primary/default` → `color/brand/light/500` (**#20836F**, brand/teal).
  It is **intent-neutral** — the ring is the brand colour on *every* variant
  (primary, secondary, link, danger), because it points at the primary action
  token regardless of the variant's own colour. It is **not** a fixed `#99C8FF`.
- The ring is a **2 px INSIDE stroke on an enlarged frame** (R + 4, +4 px/side),
  not an OUTSIDE stroke on the control.
- The gap layer is a **2 px INSIDE stroke** bound to `color/neutral/transparent`
  (white at alpha 0) on a +2 px/side frame (R + 2) — a transparent spacer band,
  not a white fill.
- Toggled via a **"Focus ring"** boolean component property on each variant frame.

> Older component *descriptions* in the file (Switch, Checkbox, Tabs…) still cite
> "3 px #99C8FF OUTSIDE" — that text is stale. Trust the live `focus/ring` /
> `focus/ring/width` tokens and the actual focus-variant nodes over those notes.

**Gotcha — ring-frame radius slips.** The two ring frames must bind their corner
radii to *their own component's* size slot (`framed-control/{size}/focus-ring-radius`
on the ring, `…/focus-ring-gap-radius` on the gap). When variants are built by
duplicating across sizes, these bindings are easy to leave pointing at the source
size (or, seen once, the gap frame bound to the *ring*-radius token) — the control
frame still looks right but the ring is non-concentric (most visible at xl). On the
Button set, 16 of 160 ring frames had slipped this way. Fix deterministically:
sweep every `State=focus` component and `setBoundVariable` all four radius corners
of each ring frame to the correct context+size token. Frame *offsets* are a fixed
+4 px/side (ring) and +2 px/side (gap) regardless of size, so only the radii slip.

## Primitives referenced by framed-control

The aliases used are all in the `Primitives` collection. Relevant IDs for scripting:

| Primitive name | Figma variable ID     | Value |
| -------------- | --------------------- | ----- |
| `radii/4`      | `VariableID:142:111`  | 4     |
| `radii/6`      | `VariableID:142:112`  | 6     |
| `radii/8`      | `VariableID:142:113`  | 8     |
| `radii/10`     | `VariableID:142:114`  | 10    |
| `radii/12`     | `VariableID:142:115`  | 12    |

## Intent / Light action tokens

Collection: `Intent / Light` (`VariableCollectionId:346:4407`, mode `346:7`).

Action tokens encode colour decisions for interactive controls by intent. All aliases point into `Primitives / Palette`.

### Token structure per intent

Filled-button intents (primary, secondary, danger) each have three groups:

| Group | Tokens | Role |
| ----- | ------ | ---- |
| `action/{intent}/` | `default · hover · active · disabled` | Background fill per interaction state |
| `action/{intent}/foreground/` | `default · disabled` | Text/icon colour on top of the fill |
| `action/{intent}/border/` | `default · hover · active · disabled` | Border/stroke colour per interaction state |

### Resolved values

| Intent | default bg | hover bg | active bg | disabled bg | foreground |
| ------ | ---------- | -------- | --------- | ----------- | ---------- |
| primary | brand.500 `#20836F` | brand.600 `#086453` | brand.700 `#003E31` | brand.500 | neutral.50 (white) |
| secondary | neutral.100 `#E2E8E6` | neutral.200 | neutral.300 | neutral.50 | neutral.900 (black) |
| danger | danger.500 `#C0392B` | danger.600 `#952318` | danger.700 `#640000` | danger.500 | neutral/white |

Secondary border: neutral.300 default → neutral.400 hover → neutral.500 active → neutral.200 disabled.
Primary and danger borders mirror their bg colour at each state.

### The link variant

`action/link` has **foreground tokens only** — no background, no border. The button frame has no fill; 50% opacity on the disabled variant frame handles the muted appearance (same pattern as all other disabled states in this system).

| Token | Alias | Resolved |
| ----- | ----- | -------- |
| `action/link/foreground/default` | `color/brand/light/500` | `#20836F` |
| `action/link/foreground/hover` | `color/brand/light/600` | `#086453` |
| `action/link/foreground/active` | `color/brand/light/700` | `#003E31` |
| `action/link/foreground/disabled` | `color/brand/light/500` | `#20836F` (opacity does the work) |

The link button is intent-neutral — it always uses the brand colour, styled like a standard `<a>` tag. There is no secondary or danger link variant.

## Adding a new framed-control property

1. Decide the value for each size slot in both densities.
2. Check whether a `Primitives` alias exists for each value (prefer aliasing over raw numbers).
3. Use `figma_execute` with `getVariableCollectionByIdAsync` (async API required) to create the variable in **all four** Context collections (see IDs below).
4. Set the value with `figma.variables.createVariableAlias(primitiveVar)`.
5. If the property also needs a DTCG entry, run the sync plugin to back up — the `Context / *` route in `dtcg.ts` handles it automatically.

### Context collection IDs

| Collection | ID |
| ---------- | -- |
| `Context / Dense`       | `VariableCollectionId:341:3320` |
| `Context / Compact`     | `VariableCollectionId:341:2956` |
| `Context / Comfortable` | `VariableCollectionId:340:2719` |
| `Context / Spacious`    | `VariableCollectionId:341:3138` |

Each holds the full `framed-control/{size}/*` and `label/{size}/*` set under the
same names — they are independent variables, distinguished only by collection.

## Building components across contexts/variants — clone-and-rebind

The cheapest, lowest-error way to add a context (or a missing variant) to a
framed-control component set is to **clone an already-correct variant and rebind
its Context-collection variables to the target collection's same-named twins**.
Used to build the whole `dense` context + the missing `spacious·link` sizes on
the Button set (see the `figma-button-set-complete` memory). Works because every
density binds identically-named `framed-control/*` + `label/*` vars; only the
collection differs. Colour (`action/*`), border-width, and the focus-ring stroke
token live *outside* the Context collections, so they carry over untouched — and
the focus ring is intent-neutral, so a per-variant clone keeps the right ring.

Recipe (run via `figma_execute`, async API throughout):

1. Build `name→ Variable` map for the **target** Context collection
   (`getVariableCollectionByIdAsync(id)`, then `getVariableByIdAsync` per
   `variableIds`).
2. `const clone = src.clone(); set.appendChild(clone);`
3. `clone.name = "Context=<ctx>, Variant=<v>, Size=<s>, State=<st>"` — setting the
   name in `prop=value, …` form is what sets `variantProperties`.
4. Walk every node depth-first and rebind:
   - read `node.boundVariables`; **skip `fills` and `strokes`** (colour paints —
     not context-bound);
   - text typography fields (`fontSize`/`fontStyle`/`fontFamily`/`lineHeight`)
     arrive as **arrays** — take element `[0]`; layout fields are scalar `{id}`;
   - resolve the source var; if its `variableCollectionId` is one of the four
     Context collections, look up the same `name` in the target map and
     `node.setBoundVariable(field, targetVar)`.
5. Idempotency: before a batch, remove any pre-existing clones for that
   context+variant so re-runs don't duplicate.

This is also the migration tool for the eventual modes consolidation
([[figma-density-consolidation]]) — same walk, rebinding to the consolidated
collection instead of a sibling Context collection.

### Layout & arrange

`apps/harmoni-figma-plugin/scripts/arrange-button-component-set.js` lays the set
out into the documented grid. Props are `Context/Variant/Size/State` (lowercase
values). Context order is **compact → comfortable → spacious → dense** (dense
last; least-used), md-first rows, so `compact/md/primary/default` is top-left;
the script also `insertChild(0, …)` that component so Figma uses it as the
**default instance**. State labels are left-aligned to each column's button edge.
