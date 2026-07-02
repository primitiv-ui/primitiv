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
| `accordion.tsx` | generated | The styled wrappers — `Accordion` / `AccordionItem` / `AccordionHeader` / `AccordionTrigger` / `AccordionContent` / `AccordionTriggerIcon` (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** and pinned to their source by
drift-guard tests.

## The default theme (`styles.css`)

The **hairline rows, no boxes** style: no container border, no per-item box, no
panel frame. Every item is separated from the next by a single unconditional
`border/subtle` hairline on its own bottom edge — there is no Position-derived
exception for the visually-last row (unlike the old boxed design, this axis was
dropped entirely: a frameless row has no corners to clamp and no seams to hide).
A HUG-height trigger row (content + `accordion/trigger-padding-block`, not a
fixed `framed-control/{size}/height` slot) pairs the label with a chevron that
rotates 180° on `data-state="open"`. The revealed content is frameless but
padded only at its trailing edge (`accordion/panel-padding-block-end`), so it
reads as breathing room before the next item's hairline rather than a boxed
continuation of the trigger.

Structured per RFC 0008 — per-component API tokens + resting look in
`primitiv.base`, the `size` modifier in `primitiv.variants`, the
`data-state` / `:focus-visible` / `data-disabled` styling in `primitiv.states`.
It wires `--primitiv-accordion-*` to **semantic tokens only**:
`framed-control/{size}/*` for the trigger's inline sizing, `border/subtle` for
the hairline, `content/primary` (trigger label) + `content/secondary` (content
copy), `label/{size}/*` + `body/{size}/*` for type. The two density-scaled
padding-block tokens (`accordion/trigger-padding-block`,
`accordion/panel-padding-block-end`) are consumed directly, not re-exposed as
`--primitiv-accordion-*` overrides — they're shared Context tokens, not
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
