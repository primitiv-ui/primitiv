# Listbox

A persistently-visible list of selectable options — the
[WAI-ARIA APG listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).
Framed like a form control on Input's geometry, with rows resolving the shared
`dropdown/*` tokens so a listbox and a menu are the same surface.

```sh
primitiv add listbox
```

```tsx
import {
  Listbox,
  ListboxOption,
  ListboxOptionIndicator,
  ListboxOptionLabel,
} from "@/components/primitiv";

<Listbox type="single" defaultValue="ams" aria-label="Cities">
  <ListboxOption value="ams">
    <ListboxOptionIndicator>
      <CheckIcon />
    </ListboxOptionIndicator>
    <ListboxOptionLabel>Amsterdam</ListboxOptionLabel>
  </ListboxOption>
  <ListboxOption value="ber">
    <ListboxOptionIndicator>
      <CheckIcon />
    </ListboxOptionIndicator>
    <ListboxOptionLabel>Berlin</ListboxOptionLabel>
  </ListboxOption>
</Listbox>;
```

Every part is exported separately, so a row is **composed** rather than
configured — the mark glyph is yours, which is why installing this pulls in no
icon package.

## Why this is not `Select`

`Select` in its default rich mode is a listbox *inside a popup*, opened from a
trigger, and it moves real DOM focus between options. This list is always
visible, has no trigger, and **never moves DOM focus**: focus stays on the frame,
and the visually-current option is published as `aria-activedescendant` on the
frame and marked `data-highlighted` on the option.

That is the whole point. It is what lets a **separate** control — a search input,
a command palette's text field — hold focus and drive the list at the same time.

**Styling consequence: the cursor is `[data-highlighted]`, not `:focus`.** An
option never matches `:focus`.

## Two states at once

This is the only component in the library where two independent row states are on
screen simultaneously, so a row can be neither, either, or both:

| Hook | Meaning |
| --- | --- |
| `[data-highlighted]` | The **cursor** — virtual focus. What Enter will act on. |
| `[aria-selected="true"]` | **Selection.** |
| `:hover` | The pointer, which is *not* the cursor. |

The cursor takes the heavier tint (`action/secondary/default`) and pointer hover
the lighter one (`action/ghost/hover`), and the cursor wins on a row that is both.
Hover deliberately never reuses the cursor's tint: **hovering does not move the
cursor**, so matching them would make two rows look current and imply the pointer
moves a cursor it cannot move. Clicking a row *does* move the cursor.

## Parts

| Part | Element | Notes |
| --- | --- | --- |
| `Listbox` | `<div role="listbox">` | The frame and the tab stop. Carries the only focus ring, and `size` |
| `ListboxOption` | `<div role="option">` | A row. `value` identifies it; `disabled` drops it from navigation |
| `ListboxOptionIndicator` | `<span aria-hidden>` | Single-select mark. Put a glyph inside; CSS reveals it when selected |
| `ListboxOptionCheckbox` | `<span aria-hidden>` | Multi-select mark — a checkbox drawn in CSS. Use instead of the indicator, never both |
| `ListboxOptionLeading` | `<span>` | Optional glyph after the mark column |
| `ListboxOptionLabel` | `<span>` | The label. Takes the free space and truncates |
| `ListboxOptionTrailing` | `<span>` | Optional shortcut/badge on the inline-end edge |
| `ListboxGroup` | `<div role="group">` | Presentational grouping |
| `ListboxGroupLabel` | `<div>` | Visible heading; names the group and sticks while scrolling |
| `ListboxEmpty` | `<div role="presentation">` | The "no results" row |

## Multi-select

Swap the mark. `ListboxOptionCheckbox` is a checkbox drawn in CSS and filled when
the row is selected:

```tsx
<Listbox type="multiple" value={picked} onValueChange={setPicked} aria-label="Toppings">
  <ListboxOption value="olives">
    <ListboxOptionCheckbox />
    <ListboxOptionLabel>Olives</ListboxOptionLabel>
  </ListboxOption>
</Listbox>
```

It is **presentational and `aria-hidden`** — the row's own `aria-selected` carries
the state. A real `<input type="checkbox">` inside `role="option"` would add a
second focusable control inside a row that is not itself focusable.

Single-select uses a checkmark and multiple uses a checkbox, which is a deliberate
split: a menu row can get away with a checkmark readout because it is transient,
but a multi-select list is a form control you accumulate a selection in and
submit, where the affordance has to invite clicking and an empty box is an
unambiguous "not selected".

## Driving it from a search input

The composition this component exists for. Focus stays in the input; the list
shows the cursor with no ring anywhere near it:

```tsx
<input value={query} onChange={(e) => setQuery(e.target.value)} />
<Listbox type="single" value={picked} onValueChange={setPicked} aria-label="Results">
  {results.length === 0 ? (
    <ListboxEmpty>No cities match “{query}”</ListboxEmpty>
  ) : (
    results.map((r) => (
      <ListboxOption key={r.id} value={r.id}>
        <ListboxOptionIndicator><CheckIcon /></ListboxOptionIndicator>
        <ListboxOptionLabel>{r.label}</ListboxOptionLabel>
      </ListboxOption>
    ))
  )}
</Listbox>
```

Forward the input's arrow/Enter keys to the frame yourself — the headless layer
owns the keymap but only while the frame has focus.

## Height

Consumer-owned via `--primitiv-listbox-max-block-size` (default `18rem`). No
token: none can know how many rows a given list should show. To stop the viewport
on a row boundary rather than mid-row — which reads as a rendering bug rather than
"there is more below" — size it from the row height:

```css
.my-listbox {
  --primitiv-listbox-max-block-size: calc(
    6 * var(--primitiv-listbox-option-height) + 5 *
      var(--primitiv-listbox-option-spacing) + 2 *
      var(--primitiv-listbox-padding-block)
  );
}
```

## Invalid

There is **no `invalid` prop**. Set `aria-invalid` yourself and the frame's border
follows — the same convention `InputGroup` uses:

```tsx
<Listbox type="single" aria-invalid aria-label="Cities">…</Listbox>
```

There is also no whole-list `disabled` state; only individual options can be
disabled.

## Escape hatches

- **Full-bleed rows** (the table/Finder look) — set
  `--primitiv-listbox-option-radius: 0` and `--primitiv-listbox-padding-inline: 0`.
- **No frame** — `border: none` on `.primitiv-listbox`. Bear in mind the frame is
  the tab stop, so you lose the only place the focus ring can go.
- **Horizontal** — pass `orientation="horizontal"`; the row axis follows
  `data-orientation`. Not modelled in Figma, since a horizontal listbox reads as a
  Segmented Control.

## Files

| File | Purpose |
| --- | --- |
| `listbox.tsx` | The wrapper — every part, hand-authored |
| `listbox.recipe.ts` | `cva` class maps for the root and each part |
| `styles.css` | The default theme |
| `styles.scss` | The same, plus `$`-prefixed aliases |
| `contract.json` | The stable surface: parts, modifiers, custom properties |

## Dependencies

- `@primitiv-ui/react` — the headless `Listbox` primitive
- `class-variance-authority` — the recipe

The design record, including all twelve settled decisions, is in
[`docs/listbox-future-work.md`](../../../docs/listbox-future-work.md).


## Truncated labels and descenders

The truncating label carries a 1px `padding-block` with an equal negative
`margin-block`. It needs `overflow: hidden` for `text-overflow: ellipsis`, and
the clip box is the line box — so on the tighter rungs of the density ramp the
deepest ink of a `g`, `j`, `p`, `q` or `y` lands a fraction of a pixel from that
edge and gets shaved, depending on device pixel ratio, browser zoom and the
row's subpixel offset. (Asta Sans has a 1.193em content area, measured off the
real font; `dense`/`xs` sets line-height at 1.20 and `dense`/`lg` at 1.23.)
Padding grows the clip box — overflow clips at the **padding** box — and the
equal negative margin gives the space straight back, so row height and rhythm
are unchanged. Retarget it with `--primitiv-listbox-label-ink-slack`.

Both axes stay a single `overflow` value on purpose: `overflow-y: visible` with
`overflow-x: hidden` is not a combination CSS honours — the visible axis
computes to `auto` and you get a scrollbar.
