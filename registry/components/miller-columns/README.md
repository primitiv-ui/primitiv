# MillerColumns

A horizontal strip of vertical lists where selecting a node reveals its
children in the next column — the macOS Finder "column view". Columns are
drag- and keyboard-resizable, and an optional trailing pane previews the
current selection.

Installed by:

```sh
primitiv add miller-columns
```

Wraps the headless `MillerColumns` compound from `@primitiv-ui/react`, which
owns the selection path, the roving tabindex, typeahead and the resize
splitter. This surface adds the styling and a chevron.

## Usage

The tree is authored by **recursive composition** — there is no `data` prop.
An item becomes a *branch* by nesting a `<MillerColumnsColumn>` among its
children; an item with no nested column is a *leaf*. Although child columns
are written nested, every column is projected into the strip so they sit
side by side.

```tsx
import {
  MillerColumns,
  MillerColumnsColumn,
  MillerColumnsItem,
  MillerColumnsItemIndicator,
  MillerColumnsPreviewPanel,
  MillerColumnsResizeHandle,
} from "@/components";

function Node({ node }) {
  return (
    <MillerColumnsItem value={node.id}>
      {node.label}
      {node.children?.length ? (
        <>
          <MillerColumnsItemIndicator />
          <MillerColumnsColumn>
            <MillerColumnsResizeHandle aria-label={`Resize ${node.label}`} />
            {node.children.map((child) => (
              <Node key={child.id} node={child} />
            ))}
          </MillerColumnsColumn>
        </>
      ) : null}
    </MillerColumnsItem>
  );
}

<MillerColumns size="md" aria-label="Files" defaultValue={["documents"]}>
  <MillerColumnsColumn>
    <MillerColumnsResizeHandle aria-label="Resize column" />
    {tree.map((node) => (
      <Node key={node.id} node={node} />
    ))}
  </MillerColumnsColumn>
  <MillerColumnsPreviewPanel>
    <FilePreview />
  </MillerColumnsPreviewPanel>
</MillerColumns>;
```

### Reading the selection

The preview pane is content-agnostic, so *what* it shows is up to you. Read
the current selection with `useMillerColumnsSelection` from **the headless
package** — the registry surface does not re-export it:

```tsx
import { useMillerColumnsSelection } from "@primitiv-ui/react";

function FilePreview() {
  const { path, selectedValue } = useMillerColumnsSelection();
  if (!selectedValue) {
    return <p className="primitiv-miller-columns__empty">Nothing selected</p>;
  }
  return <Preview id={selectedValue} />;
}
```

It returns the full active `path` (ids, root column first) and the deepest
`selectedValue` (`undefined` when nothing is selected). It works in both
controlled and uncontrolled strips, and throws if called outside a
`MillerColumns`.

### Resizing

`MillerColumnsResizeHandle` is the WAI-ARIA window splitter. Drag it, or
focus it and use the arrow keys:

```tsx
<MillerColumnsResizeHandle
  aria-label="Resize column"
  minWidth={120}
  maxWidth={400}
  step={10}
/>
```

`minWidth` / `maxWidth` bound both the drag and the keys, and back
`aria-valuemin` / `aria-valuemax`. **Give it an `aria-label`** — without one
it announces as an unnamed separator.

## Props

### `MillerColumns`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Row and column size for the whole strip |

All the headless `MillerColumns.Root` props pass through — `defaultValue` /
`value` + `onValueChange`, and `dir`. **`aria-*` props land on the inner
`role="tree"` element**, everything else on the strip container.

### `MillerColumnsColumn`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `emptyLabel` | `ReactNode` | `"This folder is empty"` | Shown when the column holds no items; `null` for a silent column |

## Patterns and gotchas

**Two elements at the root.** `MillerColumns` renders the strip container
*and*, inside it, the `role="tree"` widget holding only the columns. A tree
may own nothing but `treeitem` and `group`, so the preview pane is a sibling
of the tree rather than a child. The strip is the horizontal scroll
container; style it with `.primitiv-miller-columns`, and the tree — which
the headless owns outright — with `[data-miller-columns-tree]`.

**Ancestors and the terminal row are tinted differently, on purpose.** Every
item on the active path is `data-state="selected"`; the deepest one — the row
actually clicked — also carries `data-terminal`. Styling them alike loses the
depth cue entirely: with a uniform selected state there is no way to tell
which of several highlighted rows was chosen. Ancestors sit at the hover
value and the terminal row a step above, which is why **hovering a path row
does nothing** — its tint is carrying selection, not pointer state.

**Rows are full-bleed and square.** A band spans the column edge to edge. A
radius would leave the column's field showing at each corner and read as
floating rather than as this row of this list. There is no item radius token;
the only rounded thing is the focus ring.

**The focus ring is inset**, where Button and Tree draw theirs outset. A
column is `overflow-y: auto`, and per CSS Overflow 3 an axis set to `visible`
computes to `auto` when the other is not — so a column can never be
`overflow-x: visible`, and an outset ring is always clipped at its edges. It
is drawn as a `::before` inset by the ring offset with its own
`border-radius`; an inset `box-shadow` would take the band's square corners
instead of rounding.

**The resize grip lives inside the column's clip**, for the same reason —
anything hanging past the padding box is cut. Its 6px target reaches inward
from the seam and is never painted. At rest the grip paints nothing at all:
the hairline you see is the column's own border, so nothing doubles up. On
approach the ink grows out of that border and darkens, and on leave it
shrinks back in — both the width and the colour transition, so it eases in
each direction. While the grip is live the column's border steps aside so the
seam is the ink alone.

**Seams.** Every column draws one trailing hairline, the last one included —
so a column always reads as a column, even where the strip is wider than its
contents and the rest is empty field. The pane never draws a leading border:
one hairline per seam, always owned by the column to its left.

**Empty columns.** Selecting a childless branch opens a column with nothing
in it, so there are no children through which to pass a message. The wrapper
always renders the empty line and the stylesheet reveals it under
`[data-empty]` — whether a column is empty is the headless component's
answer, derived from its registered items, and cannot be inferred from
`children` (a column holding only a `ResizeHandle` has a child but no items).

**No multi-select, by decision.** The selection *is* the path: column N+1
exists because exactly one item in column N is chosen, so two selections in
a column leave the next column undefined. To mark many nodes, keep that set
yourself and render it as content inside each item.

## Files

| File | Purpose |
| --- | --- |
| `miller-columns.tsx` | The styled wrapper components |
| `miller-columns.recipe.ts` | `cva` recipes mapping variants to modifier classes |
| `styles.css` | The default theme (canonical) |
| `styles.scss` | The same theme plus `$`-prefixed aliases |
| `contract.json` | The stable surface: parts, modifiers, data attributes, custom properties |

## Dependencies

- `@primitiv-ui/react` — the headless `MillerColumns` compound
- `class-variance-authority` — the recipe layer
- The token layer (`primitiv tokens`) for the `--primitiv-miller-columns-*`,
  `--primitiv-tree-row-*`, `--primitiv-content-*`, `--primitiv-border-*`,
  `--primitiv-action-*`, `--primitiv-body-*`, `--primitiv-focus-*`,
  `--primitiv-surface-*` and `--primitiv-motion-*` custom properties

No component dependencies: the chevron ships inline, so nothing else needs
installing.
