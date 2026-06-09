---
title: Select
---

# Select

Headless **Select** — a compound component wrapping the native
`<select>` / `<option>` / `<optgroup>` elements. Zero styles ship.

```tsx
import { Select } from "@primitiv-ui/react";

<Select.Root defaultValue="apple" aria-label="Pick a fruit">
  <Select.Option value="apple">Apple</Select.Option>
  <Select.Option value="banana">Banana</Select.Option>
  <Select.Option value="cherry">Cherry</Select.Option>
</Select.Root>;
```

Because the underlying element is the real `<select>`, the browser owns
the popup, the keyboard interaction (arrow keys, Home/End, typeahead),
the mobile UX (iOS/Android wheel pickers), and form submission. No
positioning JS, no Portal, no anchor positioning.

## Sub-components

| Export                | Element      | ARIA / data hooks                                  | `asChild` |
| --------------------- | ------------ | -------------------------------------------------- | --------- |
| `Select.Root`         | `<select>`   | implicit `role="combobox"`, `data-disabled`        | yes       |
| `Select.Option`       | `<option>`   | implicit `role="option"`                           | —         |
| `Select.Group`        | `<optgroup>` | implicit `role="group"`, `label` as accessible name | —         |
| `Select.Placeholder`  | `<option>`   | always `value=""`, `disabled`, `hidden`            | —         |

## State modes

### Uncontrolled

Pass `defaultValue` (or omit it). The browser owns the selection.
`onValueChange` is optional.

```tsx
<Select.Root defaultValue="banana" aria-label="Pick a fruit">
  <Select.Option value="apple">Apple</Select.Option>
  <Select.Option value="banana">Banana</Select.Option>
</Select.Root>
```

### Controlled

Pass `value` and `onValueChange` together. The parent owns the
selection; the component defers every transition back through the
callback.

```tsx
const [fruit, setFruit] = useState("apple");

<Select.Root value={fruit} onValueChange={setFruit} aria-label="…">
  <Select.Option value="apple">Apple</Select.Option>
  <Select.Option value="banana">Banana</Select.Option>
</Select.Root>;
```

`onValueChange` receives the new selection as a plain string. The
consumer's own `onChange` (the raw `ChangeEvent`) still fires alongside
it if provided.

## Placeholder

`Select.Placeholder` renders a non-selectable hint that holds the
initial selection. The underlying option is rendered with `value=""`,
`disabled`, and `hidden`, so it shows in the closed Select's display
but is unreachable from the dropdown after the user picks something.

```tsx
<Select.Root required aria-label="Pick a fruit">
  <Select.Placeholder>Choose a fruit…</Select.Placeholder>
  <Select.Option value="apple">Apple</Select.Option>
  <Select.Option value="banana">Banana</Select.Option>
</Select.Root>
```

When a `Select.Placeholder` is among Root's direct children and neither
`value` nor `defaultValue` is set, Root infers `defaultValue=""` so the
placeholder — not the first selectable option — is the initial
selection. Pair with `required` on Root to make the browser's native
form validation catch an unchosen value at submit time.

`asChild` on Root walks direct children only for this detection, so the
`asChild` + Placeholder combination requires the consumer to set
`defaultValue=""` explicitly.

## Groups

`Select.Group` wraps options in a native `<optgroup>` with a labelled,
non-selectable heading.

```tsx
<Select.Root aria-label="Pick a food">
  <Select.Group label="Fruits">
    <Select.Option value="apple">Apple</Select.Option>
    <Select.Option value="banana">Banana</Select.Option>
  </Select.Group>
  <Select.Group label="Vegetables">
    <Select.Option value="carrot">Carrot</Select.Option>
  </Select.Group>
</Select.Root>
```

The `label` is announced as the group's accessible name by assistive
technology.

## Disabled

Pass `disabled` on Root to disable the whole control, or on an
individual `Select.Option` to disable that single choice. The native
`disabled` attribute does the work; `data-disabled=""` is mirrored on
the root `<select>` for CSS targeting.

```tsx
<Select.Root disabled aria-label="Pick a fruit">
  <Select.Option value="apple">Apple</Select.Option>
</Select.Root>

<Select.Root aria-label="Pick a fruit">
  <Select.Option value="apple">Apple</Select.Option>
  <Select.Option value="durian" disabled>Durian (sold out)</Select.Option>
</Select.Root>
```

## Field integration

When rendered inside a [`<Field.Root>`](../Field/README.md),
`Select.Root` reads `FieldContext` and inherits:

- `id` (from `field.id`)
- `aria-describedby` (composed: consumer ids first, then the field's
  `descriptionId`, then `errorId` when invalid)
- `aria-invalid` (`"true"` when the field is invalid)
- `disabled`
- `required`

Consumer-supplied props always win — pass an explicit value on the
`Select.Root` to override any field-derived one. Outside a `<Field.Root>`,
behaviour is unchanged.

```tsx
<Field.Root invalid={!!errors.fruit}>
  <Field.Label>Fruit</Field.Label>
  <Select.Root {...register("fruit")}>
    <Select.Placeholder>Choose a fruit…</Select.Placeholder>
    <Select.Option value="apple">Apple</Select.Option>
    <Select.Option value="banana">Banana</Select.Option>
  </Select.Root>
  <Field.ErrorText>{errors.fruit?.message}</Field.ErrorText>
</Field.Root>
```

## Form integration

Native `<select>` is a form-associated element. Pass `name` and
`required`, place the Select inside a `<form>`, and submission carries
the selected value with no extra wiring.

```tsx
<form onSubmit={…}>
  <label>
    Fruit
    <Select.Root name="fruit" required>
      <Select.Placeholder>Choose a fruit…</Select.Placeholder>
      <Select.Option value="apple">Apple</Select.Option>
    </Select.Root>
  </label>
  <button type="submit">Submit</button>
</form>
```

## `asChild` composition

Root accepts `asChild`. The consumer supplies a single element that
renders a `<select>` (typically a styled wrapper). Root's `onChange`,
`data-disabled`, `value` / `defaultValue`, and other native attributes
are merged onto it.

```tsx
function StyledSelect(props: ComponentProps<"select">) {
  return <select {...props} className="ds-select" />;
}

<Select.Root asChild value={fruit} onValueChange={setFruit}>
  <StyledSelect>
    <Select.Option value="apple">Apple</Select.Option>
  </StyledSelect>
</Select.Root>
```

## Styling hooks

| Attribute       | Values                       | Set on        |
| --------------- | ---------------------------- | ------------- |
| `data-disabled` | `""` (present when disabled) | `Select.Root` |

## Limitations

Native `<select>` only renders text inside `<option>`. Rich item content
(icons, descriptions, indicators) is not supported. A richer Select and
a Combobox with filtering are planned — see [Future
work](../../../../docs/select-future-work.md).

## Workbench example

Open the interactive version in the [workbench](/workbench/#/select). Its source:

<<< ../../../apps/workbench/src/pages/SelectExample/SelectExample.tsx
