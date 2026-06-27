# RadioGroup

A headless, accessible compound component implementing the
[WAI-ARIA Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

RadioGroup renders native `<button role="radio">` elements wrapped in a
`<div role="radiogroup">` so it gets keyboard activation (`Space` /
`Enter`), focus ring, and disabled semantics for free from the browser.
The React layer adds single-selection state, roving tabindex, arrow-key
navigation, an Indicator slot driven by the selected value, and the
`asChild` composition every primitive in this package supports.

```tsx
import { RadioGroup } from "@primitiv-ui/react";

<RadioGroup.Root defaultValue="comfortable" aria-label="Density">
  <RadioGroup.Item value="compact">
    <RadioGroup.Indicator />
    Compact
  </RadioGroup.Item>
  <RadioGroup.Item value="comfortable">
    <RadioGroup.Indicator />
    Comfortable
  </RadioGroup.Item>
</RadioGroup.Root>;
```

## Sub-components

| Export                 | Element    | Notes                                                                                         |
| ---------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `RadioGroup.Root`      | `<div>`    | `role="radiogroup"`. State owner, context provider. `asChild`                                 |
| `RadioGroup.Item`      | `<button>` | `role="radio"`, `aria-checked`, `data-state`, participates in roving tabindex. `asChild`      |
| `RadioGroup.Indicator` | `<span>`   | `aria-hidden="true"`. Renders only while the parent Item is selected. `asChild`, `forceMount` |

## State modes

- **Uncontrolled** — pass `defaultValue` (or omit for no initial selection).
- **Controlled** — pass `value` **and** `onValueChange` together.

The two shapes are statically discriminated at the type level;
TypeScript rejects mixing them.

```tsx
// Uncontrolled
<RadioGroup.Root defaultValue="compact" aria-label="Density">
  …
</RadioGroup.Root>;

// Controlled
const [value, setValue] = useState("compact");
<RadioGroup.Root value={value} onValueChange={setValue} aria-label="Density">
  …
</RadioGroup.Root>;
```

## Keyboard interaction

| Key                        | Behaviour                                                                     |
| -------------------------- | ----------------------------------------------------------------------------- |
| `Tab`                      | Moves focus to the group's single tab stop (selected item, or first if none). |
| `Space` / `Enter`          | Selects the focused item (native `<button>` activation).                      |
| `ArrowDown` / `ArrowRight` | Moves focus **and** selection to the next non-disabled item, wrapping.        |
| `ArrowUp` / `ArrowLeft`    | Moves focus **and** selection to the previous non-disabled item, wrapping.    |

The group has exactly one tab stop — the selected item, or the first
non-disabled item if nothing is selected. This is the standard WAI-ARIA
Radio Group behaviour: `Tab` takes the user into and out of the group
in one keystroke, and arrow keys navigate inside it.

## Orientation

By default (`orientation="both"`) all four arrow keys navigate the group.
Pass `orientation` to restrict navigation to a single axis:

- `orientation="horizontal"` — only `ArrowLeft` / `ArrowRight` navigate.
- `orientation="vertical"` — only `ArrowUp` / `ArrowDown` navigate.

A `horizontal` or `vertical` group also reflects the axis to assistive
technology via `aria-orientation` on the `radiogroup` element.

## Reading direction

Pass `dir` (`"ltr"` / `"rtl"`) to swap the horizontal arrow pair, so
`ArrowLeft` moves forward and `ArrowRight` moves backward in RTL. The
vertical pair is never swapped. When `dir` is omitted, it is inherited
from the nearest [`DirectionProvider`](../DirectionProvider/README.md),
falling back to `"ltr"` when there is no provider. An explicit `dir` prop
always wins over the inherited value.

## Disabled items

Passing `disabled` to a `RadioGroup.Item` forwards the native
`disabled` attribute (removing it from the focus ring and suppressing
clicks) **and** excludes the Item from:

- Arrow-key navigation — the group skips over it to the next enabled
  Item.
- The roving-tabindex home base — `Tab` never lands on a disabled Item
  when nothing is selected.

```tsx
<RadioGroup.Root aria-label="Plan">
  <RadioGroup.Item value="free">Free</RadioGroup.Item>
  <RadioGroup.Item value="pro">Pro</RadioGroup.Item>
  <RadioGroup.Item value="enterprise" disabled>
    Enterprise (contact sales)
  </RadioGroup.Item>
</RadioGroup.Root>
```

## `asChild` composition

`RadioGroup.Root`, `RadioGroup.Item`, and `RadioGroup.Indicator` each
accept an `asChild` boolean. When set, the component delegates
rendering to its single child element and merges its own ARIA
attributes, data-state, composed event handlers, and ref onto the
child (the asChild contract: the child's handler runs first, the
library's runs second unless the child calls `preventDefault`).

```tsx
// Menu-shaped radio group — same state machinery, different shell.
<RadioGroup.Root asChild aria-label="Theme">
  <menu role="menu">
    <RadioGroup.Item value="light" asChild>
      <li role="menuitemradio">Light</li>
    </RadioGroup.Item>
    <RadioGroup.Item value="dark" asChild>
      <li role="menuitemradio">Dark</li>
    </RadioGroup.Item>
  </menu>
</RadioGroup.Root>

// Icon-only indicator — the svg itself becomes the dot.
<RadioGroup.Indicator asChild>
  <svg viewBox="0 0 10 10">
    <circle cx="5" cy="5" r="3" />
  </svg>
</RadioGroup.Indicator>
```

`Root`'s and `Item`'s `asChild` are what let `Dropdown.RadioGroup` /
`Dropdown.RadioItem` (in a later phase) wrap `<menu role="menu">` and
`<li role="menuitemradio">` elements around the RadioGroup state
machinery without re-implementing any of it.

## Animation hooks

`RadioGroup.Indicator` accepts a `forceMount` boolean. When set, the
indicator stays in the DOM regardless of selection state so a CSS
animation can play against `data-state="unchecked"`:

```tsx
<RadioGroup.Item value="blue">
  <RadioGroup.Indicator forceMount />
  Blue
</RadioGroup.Item>
```

```css
[data-state="checked"] {
  animation: dot-in var(--primitiv-motion-duration-control) var(--primitiv-motion-easing-enter);
}
[data-state="unchecked"] {
  animation: dot-out var(--primitiv-motion-duration-feedback) var(--primitiv-motion-easing-exit) forwards;
}
```

Consumers using `forceMount` own the exit timing themselves.

## Styling hooks

`data-state="checked" | "unchecked"` is set on both `RadioGroup.Item`
and `RadioGroup.Indicator`, letting any CSS system target the two
phases from one rule:

```css
button[role="radio"][data-state="checked"] {
  border-color: oklch(65% 0.18 250);
}
button[role="radio"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```
