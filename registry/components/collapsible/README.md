# `collapsible` — registry entry

The artefacts `primitiv add collapsible` resolves and copies into a consumer
repo. Collapsible is a **root plus three structural subcomponents**
(`Trigger` / `Content` / `TriggerIcon`) — the single-item analogue of
Accordion: one trigger paired with one revealed panel, offered in three
visual dressings (`plain` / `card` / `inline`).

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (plain / card / inline dressings). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `collapsible.recipe.ts` | generated | One `cva` per styled part (from `contract.json`). |
| `collapsible.tsx` | generated (`Content` hand-tuned) | The styled wrappers — `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent` / `CollapsibleTriggerIcon` (from `contract.json`). `CollapsibleContent` deviates by hand: it force-mounts the panel, computes `data-clamped` from whether `collapsedHeight` is set, and wraps its children in a `.primitiv-collapsible__content-inner` clip, a padded `.primitiv-collapsible__content-body`, and a `.primitiv-collapsible__content-fade` overlay, so the grid open/close transition and the `collapsedHeight` read-more pattern can both animate. |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form and recipe are **generated** and pinned to their source by
drift-guard tests. `collapsible.tsx` is generated too, save for the one
hand-tuned `CollapsibleContent` deviation noted above (mirrors
`AccordionContent`, RFC 0004 D53).

## The default theme (`styles.css`)

Three visual dressings share one open/close mechanism:

- **`plain`** (the default) — no frame: a bare trigger row above a frameless
  panel, gap-separated.
- **`card`** — a bordered, radiused, filled box enclosing both the trigger and
  the panel. The trigger and content keep their own padding; the box simply
  wraps snugly around the same rows a `plain` collapsible renders (mirrors how
  `AccordionItem`'s hairline needs no extra padding management).
- **`inline`** — a hug-width trigger (`content/primary` foreground, no framed
  padding, no forced full-row width — confirmed against Figma dev-data: the
  trigger frame is HUG-sized and the label + chevron both bind
  `content/primary`, not a link colour) over continuous prose — the
  read-more pattern (e.g. "Show more" / "Show less", swapped by the
  consumer off `data-state`).

The panel **animates open and closed** with the same `display: grid`
row-track technique as Accordion: `.primitiv-collapsible__content`'s
`grid-template-rows` transitions between `0fr` (closed) and `1fr` (open).

When the consumer passes `collapsedHeight` to `Collapsible.Content`, the
wrapper reflects it as `data-clamped="true"` on the same element (alongside
the headless layer's own `--primitiv-collapsible-collapsed-height` custom
property). The row does **not** clamp to that height — animating
`grid-template-rows` between a fixed length and `1fr` does not interpolate
(they're different track-sizing function types), which staggers instead of
animating smoothly. So `[data-clamped="true"]` keeps the row at `1fr`
*unconditionally*, and the clip (`.primitiv-collapsible__content-inner`)
carries its own `max-block-size` transition instead — between the
`collapsedHeight` value (closed) and a generous fixed length like `100vh`
(open) — a plain length-to-length transition, which does animate. The clip's
`visibility` is also forced back to `visible` under `data-clamped`: a clamped
preview is real, readable content, never actually hidden.

Three nested elements do the work: the `.primitiv-collapsible__content-inner`
clip (`overflow: hidden` + `min-height: 0`, the positioning context for the
fade and, when clamped, the element that does the clamping), the padded
`.primitiv-collapsible__content-body` inside it (padding lives here, one level
below the clip, so it collapses away with the row instead of flooring how far
the row can shrink), and a `.primitiv-collapsible__content-fade` sibling — a
bottom gradient (`transparent` → `--primitiv-collapsible-fade-color`) that
reads as the panel fading into its surface. The fade is always rendered but
only visible while closed: without `collapsedHeight` it sits inside a
zero-height clipped row anyway; with it, it's the affordance that more content
follows. It fades out over the same transition once the panel opens.
`--primitiv-collapsible-fade-color` re-points to the card's own fill under
`--card` so the fade blends into the box rather than the page behind it.

Structured per RFC 0008 — per-component API tokens + resting look in
`primitiv.base`, the `variant` + `size` modifiers in `primitiv.variants`, the
`data-state` / `:focus-visible` / `data-disabled` styling in `primitiv.states`.
It wires `--primitiv-collapsible-*` to **semantic tokens only**:
`framed-control/{size}/*` for the trigger's inline sizing and the card's
radius, `border/subtle` + `framed-control/border-width` for the card's frame,
`content/primary` for the trigger label (every dressing, including
`inline`) + `content/secondary` (content copy), `label/{size}/*` +
`body/{size}/*` for type, `panel/padding/block` / `panel/padding/inline` for
the content padding (the same family Tabs/Accordion use), and
`motion/duration/control` / `motion/easing/default` for the open/close and
fade transitions.

## Notes

- **`data-disabled` is always present**, mirroring Accordion: the states layer
  matches `[data-disabled="true"]`, not just attribute presence, and dims the
  whole root (trigger row + any card frame together).
- **No separate box per variant.** `card`'s border/radius/fill live on the
  *root*, not on the trigger or content individually — there is one shared
  box, not two nested ones.
- **Chevron rotation, not a shared indicator** — `CollapsibleTriggerIcon`
  carries its own `data-state` directly, mirrors `AccordionTriggerIcon`.
- **Focus** is the shared two-layer ring with no radius override — nothing in
  this design rounds the trigger itself, so the ring reads square by default.
- **Label trim.** `CollapsibleTrigger` wraps string/number children in a
  `.primitiv-collapsible__trigger-label` span (via the contract's
  `wrapTextChildren`), mirroring `AccordionTrigger`; element children — icons —
  pass through unwrapped.
- **`collapsedHeight` is orthogonal to `variant`.** Any of the three dressings
  can pass it to `Collapsible.Content`; Figma's own examples only demonstrate
  it on `inline` (the read-more pattern reads most naturally over prose), but
  the stylesheet supports it uniformly.
- **`inline` has no hover colour.** Figma's Trigger set models only
  closed/open for this variant, not a hover state, so the trigger stays
  `content/primary` regardless of pointer state — no `:hover` rule to gate
  behind `(hover: hover)` here (unlike Button/SegmentedControl/etc., which
  do have a real hover colour and need the guard).
