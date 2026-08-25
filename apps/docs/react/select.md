---
title: Select
---

# Select

Headless **Select** — a single-select compound with two render paths chosen
by the `native` prop:

- **Rich** (`native={false}`, the default) — a fully-styleable Popover-API
  listbox (`Select.Trigger` / `Select.Value` / `Select.Content` /
  `Select.Item` / `Select.ItemIndicator`). Items carry arbitrary content
  (icons, badges, indicators).
- **Native** (`native={true}`) — a thin wrapper over a real `<select>` /
  `<option>` / `<optgroup>` for flat, OS-native cases (mobile wheel pickers,
  maximum-compatibility forms).

Both modes share the same `value` / `onValueChange` / `disabled` / `name`
(form) API. Zero styles ship.

```tsx
import { Select } from "@primitiv-ui/react";

// Rich (default)
<Select.Root value={framework} onValueChange={setFramework}>
  <Select.Trigger>
    <Select.Value placeholder="Pick a framework..." />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="react">
      <ReactIcon />
      React
      <Select.ItemIndicator>✓</Select.ItemIndicator>
    </Select.Item>
    <Select.Item value="vue">
      <VueIcon />
      Vue
      <Select.ItemIndicator>✓</Select.ItemIndicator>
    </Select.Item>
  </Select.Content>
</Select.Root>;
```

## Sub-components

| Export                 | Rich element             | Native element | Notes                                          |
| ---------------------- | ------------------------ | -------------- | ---------------------------------------------- |
| `Select.Root`          | context boundary + hidden `<select>` | `<select>` | owns value + open state                        |
| `Select.Trigger`       | `<button>`               | —              | `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`; `asChild` |
| `Select.Value`         | `<span>`                 | —              | mirrors the selected item's content            |
| `Select.Content`       | `<div role="listbox">` (`popover="auto"`) | — | keyboard nav; `asChild`                        |
| `Select.Item`          | `<div role="option">`    | `<option>`     | `value` (required), `disabled`                 |
| `Select.ItemIndicator` | `<span>`                 | —              | selected-only; `forceMount`, `asChild`         |
| `Select.Group`         | `<div role="group">`     | `<optgroup>`   | `label` (required string)                      |
| `Select.Separator`     | `<div role="separator">` | —              | rich-only divider; skipped by keyboard nav; `asChild` |
| `Select.Placeholder`   | —                        | `<option value="" hidden disabled>` | native-only initial hint      |

## State

**Selection** — controlled (`value` + `onValueChange`) or uncontrolled
(`defaultValue`, or omit for none), discriminated at the type level so only
one shape is accepted. `onValueChange` receives the new value as a string.

**Open** (rich only) — controlled (`open` + `onOpenChange`) or uncontrolled
(`defaultOpen`). The trigger toggles it; selection, Escape, and light-dismiss
close it.

## Rich mode

### Value mirroring

`Select.Value` **automatically mirrors the selected `Select.Item`'s
children** into the trigger — write the icon + label once, on the item, and
it shows up in the closed trigger. `Select.ItemIndicator` is **excluded** from
the mirror (the checkmark answers "which row is selected" — redundant on the
trigger it already represents). `placeholder` shows when nothing is selected.

The exclusion works **through your own wrappers**: the mirror doesn't test the
element's type (a wrapper component would be opaque to that, and a styled layer
always wraps), it publishes its intent through context and each indicator opts
itself out — at any nesting depth, `forceMount` included. Every other child
carries through untouched, so a trailing badge on the selected item shows up in
the trigger too; style it there if it needs different spacing from the row.

### Item indicator

`Select.ItemIndicator`, nested in a `Select.Item`, renders **only when that
item is selected** and exposes `data-state="checked" | "unchecked"`. Pass
`forceMount` to keep it in the DOM (as `unchecked`) for CSS enter/exit
animation.

### Keyboard

While the listbox is open:

| Key                     | Behaviour                                          |
| ----------------------- | -------------------------------------------------- |
| `ArrowDown` / `ArrowUp` | Move focus to next / previous option (wraps)       |
| `Home` / `End`          | First / last option                                |
| `Enter` / `Space`       | Select the focused option and close                |
| `Escape`                | Close and return focus to the trigger              |
| printable character     | Typeahead — focus the next option matching prefix  |

Disabled options are skipped by arrows and typeahead. On open, focus moves to
the selected option (or the first enabled one).

### Popup placement

`Select.Content` uses the native Popover API (`popover="auto"`) for the top
layer and light-dismiss — no Portal, no positioning JS. Consumers place the
popup themselves via CSS (the component ships no anchor positioning).

## Native mode

Pass `native` to render a real `<select>`. `Select.Item` becomes an
`<option>` — keeping **only its string/number children** as the option text
and **dropping element children** (icons, indicators don't render). An
icon-only item with no text renders an empty, unlabelled `<option>`.

```tsx
<Select.Root native defaultValue="apple" aria-label="Pick a fruit">
  <Select.Placeholder>Choose a fruit...</Select.Placeholder>
  <Select.Group label="Fruits">
    <Select.Item value="apple">Apple</Select.Item>
    <Select.Item value="banana">Banana</Select.Item>
  </Select.Group>
</Select.Root>
```

`Select.Placeholder` (native-only) renders `<option value="" disabled hidden>`.
When present with no `value`/`defaultValue`, Root infers `defaultValue=""` so
the placeholder is the initial selection; pair with `required` for native form
validation. `Select.Group` renders `<optgroup label>`.

## Forms

Pass `name` and place the Select in a `<form>`. In native mode the `<select>`
submits directly; in rich mode Root renders a visually-hidden native
`<select name>` that carries the value, so submission works identically. Pair
with `required` for browser validation.

## Field integration

Inside a [`<Field.Root>`](../Field/README.md), `Select.Root` reads
`FieldContext` and inherits `id`, `aria-describedby`, `aria-invalid`,
`disabled`, and `required` (consumer props win). In native mode these apply to
the `<select>`; in rich mode `disabled` / `required` / `name` flow to the
hidden form `<select>`.

## `asChild`

- `Select.Root` (native mode) — delegate to a styled `<select>` wrapper.
- `Select.Trigger` / `Select.Content` / `Select.ItemIndicator` (rich mode) —
  compose the merged props onto a consumer element.

## Styling hooks

| Attribute       | Values                          | Set on                 |
| --------------- | ------------------------------- | ---------------------- |
| `aria-expanded` | `"true"` / `"false"`            | `Select.Trigger`       |
| `aria-selected` | `"true"` / `"false"`            | rich `Select.Item`     |
| `data-state`    | `"checked"` / `"unchecked"`     | rich `Select.Item`, `Select.ItemIndicator` |
| `data-disabled` | `""` (present when disabled)    | rich `Select.Item`, native `Select.Root` |
| `data-placeholder` | `""` (present while nothing is selected) | `Select.Value` |

`data-placeholder` is what a styled layer keys the muted placeholder colour
off — it disappears the moment an item's content is mirrored into the trigger.

## Future work

A Combobox with filtering is planned — see
[Future work](../../../../docs/select-future-work.md).

## Workbench example

Open the interactive version in the [workbench](/workbench/#/select). Its source:

<<< ../../../apps/workbench/src/pages/SelectExample/SelectExample.tsx
