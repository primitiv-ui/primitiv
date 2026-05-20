# Tree

A compound component for a **hierarchical tree view** — nested
collapsible groups of selectable rows, modelled on the WAI-ARIA tree
pattern.

```tsx
import { Tree } from "@primitiv/react";

<Tree.Root defaultExpandedValues={["src"]}>
  <Tree.Item value="readme">readme</Tree.Item>
  <Tree.Branch value="src">
    <Tree.BranchControl>
      <Tree.BranchIndicator>▸</Tree.BranchIndicator>
      src
    </Tree.BranchControl>
    <Tree.BranchContent>
      <Tree.Item value="index">index.ts</Tree.Item>
      <Tree.Item value="button">button.tsx</Tree.Item>
    </Tree.BranchContent>
  </Tree.Branch>
</Tree.Root>;
```

## Authoring model

The tree is authored by **recursive composition** — there is no `data`
prop. An `Item` is a leaf; a `Branch` is a parent that pairs a
`<Tree.BranchControl>` (its clickable row) with a `<Tree.BranchContent>`
(the nested group). Each `BranchContent` renders its children one
nesting level deeper, so a `Branch` placed inside a `BranchContent`
automatically reports `aria-level={depth + 1}` and `data-depth={depth}`.

Depth and parent value ride a context — the components don't traverse
the React tree to figure out where they are.

## Sub-components

| Export                 | Role                  | Notes                                                                                                                                             |
| ---------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `Tree.Root`            | State owner           | Owns expansion + selection, the collection, and the roving tabstop. `role="tree"`, `data-selection-mode`, `aria-multiselectable` in multiple mode |
| `Tree.Item`            | Leaf treeitem         | `role="treeitem"`. Supports `label`, `disabled`, `asChild`                                                                                        |
| `Tree.Branch`          | Branch treeitem       | `role="treeitem"` containing the control row and (when expanded) the content group. Supports `label`, `disabled`                                  |
| `Tree.BranchControl`   | Branch row            | The clickable row inside a `Branch`. Click toggles expansion **and** selects. Supports `asChild`                                                  |
| `Tree.BranchContent`   | Branch group          | `role="group"`. Mount/unmount with the branch, or stay mounted via `forceMount` for CSS animation                                                 |
| `Tree.BranchIndicator` | Chevron / glyph       | Decorative `aria-hidden` span with `data-state="open"                                                                                             | "closed"`. Supports `asChild` |
| `Tree.SelectionPath`   | Selection breadcrumbs | Renders one breadcrumb trail per currently-selected value. See [Selection path](#selection-path)                                                  |

## State model

The Root carries two independent state axes — expansion and selection —
each statically discriminated into controlled and uncontrolled forms.
Passing both `default*` and the controlled prop is a type error.

### Expansion

```ts
// Uncontrolled
<Tree.Root defaultExpandedValues={["src"]} onExpandedChange={(v) => …}>

// Controlled
<Tree.Root expandedValues={values} onExpandedChange={setValues}>
```

`onExpandedChange` fires in both modes.

### Selection

The selection shape depends on `selectionMode`:

```ts
// Single (default) — selectedValue is `string | null`
<Tree.Root defaultSelectedValue="readme" onSelectedValueChange={(v) => …}>
<Tree.Root selectedValue={v} onSelectedValueChange={setV}>

// Multiple — selectedValues is `string[]`
<Tree.Root
  selectionMode="multiple"
  defaultSelectedValues={["readme", "index"]}
  onSelectedValuesChange={(v) => …}
>
<Tree.Root
  selectionMode="multiple"
  selectedValues={v}
  onSelectedValuesChange={setV}
>
```

In **multiple** mode:

- Plain click replaces selection with the clicked item.
- `Ctrl` / `Cmd` + click toggles the item in or out.
- `Shift` + click selects the contiguous range of visible items
  between the previous click (the _anchor_) and the clicked item,
  skipping disabled items. The anchor stays put across Shift+clicks,
  matching the listbox convention.

In **single** mode modifier keys are ignored — clicks always replace.

## `forceMount` (animating branches in and out)

By default a collapsed branch's content is unmounted. Pass `forceMount`
to `BranchContent` to keep it in the DOM with `aria-hidden="true"` and
`data-state="closed"` so CSS transitions can play:

```tsx
<Tree.Branch value="src">
  <Tree.BranchControl>src</Tree.BranchControl>
  <Tree.BranchContent forceMount>
    <Tree.Item value="index">index.ts</Tree.Item>
  </Tree.BranchContent>
</Tree.Branch>
```

The default form mirrors the rest of the library; `forceMount` mirrors
`Collapsible.Content`. Choose based on whether your styling needs an
enter/exit animation.

## Keyboard interaction

The whole tree is a single roving-tabindex widget — exactly one item
is tabbable at a time. The tabstop follows the last-focused item and
defaults to the first enabled visible item.

| Key                     | Leaf `Item`             | `Branch`                                                   |
| ----------------------- | ----------------------- | ---------------------------------------------------------- |
| `ArrowUp` / `ArrowDown` | Previous / next visible | Previous / next visible                                    |
| `Home` / `End`          | First / last visible    | First / last visible                                       |
| `ArrowRight`            | No-op                   | Collapsed: expand. Expanded: focus the first child         |
| `ArrowLeft`             | Focus the parent branch | Expanded: collapse. Collapsed: focus the parent branch     |
| `Enter` / `Space`       | Select                  | Toggle expansion **and** select (same as clicking the row) |

Arrow keys skip disabled items. Home / End and direct focus still land
on them so they remain discoverable.

## ARIA

- The root is `role="tree"` with `aria-multiselectable="true"` in
  multiple mode.
- Items and branches are `role="treeitem"` with `aria-level` (1-based),
  `aria-selected`, and — on branches — `aria-expanded` and
  `aria-labelledby` pointing at the `BranchControl` (so the branch's
  accessible name is just the row's content, not all descendant text).
- The nested content group is `role="group"`.
- Indicators are `aria-hidden="true"`.

## Styling hooks

The component ships **no CSS**. Style with the data attributes:

| Attribute                        | Where                             | Meaning                                                   |
| -------------------------------- | --------------------------------- | --------------------------------------------------------- | ------------------------- |
| `data-selection-mode="single     | multiple"`                        | `Root`                                                    | The active selection mode |
| `data-depth="N"`                 | `Item`, `Branch`, `BranchContent` | Zero-based nesting depth                                  |
| `data-leaf=""`                   | `Item`                            | Marks a leaf treeitem                                     |
| `data-branch=""`                 | `Branch`                          | Marks a branch treeitem                                   |
| `data-state="open                | closed"`                          | `Branch`, `BranchContent`, indicators                     | Branch expansion state    |
| `data-selected=""`               | `Item`, `Branch`                  | Set when the treeitem is selected                         |
| `data-disabled=""`               | `Item`, `Branch`, segments        | Set when the treeitem (or breadcrumb segment) is disabled |
| `data-tree-selection-path=""`    | `SelectionPath` wrapper           | Identifies the breadcrumb trail container                 |
| `data-empty=""`                  | `SelectionPath` wrapper           | Set when no item is selected                              |
| `data-tree-selection-segment=""` | `SelectionPath` segments          | One per crumb in the trail; carries `data-value`          |

Indentation, guide lines, focus rings, and the chevron rotation are
the consumer's job. The `data-depth` attribute combined with modern
CSS (`attr(data-depth type(<integer>))` or `[data-depth="N"]`
selectors) is enough to drive an indented hierarchy without inline
styles.

> **Browser support note.** Reading a typed attribute through
> `attr(data-depth type(<integer>))` inside `calc()` requires Chrome
> 133+ or Safari 18.2+. Firefox does not yet ship the advanced
> `attr()` syntax — it will fall back to the default value supplied
> as the second argument (or `0` if omitted). Two cross-browser
> workarounds:
>
> **1. Enumerate per-depth rules** — pick a sensible cap for your UI
> and write one selector per level:
>
> ```css
> [role="treeitem"][data-depth="0"] > .row {
>   padding-inline-start: 0.5rem;
> }
> [role="treeitem"][data-depth="1"] > .row {
>   padding-inline-start: 1.75rem;
> }
> [role="treeitem"][data-depth="2"] > .row {
>   padding-inline-start: 3rem;
> }
> /* …extend as deep as your tree can go */
> ```
>
> **2. Set a CSS variable inline from the render layer** — the
> consumer already knows the depth when authoring the tree
> recursively, so it can be threaded through as a prop:
>
> ```tsx
> function Node({ node, depth }: { node: FileNode; depth: number }) {
>   const indent = { "--tree-indent": depth } as React.CSSProperties;
>   if (node.children) {
>     return (
>       <Tree.Branch value={node.id}>
>         <Tree.BranchControl style={indent}>{node.label}</Tree.BranchControl>
>         <Tree.BranchContent>
>           {node.children.map((child) => (
>             <Node key={child.id} node={child} depth={depth + 1} />
>           ))}
>         </Tree.BranchContent>
>       </Tree.Branch>
>     );
>   }
>   return (
>     <Tree.Item value={node.id} style={indent}>
>       {node.label}
>     </Tree.Item>
>   );
> }
> ```
>
> ```css
> [role="treeitem"] > .row {
>   padding-inline-start: calc(var(--tree-indent, 0) * 1.25rem + 0.5rem);
> }
> ```

## Selection path

`Tree.Item` and `Tree.Branch` accept an optional `label` prop. It does
**not** affect what's rendered for the row — the children still do —
but it is stored alongside the value in Tree's node registry so the
tree can surface a human-readable breadcrumb trail of the current
selection.

```tsx
<Tree.Branch value="src" label="src">
  <Tree.BranchControl>📁 src</Tree.BranchControl>
  <Tree.BranchContent>
    <Tree.Item value="index" label="index.ts">
      📄 index.ts
    </Tree.Item>
  </Tree.BranchContent>
</Tree.Branch>
```

### `Tree.SelectionPath`

The out-of-box subcomponent renders one breadcrumb trail per
currently-selected value, composing the package's `Breadcrumb`
primitive: a `<nav aria-label="Breadcrumb"><ol>` per path, with
non-final segments as plain `<li>` text and the leaf as a
`Breadcrumb.Page` (`aria-current="page"`). Segments without a
`label` prop fall back to their `value`.

```tsx
import { Tree } from "@primitiv/react";
import { ChevronRight } from "@primitiv/icons";

<Tree.Root defaultSelectedValue="index">
  …
  <Tree.SelectionPath separator={<ChevronRight />} />
</Tree.Root>;
```

When no item is selected, the wrapper still renders with
`data-empty=""` so consumers can style a placeholder (e.g. an em-dash
via `::before`) without scoping the path bar conditionally.

For full control over the markup — wiring router links, custom
ordering, or grouping multiple selections — pass a function as
`children`. It receives the resolved paths and replaces the default
rendering entirely:

```tsx
<Tree.SelectionPath>
  {({ paths }) =>
    paths.map((path, i) => (
      <Breadcrumb.Root key={i}>
        <Breadcrumb.List>
          {path.map((seg) => (
            <Breadcrumb.Item key={seg.value}>
              <Breadcrumb.Link asChild>
                <RouterLink to={`/files/${seg.value}`}>
                  {seg.label ?? seg.value}
                </RouterLink>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
          ))}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    ))
  }
</Tree.SelectionPath>
```

### `useTreePath` / `useTreeSelectionPaths`

For UIs that don't fit the breadcrumb shape, two hooks expose the raw
path data:

```ts
import { useTreePath, useTreeSelectionPaths } from "@primitiv/react";

const path = useTreePath(value); // root → leaf for one value
const paths = useTreeSelectionPaths(); // one path per selected value, in selection order
```

Both return arrays of `TreePathSegment`:

```ts
type TreePathSegment = {
  value: string;
  label: string | null; // falls back to `null` when no `label` prop was supplied
  isBranch: boolean;
  disabled: boolean;
  depth: number;
};
```

Paths survive a branch collapsing without `forceMount`: Tree keeps a
durable copy of every node's metadata so ancestry remains resolvable
even after descendants unmount. A value that has never mounted (e.g.
a pre-selected item whose branch has not yet opened) returns an empty
array.

## Disabled items

Pass `disabled` on an `Item` or `Branch` to render `aria-disabled` and
`data-disabled`, ignore clicks and activation keys, and skip the item
during arrow-key navigation and range selection. Disabled items remain
in the DOM and focusable for discovery; `Home` / `End` still reach
them.

## Deferred past v1

- Type-ahead (printable-character focus search).
- Keyboard multi-select chords (`Ctrl+Enter`, `Shift+Arrow`, `Ctrl+A`).
- Drag-to-reorder.
- Imperative `expandAll` / `collapseAll` ref API.
- Lazy / async children loading.
