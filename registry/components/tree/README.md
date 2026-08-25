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
  {/* ...rows... */}
</Tree>
```

Its `size` is the **tree's** size and resolves to a Breadcrumb size one tier
down (`xs`|`sm` → `xs`, `md` → `sm`, `lg` → `md`, `xl` → `lg`), so the bar reads
compact beside its rows. Every colour and the separator come from Breadcrumb's
own stylesheet — this component adds no path anatomy of its own.

**Every segment is the same size; the selected node is marked by weight.** A
trail is read as one line, so changing size mid-line changes that line's
metrics — the bar would re-height as the selection moved and the crumbs would
reflow around it. Weight changes ink density and nothing else, so the bar holds
its height however deep the path goes. It is semibold rather than bold: at
`body/xs` on a dense tree, bold reads as an error state rather than a
selection. Retarget it with
`--primitiv-tree-selection-path-current-font-weight`.

This doubles up with the colour Breadcrumb already gives its current page,
which is deliberate — it is what VS Code's own breadcrumb does, and colour
alone is easy to miss at the small end of the ramp.

Note that the segments **state Breadcrumb's type explicitly** rather than
inheriting it. Only the terminal segment is a real `BreadcrumbPage`; the
ancestors are bare spans, because Breadcrumb has no non-link crumb part and
these do not navigate. Left to inherit, they would take their size from
whatever encloses the bar — the Tree root when it sits inside one, the page
when it does not.

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

**Row labels carry a 1px padding/negative-margin pair so `overflow: hidden`
cannot shave their descenders.** The label needs `overflow: hidden` for
`text-overflow: ellipsis`, and the clip box is the line box. Asta Sans has a
content area of **1.193em** (measured off the real font), while the tighter
rungs of the density ramp set line-height at or barely above that —
`dense`/`lg` is 13px on 16px (1.23) and `dense`/`xs` is 10px on 12px (1.20).
The deepest ink then landed **0.26–0.53px** from the clip edge, so whether a
`g`, `j`, `p`, `q` or `y` survived came down to device pixel ratio, browser
zoom and the row's subpixel offset — which is why it cut *sometimes*, and
never at the `comfortable`/`md` default. Padding grows the clip box (overflow
clips at the **padding** box); the equal negative margin gives the space back,
so row height and rhythm are unchanged. Clearance is now ≥1.26px everywhere.

Both axes stay a single `overflow` value on purpose: `overflow-y: visible` with
`overflow-x: hidden` is not a combination CSS honours — the visible axis
computes to `auto` and you get a scrollbar. Retarget the slack with
`--primitiv-tree-label-ink-slack`.

**Indentation is the row's own padding, and that is what makes the hover /
selected band full-width.** Padding each enclosing group would be simpler, but
it starts every nested row's *box* at the indent, so the band would begin
partway across the tree instead of running edge to edge (VS Code, Chakra and
most file trees run it edge to edge). Padding the row keeps the box full-width
and moves only its contents. The depth comes from the headless `useTreeLevel`
hook, published as `--primitiv-tree-depth`; reading `data-depth` in CSS would
need `attr(... type(<integer>))`, which Firefox does not support. **There is no
depth cap.**

**The chevron needs no setup.** `<TreeBranchIndicator />` ships its own glyph
(inlined, so no icon package) and the stylesheet turns it a quarter-turn off
`data-state`, on the same duration and easing as the panel. One glyph rotated
rather than two swapped, so it cannot fall out of sync with the branch. Pass
children to substitute your own — supply the *closed* orientation, since it gets
rotated the same way. The open angle is `--primitiv-tree-indicator-rotation`.

Note the Figma set models this as a two-glyph swap (`Expanded=closed` →
chevron-right, `open` → chevron-down). That is the same design expressed in the
vocabulary each platform has: Figma cannot express a transform, and a swap
cannot animate.

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
