# Textarea

A headless, accessible multi-line text input. Zero styles ship — apply
whatever design system you use.

```tsx
import { Textarea } from "@primitiv/react";

<label htmlFor="bio">Bio</label>
<Textarea id="bio" rows={4} placeholder="Tell us about yourself" />
```

## Props

| Prop       | Type                         | Default | Notes                                                            |
| ---------- | ---------------------------- | ------- | ---------------------------------------------------------------- |
| `disabled` | `boolean`                    | —       | Native `disabled` + `data-disabled=""` styling hook              |
| `asChild`  | `boolean`                    | `false` | Delegate rendering to the child element via Slot                 |
| `ref`      | `Ref<HTMLTextAreaElement>`   | —       | Forwarded to the underlying textarea element                     |
| `...rest`  | `ComponentProps<"textarea">` | —       | All other `<textarea>` props (`value`, `rows`, `aria-*`, etc.)   |

## Labelling

A `<textarea>` has no implicit accessible name. Give it one of:

- a `<label>` whose `htmlFor` matches the textarea's `id`,
- an `aria-label`, or
- an `aria-labelledby` pointing at visible label text.

```tsx
<label htmlFor="notes">Notes</label>
<Textarea id="notes" />
```

## Disabled

Passing `disabled` forwards the native `disabled` attribute (removing the
field from the tab order and blocking input) **and** sets
`data-disabled=""` so CSS can target `[data-disabled]` without relying on
the `:disabled` pseudo-class:

```tsx
<Textarea aria-label="Bio" disabled />
```

```css
textarea[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## `asChild` composition

Pass `asChild` to render any consumer-supplied element instead of
`<textarea>`. All props (`aria-*`, `data-*`, event handlers, `ref`) are
merged onto the child via the `Slot` utility — event handlers compose
(child runs first), `style` is shallow-merged, `className` is concatenated.

This is the escape hatch for wrapping a third-party autosizing textarea
while keeping the same prop contract:

```tsx
<Textarea asChild aria-label="Bio">
  <AutosizeTextarea />
</Textarea>
```

## Ref forwarding

```tsx
const ref = useRef<HTMLTextAreaElement>(null);
<Textarea ref={ref} aria-label="Bio" />
```
