# SplitButton

One primary action welded to a chevron trigger that opens a menu of related
alternatives, bound into a single `role="group"` widget.

```sh
primitiv add split-button
```

Pulls in [`button`](../button/README.md) and [`dropdown`](../dropdown/README.md) —
both halves are real `Button`s and the menu is a real Dropdown panel.

## Usage

```tsx
import {
  SplitButton,
  SplitButtonAction,
  SplitButtonTrigger,
  SplitButtonMenu,
  SplitButtonItem,
} from "@/components";
import { ChevronDown } from "@primitiv-ui/icons";
import { VisuallyHidden } from "@primitiv-ui/react";

<SplitButton>
  <SplitButtonAction onClick={squashAndMerge}>Squash and merge</SplitButtonAction>
  <SplitButtonTrigger>
    <ChevronDown aria-hidden="true" />
    <VisuallyHidden>More merge options</VisuallyHidden>
  </SplitButtonTrigger>
  <SplitButtonMenu>
    <SplitButtonItem onSelect={mergeCommit}>Create a merge commit</SplitButtonItem>
    <SplitButtonItem onSelect={rebase}>Rebase and merge</SplitButtonItem>
  </SplitButtonMenu>
</SplitButton>;
```

`variant` and `size` go on the **root** and flow to both halves and the menu —
don't set them on the parts.

## Split button, not select

The left half runs the default action immediately; the right half opens a menu
of alternatives. Nothing here models a selected *value* — if that's what you
need, use `select`.

## Parts

| Export | Renders | Notes |
| --- | --- | --- |
| `SplitButton` | `<div role="group">` | Owns the menu's open state and the anchor |
| `SplitButtonAction` | a `Button` | The primary action; `ArrowDown` opens the menu |
| `SplitButtonTrigger` | a square `Button` | Name derived from the action |
| `SplitButtonMenu` | a Dropdown panel | Group-width, leading-aligned |
| `SplitButtonItem` | `role="menuitem"` | One alternative, with `onSelect` |
| `SplitButtonSeparator` | `role="separator"` | Divider between groups |

## Rows with icons

`SplitButton` re-exports only the two menu parts a split button almost always
needs. The root provides the Dropdown context, so every other Dropdown part
composes inside `SplitButtonMenu` directly:

```tsx
import { DropdownItemLeading, DropdownItemLabel } from "@/components";

<SplitButtonMenu>
  <SplitButtonItem onSelect={mergeCommit}>
    <DropdownItemLeading>
      <GitMerge aria-hidden="true" />
    </DropdownItemLeading>
    <DropdownItemLabel>Create a merge commit</DropdownItemLabel>
  </SplitButtonItem>
</SplitButtonMenu>;
```

## Variants

`primary` (default), `secondary`, `danger`.

**Ghost and link are deliberately unavailable.** Neither has a fill or border at
rest, so there is nothing for the seam to divide — a welded ghost pair reads as
a label with a stray chevron until you hover it, and link is a text run that a
bordered trigger contradicts outright.

## Anatomy notes

**The seam.** On `secondary` the two halves' borders are pulled into the same
pixel column by a negative margin, so they read as one hairline. On the solid
intents that isn't enough: `action/{intent}/border/default` resolves to exactly
the same value as the fill, so a filled button has no built-in edge to see. The
trigger's leading border is therefore re-coloured to
`--primitiv-split-button-seam`, one step darker than the fill.

**The trigger is square** — as wide as the control is tall, reusing
`framed-control/{size}/height`. A narrower chevron would need a token of its own
across five sizes and four density modes; if you want one, override
`--primitiv-split-button-trigger-inline-size` on the group instead.

**The focus ring is flush at the seam.** Button's ring is outset on all four
sides, which on a welded pair paints a band of focus colour on top of the
neighbouring half. Each half here draws its own ring as an overlay: outset on
the three outer edges, flush on the seam side, inner corners squared — so the
ring stays wholly inside its own half and still reads as a closed shape.

**Disabled** works three ways — the whole group, the action alone (alternatives
stay reachable), or the trigger alone. The seam steps down one stop whenever any
of them applies, so it doesn't read as a hard dark line across a washed-out
control.

**The menu is the group's width**, not its own natural width, and aligns to the
group's leading edge — the alternatives belong to the action, not to the
chevron. The group carries a per-instance `anchor-name` derived from `useId`, so
several split buttons on one page never collide. You don't wire anything.

## Custom properties

| Property | Defaults to |
| --- | --- |
| `--primitiv-split-button-seam` | `var(--primitiv-action-primary-active)` |
| `--primitiv-split-button-trigger-inline-size` | `var(--primitiv-framed-control-md-height)` |
| `--primitiv-split-button-ring-outset` | `calc(offset + width)` of the focus ring |
| `--primitiv-split-button-ring-radius` | `calc(button radius + ring outset)` |

Everything else — intent colours, sizing, elevation, menu rows — comes from
`button` and `dropdown`, so override those components' properties instead.

## Files

| File | What it is |
| --- | --- |
| `contract.json` | The styling contract — classes, modifiers, custom properties |
| `styles.css` | The default theme |
| `styles.scss` | The same CSS plus `$`-prefixed aliases |
| `split-button.recipe.ts` | `cva` class recipes |
| `split-button.tsx` | The typed React surface |
