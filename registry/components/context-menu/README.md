# ContextMenu

The **styled** ContextMenu surface — a right-click / long-press context menu
built on the native HTML Popover API. The same bordered, shadow-defined panel
of selectable rows (plain items, checkbox/radio items, submenus) as
[Dropdown](../dropdown/README.md), positioned at the pointer instead of
anchored to a trigger. It wraps the headless
[`ContextMenu`](../../../packages/react/src/ContextMenu/README.md) primitive;
behaviour (open/close, keyboard, typeahead, focus, submenus) lives there,
styling lives here.

```sh
primitiv add context-menu
```

## Usage

No positioning wiring is required for the menu itself — the headless layer
already places `ContextMenuContent` at the cursor:

```tsx
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/context-menu";

<ContextMenu>
  <ContextMenuTrigger asChild>
    <div className="canvas">Right-click anywhere on this canvas</div>
  </ContextMenuTrigger>
  <ContextMenuContent size="md">
    <ContextMenuItem onSelect={rename}>Rename</ContextMenuItem>
    <ContextMenuItem onSelect={duplicate}>Duplicate</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem disabled>Archive</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>;
```

### Flipping on viewport overflow (optional)

`ContextMenuContent` opens correctly at the cursor with zero configuration.
To also make it flip to the opposite side when it would overflow the
viewport, wire a **unique** `anchor-name` onto the Trigger's host element and
a matching `position-anchor` onto Content — `position-try-fallbacks` needs the
box to be anchor-positioned to engage at all, even though the fallbacks below
don't read the anchor's geometry (there's no anchor to flip a cursor position
around; they recompute the opposite edge from the pointer coordinates instead):

```tsx
<ContextMenuTrigger asChild>
  <div className="canvas" style={{ anchorName: "--menu" }}>
    Right-click here
  </div>
</ContextMenuTrigger>
<ContextMenuContent style={{ positionAnchor: "--menu" }} />
```

Each menu instance needs its own anchor name, the same rule as Dropdown.

### Submenus

Submenus use real CSS anchor positioning against their `SubTrigger` — the
identical mechanism as Dropdown's subs, `anchor-name` + `position-anchor`
required either way:

```tsx
<ContextMenu.Sub>
  <ContextMenuSubTrigger style={{ anchorName: "--share" }}>
    Share
  </ContextMenuSubTrigger>
  <ContextMenuSubContent style={{ positionAnchor: "--share" }}>
    <ContextMenuItem>Email</ContextMenuItem>
    <ContextMenuItem>Copy link</ContextMenuItem>
  </ContextMenuSubContent>
</ContextMenu.Sub>
```

### Checkbox / radio items

`ContextMenuCheckboxItem` and `ContextMenuRadioItem` reserve an inline-start
gutter for a `ContextMenuItemIndicator` — the menu-convention checkmark (`✓`)
or dot (`•`) the consumer supplies. The gutter is held whether or not the mark
is mounted, so checked and unchecked rows keep their labels aligned:

```tsx
<ContextMenuCheckboxItem onSelect={(e) => e.preventDefault()}>
  <ContextMenuItemIndicator>✓</ContextMenuItemIndicator>
  Show bookmarks
</ContextMenuCheckboxItem>
```

### Row slots — leading, label, trailing

Any row (`ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`,
`ContextMenuSubTrigger`) can carry a leading glyph and a trailing affordance
alongside its label, laid out as
`[indicator gutter][leading][label][trailing]`:

```tsx
<ContextMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>
  <ContextMenuItemIndicator><Check /></ContextMenuItemIndicator>
  <ContextMenuItemLeading><ReactLogo /></ContextMenuItemLeading>
  <ContextMenuItemLabel>React</ContextMenuItemLabel>
  <ContextMenuItemTrailing>⌘1</ContextMenuItemTrailing>
</ContextMenuCheckboxItem>
```

`ContextMenuItemLabel` takes the row's free space, which is what keeps the
leading glyph hugging the gutter and the trailing content on the inline-end
edge — **use it whenever a row has a leading slot**, or the bare text node
drifts away from its glyph. A text-only row (or the long-standing
`label + shortcut` shape) needs none of the three and is unchanged.

`ContextMenuItemTrailing` is icon-height but free to grow inline, so a
shortcut, badge, or `<Kbd>` keeps its natural width while a plain icon still
lands on the row's icon scale.

## Parts

| Export                     | Wraps                       | Styled? | Notes                                                    |
| --------------------------- | --------------------------- | ------- | -------------------------------------------------------- |
| `ContextMenu`               | `ContextMenu.Root`          | —       | State owner; renders no DOM (pass-through)               |
| `ContextMenuTrigger`        | `ContextMenu.Trigger`       | —       | Pass-through `<span>`; the right-click target            |
| `ContextMenuContent`        | `ContextMenu.Content`       | ✓ root  | The panel; carries `size` only (positioned at the cursor) |
| `ContextMenuItem`           | `ContextMenu.Item`          | ✓       | A selectable row                                          |
| `ContextMenuCheckboxItem`   | `ContextMenu.CheckboxItem`  | ✓       | Togglable row; holds an indicator gutter                  |
| `ContextMenuRadioItem`      | `ContextMenu.RadioItem`     | ✓       | Single-select row; holds an indicator gutter              |
| `ContextMenuItemIndicator`  | `ContextMenu.ItemIndicator` | ✓       | The `✓` / `•` mark inside a checkbox/radio row            |
| `ContextMenuItemLeading`    | —                           | ✓       | Presentational leading slot (icon square) inside a row    |
| `ContextMenuItemLabel`      | —                           | ✓       | Presentational row label; absorbs the row's free space    |
| `ContextMenuItemTrailing`   | —                           | ✓       | Presentational trailing slot; natural width, icon height  |
| `ContextMenuLabel`          | `ContextMenu.Label`         | ✓       | Uppercase section header                                  |
| `ContextMenuSeparator`      | `ContextMenu.Separator`     | ✓       | Thin rule between groups                                  |
| `ContextMenuGroup`          | `ContextMenu.Group`         | ✓       | Semantic grouping of related rows                          |
| `ContextMenuRadioGroup`     | `ContextMenu.RadioGroup`    | ✓       | Single-select container for `ContextMenuRadioItem`s        |
| `ContextMenuSub`            | `ContextMenu.Sub`           | —       | Submenu boundary; pass-through                             |
| `ContextMenuSubTrigger`     | `ContextMenu.SubTrigger`    | ✓       | Row that opens a submenu; set its `anchor-name` here       |
| `ContextMenuSubContent`     | `ContextMenu.SubContent`    | ✓ root  | The submenu panel; `placement` defaults to `submenu`       |

## Props

- **`size`** (`ContextMenuContent` / `ContextMenuSubContent`) —
  `"xs" | "sm" | "md" | "lg" | "xl"` (default `"md"`). Re-points every child
  sizing knob (item height/padding/gap/radius/font, panel radius/padding,
  label, separator) — the same size scale as Dropdown; `data-density` scales
  within each size.
- **`placement`** (`ContextMenuSubContent` only) — `"bottom-start"` /
  `"bottom-end"` / `"top-start"` / `"top-end"` / `"submenu"` (the default —
  opens to the inline-end side). `ContextMenuContent` has no `placement`
  prop; the root panel is always positioned at the pointer.

## Why this reuses Dropdown's tokens

The row anatomy, states, and sizing are identical to Dropdown's — Figma builds
this component's rows by reusing Dropdown's `Item` / `CheckboxItem` /
`RadioItem` / `SubTrigger` sets via slots rather than duplicating them. The
stylesheet mirrors that: every `--primitiv-context-menu-item-*` /
`-label-*` / `-separator-*` knob resolves the matching
`--primitiv-dropdown-{size}-*` token rather than a parallel token ramp, so a
context menu row is pixel-identical to a Dropdown row without this component
depending on the `dropdown` one. Re-point any of those custom properties to
break the tie.

## Animation

The panel scales + fades in on open and **out in reverse on close** — CSS
transitions keyed off the native `:popover-open` state plus `@starting-style`;
`transition-behavior: allow-discrete` on `display` + `overlay` keeps it painted
in the top layer through the close so it animates out instead of snapping.
Both phases use `--primitiv-motion-duration-overlay` with
`--primitiv-motion-easing-enter` / `-exit`; `prefers-reduced-motion: reduce`
drops them.

## Files

| File                      | Purpose                                                        |
| -------------------------- | --------------------------------------------------------------- |
| `context-menu.tsx`         | The styled wrapper (applies the recipe classes)                 |
| `context-menu.recipe.ts`   | `cva` recipes mapping `size` / `placement` + parts to classes   |
| `styles.css`               | The default theme (panel, rows, placements, states)             |
| `styles.scss`              | The CSS plus `$primitiv-context-menu-*` Sass aliases             |
| `contract.json`            | The stable API surface (parts, modifiers, custom props)         |

## Dependencies

- [`@primitiv-ui/react`](https://www.npmjs.com/package/@primitiv-ui/react) —
  the headless `ContextMenu` primitive.
- [`class-variance-authority`](https://www.npmjs.com/package/class-variance-authority)
  — the recipes.
