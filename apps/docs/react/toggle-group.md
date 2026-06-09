---
title: ToggleGroup
---

# ToggleGroup

A headless, accessible compound component that manages a group of pressable
toggle buttons with roving-tabindex keyboard navigation.

```tsx
import { ToggleGroup } from "@primitiv-ui/react";

<ToggleGroup.Root type="single" defaultValue="left" aria-label="Alignment">
  <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
  <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
  <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
</ToggleGroup.Root>;
```

## Sub-components

| Export              | Element    | Notes                                                        |
| ------------------- | ---------- | ------------------------------------------------------------ |
| `ToggleGroup.Root`  | `<div>`    | `role="group"`, context provider, `asChild`                  |
| `ToggleGroup.Item`  | `<button>` | `aria-pressed`, `data-state`, roving tabindex, `asChild`     |

## Type modes

### `type="single"`

At most one item is pressed at a time. Pressing the active item again
**deselects** it — unlike a radio group, the value can return to `undefined`.

```tsx
// Uncontrolled
<ToggleGroup.Root type="single" defaultValue="center" aria-label="Alignment">
  …
</ToggleGroup.Root>

// Controlled — onValueChange receives string | undefined
const [align, setAlign] = useState<string | undefined>("center");
<ToggleGroup.Root type="single" value={align} onValueChange={setAlign} aria-label="Alignment">
  …
</ToggleGroup.Root>
```

### `type="multiple"`

Any number of items can be pressed simultaneously. Each item toggles
independently.

```tsx
// Uncontrolled
<ToggleGroup.Root type="multiple" defaultValue={["bold"]} aria-label="Formatting">
  …
</ToggleGroup.Root>

// Controlled — onValueChange receives string[]
const [formats, setFormats] = useState<string[]>([]);
<ToggleGroup.Root type="multiple" value={formats} onValueChange={setFormats} aria-label="Formatting">
  …
</ToggleGroup.Root>
```

## State modes

Both type modes support **uncontrolled** (`defaultValue`) and **controlled**
(`value` + `onValueChange`). The shapes are statically discriminated at the
type level; TypeScript rejects mixing them.

## Pressed state

| `pressed` | `aria-pressed` | `data-state` |
| --------- | -------------- | ------------ |
| `true`    | `"true"`       | `"on"`       |
| `false`   | `"false"`      | `"off"`      |

## Keyboard interaction

| Key             | Behaviour                                          |
| --------------- | -------------------------------------------------- |
| `ArrowRight` / `ArrowDown` | Focus next item (wraps)                 |
| `ArrowLeft` / `ArrowUp`    | Focus previous item (wraps)             |
| `Home`          | Focus first item                                   |
| `End`           | Focus last item                                    |
| `Space`         | Toggle the focused item                            |
| `Enter`         | Toggle the focused item                            |

Navigation is **decoupled from selection**: arrow keys move focus without
toggling. Only `Space` / `Enter` (or a click) toggle the focused item.
Only one item is in the document tab sequence at a time; `Tab` escapes
the group in a single keystroke.

## Reading direction

Pass `dir` (`"ltr"` / `"rtl"`) to set the arrow-key direction for horizontal
groups. When `dir` is omitted, it is inherited from the nearest
[`DirectionProvider`](../DirectionProvider/README.md), falling back to `"ltr"`
when there is no provider. An explicit `dir` prop always wins over the
inherited value.

## Disabled

Passing `disabled` on an `Item` forwards the native `disabled` attribute
(removing it from the tab order and suppressing clicks), sets
`data-disabled=""` for CSS targeting, and excludes it from arrow-key
navigation.

```tsx
<ToggleGroup.Item value="strikethrough" disabled>
  Strikethrough
</ToggleGroup.Item>
```

## `asChild` composition

Both `Root` and `Item` accept `asChild`. When set, the component delegates
rendering to its single child element and merges its own ARIA attributes,
data-state, composed event handlers, and ref onto the child.

## Styling hooks

```css
/* pressed item */
[data-state="on"] {
  background: oklch(65% 0.18 250);
  color: white;
}

/* group orientation */
[role="group"][data-orientation="horizontal"] {
  display: flex;
  flex-direction: row;
}

/* disabled */
[data-disabled] {
  opacity: 0.4;
  cursor: not-allowed;
}
```

## Workbench example

Open the interactive version in the [workbench](/workbench/#/toggle-group). Its source:

<<< ../../../apps/workbench/src/pages/ToggleGroupExample/ToggleGroupExample.tsx
