# Radio

A headless, accessible, **standalone** compound component implementing the
single-selection half of the
[WAI-ARIA Radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

Radio renders a native `<button role="radio">` so it gets keyboard
activation (`Space` / `Enter`), focus ring, and disabled semantics for free
from the browser. The React layer adds one-way selection, `Indicator`
mounting driven by the selected state, and the `asChild` composition every
primitive in this package supports.

> **Radio vs. RadioGroup.** `Radio` is the lone control for when you own the
> grouping (a native form `name`, a bespoke layout, a single opt-in). For a
> managed set with roving-tabindex keyboard navigation, arrow-key selection,
> and disabled-item skipping, reach for
> [`RadioGroup`](../RadioGroup/README.md) instead — it composes `role="radio"`
> items the same way but owns the shared selected value.

```tsx
import { Radio } from "@primitiv-ui/react";

<Radio.Root defaultChecked aria-label="Compact">
  <Radio.Indicator>
    <DotIcon />
  </Radio.Indicator>
</Radio.Root>;
```

## Sub-components

| Export            | Element    | Notes                                                                       |
| ----------------- | ---------- | --------------------------------------------------------------------------- |
| `Radio.Root`      | `<button>` | `role="radio"`, `aria-checked`, `data-state`, `data-disabled`. `asChild`    |
| `Radio.Indicator` | `<span>`   | `aria-hidden="true"`. Renders only while selected. `asChild`, `forceMount`  |

## Selected state

Radio is binary. The `checked` / `defaultChecked` value is a `boolean`:

| Value   | `aria-checked` | `data-state`  | Indicator renders?       |
| ------- | -------------- | ------------- | ------------------------ |
| `true`  | `"true"`       | `"checked"`   | Yes                      |
| `false` | `"false"`      | `"unchecked"` | No (unless `forceMount`) |

Selection is **one-way**: clicking an unselected radio selects it, but
clicking the already-selected radio is a no-op — a lone radio never toggles
itself off, and `onCheckedChange` does not fire for a re-select. De-selection
happens when a sibling is chosen, which is the grouping consumer's concern.

## State modes

- **Uncontrolled** — pass `defaultChecked` (or omit for unselected on mount).
- **Controlled** — pass `checked` **and** `onCheckedChange` together.

The two shapes are statically discriminated at the type level; TypeScript
rejects mixing them.

```tsx
// Uncontrolled
<Radio.Root defaultChecked>…</Radio.Root>;

// Controlled — the consumer owns the group's selected value.
const [value, setValue] = useState("comfortable");
<Radio.Root
  checked={value === "compact"}
  onCheckedChange={() => setValue("compact")}
>
  …
</Radio.Root>;
```

## Keyboard interaction

| Key     | Behaviour                              |
| ------- | -------------------------------------- |
| `Space` | Selects the radio (native `<button>`)  |
| `Enter` | Selects the radio (native `<button>`)  |

Keyboard handling comes from the underlying `<button>` element — no custom
`keydown` listeners are needed. (Arrow-key navigation across a set is a
`RadioGroup` concern, not a standalone `Radio` one.)

## Disabled

Passing `disabled` forwards the native `disabled` attribute to the button
(removing it from the tab order and suppressing clicks) **and** sets
`data-disabled=""` on the root so CSS can target `[data-disabled]` without
reaching for `:disabled`.

```tsx
<Radio.Root disabled aria-label="Unavailable plan">
  <Radio.Indicator>
    <DotIcon />
  </Radio.Indicator>
</Radio.Root>
```

## `asChild` composition

Both `Radio.Root` and `Radio.Indicator` accept an `asChild` boolean. When
set, the component delegates rendering to its single child element and merges
its own ARIA attributes, data-state, composed event handlers, and ref onto
the child (the asChild contract: the child's handler runs first, the
library's runs second unless the child calls `preventDefault`).

```tsx
// Menu-item radio — the same state machinery, different element + role.
<Radio.Root asChild aria-label="Sort by name">
  <li role="menuitemradio">Sort by name</li>
</Radio.Root>

// Icon-only indicator — the svg itself becomes the indicator.
<Radio.Indicator asChild>
  <svg viewBox="0 0 10 10">
    <circle cx="5" cy="5" r="3" />
  </svg>
</Radio.Indicator>
```

## Animation hooks

`Radio.Indicator` accepts a `forceMount` boolean. When set, the indicator
stays in the DOM regardless of selected state so a CSS animation can play
against `data-state="unchecked"`:

```tsx
<Radio.Indicator forceMount>
  <DotIcon />
</Radio.Indicator>
```

```css
[data-state="checked"] {
  animation: dot-in 120ms ease-out;
}
[data-state="unchecked"] {
  animation: dot-out 100ms ease-in forwards;
}
```

Consumers using `forceMount` own the exit timing themselves.

## Styling hooks

`data-state="checked" | "unchecked"` is set on both `Radio.Root` and
`Radio.Indicator`, letting any CSS system target both phases.

```css
button[data-state="checked"] {
  border-color: oklch(55% 0.2 265);
}
button[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```
