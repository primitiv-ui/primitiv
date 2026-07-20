# Popover

The **styled** Popover surface — a non-modal floating panel anchored to a
trigger, built on the native HTML Popover API. Borderless and shadow-defined,
with a pointer arrow and all twelve placements via CSS anchor positioning. It
wraps the headless [`Popover`](../../../packages/react/src/Popover/README.md)
primitive; behaviour (open/close, light-dismiss, focus) lives there, styling
lives here.

```sh
primitiv add popover
```

## Usage

Positioning is CSS anchor positioning — no JS measurement. Wire an `anchor-name`
onto the trigger (or `PopoverAnchor`) and a matching `position-anchor` onto the
content, then pick a `placement`:

```tsx
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
} from "@/components/popover";

<Popover>
  <PopoverTrigger style={{ anchorName: "--filters" }}>Filters</PopoverTrigger>
  <PopoverContent
    placement="bottom-start"
    size="md"
    style={{ positionAnchor: "--filters" }}
  >
    <PopoverTitle>Filters</PopoverTitle>
    <PopoverDescription>Narrow the results below.</PopoverDescription>
    {/* body */}
    <PopoverClose>Done</PopoverClose>
  </PopoverContent>
</Popover>;
```

> Each popover instance needs a **unique** `anchor-name` — reusing one name
> across instances makes the anchor ambiguous. Reach for `PopoverAnchor` when the
> panel should anchor to something larger than the trigger (e.g. a whole input
> group).

## Parts

| Export                 | Wraps                  | Styled? | Notes                                                        |
| ---------------------- | ---------------------- | ------- | ----------------------------------------------------------- |
| `Popover`              | `Popover.Root`         | —       | State owner; renders no DOM (pass-through)                   |
| `PopoverTrigger`       | `Popover.Trigger`      | —       | Pass-through; set `anchor-name` here                        |
| `PopoverAnchor`        | `Popover.Anchor`       | —       | Pass-through; optional larger anchor                        |
| `PopoverContent`       | `Popover.Content`      | ✓ root  | The panel; carries `size` + `placement`; owns the `::after` arrow |
| `PopoverTitle`         | `Popover.Title`        | ✓       | Accessible name (`aria-labelledby`)                          |
| `PopoverDescription`   | `Popover.Description`  | ✓       | Accessible description (`aria-describedby`)                  |
| `PopoverClose`         | `Popover.Close`        | ✓       | Frameless by default; compose a ghost `Button` via `asChild` |

## Props (on `PopoverContent`)

- **`size`** — `"sm" | "md" | "lg" | "xl"` (default `"md"`). Radius, padding, gap
  and arrow size; `data-density` scales the padding within each size.
- **`placement`** — one of the twelve `top` / `top-start` / `top-end` / `right` /
  `right-start` / `right-end` / `bottom` (default) / `bottom-start` /
  `bottom-end` / `left` / `left-start` / `left-end`. Sets the CSS `position-area`
  and points the arrow at the anchor. `position-try-fallbacks` auto-flips the
  panel to the opposite side if the chosen placement would overflow.

## The arrow

The pointer arrow is a `::after` pseudo-element on the panel — a rotated square
sharing the panel fill, half tucked under the panel edge so the join is seamless
and the outer half reads as a solid tail. There is no separate arrow element to
render; it follows the `placement` automatically. It scales with `size` (the
`--primitiv-popover-arrow-size` knob).

## Dark mode

The panel binds to `--primitiv-surface-floating`, which is white in light mode
(the shadow lifts it) and a lighter elevated surface in dark mode (`#1e2126`) —
because a shadow doesn't read on a dark background, elevation is shown with a
lighter surface instead. Borderless works in both themes as a result.

## Files

| File                | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `popover.tsx`       | The styled wrapper (applies the recipe classes)            |
| `popover.recipe.ts` | `cva` recipe mapping `size` / `placement` to classes       |
| `styles.css`        | The default theme (panel, arrow, placements, states)       |
| `styles.scss`       | The CSS plus `$primitiv-popover-*` Sass aliases            |
| `contract.json`     | The stable API surface (parts, modifiers, custom props)    |

## Dependencies

- [`@primitiv-ui/react`](https://www.npmjs.com/package/@primitiv-ui/react) — the
  headless `Popover` primitive.
- [`class-variance-authority`](https://www.npmjs.com/package/class-variance-authority)
  — the recipe.
