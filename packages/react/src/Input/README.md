# Input

A headless, accessible single-line text input. Zero styles ship — apply
whatever design system you use.

```tsx
import { Input } from "@primitiv-ui/react";

<label htmlFor="email">Email</label>
<Input id="email" type="email" required />
```

## Props

| Prop       | Type                       | Default  | Notes                                                          |
| ---------- | -------------------------- | -------- | -------------------------------------------------------------- |
| `type`     | `string`                   | `"text"` | Any native `<input>` type (`"email"`, `"password"`, …)         |
| `disabled` | `boolean`                  | —        | Native `disabled` + `data-disabled=""` styling hook            |
| `asChild`  | `boolean`                  | `false`  | Delegate rendering to the child element via Slot               |
| `ref`      | `Ref<HTMLInputElement>`    | —        | Forwarded to the underlying input element                      |
| `...rest`  | `ComponentProps<"input">`  | —        | All other `<input>` props (`value`, `placeholder`, `aria-*`, …) |

## Default type

`type="text"` is set by default so consumers can omit it. Override for
any native variant:

```tsx
<Input type="email" />
<Input type="password" />
<Input type="number" min={0} max={100} step={1} />
<Input type="search" />
<Input type="date" />
```

Future composite primitives (`PasswordInput`, `NumberInput`,
`DatePicker`) will layer richer interaction — visibility toggles,
increment/decrement steppers, popover calendars — on top of those
native types.

## Labelling

An `<input>` has no implicit accessible name. Give it one of:

- a `<label>` whose `htmlFor` matches the input's `id`,
- an `aria-label`, or
- an `aria-labelledby` pointing at visible label text.

```tsx
<label htmlFor="email">Email</label>
<Input id="email" type="email" />
```

## Native validation

All HTML constraint-validation attributes work as the browser intends —
`Input` does not interfere. The browser sets `:invalid` / `:valid`
pseudo-classes automatically and blocks form submission when a
constraint fails:

```tsx
<form>
  <label htmlFor="email">Email</label>
  <Input id="email" type="email" required />
  <button type="submit">Send</button>
</form>
```

For assistive technology, set `aria-invalid` explicitly based on your
validation state, and link the error message with `aria-describedby`:

```tsx
<label htmlFor="email">Email</label>
<Input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby="email-error"
/>
{hasError && <span id="email-error">Enter a valid email</span>}
```

## Form library compatibility

`ref`, `name`, `onChange`, and `onBlur` all pass through, so the spread
pattern used by [react-hook-form](https://react-hook-form.com)'s
`register("field")` (and similar libraries) works directly:

```tsx
import { useForm } from "react-hook-form";

const { register, formState: { errors } } = useForm();

<label htmlFor="email">Email</label>
<Input
  id="email"
  type="email"
  required
  {...register("email")}
  aria-invalid={!!errors.email}
  aria-describedby="email-error"
/>
{errors.email && <span id="email-error">{errors.email.message}</span>}
```

## Disabled

Passing `disabled` forwards the native `disabled` attribute (removing
the field from the tab order and blocking input) **and** sets
`data-disabled=""` so CSS can target `[data-disabled]` without relying
on the `:disabled` pseudo-class:

```tsx
<Input aria-label="Email" disabled />
```

```css
input[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## `asChild` composition

Pass `asChild` to render any consumer-supplied element instead of
`<input>`. All props (`aria-*`, `data-*`, event handlers, `ref`) are
merged onto the child via the `Slot` utility — event handlers compose
(child runs first), `style` is shallow-merged, `className` is
concatenated.

`type` is **not** forwarded when `asChild` is set — the child element
owns its own type semantics.

```tsx
// Wrap a masked input from a third-party library
<Input asChild aria-label="Phone">
  <MaskedInput mask="(000) 000-0000" />
</Input>
```

## Ref forwarding

```tsx
const ref = useRef<HTMLInputElement>(null);
<Input ref={ref} aria-label="Email" />
```

## Field integration

When rendered inside a [`<Field.Root>`](../Field/README.md), `Input`
reads `FieldContext` and inherits:

- `id` (from `field.id`)
- `aria-describedby` (composed: consumer ids first, then the field's
  `descriptionId`, then `errorId` when invalid)
- `aria-invalid` (`"true"` when the field is invalid)
- `disabled`
- `required`

Consumer-supplied props always win — pass an explicit value on the
`Input` to override any field-derived one. Outside a `<Field.Root>`,
behaviour is unchanged.

```tsx
<Field.Root invalid={!!errors.email}>
  <Field.Label>Email</Field.Label>
  <Input type="email" required {...register("email")} />
  <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
</Field.Root>
```

## Composition partners

- **[InputGroup](../InputGroup/README.md)** — a framed wrapper with
  named leading / trailing adornment slots. Use for icons, currency
  symbols, clear buttons, password-reveal toggles.
- **[Field](../Field/README.md)** — the label / description / error-text
  coordinator (above). `Field` and `InputGroup` compose freely:
  `<Field.Root><InputGroup><Input /></InputGroup></Field.Root>`.
