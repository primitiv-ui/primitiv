---
title: Toggle
---

# Toggle

A headless, accessible stateful toggle button implementing the
[WAI-ARIA Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
with `aria-pressed`.

Toggle renders a native `<button type="button">` so it gets keyboard
activation (`Space` / `Enter`), focus ring, and disabled semantics for
free from the browser. It owns a single boolean `pressed` value and
exposes it through `aria-pressed` and the `data-state` styling hook.

```tsx
import { Toggle } from "@primitiv-ui/react";

<Toggle aria-label="Bold">B</Toggle>;
```

## State modes

- **Uncontrolled** — pass `defaultPressed` (or omit for unpressed on mount).
  The component owns the value internally.
- **Controlled** — pass `pressed` **and** `onPressedChange` together.
  The parent owns the value; every click defers back through the callback.

The two shapes are statically discriminated at the type level; TypeScript
rejects mixing them.

```tsx
// Uncontrolled
<Toggle defaultPressed aria-label="Bold">B</Toggle>;

// Controlled
const [bold, setBold] = useState(false);
<Toggle pressed={bold} onPressedChange={setBold} aria-label="Bold">B</Toggle>;
```

## Pressed state

| `pressed` | `aria-pressed` | `data-state` |
| --------- | -------------- | ------------ |
| `true`    | `"true"`       | `"on"`       |
| `false`   | `"false"`      | `"off"`      |

## Keyboard interaction

| Key     | Behaviour                              |
| ------- | -------------------------------------- |
| `Space` | Toggles the button (native `<button>`) |
| `Enter` | Toggles the button (native `<button>`) |

Keyboard handling comes from the underlying `<button>` element — no custom
`keydown` listeners are needed.

## Disabled

Passing `disabled` forwards the native `disabled` attribute to the button
(removing it from the tab order and suppressing clicks) **and** sets
`data-disabled=""` so CSS can target `[data-disabled]` without reaching for
`:disabled`.

```tsx
<Toggle disabled aria-label="Bold (unavailable)">B</Toggle>
```

## `asChild` composition

Toggle accepts `asChild`. When set, the component delegates rendering to its
single child element and merges `aria-pressed`, `data-state`, the composed
`onClick`, and any `ref` onto that element. The native `<button>` is dropped;
the consumer is responsible for making the element focusable.

```tsx
// Custom element — consumer owns focusability
<Toggle asChild aria-label="Bold">
  <div role="button" tabIndex={0}>B</div>
</Toggle>
```

## Styling hooks

```css
/* pressed state */
[aria-pressed="true"] {
  background: oklch(65% 0.18 250);
}

/* data-state alternative */
[data-state="on"] {
  outline: 2px solid currentColor;
}

/* disabled */
[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Workbench example

Open the interactive version in the [workbench](/workbench/#/toggle). Its source:

<<< ../../../apps/workbench/src/pages/ToggleExample/ToggleExample.tsx
