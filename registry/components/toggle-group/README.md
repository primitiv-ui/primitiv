# `toggle-group` — registry entry

The artefacts `primitiv add toggle-group` resolves and copies into a consumer
repo. ToggleGroup is a **root plus one repeated subcomponent** (`Item`): the
consumer drops N items into the root, which owns the track; each item styles
itself off its own `data-state`.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the inset track + floating thumb). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `toggle-group.recipe.ts` | generated | One `cva` per styled part (from `contract.json`). |
| `toggle-group.tsx` | generated | The styled wrappers — `ToggleGroup` / `ToggleGroupItem` (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** and pinned to their source by
drift-guard tests.

## The default theme (`styles.css`)

The **inset track + floating thumb** style — a deliberate departure from the
welded button-group / segmented strip. The root is a **recessed pill track**
(`surface/sunken`); items are borderless, transparent labels; a pressed item
becomes a **raised pill** — `surface/selected` + the `shadow/1` lift, inset from
the track by the track padding. Single-select shows one thumb, multi-select a
thumb per pressed item.

Structured per RFC 0008 — per-component API tokens + resting look in
`primitiv.base`, the `size` / `justify` modifiers in `primitiv.variants`, the
`data-state="on"` / `:hover` / `:focus-visible` / `data-disabled` styling in
`primitiv.states`. It wires `--primitiv-toggle-group-*` to **semantic tokens
only**: `framed-control/{size}/*` for item sizing, `radii/full` for the pill,
`toggle-group/track-padding` (Context — density-scaled) for the inset,
`surface/sunken` (track) + `surface/selected` / `content/on-selected` (thumb) +
`content/*` (labels) for colour, `shadow/1` for the lift, `label/{size}/*` for type.

### Dark mode — the selected-thumb tokens

`surface/selected` and `content/on-selected` are **light in both themes**
(white / neutral-800 background, soft-dark label) so the thumb lifts off the
recessed track — which is grey in light and *dark* in dark — and its label stays
legible in both. This is why the on-state does **not** reuse `surface/default`
(black in dark) or `content/primary` (which flips to light in dark). See RFC 0017
/ the intent-token notes.

## Notes

- **Pill everywhere.** `--primitiv-toggle-group-radius` is `radii/full` at every
  size and density — the thumb nests inside the track without a derived radius.
- **`justify`.** Omitted, items are content-width (a formatting toolbar);
  `justified` makes them share the track equally (a true segmented control).
- **No shared moving indicator.** The "thumb" is the pressed item's own
  background — pure per-item `data-state`, so the headless API is unchanged and
  there is no measurement/JS. The slide between positions is the CSS transition.
- **Focus** composes the shared two-layer ring over the item's own shadow, with
  the ring's gap layer keyed to the track colour so it reads on the recessed track.
