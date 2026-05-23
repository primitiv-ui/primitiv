# Switch — Figma component spec (light mode)

## Step 0 — Inspect the existing Button component first

**Before drawing anything**, locate the existing `Button` Component Set in the file and read these properties off it. Where Button's actual value differs from what this spec assumes, **prefer Button's value** — this spec's job is to mirror house style, not replace it.

Things to pull from Button:

1. **Where it lives** — page, parent frame, naming pattern. Place the new `Switch` Component Set in the same neighbourhood, matching frame structure.
2. **Variant property naming** — does Button use `Small / Medium / Large` or `sm / md / lg`? `Default / Hover / Focus / Disabled` or `default / hover / focus / disabled`? Match exactly (case included). Apply the same casing to Switch's `size`, `state`, `interaction` properties.
3. **Focus ring** — stroke width, offset gap, colour, and whether it's an inner `Outside` stroke or a sibling rect. Reuse Button's recipe verbatim.
4. **Disabled treatment** — is Button rendered at 50 % opacity, with greyed fills, or some other treatment? Apply the same to Switch.
5. **Frame paddings / gaps / showcase typography** — outer padding, gap between size blocks, label font / size / colour, row + column header style. Mirror Button's showcase frame so the two read as a set.
6. **Component Set naming** — Button is presumably called `Button`. Use `Switch` for parity.

Where Button's value matches an assumption in this spec, no change needed. Where it differs, override the spec and follow Button.

---

## Goal

Add a `Switch` Component Set to the design system Figma file, mirroring Button's conventions. Light mode only. Anatomy = control surface only (no external label).

The headless React contract this design must match (`packages/react/src/Switch/Switch.tsx`):

- **Root** — `<button role="switch">`, carries `data-state="checked" | "unchecked"`, plus `data-disabled=""` when disabled.
- **Thumb** — `<span aria-hidden="true">`, mirrors `data-state` for CSS-driven sliding.

---

## Variant properties (Component Set)

One Component Set named **`Switch`** with three properties:

| Property      | Values                                  | Maps to                         |
| ------------- | --------------------------------------- | ------------------------------- |
| `size`        | `Small`, `Medium`, `Large`              | consumer `data-size`            |
| `state`       | `Unchecked`, `Checked`                  | `data-state`                    |
| `interaction` | `Default`, `Hover`, `Focus`, `Disabled` | hover / focus / `data-disabled` |

**Match Button's case for both property names and values** (Step 0 #2). Total: **3 × 2 × 4 = 24 variants**.

---

## Sizing

All values from `packages/tokens/src/primitives.json` `size` / `radii` / `border-width` scales.

| Size   | Track W × H | Track radius | Padding (inset) | Thumb (square) | Thumb radius | On-translate¹ | Tick icon size | Tick stroke |
| ------ | ----------- | ------------ | --------------- | -------------- | ------------ | ------------- | -------------- | ----------- |
| Small  | 28 × 16     | `radii.full` | 2               | 12 × 12        | `radii.full` | 12            | 8              | 1.5         |
| Medium | 40 × 24     | `radii.full` | 2               | 20 × 20        | `radii.full` | 16            | 12             | 2           |
| Large  | 48 × 28     | `radii.full` | 2               | 24 × 24        | `radii.full` | 20            | 16             | 2           |

¹ Translation applied to Thumb when `state=Checked`. Use Figma constraints: pin Thumb to **left** when unchecked, pin to **right** when checked — same 2 px inset on both sides.

---

## Colour tokens (light mode)

All references are DTCG token paths from `packages/tokens/src/`. Resolved hex shown for direct paint use; replace with Figma variable bindings after.

### Track fill — `Unchecked`

| Interaction | Token                    | Hex       |
| ----------- | ------------------------ | --------- |
| Default     | `color.neutral.grey.200` | `#bebebe` |
| Hover       | `color.neutral.grey.300` | `#8f8f8f` |
| Focus       | `color.neutral.grey.200` | `#bebebe` |
| Disabled    | `color.neutral.grey.100` | `#d7d7d7` |

### Track fill — `Checked` (mirrors `button.primary.background` in `components.json`)

| Interaction | Token            | Hex       |
| ----------- | ---------------- | --------- |
| Default     | `color.gold.500` | `#c9ae5d` |
| Hover       | `color.gold.600` | `#a6904b` |
| Focus       | `color.gold.500` | `#c9ae5d` |
| Disabled    | `color.gold.500` | `#c9ae5d` |

### Thumb fill — all states

`color.neutral.white` → `#ffffff`

### Tick icon (Thumb interior, `Checked` only)

Stroke colour `color.gold.900` → `#463c1c` (mirrors `button.primary.foreground.default`). No fill. Rounded line caps / joins. Two-segment polyline forming a checkmark, centred in the Thumb. **If the `Icons` page already has a `check` icon, prefer that** — instantiate it and scale to the tick size column. Recolour to `#463c1c`.

### Track border

Transparent in all interactions (`color.neutral.transparent` → `#ffffff00`). The control reads as filled, not outlined — same as `button.primary`.

### Focus ring (`interaction=Focus` only)

**Defer to Button's focus ring recipe** (Step 0 #3). If Button has no focus ring, fall back to: 2 px stroke `color.gold.500` (`#c9ae5d`), 2 px gap outside the track, applied via a sibling rounded rect at `radii.full`. Apply identically to `Unchecked / Focus` and `Checked / Focus`.

### Disabled rendering (`interaction=Disabled`)

**Defer to Button's disabled recipe** (Step 0 #4). Spec default: 50 % opacity on the whole variant frame (track + thumb + tick), keeping all underlying colours identical to the matching `state`'s Default. This matches the headless React surface, which exposes `data-disabled=""` and lets consumers apply opacity in CSS.

---

## Layout — Component Set showcase frame

White background (`#ffffff`). Three size blocks stacked vertically; each block is a 2-column × 4-row grid.

```
┌─────────────────────────────────────────────┐
│ Switch                                      │  ← Heading
│                                             │
│ Small                                       │  ← Size label
│        Unchecked       Checked              │  ← column headers
│ Default  [ — ]          [ — ]               │
│ Hover    [ — ]          [ — ]               │
│ Focus    [ — ]          [ — ]               │
│ Disabled [ — ]          [ — ]               │
│                                             │
│ Medium                                      │
│   …                                         │
│ Large                                       │
│   …                                         │
└─────────────────────────────────────────────┘
```

**Defer typography, paddings, and gaps to Button's showcase frame** (Step 0 #5). Spec defaults if Button has nothing to copy:

- Title: Khand SemiBold, `typography.compact.heading.h3` (26 / 36), `color.neutral.grey.700` (`#222222`).
- Size labels: Khand Medium, `typography.compact.body.overline` (12 / 16), `color.neutral.grey.600` (`#3b3b3b`).
- Row + column headers: Khand Medium 12 / 16, `color.neutral.grey.600` (`#3b3b3b`).
- Outer padding: `space-32` (32). Title → first block: `space-32`. Between blocks: `space-32`. Label → grid: `space-16`. Cell padding: `space-16` × `space-24`. Row label column width: 80 px.

---

## Variant naming

Use Figma's `=` syntax so the Component Set produces a clean variants panel:

```
size=Small, state=Unchecked, interaction=Default
size=Small, state=Unchecked, interaction=Hover
size=Small, state=Unchecked, interaction=Focus
size=Small, state=Unchecked, interaction=Disabled
size=Small, state=Checked,   interaction=Default
size=Small, state=Checked,   interaction=Hover
size=Small, state=Checked,   interaction=Focus
size=Small, state=Checked,   interaction=Disabled
size=Medium, state=Unchecked, interaction=Default
…
size=Large, state=Checked,   interaction=Disabled
```

**Match Button's casing** (Step 0 #2).

---

## Construction order

0. Read Button (Step 0) before drawing anything.
1. Load fonts: Khand SemiBold / Medium, Asta Sans Regular.
2. Build **one** `size=Small, state=Unchecked, interaction=Default` variant first to lock sizing, padding, constraints. Confirm Thumb is inset 2 px on the left.
3. Duplicate to `Checked / Default`: slide Thumb right by `On-translate`, swap Track fill, add tick.
4. Apply Hover / Focus / Disabled by further duplication — only the per-state diff changes.
5. Repeat for Medium, Large.
6. Group all 24 variants into a Component Set named `Switch`, placed next to Button.
7. Wrap in the labelled showcase frame, matching Button's wrapper.

---

## Component descriptions (Figma description fields)

Every component node — the Component Set itself, and any nested components (Track, Thumb) — must have a `description` written to `node.description`. The goal is that a future Claude session with Plugin API access can read a component's description and understand its full contract without scanning the page.

### Switch Component Set description

```
Switch — headless, accessible binary toggle.

React component: Switch from @primitiv/react
  - Switch.Root  →  <button role="switch">
  - Switch.Thumb →  <span aria-hidden="true">

Variant properties:
  size        = Small | Medium | Large
  state       = Unchecked | Checked       (→ data-state)
  interaction = Default | Hover | Focus | Disabled  (→ data-disabled on Disabled)

Sizing:
  Small:  track 28×16, thumb 12×12, padding 2, on-translate 12
  Medium: track 40×24, thumb 20×20, padding 2, on-translate 16
  Large:  track 48×28, thumb 24×24, padding 2, on-translate 20
  All corners: radii.full (9999)

Track fills (DTCG token → resolved hex):
  Unchecked / Default:  color.neutral.grey.200 → #bebebe
  Unchecked / Hover:    color.neutral.grey.300 → #8f8f8f
  Unchecked / Focus:    color.neutral.grey.200 → #bebebe
  Unchecked / Disabled: color.neutral.grey.100 → #d7d7d7
  Checked   / Default:  color.gold.500         → #c9ae5d
  Checked   / Hover:    color.gold.600         → #a6904b
  Checked   / Focus:    color.gold.500         → #c9ae5d
  Checked   / Disabled: color.gold.500         → #c9ae5d

Thumb fill (all states): color.neutral.white → #ffffff
Tick stroke (Checked only): color.gold.900 → #463c1c, no fill, rounded caps

Focus ring: 2 px stroke color.gold.500 (#c9ae5d), 2 px gap outside track
  — defer to Button's focus ring recipe if different

Disabled: whole variant at 50 % opacity (mirrors data-disabled CSS hook)
  — defer to Button's disabled treatment if different

Token source: packages/tokens/src/primitives.json + components.json
Figma variables should replace hex values once bound.
Light mode only. Dark mode deferred.
```

### Track layer / component description

If Track is a standalone Figma component:

```
Switch › Track

The pill-shaped background of the Switch. Fill changes per state and
interaction variant — see the Switch Component Set description for the
full token table. Always radii.full corners.

data-* surface: no direct DOM element. Styled via Switch.Root's
data-state / data-disabled on the parent.

Token source: packages/tokens/src/primitives.json
```

### Thumb layer / component description

If Thumb is a standalone Figma component:

```
Switch › Thumb

The sliding circle inside the Switch track. Always white
(color.neutral.white → #ffffff). Moves to the left (unchecked) or
right (checked) by a fixed translate inset 2 px from the track edge.

When state=Checked, contains a centred tick icon:
  stroke: color.gold.900 → #463c1c, no fill, rounded caps.
  Size: 8 px (Small) / 12 px (Medium) / 16 px (Large).

React: Switch.Thumb → <span aria-hidden="true" data-state="checked|unchecked">
data-state mirrors Switch.Root and drives CSS position transition.

Token source: packages/tokens/src/primitives.json
```

### How to write descriptions via Plugin API

After building each node, set descriptions like this:

```js
// Component Set
const switchSet = figma.currentPage.findOne(
  n => n.type === 'COMPONENT_SET' && n.name === 'Switch'
);
switchSet.description = `Switch — headless…`; // full text above

// A nested component (if Track / Thumb are components)
const trackComp = switchSet.findOne(
  n => n.type === 'COMPONENT' && n.name.includes('Track')
);
if (trackComp) trackComp.description = `Switch › Track\n\n…`;
```

Descriptions survive Figma restarts and are readable by any future Plugin API session via `node.description`.

---

## Button descriptions (follow-up)

Once Switch is confirmed working, the same treatment applies to the existing Button Component Set and any sub-components — writing descriptions that capture its variant property table, colour tokens, sizing, and focus / disabled recipes. That is a separate `/figma` session after this one is signed off.
