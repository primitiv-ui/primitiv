# `list` — registry entry

The artefacts `primitiv add list` resolves and copies into a consumer repo —
the styled `<ul>`/`<ol>` from RFC 0023 / RFC 0012 D9. Like `prose`, `list`
has **no headless `@primitiv-ui/react` counterpart**: `<List>` carries zero
interactive behaviour, so it ships entirely from the registry.

## What it does

`List` renders custom, token-coloured markers instead of native `::marker`
styling — a static bullet for `type="unordered"`, a CSS counter for
`type="ordered"` — so both the marker colour (`list/marker/foreground`) and
the marker↔text gap (`list/marker-gap`) are directly controllable. The
browser's native `::marker` pseudo-element has no controllable gap in
standard CSS, so it can't reproduce Figma's bespoke marker + `itemSpacing`
model; the CSS-generated `::before` approach here matches it exactly.

- `type` — `"unordered"` (bullet, the default) or `"ordered"` (numbered);
  drives both the rendered element (`<ul>`/`<ol>`) and the marker content.
- `indent` — `boolean` (default `true`). Applies the `list/indent` left
  padding; set `false` for flush/inline contexts where a parent already
  supplies the indentation.
- `size` — `"xs" | "sm" | "md" | "lg" | "xl"` (default `"md"`). Scales the
  item text only — `item-gap`, `marker-gap` and `indent` are density-scaled
  Context tokens shared across every size, not size-varied (RFC 0012 D9).

`List.Item` renders the `<li>`, and takes one prop:

- `disabled` — `boolean` (default `false`). Dims the whole row (marker
  included) to 50%, matching the Figma `ListItem` set's second axis
  (`State=default|disabled`) and RFC 0012 D9's "Disabled = `opacity 0.5` on
  component frame". **Presentational only**: an `<li>` isn't interactive, so
  this publishes the `data-disabled` styling hook and nothing else — it does
  not remove anything focusable inside the row from the tab order, which
  stays the consumer's job.

### One deliberate difference from the Figma build

Figma's `ListItem` frame carries **2px of block padding** (top and bottom) on
every size variant. It is an **unbound raw literal** — no token binding on
either edge, confirmed via the Figma Desktop Bridge, and identical across all
five sizes, so it doesn't move with `size` *or* `[data-density]` the way every
token-backed spacing value in the system does. It is **deliberately not
reproduced here**: with `list/item-gap` already supplying the density-scaled
row rhythm (RFC 0012 D9's actual spacing decision), the extra 2px is a fixed
nudge with no token home, and inventing a `list/item-padding-block` family to
carry it would tokenize a value the design never treated as one. The web rows
therefore sit `list/item-gap` apart; the Figma rows sit `list/item-gap` + 4px
apart. Worth revisiting if the Figma side ever binds it.

### The item's `margin-block` is zeroed, or the row rhythm doubles

`primitiv.reset` spaces bare list items with `li + li { margin-block-start:
var(--primitiv-list-item-gap) }`, and this component spaces them with flex `gap`
on the container — resolving the **same token**. Margins don't collapse in a flex
container, so the two were *adding*: every gap rendered at exactly **2×**
`list/item-gap`. Measured across the density modes before the fix: 4/8/16/24px
against a token of 2/4/8/12px.

Because both sides resolved the same token, the result stayed proportional and
looked like a deliberately airy list rather than a bug — which is why it survived
the original build. It also made the note above wrong: the web rows were sitting
2× `list/item-gap` apart, not `list/item-gap`.

`.primitiv-list__item` therefore declares `margin-block: 0`. Zeroing it (rather
than dropping the container's `gap` and leaning on the reset) keeps the component
self-contained: the marker is a `::before` on the item, so the row has to be a
flex container anyway, and a consumer who loads this sheet without the reset still
gets the right rhythm. The override lands because both are declarations **on the
same element**, which is the only case where layer order arbitrates —
`primitiv.base` outranks `primitiv.reset`.

## Usage

```tsx
import { List } from "@/components/list";

<List type="unordered" indent>
  <List.Item>First</List.Item>
  <List.Item>Second</List.Item>
</List>

<List type="ordered" size="sm">
  <List.Item>Install the CLI</List.Item>
  <List.Item>Add every component</List.Item>
</List>
```

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the `.primitiv-list` root class, the `--unordered`/`--ordered`, `--indent` and `--xs…--xl` modifiers, the `.primitiv-list__item` part, and the `--primitiv-list-*` custom properties. |
| `styles.css` | **authored** | The canonical default theme: the marker/counter machinery + type scale, in `@layer primitiv.base`/`primitiv.variants`, plus the disabled row in `primitiv.states`. |
| `styles.scss` | **authored** | `styles.css` plus a trailing `$`-alias block, one `$primitiv-list-<prop>` per custom property. |
| `list.recipe.ts` | **authored** | `cva("primitiv-list", { variants: { type, indent, size } })`. |
| `list.tsx` | **authored** | The `<List>`/`<List.Item>` wrappers. Hand-written (there is no primitive to generate from): `List` swaps its rendered element between `<ul>`/`<ol>` off the `type` prop; `List.Item` is a thin `<li>` that maps its `disabled` prop onto the `data-disabled` hook. |

Because there is no headless primitive, `list.tsx`/`list.recipe.ts` are
**not** generated by `primitiv-emit` and carry **no drift-guard test**
(contrast the generated wrappers, D53). `list.tsx` is type-checked in CI by
`scripts/check-registry-types.mjs` like every other registry wrapper.

## Tokens

`list` consumes the shared, density-scaled `list/item-gap`, `list/marker-gap`
and `list/indent` Context tokens directly — like `prose` does with `flow/*`,
they are **not** re-declared under a component-owned name, since they are
meant to be shared rather than component-specific. It also owns
`--primitiv-list-marker-color` (aliasing the Intent token
`list/marker/foreground` → `content/secondary`) and the `body/*`-aliased type
scale. No new tokens were added for this component (RFC 0012 D9).
