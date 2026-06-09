---
title: CheckboxCard
---

# CheckboxCard

Headless, accessible **CheckboxCard** — a card/tile-shaped checkbox implementing
the
[WAI-ARIA Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
including the tri-state ("mixed") variant. The entire card surface is the
interactive element. Zero styles ship.

```tsx
import { CheckboxCard } from "@primitiv-ui/react";

<CheckboxCard.Root aria-label="Enable dark mode">
  <CheckboxCard.Indicator>
    <CheckIcon />
  </CheckboxCard.Indicator>
  <h3>Dark mode</h3>
  <p>Switch the interface to a dark colour scheme.</p>
</CheckboxCard.Root>
```

## Sub-components

| Export | Element | ARIA / data hooks | `asChild` |
|--------|---------|------------------|-----------|
| `CheckboxCard.Root` | `<button>` | `role="checkbox"`, `aria-checked`, `data-state`, `data-disabled` | yes |
| `CheckboxCard.Indicator` | `<span>` | `aria-hidden="true"`, `data-state` | yes |

## State modes

### Uncontrolled

Pass `defaultChecked` (or omit for unchecked on mount). The component owns
the value internally.

```tsx
<CheckboxCard.Root defaultChecked aria-label="Enable dark mode">
  <CheckboxCard.Indicator />
  Dark mode
</CheckboxCard.Root>
```

### Controlled

Pass `checked` and `onCheckedChange` together. The parent owns the value.

```tsx
const [enabled, setEnabled] = useState<CheckedState>(false);

<CheckboxCard.Root checked={enabled} onCheckedChange={setEnabled} aria-label="…">
  <CheckboxCard.Indicator />
  Dark mode
</CheckboxCard.Root>
```

## Tri-state (indeterminate)

Both `checked` and `defaultChecked` accept `boolean | "indeterminate"`.
`aria-checked="mixed"` and `data-state="indeterminate"` are set automatically.
Clicking an indeterminate card resolves it to `true` per the WAI-ARIA tri-state
convention, then flips boolean on subsequent clicks.

```tsx
<CheckboxCard.Root defaultChecked="indeterminate" aria-label="Select all">
  <CheckboxCard.Indicator />
  Select all items
</CheckboxCard.Root>
```

## Keyboard interaction

Clicking or pressing `Space` / `Enter` on the focused card toggles its state
(native `<button>` behaviour).

## Disabled

Pass `disabled` on the Root. The native attribute suppresses clicks, removes
the card from the focus ring, and `data-disabled=""` is set for CSS targeting.

```tsx
<CheckboxCard.Root aria-label="Premium feature" disabled>
  <CheckboxCard.Indicator />
  Premium feature
</CheckboxCard.Root>
```

## `asChild` composition

Both sub-components accept `asChild`. The library's ARIA attributes,
`data-state`, event handlers, and ref are merged onto the consumer's element.

```tsx
<CheckboxCard.Root asChild aria-label="Enable feature">
  <li>Feature name</li>
</CheckboxCard.Root>
```

## Indicator animation hooks

`CheckboxCard.Indicator` mounts only while the card is checked or indeterminate.
Pass `forceMount` to keep it in the DOM — `data-state="unchecked"` lets a CSS
exit animation play.

```tsx
<CheckboxCard.Indicator forceMount>
  <CheckIcon />
</CheckboxCard.Indicator>
```

## Styling hooks

| Attribute | Values | Set on |
|-----------|--------|--------|
| `data-state` | `"checked"` \| `"unchecked"` \| `"indeterminate"` | `CheckboxCard.Root`, `CheckboxCard.Indicator` |
| `data-disabled` | `""` (present when disabled) | `CheckboxCard.Root` |

## Workbench example

Open the interactive version in the [workbench](/workbench/#/checkbox-card). Its source:

<<< ../../../apps/workbench/src/pages/CheckboxCardExample/CheckboxCardExample.tsx
