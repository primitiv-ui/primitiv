# Fieldset

A headless, accessible grouping for related form controls — a stateless
compound component wrapping `<fieldset>` and `<legend>`. Zero styles ship.

```tsx
import { Fieldset } from "@primitiv-ui/react";

<Fieldset.Root>
  <Fieldset.Legend>Notifications</Fieldset.Legend>
  <label><input type="checkbox" name="email" /> Email</label>
  <label><input type="checkbox" name="sms" /> SMS</label>
</Fieldset.Root>;
```

`Fieldset` is both callable (an alias of `Fieldset.Root`) and carries its
sub-component as a static property.

## Parts

| Part              | Element      | Notes                                                  |
| ----------------- | ------------ | ------------------------------------------------------ |
| `Fieldset.Root`   | `<fieldset>` | Implicit `role="group"`; `disabled` styling hook       |
| `Fieldset.Legend` | `<legend>`   | Supplies the group's accessible name                   |

## Props

### `Fieldset.Root`

| Prop       | Type                         | Default | Notes                                                       |
| ---------- | ---------------------------- | ------- | ----------------------------------------------------------- |
| `disabled` | `boolean`                    | —       | Native `disabled` + `data-disabled=""` styling hook         |
| `...rest`  | `ComponentProps<"fieldset">` | —       | All other `<fieldset>` props (`aria-*`, `data-*`, etc.)     |

### `Fieldset.Legend`

| Prop      | Type                       | Default | Notes                            |
| --------- | -------------------------- | ------- | -------------------------------- |
| `...rest` | `ComponentProps<"legend">` | —       | All `<legend>` props             |

## Accessible name

A `<fieldset>` has an implicit `role="group"`. Place a `Fieldset.Legend`
as the first child so the group is announced with a name — assistive
technology reads the legend when the user moves focus into any control
within the group.

```tsx
<Fieldset.Root>
  <Fieldset.Legend>Shipping address</Fieldset.Legend>
  …
</Fieldset.Root>
```

## Disabled

Passing `disabled` to `Fieldset.Root` forwards the native `disabled`
attribute. Natively, this disables **every** form control nested inside
the fieldset at once — the standard way to disable a whole section of a
form. It also sets `data-disabled=""` so CSS can target the state
directly:

```tsx
<Fieldset.Root disabled>
  <Fieldset.Legend>Billing</Fieldset.Legend>
  …every nested control is disabled…
</Fieldset.Root>
```

```css
fieldset[data-disabled] {
  opacity: 0.5;
}
```
