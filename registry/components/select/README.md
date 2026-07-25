# Select

The styled surface for `@primitiv-ui/react`'s headless `Select` — a single-select
control with **two render paths behind one API**, chosen by the `native` prop:

- **Rich** (`native={false}`, the default) — a Popover-API listbox whose options
  carry icons, labels, badges and a selected mark. The control is a framed field
  on the same geometry as `Input`, laid out `[leading][value][chevron]`.
- **Native** (`native`) — a real `<select>`, dressed in the same frame, with the
  platform drawing the popup, the arrow, and the selected text.

The panel and its rows deliberately resolve the shared `--primitiv-dropdown-*`
tokens: the Figma composition stacks a real `Dropdown / Panel` under the trigger,
so a Select listbox and a Dropdown menu are the same surface by construction —
without this component depending on `dropdown`.

## Usage

```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemLeading,
  SelectItemLabel,
  SelectItemTrailing,
} from "./components";

<Select value={framework} onValueChange={setFramework}>
  <SelectTrigger size="md" style={{ anchorName: "--framework" }}>
    <SelectValue placeholder="Pick a framework…" />
    <SelectIcon>
      <ChevronDown />
    </SelectIcon>
  </SelectTrigger>
  <SelectContent size="md" style={{ positionAnchor: "--framework" }}>
    <SelectItem value="react">
      <SelectItemIndicator><Check /></SelectItemIndicator>
      <SelectItemLeading><ReactLogo /></SelectItemLeading>
      <SelectItemLabel>React</SelectItemLabel>
    </SelectItem>
    <SelectItem value="svelte" disabled>
      <SelectItemIndicator><Check /></SelectItemIndicator>
      <SelectItemLeading><SvelteLogo /></SelectItemLeading>
      <SelectItemLabel>Svelte</SelectItemLabel>
      <SelectItemTrailing>Soon</SelectItemTrailing>
    </SelectItem>
  </SelectContent>
</Select>;
```

Native mode is the same component with `native` set:

```tsx
<Select native size="md" defaultValue="apple" aria-label="Pick a fruit">
  <SelectPlaceholder>Choose a fruit…</SelectPlaceholder>
  <SelectGroup label="Fruits">
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
  </SelectGroup>
</Select>
```

### Positioning

Like Dropdown, placement is pure CSS anchor positioning — no JS. Put an
`anchor-name` on the trigger and the matching `position-anchor` on the panel:

```tsx
<SelectTrigger style={{ anchorName: "--framework" }} />
<SelectContent placement="bottom-start" style={{ positionAnchor: "--framework" }} />
```

The panel is at least as wide as its trigger (`anchor-size(width)`, matching the
Figma composition) and flips to the opposite side on overflow. Past
`--primitiv-select-content-max-block-size` the list scrolls — there are no scroll
buttons by design.

### Where the trigger's content comes from

`SelectValue` **mirrors the selected option's content** — write the icon and
label once, on the `SelectItem`, and both show up in the closed control.
`SelectItemIndicator` is excluded from the mirror. So:

- A per-selection icon → put it on the item (via `SelectItemLeading`).
- A mark the trigger *always* shows, whatever is selected → `SelectLeading`.

While nothing is selected, `SelectValue` renders its `placeholder` and carries
`data-placeholder`, which is what switches the text to the muted colour (Figma's
`Filled` axis).

### Row slots

Options use the same `[gutter][leading][label][trailing]` shape as Dropdown rows.
`SelectItemLabel` takes the free space — **use it whenever the option has a
leading or trailing slot**, or the bare text node drifts. `SelectItemTrailing` is
icon-height but free to grow inline, so a badge or shortcut keeps its natural
width.

The selected-mark gutter is reserved on **every** row (unlike Dropdown, a
listbox row is one class whether or not it holds a mark, and the mark unmounts
while unselected — a `:has()` test would collapse the gutter and shift the labels
on the first selection). A Select with no `SelectItemIndicator` collapses it:

```css
.primitiv-select__content {
  --primitiv-select-item-inset: var(--primitiv-select-item-padding-inline);
}
```

### Group headings

The headless `SelectGroup` exposes its `label` as the group's accessible name
only. When the heading should also be *seen* in rich mode, render a
`SelectGroupLabel` with the same text inside the group (it is `aria-hidden`, so
the name is not announced twice). Native mode needs none of this — `<optgroup>`
draws its own heading.

### Disabled

In rich mode `disabled` on the root reaches the hidden form `<select>`, not the
trigger button — pass it to `SelectTrigger` as well to disable the control
itself. Native mode needs it on the root only.

## Parts

| Export                | Wraps                  | Styled? | Notes                                                     |
| --------------------- | ---------------------- | ------- | --------------------------------------------------------- |
| `Select`              | `Select.Root`          | native  | State owner; renders the frame only under `native`         |
| `SelectTrigger`       | `Select.Trigger`       | ✓ root  | The rich control; carries `size`, set its `anchor-name`    |
| `SelectValue`         | `Select.Value`         | ✓       | Mirrors the selection; `data-placeholder` when empty       |
| `SelectLeading`       | —                      | ✓       | Standing glyph in the trigger, independent of selection    |
| `SelectIcon`          | —                      | ✓       | The chevron; flips while open                              |
| `SelectContent`       | `Select.Content`       | ✓       | The panel; carries `size` + `placement`                    |
| `SelectItem`          | `Select.Item`          | ✓       | An option (rich `<div role="option">` / native `<option>`) |
| `SelectItemIndicator` | `Select.ItemIndicator` | ✓       | The selected mark, in the reserved gutter                  |
| `SelectItemLeading`   | —                      | ✓       | Leading slot inside an option                              |
| `SelectItemLabel`     | —                      | ✓       | Option label; absorbs the row's free space                 |
| `SelectItemTrailing`  | —                      | ✓       | Trailing slot; natural width, icon height                  |
| `SelectGroup`         | `Select.Group`         | ✓       | Group of options; `label` is the accessible name           |
| `SelectGroupLabel`    | —                      | ✓       | The visible group heading (rich mode)                      |
| `SelectPlaceholder`   | `Select.Placeholder`   | —       | Native-only initial hint; the browser styles it            |

## Props

| Prop        | On                             | Values                                                        | Default          |
| ----------- | ------------------------------ | ------------------------------------------------------------- | ---------------- |
| `size`      | `SelectTrigger`, `SelectContent`, native `Select` | `xs` `sm` `md` `lg` `xl`                | `md`             |
| `placement` | `SelectContent`                | `bottom-start` `bottom-end` `top-start` `top-end`             | `bottom-start`   |

Everything else — `value` / `defaultValue` / `onValueChange`, `open` /
`defaultOpen` / `onOpenChange`, `native`, `name`, `required`, `disabled`,
`asChild` — passes straight through to the headless primitive.

## Animation

The panel scales and fades on the native `:popover-open` state with
`@starting-style` for the enter, and the chevron sweeps 180°, both on the shared
`--primitiv-motion-*` tokens. `prefers-reduced-motion: reduce` drops all three to
a plain show / hide.

## Files

| File               | Purpose                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `select.tsx`       | The styled wrapper (applies the recipe classes)                   |
| `select.recipe.ts` | `cva` recipes mapping `size` / `mode` / `placement` + parts       |
| `styles.css`       | The default theme (control, panel, rows, placements, states)      |
| `styles.scss`      | The CSS plus `$primitiv-select-*` Sass aliases                    |
| `contract.json`    | The stable API surface (parts, modifiers, custom props)           |

## Dependencies

- `@primitiv-ui/react` — the headless `Select` primitive.
- `class-variance-authority` — the recipe helper.
- The token layer (`primitiv tokens`) for the `--primitiv-*` custom properties,
  including the shared `--primitiv-dropdown-*` panel and row ramp.
