---
title: Button
---

# Button

A headless, accessible `<button>` element. Zero styles ship — apply whatever
design system you use.

```tsx
import { Button } from "@primitiv-ui/react";

<Button onClick={handleSave}>Save</Button>
```

## Props

| Prop       | Type                                   | Default    | Notes                                                            |
| ---------- | -------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `type`     | `"button"` \| `"submit"` \| `"reset"` | `"button"` | Override to `"submit"` inside forms                              |
| `disabled` | `boolean`                              | —          | Native `disabled` + `data-disabled=""` styling hook             |
| `asChild`  | `boolean`                              | `false`    | Delegate rendering to the child element via Slot                 |
| `ref`      | `Ref<HTMLButtonElement>`               | —          | Forwarded to the underlying button element                       |
| `children` | `ReactNode`                            | —          | Text, icons, or any React nodes                                  |
| `...rest`  | `ComponentProps<"button">`             | —          | All other `<button>` props (`aria-*`, `data-*`, event handlers) |

## Default type

`type="button"` is the default to prevent accidental form submission when a
`<Button>` is nested inside a `<form>`. Override explicitly when you need
form semantics:

```tsx
<form onSubmit={handleSubmit}>
  <Button type="submit">Send</Button>
  <Button type="reset">Clear</Button>
</form>
```

## Disabled

Passing `disabled` forwards the native `disabled` attribute (removing the
button from the tab order and suppressing clicks) **and** sets
`data-disabled=""` so CSS can target `[data-disabled]` without relying on
the `:disabled` pseudo-class:

```tsx
<Button disabled>Save</Button>
```

```css
button[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Icon-only buttons

For buttons with no visible text, supply `aria-label` or `aria-labelledby`
so screen readers can announce the button's purpose. Mark decorative icons
`aria-hidden="true"`:

```tsx
<Button aria-label="Close dialog">
  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
</Button>
```

## Text + icon

When combining text and an icon, mark the icon as decorative so it is not
included in the accessible name:

```tsx
<Button>
  <StarIcon aria-hidden="true" />
  Favourite
</Button>
```

## `asChild` composition

Pass `asChild` to render any consumer-supplied element instead of `<button>`.
All props (`aria-*`, `data-*`, event handlers, `ref`) are merged onto the
child via the `Slot` utility — event handlers compose (child runs first),
`style` is shallow-merged, `className` is concatenated.

`type="button"` is **not** forwarded when `asChild` is set — the child
element owns its own type semantics.

```tsx
// Render a router link styled as a button
<Button asChild>
  <a href="/dashboard">Dashboard</a>
</Button>
```

## Ref forwarding

```tsx
const ref = useRef<HTMLButtonElement>(null);
<Button ref={ref}>Save</Button>
```

## Keyboard interaction

Keyboard activation is handled natively by the underlying `<button>` element.

| Key     | Behaviour                 |
| ------- | ------------------------- |
| `Space` | Activates the button      |
| `Enter` | Activates the button      |
| `Tab`   | Moves focus to the button |

## Workbench example

Open the interactive version in the [workbench](/workbench/#/button). Its source:

<<< ../../../apps/workbench/src/pages/ButtonExample/ButtonExample.tsx
