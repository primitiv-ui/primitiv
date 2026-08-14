# combobox

An editable text field with a filtered popup listbox — the
[WAI-ARIA APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

```sh
primitiv add combobox
```

```tsx
import { useState } from "react";
import { Check, ChevronDown } from "@primitiv-ui/icons";
import {
  Combobox,
  ComboboxControl,
  ComboboxInput,
  ComboboxIcon,
  ComboboxContent,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxEmpty,
} from "@/components";

const FRAMEWORKS = ["React", "Preact", "Solid", "Svelte", "Vue"];

function FrameworkPicker() {
  const [query, setQuery] = useState("");
  const matches = FRAMEWORKS.filter((f) =>
    f.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Combobox onQueryChange={setQuery}>
      <ComboboxControl>
        <ComboboxInput aria-label="Framework" placeholder="Search frameworks..." />
        <ComboboxIcon>
          <ChevronDown />
        </ComboboxIcon>
      </ComboboxControl>
      <ComboboxContent aria-label="Frameworks">
        {matches.map((f) => (
          <ComboboxItem key={f} value={f}>
            <ComboboxItemIndicator>
              <Check />
            </ComboboxItemIndicator>
            {f}
          </ComboboxItem>
        ))}
        {matches.length === 0 && <ComboboxEmpty>No frameworks match</ComboboxEmpty>}
      </ComboboxContent>
    </Combobox>
  );
}
```

## Filtering is yours

There is deliberately **no `filter` prop**. `onQueryChange` reports every
keystroke and you render the options you want, which keeps async loading, fuzzy
matching and sorting where the data lives rather than inventing a filtering API
the component would have to own.

## Parts

| Export                  | Element   | Notes                                                                      |
| ----------------------- | --------- | -------------------------------------------------------------------------- |
| `Combobox`              | `<div>`   | The root. Owns open state, value, query and cursor; carries `size`         |
| `ComboboxControl`       | `<div>`   | The framed control — border, radius, height, focus ring. **Registry-only** |
| `ComboboxLeading`       | `<span>`  | Optional standing glyph at the start of the field. **Registry-only**       |
| `ComboboxInput`         | `<input>` | `role="combobox"`, the keyboard model, all the ARIA wiring                 |
| `ComboboxIcon`          | `<span>`  | The trailing chevron. Decorative. **Registry-only**                        |
| `ComboboxContent`       | `<div>`   | `role="listbox"` popup panel, **unmounted while closed**                    |
| `ComboboxItem`          | `<div>`   | `role="option"` row                                                        |
| `ComboboxItemIndicator` | `<span>`  | The selected mark. **Registry-only**                                       |
| `ComboboxItemLeading`   | `<span>`  | Optional leading slot inside a row. **Registry-only**                      |
| `ComboboxItemLabel`     | `<span>`  | The row's label — read the caveat below. **Registry-only**                  |
| `ComboboxItemTrailing`  | `<span>`  | Optional trailing slot inside a row. **Registry-only**                     |
| `ComboboxEmpty`         | `<div>`   | `role="presentation"` no-results message, never navigable                  |

## `size` goes on the root, once

Unlike `select` — where you match `size` on the trigger *and* the content —
`Combobox`'s root is a real `<div>` containing both halves, and every custom
property is declared on it. They inherit down the DOM tree, panel included
(custom properties inherit through the DOM, not the containing block), so one
prop sizes the control, the panel and the rows together:

```tsx
<Combobox size="sm">…</Combobox>
```

That matches the Figma set, which has a single `Size` axis.

## Two state signals on screen at once

This is the thing to understand before restyling:

- The **control keeps its full focus ring** for as long as the popup is open,
  because DOM focus never leaves the input — the input is the tab stop.
- The row **cursor** is `[data-highlighted]` — virtual focus, published as
  `aria-activedescendant` on the input. It is **not** `:focus`; a row never
  matches `:focus`, because focus stays in the field.

Both showing at once is correct. The ring says "keystrokes go here"; the tint
says "Enter picks this". Don't dim either one.

**Selection** is `[aria-selected="true"]` and is independent of the cursor, so a
row can be neither, either, or both. The cursor takes the heavier tint
(`action/secondary/default`) and pointer hover the lighter one
(`action/ghost/hover`) — hover must never reuse the cursor's tint, because
hovering does not move the cursor, so two rows would read as current at once.

## The label caveat

The headless layer derives the committed label from an item's children **only
when they are a plain string**. With elements inside, the item's `value` stands
in instead — so wrapping row text in `ComboboxItemLabel` changes what the field
shows after a commit.

A bare text node works fine in the row's flex layout, and
`ComboboxItemTrailing` pushes itself to the inline-end edge on its own, so a
`[mark][text][trailing]` row needs no label element. Reach for
`ComboboxItemLabel` when you want explicit truncation control, and either make
`value` the display label or accept the value as the closed-state text.

## The search flavour

Settled in the Figma exploration (§B1) as a documented variation, not a second
component — drop the chevron and put a magnifier in the leading slot:

```tsx
<ComboboxControl>
  <ComboboxLeading>
    <Search />
  </ComboboxLeading>
  <ComboboxInput aria-label="Search docs" placeholder="Search..." />
</ComboboxControl>
```

## Positioning wires itself

The control↔panel pair uses CSS anchor positioning, and there is **nothing to
set**: `Combobox` derives a unique ident from `useId()` and hands it to
`ComboboxControl` and `ComboboxContent` through context, so several comboboxes on
one page never collide. Your own `style.anchorName` / `style.positionAnchor`
still wins (spread order) if you need to anchor the panel to something else.

The panel is `position: fixed` and flips above the control when there is no room
below.

**It also carries an explicit `z-index`, and that is load-bearing.**
`position: fixed` escapes an ancestor's `overflow: hidden`, but the panel still
competes in the page's stacking contexts — the kitchen-sink's own
disabled-Combobox demo painted straight over it, because `opacity: 0.5` forms a
stacking context and sits later in the DOM. `--primitiv-combobox-content-z-index`
(default `1000`) is the knob.

The value works because none of the panel's ancestors forms a stacking context
(the root is a static `<div>`, and flex containers don't form one), so the panel's
nearest stacking context is the root element — which is also the limit: **a
z-index cannot escape a stacking context formed by an ancestor of the combobox
itself**, such as a transformed or opacity-reduced card. Portal the panel out for
that; the `Portal` primitive is the escape hatch.

The proper fix is the top layer, which is what every other popup in the library
uses. That belongs in the headless layer — `Select.Content` already drives
`showPopover()` — and is recorded in
[`docs/combobox-future-work.md`](../../../docs/combobox-future-work.md) §1.2.

The panel animates **in** only (via `@starting-style`): the headless layer removes
the node on close, so no rule can still match it to animate out.

## The chevron is decorative

`ComboboxIcon` is a `<span aria-hidden>`, and that is a real difference from
`SelectIcon`: Select's whole frame is a `<button>`, so a chevron click opens its
listbox for free. Here the frame is a `<div>` wrapping an `<input>`, and the
headless layer exposes no open-toggle a trigger could call — the popup opens on
typing or <kbd>↓</kbd>. The glyph is `pointer-events: none` so a click aimed at
it falls through to the field rather than landing on dead space.

Making it genuinely interactive needs a headless change; it is recorded in
[`docs/combobox-future-work.md`](../../../docs/combobox-future-work.md).

## No groups yet

`ComboboxGroup` / `ComboboxGroupLabel` are **not shipped**. Grouping needs the
headless layer to wire `role="group"` + `aria-labelledby` (as `Listbox`'s
headless does); a registry-only half-version would leave the consumer wiring ids
by hand, which is worse than not shipping it. Recorded in
[`docs/combobox-future-work.md`](../../../docs/combobox-future-work.md).

## Invalid and disabled

Both are read off the inner input with `:has()`, so set them there — or let a
`Field.Root` cascade `aria-invalid` down:

```tsx
<ComboboxInput aria-invalid="true" />
<ComboboxInput disabled />
```

Disabled uses Input's dimmed treatment (`opacity`), not Select's filled one,
because this control *is* an Input.

## Tokens

**No new tokens.** That is the headline outcome of the Figma exploration, and it
falls out of the two structural decisions: the control is Input verbatim, so it
resolves `framed-control/{size}/*`; the popup is a Dropdown panel, so it resolves
`dropdown/{size}/panel/*` and its rows `dropdown/{size}/item/*`. Every number is
density-responsive for free.

## Files

| File                 | What it is                                                              |
| -------------------- | ----------------------------------------------------------------------- |
| `combobox.tsx`       | The wrapper — hand-authored, 12 parts                                   |
| `combobox.recipe.ts` | `cva` recipes mapping the `size` prop to modifier classes               |
| `styles.css`         | The default theme (canonical). Yours to edit                            |
| `styles.scss`        | The same CSS plus `$`-prefixed aliases for every custom property        |
| `contract.json`      | The stable surface — parts, modifiers, data attributes, custom properties |

## Dependencies

- `@primitiv-ui/react` — the headless `Combobox` primitive
- `class-variance-authority` — the recipe
- the token layer (`primitiv tokens`)

No icon package: every glyph is yours to pass in.
