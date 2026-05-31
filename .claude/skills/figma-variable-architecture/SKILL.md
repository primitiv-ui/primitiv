---
name: figma-variable-architecture
description: Architecture of the Figma variable collections — collection hierarchy, the framed-control anatomy tokens, size slots (xs–xl), density contexts (Comfortable / Compact), the focus ring radius formula, and the Intent action token structure (primary, secondary, danger, link — two modes: Light/Dark). TRIGGER when adding new variables, working out what token to bind to a layer property, extending the framed-control system to a new component, debugging a focus ring that looks geometrically wrong, checking the correct radius/size value for a given density and slot, or adding new intent/action tokens. SKIP for token export/backup work (see figma-token-sync) and for wireframe styling lookups (see figma-wireframe-tokens).
---

# Figma variable architecture

## Collection hierarchy

| Figma collection name        | Modes          | DTCG output file  | Path prefix in DTCG           | Purpose                                               |
| ---------------------------- | -------------- | ----------------- | ----------------------------- | ----------------------------------------------------- |
| `Primitives`                 | single         | `primitives.json` | (none)                        | Raw scale values: radii, spacing, colour, typography  |
| `Primitives / Palette`       | Light, Dark    | `primitives.json` | (none)                        | Colour ramps: brand, neutral, danger, white, black    |
| `Semantic`                   | single         | `semantic.json`   | (none)                        | Named decisions: typography scales, anatomy patterns  |
| `Intent` (2 modes)           | Light, Dark    | `semantic.json`   | `color.<modeName>`            | Semantic colour decisions: action, surface, content   |
| `Context` (4 modes)          | Dense–Spacious | `semantic.json`   | `context.<modeName>`          | Component sizing for all 4 densities                  |
| `Interaction`                | single         | `semantic.json`   | `interaction`                 | Interaction-state tokens                              |
| `Components`                 | single         | `components.json` | (none)                        | Per-component token decisions (wired to aliases)      |

**`Primitives / Palette`** is kept separate from `Primitives` because it requires two modes (Light and Dark) while all other Primitives are mode-agnostic. Merging them would force every spacing and radius variable into a two-mode collection unnecessarily.

**`Intent`** has two modes — **Light** and **Dark**. Both modes alias the same `Primitives / Palette` variable names; the palette's own Light/Dark modes provide the colour inversion automatically. Frame-level mode overrides on both `Intent` and `Primitives / Palette` together control the active theme.

The `Context` collection has 4 modes: **Dense**, **Compact**, **Comfortable**, **Spacious**. Frame-level mode overrides let any frame switch density without rebinding variables.

The `Context` collection is the one you'll touch most when building or updating components. It holds the full `framed-control/*` anatomy for every size slot across all 4 modes.

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

### Resolved values — Dense mode

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 16     | 4              | 2   | 10        | 2      | 4                     | 6                 |
| sm   | 20     | 6              | 4   | 12        | 4      | 6                     | 8                 |
| md   | 24     | 8              | 4   | 14        | 4      | 6                     | 8                 |
| lg   | 32     | 12             | 4   | 16        | 4      | 6                     | 8                 |
| xl   | 40     | 16             | 6   | 20        | 6      | 8                     | 10                |

### Resolved values — Compact mode

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 20     | 6              | 4   | 12        | 4      | 6                     | 8                 |
| sm   | 28     | 10             | 4   | 14        | 6      | 8                     | 10                |
| md   | 32     | 12             | 4   | 16        | 6      | 8                     | 10                |
| lg   | 40     | 16             | 6   | 20        | 8      | 10                    | 12                |
| xl   | 48     | 20             | 8   | 24        | 8      | 10                    | 12                |

### Resolved values — Comfortable mode

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 24     | 8              | 4   | 12        | 4      | 6                     | 8                 |
| sm   | 32     | 12             | 4   | 14        | 6      | 8                     | 10                |
| md   | 40     | 16             | 8   | 16        | 6      | 8                     | 10                |
| lg   | 48     | 20             | 8   | 20        | 8      | 10                    | 12                |
| xl   | 56     | 24             | 12  | 24        | 8      | 10                    | 12                |

### Resolved values — Spacious mode

| Slot | height | padding-inline | gap | icon-size | radius | focus-ring-gap-radius | focus-ring-radius |
| ---- | ------ | -------------- | --- | --------- | ------ | --------------------- | ----------------- |
| xs   | 28     | 10             | 4   | 14        | 6      | 8                     | 10                |
| sm   | 40     | 14             | 6   | 16        | 8      | 10                    | 12                |
| md   | 48     | 20             | 8   | 20        | 8      | 10                    | 12                |
| lg   | 56     | 28             | 10  | 24        | 10     | 12                    | 14                |
| xl   | 68     | 32             | 12  | 28        | 12     | 14                    | 16                |

All values alias into `Primitives` (e.g. `radii/6`, `space-8`, `size-16`). `height`, `padding-inline`, and `gap` vary across all four modes. Radii are identical between Compact and Comfortable only — Dense uses smaller radii and Spacious uses larger ones, so focus-ring values differ across all four modes.

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

### Canonical recipe — focus ring on ANY component

This ring is the **shared standard for every framed control** (Button, Switch,
Checkbox, Tabs/Trigger, …). Build it identically each time so all components match.
For a focus variant of size `S` in context collection `C`, add two frames as the
**first two children** (behind the content), each centred on the control with
`layoutPositioning = "ABSOLUTE"`:

1. **`focus-ring-gap`** (index 0 or 1, drawn under the ring):
   - size = control **+2 px per side** (w+4, h+4); position x=y=**−2** rel. control.
   - 4 corner radii → `C` `framed-control/${S}/focus-ring-gap-radius`.
   - stroke INSIDE, 4 weights → `focus/ring/width`; stroke colour → `color/neutral/transparent`.
   - no fill.
2. **`focus-ring`** (outermost):
   - size = control **+4 px per side** (w+8, h+8); position x=y=**−4** rel. control.
   - 4 corner radii → `C` `framed-control/${S}/focus-ring-radius`.
   - stroke INSIDE, 4 weights → `focus/ring/width`; stroke colour → `focus/ring`.
   - no fill.
3. Expose a boolean **"Focus ring"** component property bound to both frames'
   visibility (so non-focus variants hide it / it can be toggled).

The +2/+4 px offsets are **fixed for all sizes**; only the radii vary (via the
size token). Pin the radii to `S` — do not inherit them from a duplicated source
size (see the slip gotcha below). For a non-rectangular control (e.g. a circular
Switch thumb/track) the same two-frame, +2/+4, INSIDE-stroke model applies; use
the control's own radius token in place of `framed-control/*` if it differs.

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

## Intent action tokens

Collection: `Intent` — two modes: **Light** and **Dark**.

Action tokens encode colour decisions for interactive controls by intent. All aliases point into `Primitives / Palette` by variable name; the palette's own Light/Dark modes resolve the actual colour value. Both Intent modes use identical alias targets — the palette modes handle the colour difference.

**Important:** `action/*/foreground/default` and `content/inverse` and `content/on-action` alias `color/white` (the user-defined soft white anchor), **not** `color/neutral/50`. `color/neutral/50` is tinted by the neutral ramp and inverts in dark mode — wrong for text on coloured surfaces. `color/white` is the raw user-chosen white anchor in both modes.

### Token structure per intent

Filled-button intents (primary, secondary, danger) each have three groups:

| Group | Tokens | Role |
| ----- | ------ | ---- |
| `action/{intent}/` | `default · hover · active · disabled` | Background fill per interaction state |
| `action/{intent}/foreground/` | `default · disabled` | Text/icon colour on top of the fill |
| `action/{intent}/border/` | `default · hover · active · disabled` | Border/stroke colour per interaction state |

### Palette alias targets

| Intent | default bg | hover bg | active bg | disabled bg | foreground/default |
| ------ | ---------- | -------- | --------- | ----------- | ------------------ |
| primary | `color/brand/500` | `color/brand/600` | `color/brand/700` | `color/brand/200` | `color/white` |
| secondary | `color/neutral/100` | `color/neutral/200` | `color/neutral/300` | `color/neutral/50` | `color/neutral/900` |
| danger | `color/danger/500` | `color/danger/600` | `color/danger/700` | `color/danger/200` | `color/white` |

Secondary border: `neutral/300` default → `neutral/400` hover → `neutral/500` active → `neutral/200` disabled.
Primary and danger borders mirror their background alias at each state.

### The link variant

`action/link` has **foreground tokens only** — no background, no border. The button frame has no fill; 50% opacity on the disabled variant frame handles the muted appearance.

| Token | Alias |
| ----- | ----- |
| `action/link/foreground/default` | `color/brand/500` |
| `action/link/foreground/hover` | `color/brand/600` |
| `action/link/foreground/active` | `color/brand/700` |
| `action/link/foreground/disabled` | `color/brand/500` (opacity does the work) |

### Other intent groups

| Group | Notable tokens |
| ----- | -------------- |
| `surface/*` | `default/raised → color/neutral/50`, `overlay → color/neutral/900`, `inverse → color/neutral/800` |
| `content/*` | `primary → color/neutral/900`, `secondary · muted · disabled → neutral steps`, `error → color/danger/500`, `inverse/on-action → color/white` |
| `border/*` | `subtle/default/strong → neutral steps`, `focus → color/brand/500`, `invalid → color/danger/500` |
| `focus/ring` | `color/brand/500` |

#### Non-action controls use surface / border / content (not `action/*`)

`action/*` tokens are for **buttons** (intent-coloured fills). Form-input controls
— Input, Textarea, Select, and the Field wrapper — are **not actions**: they use
the neutral semantic families instead. The Input set (the first such component)
binds: fill → `surface/default` (disabled `surface/subtle`); stroke →
`border/default` (hover `border/strong`, focus `border/focus`, invalid
`border/invalid`); value text → `content/muted` (placeholder) / `content/primary`
(value) / `content/disabled`. There is **no intent/Variant axis** — a single
visual style.

#### Danger-semantic tokens (`border/invalid`, `content/error`)

Both alias `color/danger/500` in Light **and** Dark (the palette's own modes do the
inversion — same pattern as every other Intent COLOR var). `border/invalid` is the
red stroke on an invalid control; `content/error` is red text (error helper text,
required `*`). Do **not** reuse a `border/*` token for text fill or an `action/danger/*`
(button) token for a control border — those are semantically wrong. Created
2026-05-31 for Input/Field; both backed up to `intent.json` by hand (the deterministic
transform: `border.invalid` after `border.focus`, `content.error` after `content.on-action`).

### Primitives / Palette anchor variables

`color/white` and `color/black` are special single-step variables (no step suffix) written by the Harmoni plugin when "Write white & black" is checked. They store the user-chosen soft white and soft black — the raw colour picker values, not derived or tinted. Both modes hold the same value (white is white in light and dark). Components and intent tokens that need a true white/black reference these rather than `color/neutral/50` or `color/neutral/900`.

## Adding a new framed-control property

1. Decide the value for each size slot across all 4 modes.
2. Check whether a `Primitives` alias exists for each value (prefer aliasing over raw numbers).
3. Use `figma_execute` with `getVariableCollectionByIdAsync` (async API required) to create the variable in the `Context` collection and `setValueForMode` for each of the 4 mode IDs.
4. Set each mode's value with `figma.variables.createVariableAlias(primitiveVar)`.
5. If the property also needs a DTCG entry, run the sync plugin to back up — the `Context` multi-mode route in `dtcg.ts` handles it automatically.

### Context collection ID and modes

| | ID |
| ---- | -- |
| Collection `Context` | `VariableCollectionId:369:31958` |
| Mode: Dense          | `369:8` |
| Mode: Compact        | `369:9` |
| Mode: Comfortable    | `369:10` |
| Mode: Spacious       | `369:11` |

The collection holds all 218 variables for all densities. Variables alias into `Primitives`; the mode determines which alias (and resolved value) is active.

> **Deprecated (do not use for new work):** The old free-tier collections `Context / Dense` (`341:3320`), `Context / Compact` (`341:2956`), `Context / Comfortable` (`340:2719`), `Context / Spacious` (`341:3138`) still exist and will be deleted in a future cleanup step. All component sets (Button, Switch, Checkbox) were migrated to the unified `Context` collection on 2026-05-29.

## Building components across contexts/variants — clone-and-rebind

> For the full build *process* (pre-flight checks, the incremental audit loop,
> laying out the set, and verification), see the **`figma-framed-control-component`**
> skill. This section is the token-level mechanics it relies on.

The cheapest, lowest-error way to add a context (or a missing variant) to a
framed-control component set is to **clone an already-correct variant and rebind
its Context variables to the unified `Context` collection's same-named vars,
then set an explicit mode override on the cloned component**. Colour (`action/*`),
border-width, and the focus-ring stroke token live outside `Context`, so they
carry over untouched. The focus ring is intent-neutral, so a per-variant clone
keeps the right ring.

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
5. Set an **explicit mode override** on the cloned component so it self-renders at
5. Idempotency: before a batch, remove any pre-existing clones for that
   variant so re-runs don't duplicate.

**Important:** Do NOT set explicit mode overrides on component variants. With
the Professional-tier unified collection, density is owned by the **containing
frame** — any frame with `Context → Dense` mode override makes all components
inside render at Dense. Setting overrides on components locks instances to one
density and breaks consumer frame-level switching.

**Efficient rebind pattern:** instead of pre-fetching all collection variables,
do a synchronous walk first to collect unique `boundVariable` IDs, batch-fetch
only those in parallel, then filter to old-collection vars and build the rebind
map. This keeps async overhead minimal even for large component sets.

### Layout & arrange

Arrange scripts lay sets out into a size-rows × variant/state-columns grid.
Props are `Variant/Size/State` (no Context dimension). `md` is placed first
(top row) so `md/primary/default` is top-left; the script `insertChild(0, …)`
that component so Figma uses it as the **default instance**.

## Label typography resolved values

`label/*` variables encode the typography decisions for interactive control labels (Button, Checkbox, Switch, Tabs, etc.) across all four density modes and five size slots.

### font-size

| Slot | Dense | Compact | Comfortable | Spacious |
| ---- | ----- | ------- | ----------- | -------- |
| xs   | 10    | 12      | 13          | 14       |
| sm   | 11    | 14      | 16          | 18       |
| md   | 12    | 16      | 18          | 20       |
| lg   | 13    | 18      | 20          | 22       |
| xl   | 14    | 20      | 22          | 24       |

### line-height

| Slot | Dense | Compact | Comfortable | Spacious |
| ---- | ----- | ------- | ----------- | -------- |
| xs   | 12    | 16      | 20          | 20       |
| sm   | 14    | 20      | 24          | 28       |
| md   | 16    | 24      | 28          | 32       |
| lg   | 16    | 28      | 32          | 36       |
| xl   | 20    | 32      | 36          | 40       |

`font-family`, `font-weight`, and `font-style` are identical across all four modes (sans / semibold / SemiBold). All values alias into `Primitives` (`font-size/12`, `line-height/24`, etc.).

> **Gotcha — Comfortable and Spacious copying Compact.** When label variables were first created, Comfortable and Spacious were left aliasing the same Primitives values as Compact. The tables above reflect the corrected values (fixed 2026-05-29). If you bootstrap a new file or re-run the Bootstrap context action, verify that each mode has distinct font-size values — the action may need updating to match these tables.

> **Gotcha — what the font families actually resolve to.** `font-family/sans`
> resolves to **Khand**, `font-family/serif` to **Asta Sans**. *Both are sans
> faces* — "serif" is a misnomer (Asta Sans is the body/UI text font). So:
> `label/*` → **Khand SemiBold** (the bold, condensed label/button face), and
> `body/*` → **Asta Sans Regular** (the regular value/helper/input text face).
> Before setting `characters` on a text node, `loadFontAsync` the *resolved*
> face (`{family:"Khand",style:"SemiBold"}` or `{family:"Asta Sans",style:"Regular"}`),
> not the variable name. This is why Input value text uses `body/*` (regular) and
> Field labels use `label/*` (semibold).

> **Gotcha — typography variable resolvedTypes are mixed.** When creating
> typography variables, `font-family` and `font-style` are **STRING**, but
> `font-weight`, `font-size`, and `line-height` are **FLOAT**. Creating a
> `font-weight` variable as STRING (then aliasing the FLOAT primitive) throws
> `"Mismatched variable resolved type for mode …"`. Pick the resolvedType per
> field, not per "it's typography".

> **`body/*` now runs xs–xl.** The body ramp originally stopped at `lg`;
> `body/xl/*` was added 2026-05-31 (font-size/line-height mirror `label/xl` per
> mode — Comfortable 22/36, Compact 20/32, Spacious 24/40, Dense 14/20 — family
> serif, weight/style regular) so form controls have a body face at every size.
> Backed up to `context.json` (`body.xl` in all four mode blocks).

## Text styles and mode overrides

Text styles in Figma (`TextStyle`) **do not support `setExplicitVariableModeForCollection`** — the method does not exist on `BaseStyle`. This means text style variable bindings always resolve using the collection's **default mode** (Compact, modeId `369:9`) unless the text node sits inside a frame with a mode override.

Practical behaviour:
- **Text node in a frame with `Context → Dense` override**: the bound variable resolves to the Dense mode value — correct.
- **Text style panel preview**: always shows the default mode (Compact) regardless of the style's intended density. This is a Figma limitation, not a bug.
- **Canonical text styles** (72 total, 18 per density): `Dense / Label / md`, `Comfortable / Body / lg`, etc. All bound to the unified Context collection. The density in the style name is the *intended* use context, not an enforced mode.

**Critical: all 72 text styles bind to the same underlying variables.** `Dense / Label / md` and `Comfortable / Label / md` both bind their `fontSize` to the single `label/md/font-size` variable — there is no separate per-density variable. The density prefix in the style name is documentation only. In the Figma style panel, all four density variants of a given role/size will show identical values (the Compact default). They only render differently when the text node sits inside a frame that has a mode override applied — at which point the shared variable resolves to the correct density value.

**Typography variable paths in text styles** follow the same naming as in component anatomy:
- `label/{xs–xl}/font-family`, `font-style`, `font-size`, `line-height`
- `body/{xs–xl}/…`, `heading/{h1–h6}/…`, `display/{lg,xl}/…`, `overline/…`

**Component label text nodes** (e.g. Button's "Button text") bind directly to Context collection variables inline — no text style applied. They respond correctly to frame mode overrides without any text style involvement.
