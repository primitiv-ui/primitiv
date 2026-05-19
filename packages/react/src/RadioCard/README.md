# RadioCard

Headless, accessible **RadioCard** — a card/tile-shaped radio group variant
implementing the
[WAI-ARIA Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).
The entire card surface is the interactive element. Zero styles ship.

```tsx
import { RadioCard } from "@primitiv/react";

<RadioCard.Root defaultValue="pro" aria-label="Plan">
  <RadioCard.Item value="starter">
    <RadioCard.Indicator />
    <h3>Starter</h3>
    <p>Free forever</p>
  </RadioCard.Item>
  <RadioCard.Item value="pro">
    <RadioCard.Indicator />
    <h3>Pro</h3>
    <p>$9/month</p>
  </RadioCard.Item>
</RadioCard.Root>
```

## Sub-components

| Export | Element | ARIA / data hooks | `asChild` |
|--------|---------|------------------|-----------|
| `RadioCard.Root` | `<div>` | `role="radiogroup"` | yes |
| `RadioCard.Item` | `<button>` | `role="radio"`, `aria-checked`, `data-state`, `tabIndex` | yes |
| `RadioCard.Indicator` | `<span>` | `aria-hidden="true"`, `data-state` | yes |

## State modes

### Uncontrolled

Pass `defaultValue` (or omit for nothing selected on mount). The component owns
the value internally.

```tsx
<RadioCard.Root defaultValue="pro" aria-label="Plan">
  <RadioCard.Item value="starter">Starter</RadioCard.Item>
  <RadioCard.Item value="pro">Pro</RadioCard.Item>
</RadioCard.Root>
```

### Controlled

Pass `value` and `onValueChange` together. The parent owns the value.

```tsx
const [plan, setPlan] = useState("pro");

<RadioCard.Root value={plan} onValueChange={setPlan} aria-label="Plan">
  <RadioCard.Item value="starter">Starter</RadioCard.Item>
  <RadioCard.Item value="pro">Pro</RadioCard.Item>
</RadioCard.Root>
```

## Keyboard interaction

| Key | Behaviour |
|-----|-----------|
| `ArrowDown` / `ArrowRight` | Select and focus the next enabled Item, wrapping at the end |
| `ArrowUp` / `ArrowLeft` | Select and focus the previous enabled Item, wrapping at the start |
| `Space` / `Enter` | Select the focused Item (native `<button>` behaviour) |
| `Tab` | Move focus out of the group (only one Item is in the tab sequence at a time) |

## Orientation

By default (`orientation="both"`) all four arrow keys navigate the group.
Pass `orientation` to restrict navigation to a single axis:

- `orientation="horizontal"` — only `ArrowLeft` / `ArrowRight` navigate.
- `orientation="vertical"` — only `ArrowUp` / `ArrowDown` navigate.

A `horizontal` or `vertical` group also reflects the axis to assistive
technology via `aria-orientation` on the `radiogroup` element.

## Disabled items

Pass `disabled` on any `RadioCard.Item`. The native attribute suppresses clicks,
removes the item from the focus ring, and excludes it from arrow-key navigation
and the roving-tabindex home base.

```tsx
<RadioCard.Root aria-label="Plan">
  <RadioCard.Item value="starter" disabled>Starter</RadioCard.Item>
  <RadioCard.Item value="pro">Pro</RadioCard.Item>
</RadioCard.Root>
```

## `asChild` composition

All three sub-components accept `asChild`. The library's ARIA attributes,
`data-state`, event handlers, and ref are merged onto the consumer's element;
the default element is dropped.

```tsx
<RadioCard.Root asChild aria-label="Plan">
  <ul>
    <RadioCard.Item value="pro" asChild>
      <li>Pro</li>
    </RadioCard.Item>
  </ul>
</RadioCard.Root>
```

## Indicator animation hooks

`RadioCard.Indicator` mounts only while its Item is selected. Pass `forceMount`
to keep it in the DOM — `data-state="unchecked"` lets a CSS exit animation play.

```tsx
<RadioCard.Indicator forceMount>
  <svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" /></svg>
</RadioCard.Indicator>
```

## Styling hooks

| Attribute | Values | Set on |
|-----------|--------|--------|
| `data-state` | `"checked"` \| `"unchecked"` | `RadioCard.Item`, `RadioCard.Indicator` |
