# Combobox

A headless, accessible **combobox** — an editable text field with a filtered
popup listbox, implementing the
[WAI-ARIA APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

```tsx
import { Combobox } from "@primitiv-ui/react";

<Combobox.Root onQueryChange={setQuery} onValueChange={setFramework}>
  <Combobox.Input aria-label="Framework" />
  <Combobox.Content aria-label="Frameworks">
    <Combobox.Item value="react">React</Combobox.Item>
    <Combobox.Item value="preact">Preact</Combobox.Item>
  </Combobox.Content>
</Combobox.Root>;
```

## Sub-components

| Export              | Element   | Notes                                                                              |
| ------------------- | --------- | ---------------------------------------------------------------------------------- |
| `Combobox.Root`     | `<div>`   | Owns open state, value, query and cursor; context provider; `asChild`              |
| `Combobox.Input`    | `<input>` | `role="combobox"`, the full keyboard model, all the ARIA wiring; `asChild`         |
| `Combobox.Content`  | `<div>`   | `role="listbox"`, **unmounted while closed**; `asChild`                            |
| `Combobox.Item`     | `<div>`   | `role="option"`, `aria-selected`, `data-highlighted`; `asChild`                    |
| `Combobox.Empty`    | `<div>`   | `role="presentation"` no-results message, never navigable; `asChild`               |

## Filtering is yours

There is deliberately **no `filter` prop**. `onQueryChange` reports every
keystroke and you render the options you want:

```tsx
const [query, setQuery] = useState("");
const matches = FRAMEWORKS.filter((f) =>
  f.label.toLowerCase().includes(query.toLowerCase()),
);

<Combobox.Root onQueryChange={setQuery}>
  <Combobox.Input aria-label="Framework" />
  <Combobox.Content aria-label="Frameworks">
    {matches.map((f) => (
      <Combobox.Item key={f.value} value={f.value}>
        {f.label}
      </Combobox.Item>
    ))}
    {matches.length === 0 && <Combobox.Empty>No matches</Combobox.Empty>}
  </Combobox.Content>
</Combobox.Root>;
```

That keeps async loading, fuzzy matching and sorting where the data lives,
rather than inventing a filtering API the component would have to own.

## Query versus value

One field, two readings, disambiguated by whether the popup is open:

- **while open** — the input holds whatever the user typed (the query);
- **on commit or Escape** — the text is reset **from the value**.

So the field never sits showing a half-typed query that is not the value,
which is the classic combobox bug.

The label shown after committing comes from the item's children when they are a
string. When an item renders elements (an icon plus a span, say), there is no
reliable way to read a label out of arbitrary JSX, so **the value stands in** —
pass string children if you want a nicer closed-state label.

## Keyboard

| Key                   | Behaviour                                                        |
| --------------------- | ---------------------------------------------------------------- |
| any printable char    | Sets the query and **opens** the popup                           |
| <kbd>↓</kbd>          | Moves the cursor down; seeds it on the **first** item if none     |
| <kbd>↑</kbd>          | Moves the cursor up; seeds it on the **last** item if none        |
| <kbd>Home</kbd> / <kbd>End</kbd> | Jumps the cursor to the first / last item             |
| <kbd>Enter</kbd>      | Commits the cursor item. Ignored when there is no cursor          |
| <kbd>Escape</kbd>     | Closes, clears the cursor, restores the committed label           |

Arrow travel wraps at both ends.

## Virtual focus, not a roving tabstop

DOM focus **never leaves the input**. The cursor is published as
`aria-activedescendant` on the input and `data-highlighted` on the item; no
option is ever given a `tabIndex` or `focus()`ed. That is what lets the input
keep focus while driving the list, and it is the same model
[`Listbox`](../Listbox/README.md) uses — the two were designed to agree.

## Controlled and uncontrolled

Both `open` and `value` support either shape:

```tsx
// uncontrolled
<Combobox.Root defaultOpen defaultValue="react">

// controlled — the combobox asks, the parent decides
<Combobox.Root open={open} onOpenChange={setOpen} value={value} onValueChange={setValue}>
```

Under a controlled prop the combobox never moves on its own: it calls the
change handler and waits.

## Styling hooks

| Hook                     | Where             | When                                   |
| ------------------------ | ----------------- | -------------------------------------- |
| `aria-expanded`          | `Combobox.Input`  | Reflects open state                    |
| `aria-activedescendant`  | `Combobox.Input`  | Present only once a cursor exists      |
| `aria-selected`          | `Combobox.Item`   | The committed value                    |
| `data-highlighted`       | `Combobox.Item`   | The cursor sits on this item           |

Selection and cursor are **separate** states and are meant to look different —
one says "this is chosen", the other "Enter picks this".

## Accessibility notes

- The input carries `role="combobox"`, `aria-autocomplete="list"` and
  `aria-controls` pointing at the listbox id, which is derived per instance so
  two comboboxes on one page never collide.
- `Combobox.Content` is unmounted while closed rather than hidden, so a closed
  combobox contributes no list to the accessibility tree.
- Give the input an accessible name (`aria-label` or a `<label>`) and the
  listbox one too.

## Not in v1

Deliberately out of scope, recorded on the Figma "Combobox — exploration" page:
a built-in `filter` prop, async option loading, multi-select with token chips,
and virtualization. The **command palette** is a separate composite that
*wraps* this component in a `Modal` — it is not a Combobox mode.
