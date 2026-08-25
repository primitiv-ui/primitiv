---
title: SplitButton
---

# SplitButton

One primary action paired with a menu of related alternatives, bound into
a single `role="group"` widget. Zero styles ship.

```tsx
import { SplitButton, VisuallyHidden } from "@primitiv-ui/react";

<SplitButton>
  <SplitButton.Action onClick={squashAndMerge}>
    Squash and merge
  </SplitButton.Action>
  <SplitButton.Trigger>
    <ChevronDown aria-hidden="true" />
    <VisuallyHidden>More merge options</VisuallyHidden>
  </SplitButton.Trigger>
  <SplitButton.Menu>
    <SplitButton.Item onSelect={mergeCommit}>
      Create a merge commit
    </SplitButton.Item>
    <SplitButton.Item onSelect={rebase}>Rebase and merge</SplitButton.Item>
  </SplitButton.Menu>
</SplitButton>;
```

## Split button, not select

A `Select` answers *"which option is currently selected?"* — picking an
item changes a **value**. A split button is an **actions** control: the
left half runs the default action immediately, and the right half opens a
menu of alternatives. Those alternatives may run their own action, or
re-point what the primary half does next; either way nothing about the
widget models a selected value.

If you want a value picker, use [`Select`](../Select/README.md). If you
want a plain menu button with no default action, use
[`Dropdown`](../Dropdown/README.md) on its own.

## Sub-components

| Export                   | Element                    | Role         | Notes                                                                   |
| ------------------------ | -------------------------- | ------------ | ----------------------------------------------------------------------- |
| `SplitButton` / `.Root`  | `<div>`                    | `group`      | Owns the menu's open state; uncontrolled (`defaultOpen`) or controlled   |
| `SplitButton.Action`     | `<button type="button">`   | `button`     | The primary action; `ArrowDown` opens the menu                          |
| `SplitButton.Trigger`    | `<button type="button">`   | `button`     | `aria-haspopup="menu"`; name derived from the action                    |
| `SplitButton.Menu`       | `<menu popover="auto">`    | `menu`       | The panel of alternatives                                               |
| `SplitButton.Item`       | `<div>`                    | `menuitem`   | One alternative action, with `onSelect`                                 |
| `SplitButton.Separator`  | `<div>`                    | `separator`  | Divider between groups of alternatives                                  |

`Root`, `Action` and the group accept `asChild`; `Trigger`, `Menu`,
`Item` and `Separator` inherit `asChild` from the Dropdown parts they
delegate to.

## Anatomy and styling hooks

| Part          | Hook                                                   |
| ------------- | ------------------------------------------------------ |
| Root          | `data-split-button=""`, `data-state="open" \| "closed"` |
| Action        | `data-split-button-action=""`                          |
| Trigger       | `data-split-button-trigger=""`                          |
| Menu          | `data-split-button-menu=""`                            |
| Any disabled  | `data-disabled=""`                                     |

`data-state` on the **root** tracks the menu, which is what makes the
seam between the two halves styleable while the menu is open (a pressed
chevron, a joined border) without reaching for `:has()`.

## What this component adds over `Dropdown`

The menu half *is* a `Dropdown` — Root renders a `Dropdown.Root`, and
`Menu` / `Item` / `Separator` delegate to `Dropdown.Content` / `.Item` /
`.Separator`. All the arrow-key navigation, typeahead, Escape handling,
light dismiss and focus restoration are Dropdown's, tested once over
there.

What `SplitButton` owns is the coordination **between the two halves**,
which is the whole reason it exists as a primitive rather than a styled
recipe:

1. **The `role="group"` boundary** — assistive technology reads two
   buttons as one widget rather than two unrelated commands.
2. **The trigger's accessible name, derived from the action** — see
   below. This is the thing hand-rolled split buttons get wrong most
   often.
3. **`disabled` propagation** — one prop on the group disables both
   halves; it is OR-ed with each half's own `disabled`, so a part can
   never override the group back to enabled.
4. **`ArrowDown` on the action opens the menu** — the action is *not*
   the menu trigger, so nothing in `Dropdown` wires this. Note this
   affordance is specific to `SplitButton`; `Dropdown.Trigger` itself
   opens on click/Enter/Space only.

## The derived accessible name

A chevron-only control has no text of its own. Unless you pass
`aria-label` or `aria-labelledby`, `SplitButton.Trigger` defaults to:

```
aria-labelledby="<the trigger's own id> <the action's id>"
```

Self-reference is valid in `aria-labelledby` and resolves to the
element's own contents, so putting visually-hidden text inside the
trigger produces *"More merge options, Squash and merge"*:

```tsx
<SplitButton.Trigger>
  <ChevronDown aria-hidden="true" />
  <VisuallyHidden>More merge options</VisuallyHidden>
</SplitButton.Trigger>
```

With no text inside the trigger at all, the name falls back to just the
action's label — ambiguous, but still better than an unlabelled button.
Passing either ARIA attribute yourself opts out of the derivation
completely:

```tsx
<SplitButton.Trigger aria-label="More merge options">
  <ChevronDown aria-hidden="true" />
</SplitButton.Trigger>
```

Because the derivation depends on both ids, **`id` is component-owned on
`Action` and `Trigger`** and is `Omit`-ted from their prop types. Each
id is derived from the root's `useId()` with a stable `-split-button-action`
/ `-split-button-trigger` suffix.

## Keyboard interaction

| Key                     | On                | Behaviour                                        |
| ----------------------- | ----------------- | ------------------------------------------------ |
| `Enter` / `Space`       | Action            | Runs the primary action (native button)          |
| `ArrowDown`             | Action            | Opens the menu, focusing its first item          |
| `Enter` / `Space`       | Trigger           | Toggles the menu                                 |
| `ArrowDown` / `ArrowUp` | Menu              | Moves between items (wraps)                      |
| `Home` / `End`          | Menu              | First / last enabled item                        |
| printable characters    | Menu              | Typeahead                                        |
| `Escape`                | Menu              | Closes and returns focus to the trigger          |

**Both halves are separate tab stops.** They are two genuinely distinct
commands, so each is independently tabbable — this is deliberately *not*
a roving-tabindex widget, and shouldn't become one. (Contrast
`NavigationMenu`, which uses the roving-tabindex hook for its keymap only,
for the same underlying reason.)

## State modes

Identical to `Dropdown.Root`'s, and statically discriminated at the type
level:

- **Uncontrolled** — pass `defaultOpen` (or omit it to start closed).
  Optional `onOpenChange` observes user-driven transitions.
- **Controlled** — pass `open` and `onOpenChange` together.

```tsx
const [open, setOpen] = useState(false);

<SplitButton open={open} onOpenChange={setOpen}>
  ...
</SplitButton>;
```

## Disabled

```tsx
{/* Both halves disabled */}
<SplitButton disabled>...</SplitButton>

{/* Only the action — alternatives stay reachable */}
<SplitButton.Action disabled>Squash and merge</SplitButton.Action>

{/* Only the menu — the default action still works */}
<SplitButton.Trigger disabled aria-label="More merge options" />
```

## Richer menus

`SplitButton` re-exports only the two menu parts a split button almost
always needs. Root provides the same Dropdown context, so every other
`Dropdown` part composes inside `SplitButton.Menu` directly:

```tsx
import { Dropdown, SplitButton } from "@primitiv-ui/react";

<SplitButton.Menu>
  <Dropdown.Group>
    <Dropdown.Label>Merge strategy</Dropdown.Label>
    <SplitButton.Item onSelect={mergeCommit}>
      Create a merge commit
    </SplitButton.Item>
  </Dropdown.Group>
  <SplitButton.Separator />
  <Dropdown.Sub>
    <Dropdown.SubTrigger>Advanced</Dropdown.SubTrigger>
    <Dropdown.SubContent>
      <SplitButton.Item onSelect={rebase}>Rebase and merge</SplitButton.Item>
    </Dropdown.SubContent>
  </Dropdown.Sub>
</SplitButton.Menu>;
```

`dir` on `SplitButton.Root` is forwarded to the Dropdown, so submenus
invert their open/close arrow keys in RTL.

## `asChild`

```tsx
{/* The group is a <section> */}
<SplitButton asChild>
  <section aria-label="Merge">...</section>
</SplitButton>

{/* The primary action navigates instead of firing a handler.
    type="button" is not forwarded in asChild mode. */}
<SplitButton.Action asChild>
  <a href="/merge">Squash and merge</a>
</SplitButton.Action>
```

## Positioning

Like `Dropdown`, the menu is a native `popover="auto"` element in the top
layer — placement is the consumer's CSS concern (CSS anchor positioning,
as the registry `dropdown` component does).

## Live example

See it running in the [kitchen sink](/kitchen-sink/#split-button) — the reference app
that installs every styled registry component.
