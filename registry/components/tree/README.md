# Tree

A hierarchical list of expandable branches and selectable leaves — the WAI-ARIA
tree view, with connector guide lines and an optional breadcrumb of the selected
node's ancestry.

```sh
primitiv add tree
```

Installs the styled surface plus [`breadcrumb`](../breadcrumb/README.md), which
`TreeSelectionPath` composes.

## Usage

Trees are authored recursively — there is no `data` prop, by design. A branch is
a `TreeBranch` wrapping a `TreeBranchControl` (the row) and a
`TreeBranchContent` (its children); a leaf is a `TreeItem`.

```tsx
import {
  Tree,
  TreeBranch,
  TreeBranchContent,
  TreeBranchControl,
  TreeBranchIndicator,
  TreeItem,
} from "@/components/tree";

<Tree defaultExpandedValues={["src"]} defaultSelectedValue="index.ts">
  <TreeBranch value="src" label="src">
    <TreeBranchControl>
      <TreeBranchIndicator>
        <ChevronRight />
      </TreeBranchIndicator>
      src
    </TreeBranchControl>
    <TreeBranchContent>
      <TreeItem value="index.ts" label="index.ts">
        index.ts
      </TreeItem>
      <TreeItem value="app.tsx" label="app.tsx">
        app.tsx
      </TreeItem>
    </TreeBranchContent>
  </TreeBranch>
  <TreeItem value="readme" label="README.md">
    README.md
  </TreeItem>
</Tree>;
```

### Selection path

`TreeSelectionPath` renders a breadcrumb trail of the selected node's ancestry —
the VS Code editor path bar. It reads the selection from context, so it needs no
props beyond its size, and it renders one trail per selected value in
`selectionMode="multiple"`.

```tsx
<Tree selectionMode="single" defaultSelectedValue="index.ts">
  <TreeSelectionPath size="md" />
  {/* …rows… */}
</Tree>
```

Its `size` is the **tree's** size and resolves to a Breadcrumb size one tier
down (`xs`|`sm` → `xs`, `md` → `sm`, `lg` → `md`, `xl` → `lg`), so the bar reads
compact beside its rows. Every colour, the separator and the type come from
Breadcrumb's own stylesheet — this component adds no path anatomy of its own.

## Props

### `Tree`

| Prop         | Type                                   | Default   | Notes                                    |
| ------------ | -------------------------------------- | --------- | ---------------------------------------- |
| `size`       | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"`    | Row size for the whole tree.             |
| `connectors` | `"lines" \| "none"`                    | `"lines"` | Hairline guide lines, or indent only.    |

Everything else — `selectionMode`, `defaultExpandedValues` / `expandedValues`,
`defaultSelectedValue` / `selectedValue`, `onExpandedChange`,
`onSelectedValueChange` — passes straight through to the headless
[`Tree`](https://primitiv-ui.dev/docs/react/tree).

### `TreeSelectionPath`

| Prop        | Type                                   | Default | Notes                                    |
| ----------- | -------------------------------------- | ------- | ---------------------------------------- |
| `size`      | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"`  | The tree's size; maps one tier down.     |
| `separator` | `ReactNode`                            | —       | Overrides Breadcrumb's chevron.          |

## Patterns and gotchas

**Indentation comes from nesting, not from `data-depth`.** `TreeBranchContent`
physically contains its children, so one `padding-inline-start` on the content
body indents an entire subtree at any depth. The headless README suggests
`attr(data-depth type(<integer>))`, but that syntax is Chrome 133+ / Safari
18.2+ and Firefox silently falls back — nesting avoids the problem and needs no
per-depth rules. **There is no depth cap.**

**Branches animate open and closed.** `TreeBranchContent` is force-mounted and
uses the same `display: grid` 0fr↔1fr row-track transition as Accordion, so a
branch opens to its subtree's exact height with no `max-height` guess and no JS
measurement. `forceMount` is therefore not exposed — turning it off would
unmount the subtree on close and leave nothing to animate. Duration and easing
are `--primitiv-tree-transition-duration` / `-easing`, and the whole thing is
disabled under `prefers-reduced-motion`.

**A leaf's connector stub is longer than a branch's, deliberately.** A branch
draws a chevron in its leading slot so the stub must stop before that glyph; a
leaf leaves the slot empty (that is what the `__item-spacer` is), putting its
first ink a whole icon-width further along. One length for both leaves a leaf's
line dying in blank space. The two knobs are
`--primitiv-tree-connector-stub-width` and `-stub-width-leaf`.

**The part wrappers carry a `TREE_PART` marker, and they need it.**
`Tree.Branch` finds its control and content by inspecting its children *before*
rendering them, so it sees `TreeBranchControl` / `TreeBranchContent` rather than
the headless parts they render. Both set `[TREE_PART]` so the branch recognises
them; strip the marker and you get `A Tree.Branch must contain a
<Tree.BranchControl>.` at runtime. Any wrapper of your own around these parts
needs the same marker.

**Selected, hover and focus are drawn on the row, not the treeitem.** The
headless puts the roving tabstop on `TreeBranch`, which wraps the whole
subtree — styling `:focus-visible` on it directly would ring every descendant.
The stylesheet targets `.primitiv-tree__branch[data-selected] >
.primitiv-tree__branch-control` (and the `:focus-visible` equivalent) instead.
Keep that shape if you restyle.

**Disabled rows stay focusable.** They dim and stop taking pointer events, but
remain in the DOM and in the roving order, so a disabled node is still
discoverable by keyboard. A disabled branch does not disable its children.

**Guide lines are pure CSS.** They need no headless attributes: the vertical
rail is a `::after` on each nested treeitem spanning its full height (so an
ancestor's line continues past deeper rows), `:last-child` truncates it into the
elbow, and the horizontal stub is a `::before`. Both offsets are logical, so RTL
works with no extra rules.

## Files

| File              | Purpose                                                     |
| ----------------- | ----------------------------------------------------------- |
| `tree.tsx`        | The styled wrapper — one export per part.                    |
| `tree.recipe.ts`  | `cva` recipe mapping the `size` / `connectors` modifiers.    |
| `styles.css`      | The default theme (canonical).                               |
| `styles.scss`     | The same CSS plus `$primitiv-tree-*` aliases.                |
| `contract.json`   | Parts, modifiers and custom properties — the stable surface. |

## Dependencies

- [`@primitiv-ui/react`](https://www.npmjs.com/package/@primitiv-ui/react) — the
  headless `Tree`.
- [`class-variance-authority`](https://www.npmjs.com/package/class-variance-authority)
  — the recipe.
- [`breadcrumb`](../breadcrumb/README.md) — composed by `TreeSelectionPath`.
- The token layer (`primitiv tokens`).
