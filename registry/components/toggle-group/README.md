# `toggle-group` — registry entry

The artefacts `primitiv add toggle-group` resolves and copies into a consumer
repo. ToggleGroup is a **root plus one repeated subcomponent** (`Item`): the
consumer drops N items into the root, which owns the track; each item styles
itself off its own `data-state`.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (framed items in a bordered track). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `toggle-group.recipe.ts` | generated | One `cva` per styled part (from `contract.json`). |
| `toggle-group.tsx` | generated | The styled wrappers — `ToggleGroup` / `ToggleGroupItem` (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** and pinned to their source by
drift-guard tests.

## The default theme (`styles.css`)

Framed items in a bordered track, using **SegmentedControl's paint recipe, state
for state**: an unpressed item is `action/secondary` (fill + border), a pressed
one is `action/primary`, hover deepens each toward its own intent's hover token,
and the track is a transparent `border/subtle` frame rather than a ground — so
the control sits on any surface.

Structured per RFC 0008 — per-component API tokens + resting look in
`primitiv.base`, the `size` / `justify` modifiers in `primitiv.variants`, the
`data-state="on"` / `:hover` / `:focus-visible` / `data-disabled` styling in
`primitiv.states`. It wires `--primitiv-toggle-group-*` to **semantic tokens
only**: `framed-control/{size}/*` for item sizing and radius,
`toggle-group/track-padding` (Context — density-scaled) for the inset,
`action/primary/*` and `action/secondary/*` for colour, `border/subtle` for the
track, `label/{size}/*` for type.

### It looks like a SegmentedControl on purpose

The two are semantically different — this is `role="group"` with `aria-pressed`
(any number on, including none, and multi-select), SegmentedControl is
`role="radiogroup"` with `aria-checked` (exactly one, never empty) — and after
the 2026-08-26 redesign that difference is carried by the API and the docs, not
by the look. The trade was made with the evidence in view (the Figma page
"Toggle Group — exploration", §6): one fill language across every control was
judged more valuable than a visual tell between two components whose difference
is semantic.

Two consequences worth knowing. Adjacent pressed items read as two primary
actions rather than one control with two things on (§3). And nothing on screen
distinguishes the two components, so choosing between them is a semantics
question — reach for this one when the buttons are independent toggles or
commands, and for SegmentedControl when the choice is a single value.

### What it replaced

An "inset track + floating thumb": a recessed `surface/sunken` **pill**
(`radii/full`) holding borderless labels, where a pressed item became a raised
`surface/selected` pill with a `shadow/1` lift. It was the only control in
Primitiv drawn that way, while every comparable one used
`framed-control/{size}/radius` and the `action/*` fill language. The
`surface/selected` / `content/on-selected` pair existed to keep that thumb
legible in both themes and is no longer used here.

## Notes

- **Concentric radius.** `--primitiv-toggle-group-radius` is
  `calc(item-radius + track-inset)`, so the track's outer curve runs parallel to
  the items' at every size, and it re-derives itself when a size modifier
  re-points `--primitiv-toggle-group-item-radius`. Figma cannot express that sum,
  so its canvas carries literal `toggle-group/{size}/radius` variables instead —
  the same split that puts `segmented-control/{size}/radius` in Figma but not in
  `packages/tokens`. The DTCG source needed nothing new.
- **`justify`.** Omitted, items are content-width (a formatting toolbar);
  `justified` makes them share the track equally (a true segmented control).
- **No shared moving indicator.** The pressed look is the item's own
  background — pure per-item `data-state`, so the headless API is unchanged and
  there is no measurement/JS.
- **Focus** is the shared two-layer ring following the item's own radius, with
  the gap band keyed to the PAGE surface. Under the old design the track was a
  solid sunken ground and the ring had to read against it; a transparent track
  has no colour to match.
- **Label trim.** `ToggleGroupItem` wraps string/number children in a
  `.primitiv-toggle-group__item-label` span (via the contract's per-part
  `wrapTextChildren`, mirroring Button's `__label`); element children — icons —
  pass through unwrapped. `text-box-trim` / `text-box-edge` live on that span,
  not the item's flex container, so engines honour the trim and the label
  optically centres regardless of the font's metrics (a no-op where
  unsupported).
