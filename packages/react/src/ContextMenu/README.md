# ContextMenu

A compound component implementing the
[WAI-ARIA Menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/)
for right-click / long-press / context-key menus, layered on top of the
native HTML
[Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API).
No portal, no floating-ui — the browser handles layering via the top
layer, and the component handles close on outside click / Escape.

```tsx
import { ContextMenu } from "@primitiv-ui/react";

<ContextMenu.Root>
  <ContextMenu.Trigger>
    <div className="canvas">Right-click anywhere on this canvas</div>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item onSelect={() => paste()}>Paste</ContextMenu.Item>
    <ContextMenu.Item onSelect={() => duplicate()}>Duplicate</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item disabled>Archive</ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>;
```

## Sub-components

| Export                      | Role                 | Notes                                                                                |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `ContextMenu.Root`          | State owner          | Uncontrolled (`defaultOpen`) or controlled (`open` + `onOpenChange`)                 |
| `ContextMenu.Trigger`       | Right-click target   | Renders `<span>`; intercepts `contextmenu`, suppresses the native menu               |
| `ContextMenu.Content`       | `menu`               | Native `popover="manual"`, positioned at the cursor; arrow keys, typeahead, Escape   |
| `ContextMenu.Item`          | `menuitem`           | Activatable row with `onSelect` escape hatch                                         |
| `ContextMenu.CheckboxItem`  | `menuitemcheckbox`   | Tri-state toggle (`true` / `false` / `"indeterminate"`)                              |
| `ContextMenu.RadioGroup`    | `group`              | Single-selection container for `RadioItem`s                                          |
| `ContextMenu.RadioItem`     | `menuitemradio`      | Must live inside a `RadioGroup`                                                      |
| `ContextMenu.ItemIndicator` | —                    | Icon slot inside a `CheckboxItem` / `RadioItem`; exposes `data-state` + `forceMount` |
| `ContextMenu.Label`         | —                    | Non-interactive label; auto-wired to the enclosing `Group` via `aria-labelledby`     |
| `ContextMenu.Group`         | `group`              | Semantic grouping for related items                                                  |
| `ContextMenu.Separator`     | `separator`          | Visual divider; skipped by focus and typeahead                                       |
| `ContextMenu.Sub`           | State owner          | Submenu boundary; same state modes as `Root`                                         |
| `ContextMenu.SubTrigger`    | `menuitem`           | Opens the submenu on click, hover, or the inline-forward arrow (`ArrowRight` LTR / `ArrowLeft` RTL) |
| `ContextMenu.SubContent`    | `menu`               | Submenu panel; the inline-backward arrow (`ArrowLeft` LTR / `ArrowRight` RTL) closes it and returns focus to the trigger |

All sub-components that render an element accept `asChild` to compose
their ARIA and behaviour onto a caller-supplied child.

## Opening

The Trigger listens for the DOM `contextmenu` event on its rendered
element, calls `preventDefault()` to suppress the platform menu, and
opens the Content positioned at the pointer coordinates via
`position: fixed`.

By default, Trigger renders a `<span>` wrapping its children — a
neutral host that doesn't disturb the wrapped content's semantics. Pass
`asChild` to attach the right-click behaviour to any element (a `<div>`
canvas, a list row, an image, etc.).

```tsx
<ContextMenu.Trigger asChild>
  <ImageCard src="…" alt="…" />
</ContextMenu.Trigger>
```

A disabled Trigger ignores `contextmenu` entirely, letting the native
browser menu through.

## Keyboard interaction

| Key                     | Behaviour                                         |
| ----------------------- | ------------------------------------------------- |
| `ArrowDown` / `ArrowUp` | Move focus to next / previous item (wraps)        |
| `Home` / `End`          | Jump to first / last enabled item                 |
| `Enter` / `Space`       | Activate the focused item                         |
| `Escape`                | Close the menu and return focus to the Trigger    |
| any printable character | Typeahead — focuses the next item matching prefix |
| `ArrowRight`            | Open a focused submenu (`SubTrigger`, LTR) / close the submenu (inside `SubContent`, RTL) |
| `ArrowLeft`             | Close the current submenu (inside `SubContent`, LTR) / open a focused submenu (`SubTrigger`, RTL) |

Typeahead accumulates keystrokes within a 500 ms window; pressing the
same character repeatedly cycles through items sharing that first letter.
Disabled items are skipped by arrow navigation, typeahead, and activation.

## Reading direction

Pass `dir="ltr"` or `dir="rtl"` on `ContextMenu.Root` to invert the
submenu open / close arrow keys. When omitted, the component reads the
inherited `DirectionProvider` value, falling back to `"ltr"`:

```tsx
<DirectionProvider dir="rtl">
  <ContextMenu.Root>{/* submenus now open on ArrowLeft */}</ContextMenu.Root>
</DirectionProvider>
```

An explicit `dir` prop on `ContextMenu.Root` always wins over the
inherited value. The reading direction only affects keyboard handling —
submenu visual placement is the consumer's CSS concern (the workbench
example uses logical positioning + `position-try-fallbacks: flip-inline`
so subs reflow automatically in RTL).

## State modes

- **Uncontrolled** — pass `defaultOpen` (or omit to start closed). Optional
  `onOpenChange` observes user-driven transitions.
- **Controlled** — pass `open` and `onOpenChange` together.

`ContextMenu.Sub` follows the same contract for its own open state.

External flips of the controlled `open` prop do **not** invoke
`onOpenChange` — only user-driven transitions (right-click, Escape,
selection, outside click) do.

`ContextMenu.CheckboxItem` and `ContextMenu.RadioGroup` each expose the
same uncontrolled / controlled split for their `checked` / `value` state.

## The `onSelect` escape hatch

Every activatable item (`Item`, `CheckboxItem`, `RadioItem`) fires
`onSelect` with a cancellable `Event` on activation. By default the menu
auto-closes; call `event.preventDefault()` to keep it open — useful for
rapidly toggling multiple checkboxes, or running an action whose outcome
is shown inline in the menu.

```tsx
<ContextMenu.CheckboxItem
  onSelect={(event) => event.preventDefault()}
  onCheckedChange={setGridVisible}
>
  Show grid
</ContextMenu.CheckboxItem>
```

## Disabled items

Disabled items receive `aria-disabled="true"` rather than the native
`disabled` attribute, so they remain visible to assistive technology but
no-op on activation. Arrow navigation and typeahead skip them.

```tsx
<ContextMenu.Item disabled>Archive (coming soon)</ContextMenu.Item>
```

A disabled `SubTrigger` refuses to open on both click and the
inline-forward arrow key.

## Checkbox and radio items

```tsx
<ContextMenu.Content>
  <ContextMenu.Label>View</ContextMenu.Label>
  <ContextMenu.CheckboxItem defaultChecked>Show grid</ContextMenu.CheckboxItem>
  <ContextMenu.CheckboxItem>Show ruler</ContextMenu.CheckboxItem>
  <ContextMenu.Separator />
  <ContextMenu.RadioGroup defaultValue="system">
    <ContextMenu.RadioItem value="light">Light</ContextMenu.RadioItem>
    <ContextMenu.RadioItem value="dark">Dark</ContextMenu.RadioItem>
    <ContextMenu.RadioItem value="system">Match system</ContextMenu.RadioItem>
  </ContextMenu.RadioGroup>
</ContextMenu.Content>
```

`CheckboxItem` supports a tri-state: `true`, `false`, or `"indeterminate"`
(which renders as `aria-checked="mixed"`). An indeterminate item resolves
to `true` on the next activation.

### `ItemIndicator`

Render the visible mark inside the item via `ContextMenu.ItemIndicator`.
It defaults to a `<span>`, supports `asChild` so consumers can compose
onto an SVG icon, and exposes `data-state` for styling:

```tsx
<ContextMenu.CheckboxItem
  checked={showBookmarks}
  onCheckedChange={setShowBookmarks}
>
  <ContextMenu.ItemIndicator>
    <CheckIcon />
  </ContextMenu.ItemIndicator>
  Show bookmarks
</ContextMenu.CheckboxItem>
```

| `data-state`      | When                                                                                |
| ----------------- | ----------------------------------------------------------------------------------- |
| `"checked"`       | Parent `CheckboxItem` is `true`, or parent `RadioItem` is the group's current value |
| `"unchecked"`     | Parent is `false` (only reachable when `forceMount` is set — see below)             |
| `"indeterminate"` | Parent `CheckboxItem` is `"indeterminate"`                                          |

By default the indicator **unmounts** when its parent is unchecked. Pass
`forceMount` to keep the DOM node in both states so CSS transitions or a
React animation library can drive the visual state off `data-state`.

Rendering `ContextMenu.ItemIndicator` outside a `CheckboxItem` or
`RadioItem` throws a descriptive error.

## Submenus

```tsx
<ContextMenu.Content>
  <ContextMenu.Item>Cut</ContextMenu.Item>
  <ContextMenu.Sub>
    <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
    <ContextMenu.SubContent>
      <ContextMenu.Item>Email</ContextMenu.Item>
      <ContextMenu.Item>Copy link</ContextMenu.Item>
    </ContextMenu.SubContent>
  </ContextMenu.Sub>
</ContextMenu.Content>
```

Open a submenu with the inline-forward arrow key (`ArrowRight` in LTR,
`ArrowLeft` in RTL), a click on the trigger, or pointer hover; close it
with the inline-backward arrow or by selecting an item. Focus returns to
the `SubTrigger` when the submenu closes.

## Groups and labels

```tsx
<ContextMenu.Content>
  <ContextMenu.Group>
    <ContextMenu.Label>Edit</ContextMenu.Label>
    <ContextMenu.Item>Undo</ContextMenu.Item>
    <ContextMenu.Item>Redo</ContextMenu.Item>
  </ContextMenu.Group>
</ContextMenu.Content>
```

Nesting a `ContextMenu.Label` inside a `ContextMenu.Group` wires the
group's `aria-labelledby` to the label automatically.

## `asChild` composition

Every rendering sub-component accepts `asChild` to compose its
ARIA attributes, event handlers, and ref onto a caller-supplied child:

```tsx
<ContextMenu.Trigger asChild>
  <div className="canvas">Right-click here</div>
</ContextMenu.Trigger>

<ContextMenu.Item asChild>
  <a href="/rename">Rename</a>
</ContextMenu.Item>
```

## Styling hooks

```css
/* Open state on the menu panel */
[role="menu"][data-state="open"] {
  animation: fade-in var(--primitiv-motion-duration-control) var(--primitiv-motion-easing-enter);
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
```

`data-state="open" | "closed"` is present on the Content for state-driven
styling. `data-highlighted` is present on `Item`, `CheckboxItem`,
`RadioItem`, and `SubTrigger` while the item has pointer focus.
