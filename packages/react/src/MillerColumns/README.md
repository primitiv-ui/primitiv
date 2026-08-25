# MillerColumns

A compound component for the **Miller columns** pattern (also called
cascading lists or the macOS Finder "column view"): a horizontal strip
of vertical lists where selecting a node reveals its children in the
next column to the right.

```tsx
import { MillerColumns } from "@primitiv-ui/react";

function Node({ node }) {
  return (
    <MillerColumns.Item value={node.id}>
      {node.label}
      {node.children?.length ? (
        <>
          <MillerColumns.ItemIndicator>▸</MillerColumns.ItemIndicator>
          <MillerColumns.Column>
            {node.children.map((child) => (
              <Node key={child.id} node={child} />
            ))}
          </MillerColumns.Column>
        </>
      ) : null}
    </MillerColumns.Item>
  );
}

<MillerColumns.Root defaultValue={["docs", "guides"]}>
  <MillerColumns.Column>
    {tree.map((node) => (
      <Node key={node.id} node={node} />
    ))}
  </MillerColumns.Column>
</MillerColumns.Root>;
```

## Authoring model

The tree is authored by **recursive composition** — there is no `data`
prop. An `Item` becomes a *branch* by nesting a
`<MillerColumns.Column>` among its children; that nested column lists
the item's children, each of which is another `Item`. An `Item` with no
nested column is a *leaf*.

Although child columns are authored nested, every `Column` is
**portal-projected** into the `Root` strip, so the active columns sit
side-by-side in a single left-to-right row regardless of how deeply
they were declared.

A branch's nested column is only **mounted while that branch is
selected**, so a consumer's recursive `Node` component naturally stops
recursing at inactive branches — only the columns along the active path
are ever rendered.

## Sub-components

| Export                       | Role          | Notes                                                                                          |
| ----------------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| `MillerColumns.Root`          | State owner   | Uncontrolled (`defaultValue`) or controlled (`value` + `onValueChange`); renders the strip     |
| `MillerColumns.Column`        | List          | A vertical list of items, projected into the strip as `role="group"`                           |
| `MillerColumns.Item`          | Tree node     | A `role="treeitem"`; branch when it nests a `Column`. Supports `disabled`, `asChild`, `ref`     |
| `MillerColumns.ItemIndicator` | Icon wrapper  | Decorative `aria-hidden` icon, rendered only for branch items                                  |
| `MillerColumns.ResizeHandle`  | Resize grip   | A focusable `role="separator"` window splitter — drag or arrow-key it to set its column's width |
| `MillerColumns.PreviewPanel`  | Preview pane  | A content-agnostic trailing panel; pair with `useMillerColumnsSelection`                        |

## Selection model

The selection is a single **active path** — an array of item ids from
the root column down to the deepest selected item. Selecting an item at
depth _d_ truncates the path to _d_ and appends the new id, so every
column deeper than _d_ closes.

- **Uncontrolled** — pass `defaultValue` (or omit it to start with
  nothing selected).
- **Controlled** — pass `value` and `onValueChange` together. The
  parent owns the path; the component defers every change back through
  the callback.

The two shapes are discriminated at the type level: passing
`defaultValue` alongside `value` is a type error.

**Single path only, by decision.** There is no multi-select and there is
not going to be one — this is settled, not a v1 shortfall awaiting a
follow-up. A Miller strip's whole premise is that the selection *is* the
path: column N+1 exists because exactly one item in column N is chosen.
Two selections in a column have no defined answer for what the next
column should show. A consumer needing to mark many nodes should keep
that set themselves and render it as content inside each `Item` (a
checkbox, a badge), leaving the path to mean navigation.

Every item on the path renders `data-state="selected"`, including the
ancestors the path merely passes through. The **deepest** one also gets
`data-terminal`. Style the two apart — with a uniform selected state
there is no way to tell which of several highlighted rows was actually
clicked.

## Keyboard interaction

| Key                 | Behaviour                                                              |
| ------------------- | ---------------------------------------------------------------------- |
| `ArrowUp` / `ArrowDown` | Move focus within the focused column (wraps, skips disabled items) |
| `Home` / `End`      | Focus the first / last item of the focused column                      |
| `Enter` / `Space`   | Select the focused item                                                |
| `ArrowRight`        | Branch: select it and move focus to its child column's first item; leaf: no-op |
| `ArrowLeft`         | Move focus to the selected item of the parent column                   |
| `Tab`               | Move into / out of the whole tree (single tabstop)                     |
| Printable character | Typeahead — focus the first item in the column whose label matches     |

Under `dir="rtl"` the horizontal pair is mirrored: `ArrowLeft` steps
*into* a branch's child column and `ArrowRight` walks back out, so the
step-in key always points at the column it opens. `dir` is inherited
from a `DirectionProvider` ancestor when omitted.

Typeahead accumulates keystrokes into a prefix query that resets after
500 ms of inactivity; repeating one character cycles through the items
starting with it. The query is scoped to the **focused item's own
column** — each column is an independent list, so typing never jumps the
cursor sideways.

The strip is a single roving-tabindex widget: exactly one item is
tabbable at a time. The tabstop follows the last-focused item and
defaults to the deepest selected item, falling back to the first item
of the root column.

## Auto-scroll

When selecting a branch reveals a new column, the strip scrolls to its
trailing edge so the newly opened column is brought into view. This
fires only when a column is *added* — neither the initial render nor
closing a column scrolls the strip. Scrolling only has a visible
effect when the strip is itself an overflow container; give
`[data-miller-columns-strip]` an `overflow-x` for it to take hold.

## ARIA

`Root` renders **two** elements: an outer strip container you lay out and
scroll, and an inner `role="tree"` widget holding only the columns. A
tree may own nothing but `treeitem` and `group`, so the `PreviewPanel`
sits outside it.

Because of that split, **`aria-*` props go to the tree widget** and every
other prop (`className`, `id`, `style`, `data-*`) goes to the strip
container:

```tsx
<MillerColumns.Root aria-label="Files" className="strip">
```

- The tree widget is `role="tree"`.
- Each `Column` is `role="group"`.
- Each `Item` is `role="treeitem"` with `aria-level` (1-based column
  depth), `aria-selected`, and — on branch items — `aria-expanded`.

## Disabled items

Pass `disabled` on an `Item` to render `aria-disabled="true"` and
`data-disabled`, ignore clicks and activation keys, and skip the item
during arrow-key navigation. Disabled items remain in the DOM and
focusable for discovery.

## Resizable columns

Drop a `MillerColumns.ResizeHandle` among a `Column`'s children to make
that column drag-resizable. The handle renders a
`<div role="separator" aria-orientation="vertical">`; while it is
pointer-dragged it drives that column's width as state on the `Root`,
applied as the column's inline `width`.

```tsx
<MillerColumns.Column className="column">
  <MillerColumns.ResizeHandle className="resize-handle" />
  {items}
</MillerColumns.Column>
```

The handle ships with no styles or position — give it a width and pin
it to the column's trailing edge yourself:

```css
.column {
  position: relative;
}
.resize-handle {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  width: 6px;
  cursor: col-resize;
}
.resize-handle[data-dragging] {
  /* feedback while a drag is in progress */
}
```

The first drag measures the column's current rendered width and
resizes from there; later drags resume from the last resized width.

The handle is a full WAI-ARIA **window splitter**: it is focusable, and
arrow keys resize it. Pass `minWidth` / `maxWidth` / `step` to bound and
pace that (they clamp pointer drags too, so CSS `min-width` is no longer
the only floor).

| Prop       | Default    | Effect                                             |
| ---------- | ---------- | -------------------------------------------------- |
| `minWidth` | `0`        | Floor for drag and keys; published as `aria-valuemin` |
| `maxWidth` | `Infinity` | Ceiling; published as `aria-valuemax` only when finite |
| `step`     | `10`       | Pixels moved per arrow-key press                    |

| Key                       | Behaviour                          |
| ------------------------- | ---------------------------------- |
| Inline-end arrow          | Widen the column by `step`         |
| Inline-start arrow        | Narrow the column by `step`        |
| `Home` / `End`            | Jump to `minWidth` / `maxWidth`    |

The arrow pair mirrors under `dir="rtl"`. `End` does nothing while
`maxWidth` is unbounded — there is no largest width to jump to.

`aria-valuenow` tracks the column's real rendered width via a
`ResizeObserver`, so it is correct before the first resize and follows
CSS- or container-driven changes as well.

**Give the handle an accessible name** — without one it announces as an
unnamed separator:

```tsx
<MillerColumns.ResizeHandle
  aria-label="Resize column"
  minWidth={120}
  maxWidth={400}
/>
```

## Preview panel

`MillerColumns.PreviewPanel` is a trailing pane — the macOS-Finder
"preview" column — rendered as the last child of the strip, to the
right of the columns. It is deliberately **content-agnostic**: the
component cannot know how to preview an item, so the consumer decides
what the panel shows. Author it as the last child of `Root`, a sibling
of the root `Column`:

```tsx
<MillerColumns.Root>
  <MillerColumns.Column>{items}</MillerColumns.Column>
  <MillerColumns.PreviewPanel>
    <FilePreview />
  </MillerColumns.PreviewPanel>
</MillerColumns.Root>
```

To render content for whatever is selected, read the selection with
the `useMillerColumnsSelection` hook from any component inside `Root`:

```tsx
import { useMillerColumnsSelection } from "@primitiv-ui/react";

function FilePreview() {
  const { path, selectedValue } = useMillerColumnsSelection();
  if (!selectedValue) {
    return <p>Nothing selected</p>;
  }
  return <Preview id={selectedValue} />;
}
```

`useMillerColumnsSelection` returns the active `path` and the deepest
`selectedValue` (`undefined` when nothing is selected). It works for
both controlled and uncontrolled roots, and throws if called outside
`MillerColumns.Root`.

The panel ships with no ARIA role, and renders *outside* the inner
`role="tree"` widget — a tree may own only `treeitem`s and `group`s, so
the panel could not legally sit inside it. Give the panel content its
own labelled landmark (`role`, `aria-label`, ...) through props if the
preview warrants being announced.

## `asChild` composition

`MillerColumns.Item` accepts `asChild` to render the cell as a
consumer-supplied element instead of the default `<div>`. All treeitem
ARIA attributes, event handlers, and the internal ref are merged onto
the child (child handler runs first, then the component's). A nested
`<MillerColumns.Column>` is still declared as a sibling of the cell
element:

```tsx
<MillerColumns.Item<HTMLAnchorElement> asChild value="docs">
  <a href="#docs">Docs</a>
  <MillerColumns.Column>...</MillerColumns.Column>
</MillerColumns.Item>
```

A `ref` prop (React 19 ref-as-prop style) is forwarded to the rendered
element and composed with the library's internal ref.

## Styling hooks

Zero styles ship with the component. Style it through `data-*` hooks;
typically the strip is `display: flex` and each column scrolls
vertically.

Inside the tree element, each column is wrapped in a transparent
(`display: contents`) slot element that fixes left-to-right order — so
target columns with `[data-miller-columns-column]`, not a direct-child
selector like `[data-miller-columns-tree] > *`. Note the strip's direct
children are the tree element and the `PreviewPanel`, not the columns.

```css
[data-miller-columns-strip] {
  display: flex;
}
[data-miller-columns-column] {
  overflow-y: auto;
}
[data-miller-columns-column][data-depth="0"] {
  /* the root column */
}
[role="treeitem"][data-state="selected"] {
  /* the selected item in each column */
}
[role="treeitem"][data-has-children] {
  /* branch items */
}
[role="treeitem"][data-disabled] {
  opacity: 0.5;
}
```

| Element         | Attributes                                                                  |
| --------------- | --------------------------------------------------------------------------- |
| Strip (`Root`)  | `data-miller-columns-strip`, `data-orientation="horizontal"`                |
| Tree (`Root`)   | `data-miller-columns-tree`, `role="tree"` — the inner widget element        |
| `Column`        | `data-miller-columns-column`, `data-depth`, `data-empty` (no items)         |
| `Item`          | `data-state="selected" \| "unselected"`, `data-terminal` (deepest selected), `data-depth`, `data-has-children`, `data-disabled` |
| `ItemIndicator` | `data-state`, `data-has-children`                                           |
| `ResizeHandle`  | `data-miller-columns-resize-handle`, `data-dragging` (present mid-drag)     |
| `PreviewPanel`  | `data-miller-columns-preview`, `data-empty` (nothing selected)              |

## Deferred / follow-up work

The following were intentionally left out of the first version and are
good candidates for later, independent cycles:

1. **Context-menu image preview.** Once a Context Menu component
   exists, a leaf image `Item` could open a context menu on
   right-click whose first entry ("Preview", with an eye icon) opens
   the `Modal` to show the image larger.
