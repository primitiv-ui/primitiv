---
title: Switch
---

# Switch

Headless, accessible **Switch** — a compound component implementing the
[WAI-ARIA Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)
on a native `<button role="switch">`. Semantically represents an immediate
on/off action (as opposed to a selection choice). Zero styles ship.

```tsx
import { Switch } from "@primitiv-ui/react";

<Switch.Root defaultChecked aria-label="Enable notifications">
  <Switch.Thumb />
</Switch.Root>
```

## Sub-components

| Export | Element | ARIA / data hooks | `asChild` |
|--------|---------|------------------|-----------|
| `Switch.Root` | `<button>` | `role="switch"`, `aria-checked`, `data-state`, `data-disabled` | yes |
| `Switch.Thumb` | `<span>` | `aria-hidden="true"`, `data-state` | yes |

## State modes

### Uncontrolled

Pass `defaultChecked` (or omit for unchecked on mount). The component owns
the value internally.

```tsx
<Switch.Root defaultChecked aria-label="Enable dark mode">
  <Switch.Thumb />
</Switch.Root>
```

### Controlled

Pass `checked` and `onCheckedChange` together. The parent owns the value.

```tsx
const [enabled, setEnabled] = useState(false);

<Switch.Root checked={enabled} onCheckedChange={setEnabled} aria-label="…">
  <Switch.Thumb />
</Switch.Root>
```

## Keyboard interaction

| Key | Behaviour |
|-----|-----------|
| `Space` | Toggle the switch (native `<button>` behaviour) |
| `Enter` | Toggle the switch (native `<button>` behaviour) |
| `Tab` | Move focus to or from the switch |

## Disabled

Pass `disabled` on the Root. The native attribute suppresses clicks and removes
the switch from the focus ring. `data-disabled=""` is set for CSS targeting.

```tsx
<Switch.Root aria-label="Enable feature" disabled>
  <Switch.Thumb />
</Switch.Root>
```

## The Thumb

`Switch.Thumb` is **always mounted** — unlike `Checkbox.Indicator`, it never
conditionally unmounts. Its visual position (left for off, right for on) is
driven entirely by CSS targeting `data-state`. This gives consumers a real DOM
node to animate with `transition` or Web Animations, rather than being
constrained to pseudo-elements.

```scss
.switch-root {
  position: relative;
  width: 2.75rem;
  height: 1.5rem;
  border-radius: 9999px;
  background: #d1d5db;
  transition: background 120ms ease;

  &[data-state="checked"] {
    background: #6366f1;
  }
}

.switch-thumb {
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: white;
  transition: translate 120ms ease;

  &[data-state="checked"] {
    translate: 1.25rem 0;
  }
}
```

## `asChild` composition

Both sub-components accept `asChild`. The library's ARIA attributes,
`data-state`, event handlers, and ref are merged onto the consumer's element.

```tsx
<Switch.Root asChild aria-label="Enable notifications">
  <div role="switch">…</div>
</Switch.Root>
```

## Styling hooks

| Attribute | Values | Set on |
|-----------|--------|--------|
| `data-state` | `"checked"` \| `"unchecked"` | `Switch.Root`, `Switch.Thumb` |
| `data-disabled` | `""` (present when disabled) | `Switch.Root` |

## Workbench example

Open the interactive version in the [workbench](/workbench/#/switch). Its source:

<<< ../../../apps/workbench/src/pages/SwitchExample/SwitchExample.tsx
