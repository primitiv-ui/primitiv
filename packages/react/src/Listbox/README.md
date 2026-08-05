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
| `Listbox.Group`   | `<div>` | `role="group"` with a required `label`, `asChild`                          |

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
<Listbox.Root type="single" defaultValue="apple" aria-label="Fruit">…</Listbox.Root>

// Controlled — onValueChange receives string
const [fruit, setFruit] = useState("apple");
<Listbox.Root type="single" value={fruit} onValueChange={setFruit} aria-label="Fruit">
  …
</Listbox.Root>
```

### `type="multiple"`

Options toggle independently and the root carries `aria-multiselectable`.

```tsx
// Controlled — onValueChange receives string[]
const [toppings, setToppings] = useState<string[]>([]);
<Listbox.Root type="multiple" value={toppings} onValueChange={setToppings} aria-label="Toppings">
  …
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

Moving the cursor **does not** select, by default. APG leaves
selection-follows-focus optional for single-select listboxes and warns it can
degrade accessibility; the manual model is also what a command palette needs,
since arrowing through results must not commit a choice. Opt into the APG
example's behaviour with `selectionFollowsFocus`:

```tsx
<Listbox.Root type="single" selectionFollowsFocus aria-label="Fruit">…</Listbox.Root>
```

Typeahead follows APG's repeat rule: pressing the same letter repeatedly
cycles through the options starting with it, rather than searching for a
literal run of that character. Matching is a case-insensitive prefix test
against the option's rendered text, so keep the label in `children`.

## Grouping

Groups are presentational. The cursor walks every option in DOM order,
crossing group boundaries without stopping, and typeahead searches the whole
list. The `label` is required — APG requires every option group to have an
accessible name.

```tsx
<Listbox.Root type="single" aria-label="Fruit">
  <Listbox.Group label="Citrus">
    <Listbox.Option value="lemon">Lemon</Listbox.Option>
  </Listbox.Group>
  <Listbox.Group label="Stone fruit">
    <Listbox.Option value="peach">Peach</Listbox.Option>
  </Listbox.Group>
</Listbox.Root>
```

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
| `data-highlighted=""`                  | Option  | The cursor is on this option        |
| `data-disabled=""`                     | Option  | The option is disabled              |
| `aria-selected="true\|false"`           | Option  | Selection state                     |

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

## Not in scope

- **`aria-setsize` / `aria-posinset`** for virtualised or lazily-loaded lists.
  APG calls for these when the full option set is not in the DOM; add them
  yourself on each Option (they pass straight through) if you virtualise.
- **The optional multi-select keyboard extras** — Shift+Arrow, Shift+Space,
  Ctrl+A, Ctrl+Shift+Home/End. APG marks all of these optional and Space-toggles
  is its recommended no-modifier model, which is what ships here.
- **Combobox integration.** The virtual-focus model is what makes it possible,
  but the input wiring itself belongs to `Combobox`
  (see [`docs/select-future-work.md`](../../../../docs/select-future-work.md)).
