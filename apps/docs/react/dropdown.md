---
title: Dropdown
---

# Dropdown

A compound component implementing the
[WAI-ARIA Menu Button / Menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
on top of the native HTML
[Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API).
No portal, no floating-ui — the browser handles layering and light-dismiss.

```tsx
import { Dropdown } from "@primitiv-ui/react";

<Dropdown.Root>
  <Dropdown.Trigger>Options</Dropdown.Trigger>
  <Dropdown.Content>
    <Dropdown.Item onSelect={() => rename()}>Rename</Dropdown.Item>
    <Dropdown.Item onSelect={() => duplicate()}>Duplicate</Dropdown.Item>
    <Dropdown.Separator />
    <Dropdown.Item disabled>Archive</Dropdown.Item>
  </Dropdown.Content>
</Dropdown.Root>;
```

## Sub-components

| Export                   | Role                 | Notes                                                                                |
| ------------------------ | -------------------- | ------------------------------------------------------------------------------------ |
| `Dropdown.Root`          | State owner          | Uncontrolled (`defaultOpen`) or controlled (`open` + `onOpenChange`)                 |
| `Dropdown.Trigger`       | `aria-haspopup=menu` | Toggles the menu; supports `asChild`                                                 |
| `Dropdown.Content`       | `menu`               | Native `popover="auto"`; handles arrow keys, typeahead, Escape                       |
| `Dropdown.Item`          | `menuitem`           | Activatable row with `onSelect` escape hatch                                         |
| `Dropdown.CheckboxItem`  | `menuitemcheckbox`   | Tri-state toggle (`true` / `false` / `"indeterminate"`)                              |
| `Dropdown.RadioGroup`    | `group`              | Single-selection container for `RadioItem`s                                          |
| `Dropdown.RadioItem`     | `menuitemradio`      | Must live inside a `RadioGroup`                                                      |
| `Dropdown.ItemIndicator` | —                    | Icon slot inside a `CheckboxItem` / `RadioItem`; exposes `data-state` + `forceMount` |
| `Dropdown.Label`         | —                    | Non-interactive label; auto-wired to the enclosing `Group` via `aria-labelledby`     |
| `Dropdown.Group`         | `group`              | Semantic grouping for related items                                                  |
| `Dropdown.Separator`     | `separator`          | Visual divider; skipped by focus and typeahead                                       |
| `Dropdown.Sub`           | State owner          | Submenu boundary; same state modes as `Root`                                         |
| `Dropdown.SubTrigger`    | `menuitem`           | Opens the submenu on click or the inline-forward arrow (`ArrowRight` LTR / `ArrowLeft` RTL) |
| `Dropdown.SubContent`    | `menu`               | Submenu panel; the inline-backward arrow (`ArrowLeft` LTR / `ArrowRight` RTL) closes it and returns focus to the trigger |

All sub-components that render an element accept `asChild` to compose
their ARIA and behaviour onto a caller-supplied child.

## Keyboard interaction

| Key                     | Behaviour                                         |
| ----------------------- | ------------------------------------------------- |
| `ArrowDown` / `ArrowUp` | Move focus to next / previous item (wraps)        |
| `Home` / `End`          | Jump to first / last enabled item                 |
| `Enter` / `Space`       | Activate the focused item                         |
| `Escape`                | Close the menu and return focus to the trigger    |
| any printable character | Typeahead — focuses the next item matching prefix |
| `ArrowRight`            | Open a focused submenu (`SubTrigger`, LTR) / close the submenu (inside `SubContent`, RTL) |
| `ArrowLeft`             | Close the current submenu (inside `SubContent`, LTR) / open a focused submenu (`SubTrigger`, RTL) |

Typeahead accumulates keystrokes within a 500 ms window; pressing the
same character repeatedly cycles through items sharing that first letter.
Disabled items are skipped by arrow navigation, typeahead, and activation.

## Reading direction

Pass `dir="ltr"` or `dir="rtl"` on `Dropdown.Root` to invert the submenu
open / close arrow keys. When omitted, the component reads the inherited
`DirectionProvider` value, falling back to `"ltr"`:

```tsx
<DirectionProvider dir="rtl">
  <Dropdown.Root>{/* submenus now open on ArrowLeft */}</Dropdown.Root>
</DirectionProvider>
```

An explicit `dir` prop on `Dropdown.Root` always wins over the inherited
value. The reading direction only affects keyboard handling — submenu
visual placement is the consumer's CSS concern (use logical properties
or `position-try-fallbacks` with `flip-inline`).

## State modes

- **Uncontrolled** — pass `defaultOpen` (or omit to start closed). Optional
  `onOpenChange` observes user-driven transitions.
- **Controlled** — pass `open` and `onOpenChange` together.

`Dropdown.Sub` follows the same contract for its own open state.

`Dropdown.CheckboxItem` and `Dropdown.RadioGroup` each expose the same
uncontrolled / controlled split for their `checked` / `value` state.

## The `onSelect` escape hatch

Every activatable item (`Item`, `CheckboxItem`, `RadioItem`) fires
`onSelect` with a cancellable `Event` on activation. By default the menu
auto-closes; call `event.preventDefault()` to keep it open — useful for
rapidly toggling multiple checkboxes, or running an action whose outcome
is shown inline in the menu.

```tsx
<Dropdown.CheckboxItem
  onSelect={(event) => event.preventDefault()}
  onCheckedChange={setGridVisible}
>
  Show grid
</Dropdown.CheckboxItem>
```

## Disabled items

Disabled items receive `aria-disabled="true"` rather than the native
`disabled` attribute, so they remain visible to assistive technology but
no-op on activation. Arrow navigation and typeahead skip them.

```tsx
<Dropdown.Item disabled>Archive (coming soon)</Dropdown.Item>
```

A disabled `SubTrigger` refuses to open on both click and the
inline-forward arrow key.

## Checkbox and radio items

```tsx
<Dropdown.Content>
  <Dropdown.Label>View</Dropdown.Label>
  <Dropdown.CheckboxItem defaultChecked>Show grid</Dropdown.CheckboxItem>
  <Dropdown.CheckboxItem>Show ruler</Dropdown.CheckboxItem>
  <Dropdown.Separator />
  <Dropdown.RadioGroup defaultValue="system">
    <Dropdown.RadioItem value="light">Light</Dropdown.RadioItem>
    <Dropdown.RadioItem value="dark">Dark</Dropdown.RadioItem>
    <Dropdown.RadioItem value="system">Match system</Dropdown.RadioItem>
  </Dropdown.RadioGroup>
</Dropdown.Content>
```

`CheckboxItem` supports a tri-state: `true`, `false`, or `"indeterminate"`
(which renders as `aria-checked="mixed"`). An indeterminate item resolves
to `true` on the next activation, matching the native
`<input type="checkbox">` contract.

### `ItemIndicator`

Render the visible mark (usually a checkmark or a bullet) inside the
item via `Dropdown.ItemIndicator`. It defaults to a `<span>`, supports
`asChild` so consumers can compose onto an SVG icon, and exposes
`data-state` for styling:

```tsx
<Dropdown.CheckboxItem
  checked={showBookmarks}
  onCheckedChange={setShowBookmarks}
>
  <Dropdown.ItemIndicator>
    <CheckIcon />
  </Dropdown.ItemIndicator>
  Show bookmarks
</Dropdown.CheckboxItem>
```

| `data-state`      | When                                                                                |
| ----------------- | ----------------------------------------------------------------------------------- |
| `"checked"`       | Parent `CheckboxItem` is `true`, or parent `RadioItem` is the group's current value |
| `"unchecked"`     | Parent is `false` (only reachable when `forceMount` is set — see below)             |
| `"indeterminate"` | Parent `CheckboxItem` is `"indeterminate"`                                          |

By default the indicator **unmounts** when its parent is unchecked. Pass
`forceMount` to keep the DOM node in both states so CSS transitions or a
React animation library can drive the visual state off `data-state`:

```tsx
<Dropdown.ItemIndicator forceMount>
  <CheckIcon className="indicator" /> {/* fade in/out via data-state */}
</Dropdown.ItemIndicator>
```

Rendering `Dropdown.ItemIndicator` outside a `CheckboxItem` or `RadioItem`
throws a descriptive error.

## Submenus

```tsx
<Dropdown.Content>
  <Dropdown.Item>New</Dropdown.Item>
  <Dropdown.Sub>
    <Dropdown.SubTrigger>Open Recent</Dropdown.SubTrigger>
    <Dropdown.SubContent>
      <Dropdown.Item>Project A</Dropdown.Item>
      <Dropdown.Item>Project B</Dropdown.Item>
    </Dropdown.SubContent>
  </Dropdown.Sub>
</Dropdown.Content>
```

Open a submenu with the inline-forward arrow key (`ArrowRight` in LTR,
`ArrowLeft` in RTL) or a click on the trigger; close it with the
inline-backward arrow or by selecting an item. Focus returns to the
`SubTrigger` when the submenu closes.

Hovering the `SubTrigger` opens the submenu automatically; hovering onto
a sibling item in the parent menu closes it, mirroring the keyboard
contract in which focus returning to the parent menu dismisses the sub.

Arrow-key navigation is scoped to the popover that currently holds
focus. Items inside a `SubContent` aren't pulled into the parent's
navigation cycle, so `ArrowDown` from a `SubTrigger` lands on the next
sibling item in the parent menu — not on the first item inside a closed
submenu, which is unfocusable. While focus lives inside an open
`SubContent`, `ArrowDown` and `ArrowUp` wrap within that sub's items.

## Groups and labels

```tsx
<Dropdown.Content>
  <Dropdown.Group>
    <Dropdown.Label>File</Dropdown.Label>
    <Dropdown.Item>New</Dropdown.Item>
    <Dropdown.Item>Open…</Dropdown.Item>
  </Dropdown.Group>
  <Dropdown.Separator />
  <Dropdown.Group>
    <Dropdown.Label>Edit</Dropdown.Label>
    <Dropdown.Item>Undo</Dropdown.Item>
  </Dropdown.Group>
</Dropdown.Content>
```

Nesting a `Dropdown.Label` inside a `Dropdown.Group` wires the group's
`aria-labelledby` to the label automatically — no manual `id` threading
is needed.

## `asChild` composition

Every rendering sub-component accepts `asChild` to compose its
ARIA attributes, event handlers, and ref onto a caller-supplied child.
All ARIA attributes and handlers merge onto the child following the
[Slot](../Slot.tsx) composition rules (child handler runs first, then
the component's):

```tsx
<Dropdown.Trigger asChild>
  <MyStyledButton>Options</MyStyledButton>
</Dropdown.Trigger>

<Dropdown.Item asChild>
  <a href="/rename">Rename</a>
</Dropdown.Item>
```

## Styling hooks

```css
/* Open state on the menu panel */
[role="menu"][data-popover-open] {
  animation: fade-in 120ms ease-out;
}

/* Highlighted item — pointer focus */
[role="menuitem"][data-highlighted],
[role="menuitemcheckbox"][data-highlighted],
[role="menuitemradio"][data-highlighted] {
  background: rgba(0 0 0 / 0.06);
  outline: none;
}

/* Disabled items */
[aria-disabled="true"] {
  opacity: 0.5;
  pointer-events: none;
}

/* Checked state for checkbox / radio items */
[role="menuitemcheckbox"][aria-checked="true"]::before,
[role="menuitemradio"][aria-checked="true"]::before {
  content: "✓";
}
```

The native popover API adds `data-popover-open` on the element while the
popover is showing; combine it with the standard ARIA attributes for
state-driven styling.

`data-highlighted` is present on `Item`, `CheckboxItem`, `RadioItem`, and
`SubTrigger` while the item has pointer focus (mouseenter). On `SubTrigger`
it also remains present for the duration its sub-menu is open, so the
active path stays highlighted as the user navigates nested levels.

## Workbench example

Open the interactive version in the [workbench](/workbench/#/dropdown). Its source:

<<< ../../../apps/workbench/src/pages/DropdownExample/DropdownExample.tsx
