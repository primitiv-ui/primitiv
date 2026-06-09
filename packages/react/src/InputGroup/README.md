# InputGroup

A headless, accessible compound that frames a single form control
alongside optional leading and trailing adornments — icons, currency
symbols, clear buttons, password-reveal toggles. Zero styles ship.

```tsx
import { InputGroup, Input } from "@primitiv-ui/react";

<InputGroup>
  <InputGroup.LeadingAdornment>
    <SearchIcon aria-hidden="true" />
  </InputGroup.LeadingAdornment>
  <Input aria-label="Search" type="search" />
</InputGroup>
```

## Anatomy

| Part                              | Element  | Styling hook                                  |
| --------------------------------- | -------- | --------------------------------------------- |
| `InputGroup` / `InputGroup.Root`  | `<div>`  | `data-input-group=""`                         |
| `InputGroup.LeadingAdornment`     | `<span>` | `data-input-group-adornment="leading"`        |
| `InputGroup.TrailingAdornment`    | `<span>` | `data-input-group-adornment="trailing"`       |

`InputGroup` is intentionally **not** input-specific. The wrapper maps
to the `framed-control/*` design-token anatomy (height, padding-inline,
gap, icon-size, radius) and works around `<Input>`, `<Textarea>`, or any
future framed control — the only thing tying it to `<Input>` is the
name.

## State coordination — there is none

`InputGroup` owns no state, provides no context, and accepts no
`disabled` / `invalid` props. State-dependent styling on the frame
delegates to CSS:

```css
[data-input-group] {
  display: inline-flex;
  align-items: center;
  gap: var(--frame-gap);
  padding-inline: var(--frame-padding-inline);
  border: 1px solid var(--frame-border);
  border-radius: var(--frame-radius);
}

/* Focus ring around the whole frame */
[data-input-group]:focus-within {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

/* Disabled-frame styling — driven by the inner input */
[data-input-group]:has(input:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Invalid-frame styling — same idea */
[data-input-group]:has(input[aria-invalid="true"]) {
  border-color: var(--danger);
}
```

When `Field` lands it will sit *outside* `InputGroup` and own label /
description / error-text wiring; `InputGroup` will not need to change.

## Adornments

### Decorative

A decorative icon — give the icon `aria-hidden="true"` (or wrap with
`AccessibleIcon`). The default `<span>` adornment has no automatic ARIA
semantics — that's the consumer's call.

```tsx
<InputGroup>
  <InputGroup.LeadingAdornment>
    <MailIcon aria-hidden="true" />
  </InputGroup.LeadingAdornment>
  <Input type="email" aria-label="Email" />
</InputGroup>
```

### Interactive — `asChild` + `<button>`

For a clear button, password-reveal toggle, or any clickable adornment,
pass `asChild` and supply the `<button>` directly. The data attribute
and ref merge onto the button; event handlers compose (child runs
first).

```tsx
<InputGroup>
  <Input value={q} onChange={onChange} aria-label="Search" />
  <InputGroup.TrailingAdornment asChild>
    <button type="button" aria-label="Clear" onClick={() => onChange("")}>
      <XIcon aria-hidden="true" />
    </button>
  </InputGroup.TrailingAdornment>
</InputGroup>
```

### Leading and trailing together

JSX order matches visual order — put `LeadingAdornment` before the
control, `TrailingAdornment` after.

```tsx
<InputGroup>
  <InputGroup.LeadingAdornment><MailIcon aria-hidden="true" /></InputGroup.LeadingAdornment>
  <Input type="email" aria-label="Email" />
  <InputGroup.TrailingAdornment asChild>
    <button type="button" aria-label="Clear">
      <XIcon aria-hidden="true" />
    </button>
  </InputGroup.TrailingAdornment>
</InputGroup>
```

## `asChild` on Root

Pass `asChild` on `InputGroup.Root` to render the frame as a `<label>`
so clicking anywhere on the frame focuses the wrapped input:

```tsx
<InputGroup asChild>
  <label>
    <InputGroup.LeadingAdornment><SearchIcon aria-hidden="true" /></InputGroup.LeadingAdornment>
    <Input type="search" />
  </label>
</InputGroup>
```

## With react-hook-form

`InputGroup` doesn't get in the way — spread `register` onto the inner
`<Input>` as usual:

```tsx
import { useForm } from "react-hook-form";

const { register, formState: { errors } } = useForm();

<label htmlFor="email">Email</label>
<InputGroup>
  <InputGroup.LeadingAdornment><MailIcon aria-hidden="true" /></InputGroup.LeadingAdornment>
  <Input
    id="email"
    type="email"
    required
    {...register("email")}
    aria-invalid={!!errors.email}
    aria-describedby="email-error"
  />
</InputGroup>
{errors.email && <span id="email-error">{errors.email.message}</span>}
```

## Ref forwarding

Every part accepts a `ref` prop:

```tsx
const groupRef = useRef<HTMLDivElement>(null);
const inputRef = useRef<HTMLInputElement>(null);

<InputGroup ref={groupRef}>
  <Input ref={inputRef} aria-label="Search" />
</InputGroup>
```

## Coming next

- **Field** — the label / description / error-text coordinator that
  wraps an `InputGroup` (or any other control) and auto-wires `id`,
  `aria-describedby`, and the `invalid` cascade. Until it ships, do that
  wiring manually.
