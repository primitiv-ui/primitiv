# SegmentedControl

A headless, accessible compound component for picking **one** option from a
small linear set — the segmented-control pattern (iOS-style pill strip,
"consumption mode" switch, view toggles). It implements the
[WAI-ARIA Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/),
so exactly one segment is always selected and the selection can never be
cleared to nothing.

SegmentedControl renders native `<button role="radio">` elements wrapped in a
`<div role="radiogroup">` so it gets keyboard activation (`Space` / `Enter`),
focus ring, and disabled semantics for free from the browser. The React layer
adds single-selection state, roving tabindex, arrow-key navigation, a
whole-control `disabled`, and the `asChild` composition every primitive in
this package supports.

```tsx
import { SegmentedControl } from "@primitiv-ui/react";

<SegmentedControl.Root defaultValue="headless" aria-label="Consumption mode">
  <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
  <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
  <SegmentedControl.Item value="figma">Figma</SegmentedControl.Item>
</SegmentedControl.Root>;
```

## SegmentedControl vs ToggleGroup

Reach for `SegmentedControl` when the choice is a **value** — one option is
always active, like a radio group (view mode, density, a tab-like switch).
Reach for [`ToggleGroup`](../ToggleGroup/README.md) when the buttons are
**commands or toggles** that can each be on or off (text formatting, a
toolbar), including single-select-with-clear. The two look similar but carry
different semantics: `SegmentedControl` is `role="radiogroup"` /
`role="radio"` + `aria-checked`; `ToggleGroup` is `role="group"` +
`aria-pressed` and allows deselecting to nothing.

## Sub-components

| Export                     | Element    | Notes                                                                                          |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `SegmentedControl.Root`    | `<div>`    | `role="radiogroup"`, `aria-orientation`, `data-orientation`, `data-disabled`. State owner. `asChild` |
| `SegmentedControl.Item`    | `<button>` | `role="radio"`, `aria-checked`, `data-state`, `data-disabled`, participates in roving tabindex. `asChild` |

## State modes

- **Uncontrolled** — pass `defaultValue` (or omit for no initial selection).
- **Controlled** — pass `value` **and** `onValueChange` together.

The two shapes are statically discriminated at the type level; TypeScript
rejects mixing them.

```tsx
// Uncontrolled
<SegmentedControl.Root defaultValue="headless" aria-label="Mode">
  …
</SegmentedControl.Root>;

// Controlled
const [value, setValue] = useState("headless");
<SegmentedControl.Root value={value} onValueChange={setValue} aria-label="Mode">
  …
</SegmentedControl.Root>;
```

## Keyboard interaction

| Key                        | Behaviour                                                                        |
| -------------------------- | -------------------------------------------------------------------------------- |
| `Tab`                      | Moves focus to the control's single tab stop (selected segment, or first if none). |
| `Space` / `Enter`          | Selects the focused segment (native `<button>` activation).                      |
| `ArrowRight` / `ArrowLeft` | (horizontal) Moves focus **and** selection to the next / previous segment, wrapping. |
| `ArrowDown` / `ArrowUp`    | (vertical) Moves focus **and** selection to the next / previous segment, wrapping. |

The control has exactly one tab stop — the selected segment, or the first
non-disabled segment if nothing is selected. `Tab` takes the user into and out
of the control in one keystroke; arrow keys navigate inside it.

## Orientation

`orientation` defaults to `"horizontal"` (the usual segmented-control layout),
which binds `ArrowLeft` / `ArrowRight`. Pass `orientation="vertical"` to bind
`ArrowUp` / `ArrowDown` instead. Either way the axis is reflected to assistive
technology via `aria-orientation`, and to CSS via `data-orientation`, on the
`radiogroup` element.

## Reading direction

Pass `dir` (`"ltr"` / `"rtl"`) to swap the horizontal arrow pair, so
`ArrowLeft` moves forward and `ArrowRight` moves backward in RTL. The vertical
pair is never swapped. When `dir` is omitted, it is inherited from the nearest
[`DirectionProvider`](../DirectionProvider/README.md), falling back to `"ltr"`.
An explicit `dir` prop always wins over the inherited value.

## Disabled

Disable a **single segment** by passing `disabled` to a
`SegmentedControl.Item`. It forwards the native `disabled` attribute (removing
it from the focus ring and suppressing clicks), sets `data-disabled=""`, and
excludes the segment from arrow-key navigation and the roving-tabindex home
base.

Disable the **whole control** by passing `disabled` to `SegmentedControl.Root`.
Every segment becomes disabled, `data-disabled=""` is set on the root, and no
segment is navigable or takes a tab stop. The current selection is still
reflected (`aria-checked` / `data-state`) so the control reads correctly while
inert.

```tsx
<SegmentedControl.Root aria-label="Plan" disabled defaultValue="pro">
  <SegmentedControl.Item value="free">Free</SegmentedControl.Item>
  <SegmentedControl.Item value="pro">Pro</SegmentedControl.Item>
</SegmentedControl.Root>
```

## `asChild` composition

`SegmentedControl.Root` and `SegmentedControl.Item` each accept an `asChild`
boolean. When set, the component delegates rendering to its single child
element and merges its own ARIA attributes, `data-state`, `data-disabled`,
composed event handlers, and ref onto the child (the asChild contract: the
child's handler runs first, the library's runs second unless the child calls
`preventDefault`).

```tsx
<SegmentedControl.Root asChild aria-label="View">
  <nav>
    <SegmentedControl.Item value="grid" asChild>
      <a href="#grid">Grid</a>
    </SegmentedControl.Item>
    <SegmentedControl.Item value="list" asChild>
      <a href="#list">List</a>
    </SegmentedControl.Item>
  </nav>
</SegmentedControl.Root>
```

## Styling hooks

`data-state="checked" | "unchecked"` is set on each `SegmentedControl.Item`,
and `data-orientation` / `data-disabled` on the root, letting any CSS system
style the selected segment and the disabled state from plain attribute
selectors:

```css
button[role="radio"][data-state="checked"] {
  background: var(--primitiv-action-primary-default);
  color: var(--primitiv-action-primary-foreground-default);
}
[role="radiogroup"][data-disabled] {
  opacity: 0.5;
  pointer-events: none;
}
```
