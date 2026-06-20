# Checkbox

A headless, accessible Checkbox built on a **real native
`<input type="checkbox">`**, including the platform's own tri-state
("mixed") variant.

Checkbox renders a `<label>` that is the visible box, wrapping a
visually-hidden native `<input type="checkbox">` (the focusable,
form-participating control) and a decorative `Indicator` mark. Because the
underlying element is a genuine native checkbox, it submits its `value`
under `name` with an enclosing form, resets with the form, and gets keyboard
activation and focus for free. The `"indeterminate"` state is the
platform's: it is applied via the input's `.indeterminate` DOM property, so
the browser exposes `aria-checked="mixed"` and the `:indeterminate`
pseudo-class for styling.

```tsx
import { Checkbox } from "@primitiv-ui/react";

<Checkbox.Root name="terms" value="accepted" defaultChecked aria-label="Accept terms">
  <Checkbox.Indicator />
</Checkbox.Root>;
```

## Sub-components

| Export               | Element                          | Notes                                                                                       |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| `Checkbox.Root`      | `<label>` + hidden `<input>`     | The styled box. `data-state`, `data-disabled` on the label; `name`/`value`/`aria-*`/`ref` go to the input. |
| `Checkbox.Indicator` | `<span>`                         | `aria-hidden="true"`. Always mounted; CSS reveals it. `asChild`                             |

`Checkbox.Root`'s `className` / `style` style the **box** (the `<label>` you
see). Every other prop spreads onto the hidden `<input>`, because semantically
the Root *is* the checkbox: pass `name`, `value`, `id`, `required`, `aria-*`,
`ref`, etc. straight to `Checkbox.Root`.

## Checked state

Checkbox is tri-state. The `checked` / `defaultChecked` value is
`boolean | "indeterminate"`:

| Value             | Native           | `data-state`      | Mark visible? |
| ----------------- | ---------------- | ----------------- | ------------- |
| `true`            | `:checked`       | `"checked"`       | Yes (tick)    |
| `false`           | —                | `"unchecked"`     | No            |
| `"indeterminate"` | `:indeterminate` | `"indeterminate"` | Yes (bar)     |

Clicking an indeterminate checkbox resolves it to `true` per the WAI-ARIA
tri-state convention (the native default); subsequent clicks flip between
`true` and `false`.

## State modes

- **Uncontrolled** — pass `defaultChecked` (or omit for unchecked on mount).
  It may be `"indeterminate"`.
- **Controlled** — pass `checked` **and** `onCheckedChange` together.

The two shapes are statically discriminated at the type level; TypeScript
rejects mixing them.

```tsx
// Uncontrolled
<Checkbox.Root name="terms" value="accepted" defaultChecked>
  <Checkbox.Indicator />
</Checkbox.Root>;

// Controlled
const [checked, setChecked] = useState<CheckedState>(false);
<Checkbox.Root checked={checked} onCheckedChange={setChecked}>
  <Checkbox.Indicator />
</Checkbox.Root>;
```

> **`data-state` is a best-effort mirror.** Drive the *visual* checked look off
> the input's native `:checked` / `:indeterminate` (and `:has(> input:checked)`
> on the box), as the shipped registry stylesheet does — it stays correct
> through a form reset, which fires no React event.

## Keyboard interaction

| Key     | Behaviour                                    |
| ------- | -------------------------------------------- |
| `Space` | Toggles the focused checkbox (native input)  |
| `Tab`   | Moves to / from the checkbox (native)        |

Keyboard handling comes from the underlying native input — no custom `keydown`
listeners are needed.

## Disabled

Passing `disabled` forwards the native `disabled` attribute to the input
(removing it from the tab order and suppressing clicks) **and** sets
`data-disabled=""` on the box so CSS can target `[data-disabled]` without
reaching for `:disabled`.

```tsx
<Checkbox.Root disabled aria-label="Locked setting">
  <Checkbox.Indicator />
</Checkbox.Root>
```

## `asChild` composition

`Checkbox.Indicator` accepts an `asChild` boolean. When set, the component
delegates rendering to its single child element and merges its `aria-hidden`,
`data-state`, and ref onto the child — typically an `<svg>` tick:

```tsx
<Checkbox.Indicator asChild>
  <svg viewBox="0 0 10 10">
    <path d="M1 5l3 3 5-7" />
  </svg>
</Checkbox.Indicator>
```

## Styling hooks

- The box (`Checkbox.Root`) carries
  `data-state="checked" | "unchecked" | "indeterminate"` and `data-disabled=""`.
- The hidden input exposes the always-correct native states: `:checked`,
  `:indeterminate`, `:focus-visible`, `:disabled`. Prefer these for the *marked*
  look.

```css
.checkbox:has(> input:checked),
.checkbox:has(> input:indeterminate) {
  background: oklch(65% 0.18 145);
}
.checkbox > input:checked ~ .checkbox__indicator,
.checkbox > input:indeterminate ~ .checkbox__indicator {
  scale: 1;
}
.checkbox[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```
