---
title: Field
---

# Field

A headless, accessible coordinator that owns the `id`,
`aria-describedby`, and `invalid` / `disabled` / `required` wiring for
a single form control plus its label, description, and error message.
Zero styles ship.

```tsx
import { Field, Input } from "@primitiv-ui/react";

<Field.Root>
  <Field.Label>Email</Field.Label>
  <Input type="email" required />
  <Field.Description>We won't share it.</Field.Description>
</Field.Root>
```

## Anatomy

| Part                        | Element                  | Styling hook                          |
| --------------------------- | ------------------------ | ------------------------------------- |
| `Field` / `Field.Root`      | `<div>`                  | `data-field=""`                       |
| `Field.Label`               | `<label>` (`htmlFor=id`) | n/a                                   |
| `Field.Description`         | `<div id=…-description>` | n/a                                   |
| `Field.ErrorText`           | `<div role="alert">`     | n/a (only renders when invalid)       |

Plus three state-driven hooks on the root: `data-field-invalid`,
`data-field-disabled`, `data-field-required`.

`Field` does **not** render the control itself — it sits *around* an
existing control. `Input` reads `FieldContext` automatically and
inherits the wiring; outside a `<Field.Root>`, `Input` behaves exactly
as before.

## State cascade

Three props on `Field.Root` propagate via context to the control:

```tsx
<Field.Root invalid disabled required>
  <Field.Label>Email</Field.Label>
  <Input type="email" />
  {/*  ^ inherits aria-invalid="true", disabled, required, plus
        aria-describedby pointing at the error / description ids */}
</Field.Root>
```

Consumer-supplied props on the control always win — pass
`disabled={false}` on `Input` and it stays enabled regardless of
`Field.Root`'s `disabled`.

## ID and aria-describedby wiring

`Field.Root` either accepts an explicit `id` or auto-generates one via
`useId`. The derived ids:

| Reference            | Form                |
| -------------------- | ------------------- |
| `field.id`           | `<id>`              |
| `field.descriptionId`| `<id>-description`  |
| `field.errorId`      | `<id>-error`        |

When `Input` is rendered inside `Field.Root`:

- `id` defaults to `field.id`
- `aria-describedby` composes consumer-supplied ids first, then the
  field's `descriptionId`, then the `errorId` (only when invalid)
- `aria-invalid` is set to `"true"` when `field.invalid` is true

If you don't render `Field.Description` or `Field.ErrorText`, the
referenced ids point at nothing — screen readers handle missing ids
gracefully, but it's worth knowing.

## Validation flow

`Field.ErrorText` returns `null` unless `Field.Root` is `invalid`, so
you can render it unconditionally:

```tsx
<Field.Root invalid={!!errors.email}>
  <Field.Label>Email</Field.Label>
  <Input type="email" required {...register("email")} />
  <Field.ErrorText>{errors.email?.message ?? "Required"}</Field.ErrorText>
</Field.Root>
```

## With react-hook-form

`Field` doesn't know about RHF — it just provides the wiring; you tell
it whether the field is invalid by passing `invalid` to `Field.Root`,
and spread `register` onto the `Input`:

```tsx
import { useForm } from "react-hook-form";

const { register, formState: { errors } } = useForm();

<Field.Root invalid={!!errors.email}>
  <Field.Label>Email</Field.Label>
  <Input type="email" required {...register("email")} />
  <Field.Description>We won't spam you.</Field.Description>
  <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
</Field.Root>
```

## With InputGroup

`Field` and `InputGroup` compose freely — `Field` wraps the entire
field group; `InputGroup` wraps just the control plus its adornments.

```tsx
<Field.Root invalid={!!errors.email}>
  <Field.Label>Email</Field.Label>
  <InputGroup>
    <InputGroup.LeadingAdornment>
      <MailIcon aria-hidden="true" />
    </InputGroup.LeadingAdornment>
    <Input type="email" {...register("email")} />
  </InputGroup>
  <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
</Field.Root>
```

`Input` still reads `FieldContext` even when wrapped in `InputGroup` —
the context flows through any DOM nesting.

## Sub-components throw when used outside a Root

`Field.Label`, `Field.Description`, and `Field.ErrorText` throw a
clear error if rendered outside a `<Field.Root>`. The strict-context
hook ensures the typo / misuse fails loudly rather than rendering
silently broken markup.

## `asChild` composition

Every part supports `asChild` for swapping the default element while
preserving the wiring:

```tsx
// Render the field as a semantic <fieldset>
<Field.Root asChild>
  <fieldset>
    <Field.Label>Email</Field.Label>
    <Input type="email" />
  </fieldset>
</Field.Root>

// Render the description as a <p> instead of a <div>
<Field.Description asChild>
  <p className="hint">We won't share it.</p>
</Field.Description>

// Render the error as a <p>
<Field.ErrorText asChild>
  <p className="error">{errors.email?.message}</p>
</Field.ErrorText>

// Render the label on a custom heading slot
<Field.Label asChild>
  <span className="label-text">Email</span>
</Field.Label>
```

Merge rules follow the standard Slot contract: event handlers compose
(child runs first), `style` is shallow-merged, `className` is
concatenated, and the wired attributes (`htmlFor`, `id`, `role`,
`data-field*`) are always merged onto the consumer element.

## Workbench example

Open the interactive version in the [workbench](/workbench/#/field). Its source:

<<< ../../../apps/workbench/src/pages/FieldExample/FieldExample.tsx
