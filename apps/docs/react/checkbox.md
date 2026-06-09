---
title: Checkbox
---

# Checkbox

A headless, accessible compound component implementing the
[WAI-ARIA Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/),
including the tri-state ("mixed") variant.

Checkbox renders a native `<button role="checkbox">` so it gets
keyboard activation (`Space` / `Enter`), focus ring, and disabled
semantics for free from the browser. The React layer adds three-state
support, `Indicator` mounting driven by the checked state, and the
`asChild` composition every primitive in this package supports.

```tsx
import { Checkbox } from "@primitiv-ui/react";

<Checkbox.Root defaultChecked aria-label="Accept terms">
  <Checkbox.Indicator>
    <CheckIcon />
  </Checkbox.Indicator>
</Checkbox.Root>;
```

## Sub-components

| Export               | Element    | Notes                                                                                      |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `Checkbox.Root`      | `<button>` | `role="checkbox"`, `aria-checked`, `data-state`, `data-disabled`. `asChild`                |
| `Checkbox.Indicator` | `<span>`   | `aria-hidden="true"`. Renders only while checked or indeterminate. `asChild`, `forceMount` |

## Checked state

Checkbox is tri-state. The `checked` / `defaultChecked` value is
`boolean | "indeterminate"`:

| Value             | `aria-checked` | `data-state`      | Indicator renders?       |
| ----------------- | -------------- | ----------------- | ------------------------ |
| `true`            | `"true"`       | `"checked"`       | Yes                      |
| `false`           | `"false"`      | `"unchecked"`     | No (unless `forceMount`) |
| `"indeterminate"` | `"mixed"`      | `"indeterminate"` | Yes                      |

Clicking an indeterminate checkbox resolves it to `true` per the
WAI-ARIA tri-state convention; subsequent clicks flip between `true`
and `false`.

## State modes

- **Uncontrolled** — pass `defaultChecked` (or omit for unchecked on mount).
- **Controlled** — pass `checked` **and** `onCheckedChange` together.

The two shapes are statically discriminated at the type level;
TypeScript rejects mixing them.

```tsx
// Uncontrolled
<Checkbox.Root defaultChecked>…</Checkbox.Root>;

// Controlled
const [checked, setChecked] = useState<CheckedState>(false);
<Checkbox.Root checked={checked} onCheckedChange={setChecked}>
  …
</Checkbox.Root>;
```

## Keyboard interaction

| Key     | Behaviour                                |
| ------- | ---------------------------------------- |
| `Space` | Toggles the checkbox (native `<button>`) |
| `Enter` | Toggles the checkbox (native `<button>`) |

Keyboard handling comes from the underlying `<button>` element — no
custom `keydown` listeners are needed.

## Disabled

Passing `disabled` forwards the native `disabled` attribute to the
button (removing it from the tab order and suppressing clicks) **and**
sets `data-disabled=""` on the root so CSS can target
`[data-disabled]` without reaching for `:disabled`.

```tsx
<Checkbox.Root disabled aria-label="Locked setting">
  <Checkbox.Indicator>
    <CheckIcon />
  </Checkbox.Indicator>
</Checkbox.Root>
```

## `asChild` composition

Both `Checkbox.Root` and `Checkbox.Indicator` accept an `asChild`
boolean. When set, the component delegates rendering to its single
child element and merges its own ARIA attributes, data-state, composed
event handlers, and ref onto the child (the asChild contract: the
child's handler runs first, the library's runs second unless the child
calls `preventDefault`).

```tsx
// Menu-item checkbox — the same state machinery, different element + role.
<Checkbox.Root asChild aria-label="Show hidden files">
  <li role="menuitemcheckbox">Show hidden files</li>
</Checkbox.Root>

// Icon-only indicator — the svg itself becomes the indicator.
<Checkbox.Indicator asChild>
  <svg viewBox="0 0 10 10">
    <path d="M1 5l3 3 5-7" />
  </svg>
</Checkbox.Indicator>
```

`Root`'s `asChild` is what lets `Dropdown.CheckboxItem` (in a later
phase) wrap an `<li role="menuitemcheckbox">` around the Checkbox
state / toggle behaviour without re-implementing any of it.

## Animation hooks

`Checkbox.Indicator` accepts a `forceMount` boolean. When set, the
indicator stays in the DOM regardless of checked state so a CSS
animation can play against `data-state="unchecked"`:

```tsx
<Checkbox.Indicator forceMount>
  <CheckIcon />
</Checkbox.Indicator>
```

```css
[data-state="checked"] {
  animation: tick-in 120ms ease-out;
}
[data-state="unchecked"] {
  animation: tick-out 100ms ease-in forwards;
}
```

Consumers using `forceMount` own the exit timing themselves.

## Styling hooks

`data-state="checked" | "unchecked" | "indeterminate"` is set on both
`Checkbox.Root` and `Checkbox.Indicator`, letting any CSS system target
the three phases.

```css
button[data-state="checked"] {
  background: oklch(65% 0.18 145);
}
button[data-state="indeterminate"] {
  background: oklch(70% 0.1 250);
}
button[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Workbench example

Open the interactive version in the [workbench](/workbench/#/checkbox). Its source:

<<< ../../../apps/workbench/src/pages/CheckboxExample/CheckboxExample.tsx
