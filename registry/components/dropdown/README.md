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

### Row slots — leading, label, trailing

Any row (`DropdownItem`, `DropdownCheckboxItem`, `DropdownRadioItem`,
`DropdownSubTrigger`) can carry a leading glyph and a trailing affordance
alongside its label, laid out as
`[indicator gutter][leading][label][trailing]`:

```tsx
<DropdownCheckboxItem checked={checked} onCheckedChange={setChecked}>
  <DropdownItemIndicator><Check /></DropdownItemIndicator>
  <DropdownItemLeading><ReactLogo /></DropdownItemLeading>
  <DropdownItemLabel>React</DropdownItemLabel>
  <DropdownItemTrailing>⌘1</DropdownItemTrailing>
</DropdownCheckboxItem>
```

`DropdownItemLabel` takes the row's free space, which is what keeps the leading
glyph hugging the gutter and the trailing content on the inline-end edge — **use
it whenever a row has a leading slot**, or the bare text node drifts away from
its glyph. A text-only row (or the long-standing `label + shortcut` shape) needs
none of the three and is unchanged.

`DropdownItemTrailing` is icon-height but free to grow inline, so a shortcut,
badge, or `<Kbd>` keeps its natural width while a plain icon still lands on the
row's icon scale.

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
| `DropdownItemLeading`   | —                        | ✓       | Presentational leading slot (icon square) inside a row   |
| `DropdownItemLabel`     | —                        | ✓       | Presentational row label; absorbs the row's free space   |
| `DropdownItemTrailing`  | —                        | ✓       | Presentational trailing slot; natural width, icon height |
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

## Collision handling

The panel is positioned with CSS anchor positioning and falls back in this
order when the chosen placement doesn't fit:

1. `flip-block` — swap above/below
2. `flip-inline` — swap start/end
3. both together
4. `--primitiv-dropdown-fit-above` / `--primitiv-dropdown-fit-below` — pin the
   far edge to the viewport and scroll

The order matters. Flips are tried first because a whole panel in open space
always beats a scrolling one; the clamping fallbacks come last because a
clamped panel *always* fits by construction, so listing them earlier would let
one win over a perfectly good flip.

The clamping fallbacks exist for the case flipping cannot solve: a menu **taller
than the viewport** overflows whichever way it faces. They touch only the block
axis, so the inline alignment chosen by the placement modifier survives and one
pair serves all four placements plus submenus.

`overflow` lives on the base rule, not in the `@position-try` blocks —
`@position-try` only accepts insets, margins, sizing and self-alignment.

### Bounding a long menu directly

Collision fallbacks only fire on a collision. A menu that is simply *long* — a
few hundred rows in open space — needs a cap:

```css
.my-long-menu {
  --primitiv-dropdown-max-block-size: 18rem;
}
```

`none` by default. The `pagination` component sets it, because a collapsed page
range can hide hundreds of numbers.


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
