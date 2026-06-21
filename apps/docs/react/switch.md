---
title: Switch
---

# Switch

Headless, accessible **Switch** — a compound component built on a **real,
visually-hidden native `<input type="checkbox" role="switch">`**. Semantically
represents an immediate on/off action (as opposed to a selection choice), and —
being a genuine native input — participates in forms. Zero styles ship.

```tsx
import { Switch } from "@primitiv-ui/react";

<Switch.Root name="notify" value="on" defaultChecked aria-label="Enable notifications">
  <Switch.Thumb />
</Switch.Root>
```

## Sub-components

| Export | Element | ARIA / data hooks | `asChild` |
|--------|---------|------------------|-----------|
| `Switch.Root` | `<label>` + hidden `<input>` | input is `role="switch"`; `data-state`, `data-disabled` on the label | — |
| `Switch.Thumb` | `<span>` | `aria-hidden="true"`, `data-state` | yes |

`Switch.Root`'s `className` / `style` style the **track** (the `<label>` you
see). Every other prop spreads onto the hidden `<input>`, because semantically
the Root *is* the switch: pass `name`, `value`, `id`, `required`, `aria-*`,
`ref`, etc. straight to `Switch.Root`.

## State modes

### Uncontrolled

Pass `defaultChecked` (or omit for off on mount). The **browser** owns the
value, so the switch participates in forms and resets.

```tsx
<Switch.Root name="dark" value="on" defaultChecked aria-label="Enable dark mode">
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

> **`data-state` is a best-effort mirror.** Drive the *visual* on/off look off
> the input's native `:checked` (and `:has(> input:checked)` on the track), as
> the shipped registry stylesheet does — it stays correct through a form reset,
> which fires no React event.

## Keyboard interaction

| Key | Behaviour |
|-----|-----------|
| `Space` | Toggle the switch (native checkbox behaviour) |
| `Tab` | Move focus to or from the switch |

`Enter` does **not** toggle — a checkbox-based control responds to `Space` only.

## Disabled

Pass `disabled` on the Root. The native attribute suppresses clicks and removes
the switch from the focus ring. `data-disabled=""` is set on the track for CSS.

```tsx
<Switch.Root aria-label="Enable feature" disabled>
  <Switch.Thumb />
</Switch.Root>
```

## Size

The styled surface installed by `primitiv add switch` exposes a `size` prop.
The default is `md` (`xs` · `sm` · `md` · `lg` · `xl`).

```tsx
<Switch size="sm" aria-label="Enable notifications" />
```

## The Thumb

`Switch.Thumb` is **always mounted**. Its visual position (off → on) should be
driven by CSS keyed off the input's native `:checked` (a sibling selector), so
it stays correct through a form reset. It gives consumers a real DOM node to
animate with `transition` or Web Animations.

```css
.switch {
  position: relative;
}
.switch:has(> input:checked) {
  background: #6366f1;
}
.switch__thumb {
  transition: translate 120ms ease;
}
.switch > input:checked ~ .switch__thumb {
  translate: 1.25rem 0;
}
```

## `asChild` composition

`Switch.Thumb` accepts `asChild`: the library's `aria-hidden`, `data-state`, and
ref are merged onto the consumer's element.

```tsx
<Switch.Thumb asChild>
  <span className="my-thumb" />
</Switch.Thumb>
```

## Styling hooks

| Attribute | Values | Set on |
|-----------|--------|--------|
| `data-state` | `"checked"` \| `"unchecked"` | `Switch.Root` (track), `Switch.Thumb` |
| `data-disabled` | `""` (present when disabled) | `Switch.Root` (track) |
| `:checked` / `:focus-visible` / `:disabled` | native | the hidden `<input>` |

## Workbench example

Open the interactive version in the [workbench](/workbench/#/switch). Its source:

<<< ../../../apps/workbench/src/pages/SwitchExample/SwitchExample.tsx
