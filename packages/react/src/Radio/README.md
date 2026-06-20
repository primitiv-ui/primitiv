# Radio

A headless, accessible, **standalone** radio control built on a **real native
`<input type="radio">`**.

Radio renders a `<label>` that is the visible box, wrapping a visually-hidden
native `<input type="radio">` (the focusable, form-participating control) and a
decorative `Indicator` dot. Because the underlying element is a genuine native
radio, siblings sharing a `name` form a **native radio group** — the browser,
not JavaScript, enforces single-selection and silently deselects the others.
It also submits with an enclosing form, resets with it, and gets keyboard
activation and focus for free.

> **Radio vs. RadioGroup.** `Radio` is the lone native control for when you own
> the grouping (a shared `name`, a bespoke layout, a single opt-in). For a
> managed set with roving-tabindex keyboard navigation, arrow-key selection, and
> disabled-item skipping, reach for [`RadioGroup`](../RadioGroup/README.md) — it
> composes `role="radio"` items and owns the shared selected value itself.

```tsx
import { Radio } from "@primitiv-ui/react";

<Radio.Root name="density" value="comfortable" defaultChecked aria-label="Comfortable">
  <Radio.Indicator />
</Radio.Root>;
```

## Sub-components

| Export            | Element                          | Notes                                                                              |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| `Radio.Root`      | `<label>` + hidden `<input>`     | The styled box. `data-state`, `data-disabled` on the label; `name`/`value`/`aria-*`/`ref` go to the input. |
| `Radio.Indicator` | `<span>`                         | `aria-hidden="true"`. Always mounted; CSS reveals it. `asChild`                    |

`Radio.Root`'s `className` / `style` style the **box** (the `<label>` you see).
Every other prop spreads onto the hidden `<input>`, because semantically the
Root *is* the radio: pass `name`, `value`, `id`, `required`, `aria-*`, `ref`,
etc. straight to `Radio.Root`.

## Native grouping (the headline)

Give sibling radios the same `name` and the browser groups them. No shared
state, no `RadioGroup`, no controlled wiring required:

```tsx
{plans.map((plan) => (
  <Radio.Root key={plan.id} name="plan" value={plan.id} aria-label={plan.label}>
    <Radio.Indicator />
  </Radio.Root>
))}
```

Selecting one deselects the rest, and the chosen `value` submits under `plan`
with an enclosing `<form>`.

## Selected state

Radio is binary. The `checked` / `defaultChecked` value is a `boolean`:

| Value   | Native    | `data-state`  | Dot visible? |
| ------- | --------- | ------------- | ------------ |
| `true`  | `:checked`| `"checked"`   | Yes          |
| `false` | —         | `"unchecked"` | No           |

A native radio only ever moves *into* the checked state by user action —
clicking the already-selected radio is a no-op, and selection moves off it only
when a sibling is chosen. You get that for free.

## State modes

- **Uncontrolled** — pass `defaultChecked` (or omit for unselected on mount).
  The **browser** owns the value, so native `name`-grouping works.
- **Controlled** — pass `checked` **and** `onCheckedChange` together. The parent
  owns the value (and the grouping).

The two shapes are statically discriminated at the type level; TypeScript
rejects mixing them.

```tsx
// Uncontrolled native group
<Radio.Root name="density" value="compact" defaultChecked>
  <Radio.Indicator />
</Radio.Root>;

// Controlled — the consumer owns the group's selected value.
const [value, setValue] = useState("comfortable");
<Radio.Root
  name="density"
  value="compact"
  checked={value === "compact"}
  onCheckedChange={() => setValue("compact")}
>
  <Radio.Indicator />
</Radio.Root>;
```

> **`data-state` is a best-effort mirror.** It is accurate in controlled mode and
> for self-clicks, but a sibling the browser silently deselects fires no React
> event, so its `data-state` can lag. Drive the *visual* checked look off the
> input's native `:checked` (and `:has(> input:checked)` on the box), as the
> shipped registry stylesheet does — not off `data-state`.

## Keyboard interaction

| Key            | Behaviour                                  |
| -------------- | ------------------------------------------ |
| `Space`        | Selects the focused radio (native `<input>`) |
| `Tab`          | Moves to / from the radio (native)         |

Keyboard handling comes from the underlying native input — no custom `keydown`
listeners. (Arrow-key navigation *within* a group is a `RadioGroup` concern.)

## Disabled

Passing `disabled` forwards the native `disabled` attribute to the input
(removing it from the tab order and suppressing clicks) **and** sets
`data-disabled=""` on the box so CSS can target `[data-disabled]` without
reaching for `:disabled`.

```tsx
<Radio.Root disabled aria-label="Unavailable plan">
  <Radio.Indicator />
</Radio.Root>
```

## `asChild` composition

`Radio.Indicator` accepts an `asChild` boolean. When set, the component
delegates rendering to its single child element and merges its `aria-hidden`,
`data-state`, and ref onto the child — typically to use an `<svg>` as the dot:

```tsx
<Radio.Indicator asChild>
  <svg viewBox="0 0 10 10">
    <circle cx="5" cy="5" r="3" />
  </svg>
</Radio.Indicator>
```

## Styling hooks

- The box (`Radio.Root`) carries `data-state="checked" | "unchecked"` and
  `data-disabled=""`.
- The hidden input exposes the always-correct native states: `:checked`,
  `:focus-visible`, `:disabled`. Prefer these for the *checked* look.

```css
/* Reveal the dot from the native checked state — correct even on a silent
   sibling deselect. */
.radio > input:checked ~ .radio__indicator {
  scale: 1;
}
.radio:has(> input:checked) {
  border-color: oklch(55% 0.2 265);
}
.radio[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```
