# Dropdown

The **styled** Dropdown surface — a menu-button dropdown built on the native
HTML Popover API. A bordered, shadow-defined panel of selectable rows (plain
items, checkbox/radio items, submenus), grouped with labels and separators and
placed with CSS anchor positioning. It wraps the headless
[`Dropdown`](../../../packages/react/src/Dropdown/README.md) primitive;
behaviour (open/close, keyboard, typeahead, focus, submenus) lives there,
styling lives here.

```sh
primitiv add dropdown
```

## Usage

Positioning is CSS anchor positioning — no JS measurement. Wire an `anchor-name`
onto the trigger and a matching `position-anchor` onto the content, then pick a
`placement` (or take the `bottom-start` default):

```tsx
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/dropdown";

<Dropdown>
  <DropdownTrigger style={{ anchorName: "--options" }}>Options</DropdownTrigger>
  <DropdownContent size="md" style={{ positionAnchor: "--options" }}>
    <DropdownItem onSelect={rename}>Rename</DropdownItem>
    <DropdownItem onSelect={duplicate}>Duplicate</DropdownItem>
    <DropdownSeparator />
    <DropdownItem disabled>Archive</DropdownItem>
  </DropdownContent>
</Dropdown>;
```

> Each menu instance needs a **unique** `anchor-name` — reusing one name across
> instances makes the anchor ambiguous. Submenus wire their own `anchor-name` on
> the `DropdownSubTrigger` and `position-anchor` on the `DropdownSubContent`.

### Reading direction

Placement uses logical `anchor(start)` / `anchor(end)` insets, so the panel hugs
the trigger's inline-start edge and submenus open to the inline-end side in
**both** LTR and RTL with no extra rules — set `dir="rtl"` (and a
`DirectionProvider` for the headless keyboard handling) and it flips.

### Checkbox / radio items

`DropdownCheckboxItem` and `DropdownRadioItem` reserve an inline-start gutter for
a `DropdownItemIndicator` — the menu-convention checkmark (`✓`) or dot (`•`) the
consumer supplies. The gutter is held whether or not the mark is mounted, so
checked and unchecked rows keep their labels aligned:

```tsx
<DropdownCheckboxItem onSelect={(e) => e.preventDefault()}>
  <DropdownItemIndicator>✓</DropdownItemIndicator>
  Show bookmarks
</DropdownCheckboxItem>
```

## Parts

| Export                  | Wraps                    | Styled? | Notes                                                    |
| ----------------------- | ------------------------ | ------- | -------------------------------------------------------- |
| `Dropdown`              | `Dropdown.Root`          | —       | State owner; renders no DOM (pass-through)               |
| `DropdownTrigger`       | `Dropdown.Trigger`       | —       | Pass-through; set `anchor-name` here                     |
| `DropdownContent`       | `Dropdown.Content`       | ✓ root  | The panel; carries `size` + `placement`                  |
| `DropdownItem`          | `Dropdown.Item`          | ✓       | A selectable row                                         |
| `DropdownCheckboxItem`  | `Dropdown.CheckboxItem`  | ✓       | Togglable row; holds an indicator gutter                 |
| `DropdownRadioItem`     | `Dropdown.RadioItem`     | ✓       | Single-select row; holds an indicator gutter             |
| `DropdownItemIndicator` | `Dropdown.ItemIndicator` | ✓       | The `✓` / `•` mark inside a checkbox/radio row           |
| `DropdownLabel`         | `Dropdown.Label`         | ✓       | Uppercase section header                                 |
| `DropdownSeparator`     | `Dropdown.Separator`     | ✓       | Thin rule between groups                                 |
| `DropdownGroup`         | `Dropdown.Group`         | ✓       | Semantic grouping of related rows                        |
| `DropdownRadioGroup`    | `Dropdown.RadioGroup`    | ✓       | Single-select container for `DropdownRadioItem`s         |
| `DropdownSub`           | `Dropdown.Sub`           | —       | Submenu boundary; pass-through                           |
| `DropdownSubTrigger`    | `Dropdown.SubTrigger`    | ✓       | Row that opens a submenu; set its `anchor-name` here     |
| `DropdownSubContent`    | `Dropdown.SubContent`    | ✓ root  | The submenu panel; `placement` defaults to `submenu`     |

## Props (on `DropdownContent` / `DropdownSubContent`)

- **`size`** — `"xs" | "sm" | "md" | "lg" | "xl"` (default `"md"`). Re-points
  every child sizing knob (item height/padding/gap/radius/font, panel
  radius/padding, label, separator); `data-density` scales within each size.
- **`placement`** — `DropdownContent`: `"bottom-start"` (default) / `"bottom-end"`
  / `"top-start"` / `"top-end"`. `DropdownSubContent`: also `"submenu"` (its
  default — opens to the inline-end side). `position-try-fallbacks` auto-flips the
  panel when the chosen placement would overflow the viewport.

## Animation

The panel scales + fades in on open and **out in reverse on close** — CSS
transitions keyed off the native `:popover-open` state plus `@starting-style`;
`transition-behavior: allow-discrete` on `display` + `overlay` keeps it painted
in the top layer through the close so it animates out instead of snapping. Like
Popover this needs **no `forceMount`** — a native popover stays in the DOM. Both
phases use `--primitiv-motion-duration-overlay` with
`--primitiv-motion-easing-enter` / `-exit`; `prefers-reduced-motion: reduce`
drops them.

## Files

| File                 | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `dropdown.tsx`       | The styled wrapper (applies the recipe classes)               |
| `dropdown.recipe.ts` | `cva` recipes mapping `size` / `placement` + parts to classes |
| `styles.css`         | The default theme (panel, rows, placements, states)           |
| `styles.scss`        | The CSS plus `$primitiv-dropdown-*` Sass aliases              |
| `contract.json`      | The stable API surface (parts, modifiers, custom props)       |

## Dependencies

- [`@primitiv-ui/react`](https://www.npmjs.com/package/@primitiv-ui/react) — the
  headless `Dropdown` primitive.
- [`class-variance-authority`](https://www.npmjs.com/package/class-variance-authority)
  — the recipes.
