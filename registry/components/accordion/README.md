# `accordion` — registry entry

The artefacts `primitiv add accordion` resolves and copies into a consumer
repo. Accordion is a **root plus five structural subcomponents**
(`Item` / `Header` / `Trigger` / `Content` / `TriggerIcon`): the consumer
composes N items, each pairing a heading-wrapped trigger with a revealed
content region.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (hairline rows, no boxes). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `accordion.recipe.ts` | generated | One `cva` per styled part (from `contract.json`). |
| `accordion.tsx` | generated (`Content` hand-tuned) | The styled wrappers — `Accordion` / `AccordionItem` / `AccordionHeader` / `AccordionTrigger` / `AccordionContent` / `AccordionTriggerIcon` (from `contract.json`). `AccordionContent` deviates by hand: it force-mounts the panel and wraps its children in a `.primitiv-accordion__content-inner` clip element so the grid open/close transition can animate. |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form and recipe are **generated** and pinned to their source by
drift-guard tests. `accordion.tsx` is generated too, save for the one
hand-tuned `AccordionContent` deviation noted above.

## The default theme (`styles.css`)

The **hairline rows, no boxes** style: no container border, no per-item box, no
panel frame. Every item is separated from the next by a single unconditional
`border/subtle` hairline on its own bottom edge — there is no Position-derived
exception for the visually-last row (unlike the old boxed design, this axis was
dropped entirely: a frameless row has no corners to clamp and no seams to hide).
A HUG-height trigger row (content + `accordion/trigger-padding-block`, not a
fixed `framed-control/{size}/height` slot) pairs the label with a chevron that
rotates 180° on `data-state="open"`. The revealed content is frameless but
padded on both block edges via the **shared** `panel/padding/block` +
`panel/padding/inline` tokens — the same family Tabs' panel uses — so the two
stay visually consistent (Tabs and Accordion are the only two components with
a "revealed content area" shape).

The panel **animates open and closed** with the CSS `display: grid`
row-track technique: `.primitiv-accordion__content` is a single-row grid whose
`grid-template-rows` transitions between `0fr` (closed) and `1fr` (open), and an
inner `.primitiv-accordion__content-inner` wrapper (`overflow: hidden;
min-height: 0`) clips the copy as the row collapses. This opens the panel to its
content's **exact height** with no `max-height` guess and no JS measurement, and
closes it back over the transition duration. Timing is
`--primitiv-accordion-content-transition-duration` /
`-transition-easing`, defaulting to `motion/duration/control` +
`motion/easing/default` so the panel moves in lockstep with the chevron; both
are dropped under `prefers-reduced-motion: reduce`. Because the panel is
**force-mounted** to animate (it is never `hidden`), the inner wrapper flips to
`visibility: hidden` at the end of the close so collapsed content stays out of
the tab order and the accessibility tree.

Structured per RFC 0008 — per-component API tokens + resting look in
`primitiv.base`, the `size` modifier in `primitiv.variants`, the
`data-state` / `:focus-visible` / `data-disabled` styling in `primitiv.states`.
It wires `--primitiv-accordion-*` to **semantic tokens only**:
`framed-control/{size}/*` for the trigger's inline sizing, `border/subtle` for
the hairline, `content/primary` (trigger label) + `content/secondary` (content
copy), `label/{size}/*` + `body/{size}/*` for type,
`--primitiv-accordion-content-padding-block` / `-padding-inline` (defaulting
to `panel/padding/block` / `panel/padding/inline`) for the content padding, and
`--primitiv-accordion-content-transition-duration` / `-transition-easing`
(defaulting to `motion/duration/control` / `motion/easing/default`) for the
open/close animation.
The trigger's own density-scaled padding-block token
(`accordion/trigger-padding-block`) is consumed directly, not re-exposed as a
`--primitiv-accordion-*` override — it's a shared Context token, not
component-owned API (mirrors how Table consumes `--primitiv-table-cell-padding-block`).

## Notes

- **Unconditional hairline.** `--primitiv-accordion-item-border-color` /
  `-border-width` apply to every `.primitiv-accordion__item`, open or closed,
  first or last. Ground-truthed against the "hairline rows, no boxes"
  exploration, which shows the same 1px `border/subtle` rule on all four rows
  including the visually-last one.
- **No hover treatment.** Unlike Tabs' active/inactive colour swap, the
  trigger label stays `content/primary` whether the item is open or closed —
  confirmed against the exploration, which shows identical label colour in
  every state. `default` and `hover` are visually identical.
- **`data-disabled` is always present.** Unlike every other framed control in
  this library (`Tabs`, `ToggleGroup`, `Switch`, `Checkbox`), `Accordion.Trigger`
  renders `data-disabled="true"` / `data-disabled="false"` unconditionally
  rather than omitting the attribute when not disabled — so the states layer
  matches `[data-disabled="true"]`, not just `[data-disabled]` presence.
- **Chevron rotation, not a shared indicator.** `AccordionTriggerIcon` carries
  its own `data-state` directly (`open` / `closed`), so
  `.primitiv-accordion__trigger-icon[data-state="open"]` rotates it 180° —
  pure per-item state, no measurement/JS, mirrors ToggleGroup's own
  documented precedent for its shadow.
- **Focus** is the shared two-layer ring with no radius override — nothing in
  this design rounds, so the ring reads square by default.
- **Label trim.** `AccordionTrigger` wraps string/number children in a
  `.primitiv-accordion__trigger-label` span (via the contract's per-part
  `wrapTextChildren`, mirroring `ToggleGroupItem` / `TabsTrigger`); element
  children — icons — pass through unwrapped. `text-box-trim` / `text-box-edge`
  live on that span, not the trigger's flex container.
