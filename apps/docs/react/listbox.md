---
title: Listbox
---

# Listbox

A headless, accessible compound component implementing the
[WAI-ARIA APG listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
— a persistently-visible list of options with a **virtual-focus** cursor.

```tsx
import { Listbox } from "@primitiv-ui/react";

<Listbox.Root type="single" defaultValue="apple" aria-label="Fruit">
  <Listbox.Option value="apple">Apple</Listbox.Option>
  <Listbox.Option value="banana">Banana</Listbox.Option>
  <Listbox.Option value="cherry">Cherry</Listbox.Option>
</Listbox.Root>;
```

## Sub-components

| Export            | Element | Notes                                                                     |
| ----------------- | ------- | ------------------------------------------------------------------------- |
| `Listbox.Root`    | `<div>` | `role="listbox"`, the tab stop, `aria-activedescendant`, context provider, `asChild` |
| `Listbox.Option`  | `<div>` | `role="option"`, `aria-selected`, `data-highlighted`, `disabled`, `asChild` |
| `Listbox.Group`   | `<div>` | `role="group"`, named by `label` or a nested `GroupLabel`, `asChild`        |
| `Listbox.GroupLabel` | `<div>` | `role="presentation"` visible heading; wires the group's `aria-labelledby` |

## Why this is not `Select`

`Select` (in its default rich mode) is a listbox **inside a popup**, opened
from a trigger, and its headless layer moves **real DOM focus** between
options. `Listbox` is the list on its own: always visible, no trigger, no
popup — and crucially it never moves DOM focus.

Focus stays on the root. The visually-focused option is published as
`aria-activedescendant` on the root and marked `data-highlighted` on the
option itself. That is the whole point of the component: it is what lets a
**separate** control — a search input, a command palette's text field — hold
DOM focus and drive the list at the same time. A roving tabstop cannot do
that, which is why `Select`'s internals could not simply be reused.

Practical consequence when styling: **the cursor is `[data-highlighted]`, not
`:focus`.** An option never matches `:focus`.

## Selection modes

### `type="single"`

At most one option is selected. Re-selecting the current option is a no-op —
unlike `ToggleGroup`, a listbox is not a toggle, so the value never returns to
empty by clicking the same row twice.

```tsx
// Uncontrolled
<Listbox.Root type="single" defaultValue="apple" aria-label="Fruit">...</Listbox.Root>

// Controlled — onValueChange receives string
const [fruit, setFruit] = useState("apple");
<Listbox.Root type="single" value={fruit} onValueChange={setFruit} aria-label="Fruit">
  ...
</Listbox.Root>
```

### `type="multiple"`

Options toggle independently and the root carries `aria-multiselectable`.

```tsx
// Controlled — onValueChange receives string[]
const [toppings, setToppings] = useState<string[]>([]);
<Listbox.Root type="multiple" value={toppings} onValueChange={setToppings} aria-label="Toppings">
  ...
</Listbox.Root>
```

## Keyboard

| Key                    | Behaviour                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| Arrow Down / Up        | Move the cursor (vertical orientation), wrapping at both ends     |
| Arrow Right / Left     | Move the cursor (horizontal orientation), mirrored under `dir="rtl"` |
| Home / End             | Move the cursor to the first / last enabled option                |
| Enter, Space           | Select (single) or toggle (multiple) the cursor option            |
| Printable characters   | Prefix typeahead — moves the cursor, resets after 500 ms idle     |

Multiple-selection mode adds APG's optional modifier shortcuts:

| Key                    | Behaviour                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| Shift+Arrow            | Moves the cursor and selects the option it lands on. Does **not** wrap |
| Ctrl/Cmd+Shift+Home    | Selects from the cursor to the first option, cursor parks there   |
| Ctrl/Cmd+Shift+End     | Selects from the cursor to the last option, cursor parks there    |
| Ctrl/Cmd+A             | Selects every enabled option, or clears the selection if all are already selected |

Every other chorded shortcut is left alone: `Alt+Arrow` and any unclaimed
`Ctrl`/`Cmd` combination pass straight through to your own `onKeyDown` and to
the browser. That is what lets you bind a toolbar to `Alt+Arrow`, as APG's
rearrangeable example does.

Moving the cursor **does not** select, by default. APG leaves
selection-follows-focus optional for single-select listboxes and warns it can
degrade accessibility; the manual model is also what a command palette needs,
since arrowing through results must not commit a choice. Opt into the APG
example's behaviour with `selectionFollowsFocus`:

```tsx
<Listbox.Root type="single" selectionFollowsFocus aria-label="Fruit">...</Listbox.Root>
```

Typeahead follows APG's repeat rule: pressing the same letter repeatedly
cycles through the options starting with it, rather than searching for a
literal run of that character. Matching is a case-insensitive prefix test
against the option's rendered text, so keep the label in `children`.

## Pointer

Clicking an option selects it (single) or toggles it (multiple), **and moves
the cursor onto it**, so a following arrow key resumes from the row you
clicked rather than from wherever focus seeding left the cursor. APG treats
the clicked option as the focused option. Clicking a disabled option does
neither.

**Hovering does not move the cursor**, deliberately — there are no pointer
handlers on the option at all. `Select`'s popup listbox and `Dropdown` both
move their highlight on pointer movement, but those are transient surfaces
you are about to dismiss. This list is persistent and an external input may
be driving it, so a mouse resting anywhere over the list would steal the
cursor mid-keystroke.

The styling consequence: **hover needs its own treatment, weaker than the
cursor's and visually distinct from it.** If hover reused the cursor
treatment, two rows would look current at once and the pointer would appear
to move a cursor it cannot move.

## Grouping

Groups are presentational. The cursor walks every option in DOM order,
crossing group boundaries without stopping, and typeahead searches the whole
list.

APG requires every option group to carry an accessible name. There are two
ways to give it one, and you must use one of them:

```tsx
{/* Visible heading — what APG's grouped-options example does. */}
<Listbox.Group>
  <Listbox.GroupLabel>Citrus</Listbox.GroupLabel>
  <Listbox.Option value="lemon">Lemon</Listbox.Option>
</Listbox.Group>

{/* Invisible name, when the grouping is implied visually some other way. */}
<Listbox.Group label="Citrus">
  <Listbox.Option value="lemon">Lemon</Listbox.Option>
</Listbox.Group>
```

`GroupLabel` renders `role="presentation"` — only `role="option"` elements may
sit inside a listbox — and the group points `aria-labelledby` at it, with the
id derived for you. If both are supplied the rendered `GroupLabel` wins, since
`aria-labelledby` outranks `aria-label` in the accessible-name algorithm and
emitting both would be misleading.

## Disabled options

`disabled` drops an option out of cursor navigation, focus seeding and
typeahead, and makes it unselectable — while keeping it in the DOM and in the
accessibility tree as `aria-disabled`.

```tsx
<Listbox.Option value="durian" disabled>Durian (out of stock)</Listbox.Option>
```

This is a **house extension**, matching `Select` and `Dropdown` in this
library. APG's listbox pattern does not itself specify disabled options.

## Accessibility notes

- **Name the listbox.** Pass `aria-label` or `aria-labelledby` on the Root.
  APG requires it for any listbox that is not part of another widget.
- `aria-orientation` is emitted **only** for `orientation="horizontal"`;
  vertical is the ARIA default and is left implicit.
- The active option is scrolled into view (`block: "nearest"`) as the cursor
  moves, per APG.
- On focus, the cursor is seeded onto the first selected option, or the first
  enabled option when nothing is selected.

## Styling hooks

Zero styles ship with this library. Style from:

| Attribute                              | Where   | Meaning                             |
| -------------------------------------- | ------- | ----------------------------------- |
| `data-orientation="vertical\|horizontal"` | Root    | Layout axis                         |
| `aria-invalid="true"`                  | Root    | Invalid — **you** set this; see below |
| `data-highlighted=""`                  | Option  | The cursor is on this option        |
| `data-disabled=""`                     | Option  | The option is disabled              |
| `aria-selected="true\|false"`           | Option  | Selection state                     |

There is deliberately **no `invalid` prop**. `Listbox.Root` spreads unknown
props onto its `<div>`, so `aria-invalid` already reaches the DOM — style the
invalid frame from `[aria-invalid="true"]`, the same way `InputGroup` styles
itself with `:has(input[aria-invalid="true"])`. A bespoke prop would only
restate what the ARIA attribute already says.

There is also no root-level `disabled`. Only individual options can be
disabled; a whole inert listbox is out of scope.

## `asChild`

Every part composes onto a consumer element via the `Slot` pattern, so the
listbox can be a semantic list:

```tsx
<Listbox.Root type="single" asChild aria-label="Fruit">
  <ul>
    <Listbox.Option value="apple" asChild>
      <li>Apple</li>
    </Listbox.Option>
  </ul>
</Listbox.Root>
```

## Reordering options

Navigation order is read from the **live DOM** on every interaction, not from
the order options happened to mount in. Moving an option in place — as APG's
rearrangeable example does — keeps the same element mounted with unchanged
props, so nothing re-registers and any cached order would silently go stale.
Arrow keys, `Home`/`End`, focus seeding, typeahead and the range shortcuts all
follow the new visual order immediately.

## APG example coverage

| Example | Status |
| ------- | ------ |
| [Scrollable Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-scrollable/) | Covered. Set `selectionFollowsFocus`, which is what that example does |
| [Listbox with Grouped Options](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/) | Covered via `Listbox.GroupLabel` |
| [Rearrangeable Options](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/) | Keyboard model covered — both selection modes, the modifier shortcuts, chord pass-through for the toolbar, and in-place reordering. The toolbar buttons and the move/transfer logic are the consumer's, since the component owns no data model |

## Not in scope

- **`aria-setsize` / `aria-posinset`** for virtualised or lazily-loaded lists.
  APG calls for these when the full option set is not in the DOM; add them
  yourself on each Option (they pass straight through) if you virtualise.
- **Shift+Space** to select a contiguous run from an anchor. APG marks it
  optional, and the shortcuts that ship here cover the same ground without
  needing anchor state.
- **Combobox integration.** The virtual-focus model is what makes it possible,
  but the input wiring itself belongs to `Combobox`
  (see [`docs/select-future-work.md`](../../../../docs/select-future-work.md)).

## Live example

See it running in the [kitchen sink](/kitchen-sink/#listbox) — the reference app
that installs every styled registry component.
