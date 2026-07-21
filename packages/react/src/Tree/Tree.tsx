import { Fragment, useLayoutEffect, useRef } from "react";
import type { ReactElement } from "react";

import { Breadcrumb } from "../Breadcrumb/index.ts";
import { Slot, composeEventHandlers } from "../Slot/index.ts";
import { deriveId } from "../utils/index.ts";

import {
  TreeContext,
  TreeItemContext,
  TreeLevelContext,
  useTreeContext,
  useTreeItemContext,
  useTreeLevelContext,
} from "./TreeContext";
import {
  useTreeItemKeyboard,
  useTreeRoot,
  useTreeSelectionPaths,
} from "./hooks/index.ts";
import { partitionBranchChildren } from "./utils";

import type {
  TreeRootProps,
  TreeItemProps,
  TreeBranchProps,
  TreeBranchControlProps,
  TreeBranchContentProps,
  TreeBranchIndicatorProps,
  TreeSelectionPathProps,
  TreeSelectionPathRenderProps,
} from "./types";

/**
 * The state-owning container of a hierarchical tree view. Renders a
 * `<div role="tree">` and provides every descendant with the expansion
 * set, selection set, and roving-tabstop coordination.
 *
 * **State ownership.** Root owns two independent axes, each controllable
 * or uncontrolled:
 *
 * - **Expansion** — which branches are open. Controlled via
 *   {@link TreeRootControlledExpansionProps.expandedValues | `expandedValues`}
 *   + {@link TreeRootControlledExpansionProps.onExpandedChange | `onExpandedChange`};
 *   uncontrolled via
 *   {@link TreeRootUncontrolledExpansionProps.defaultExpandedValues | `defaultExpandedValues`}.
 * - **Selection** — which node(s) are selected, gated by
 *   {@link SelectionMode | `selectionMode`} (`"single"` default, or
 *   `"multiple"`). Each mode has its own controlled / uncontrolled
 *   `value` / `defaultValue` / `onChange` prop trio, statically
 *   discriminated so passing the wrong prop pair for the active mode is
 *   a type error.
 *
 * **Roving tabindex.** The whole tree exposes a **single tab stop** — at
 * most one `treeitem` carries `tabIndex={0}` (the last-focused visible
 * item, else the first non-disabled item in visible depth-first order);
 * every other item is `tabIndex={-1}`. `Tab` therefore enters and leaves
 * the tree once, and the arrow keys move focus *within* it. See
 * {@link TreeItem} / {@link TreeBranch} for the full key table.
 *
 * **Context.** Root provides the `TreeContext` (expansion/selection
 * state, the node registry, roving bookkeeping, path resolver) and seeds
 * the `TreeLevelContext` at `{ depth: 0, parentValue: null }`, which each
 * {@link TreeBranchContent} deepens for its children.
 *
 * **Styling hooks.**
 * - `role="tree"` on the rendered container.
 * - `aria-multiselectable="true"` only when `selectionMode="multiple"`.
 * - `data-selection-mode="single" | "multiple"`.
 *
 * @extends HTMLDivElement
 *
 * @example Uncontrolled, single selection
 * ```tsx
 * <Tree.Root defaultExpandedValues={["src"]}>
 *   <Tree.Branch value="src">
 *     <Tree.BranchControl>src</Tree.BranchControl>
 *     <Tree.BranchContent>
 *       <Tree.Item value="index">index.ts</Tree.Item>
 *     </Tree.BranchContent>
 *   </Tree.Branch>
 * </Tree.Root>
 * ```
 *
 * @example Multi-select with Ctrl/Cmd and Shift+click
 * ```tsx
 * <Tree.Root
 *   selectionMode="multiple"
 *   onSelectedValuesChange={(values) => console.log(values)}
 * >
 *   {…}
 * </Tree.Root>
 * ```
 */
export function TreeRoot(props: TreeRootProps): ReactElement {
  const {
    children,
    expandedValues,
    defaultExpandedValues,
    onExpandedChange,
    selectionMode = "single",
    selectedValue,
    defaultSelectedValue,
    onSelectedValueChange,
    selectedValues,
    defaultSelectedValues,
    onSelectedValuesChange,
    ...rest
  } = props as TreeRootProps & {
    selectedValue?: string | null;
    defaultSelectedValue?: string | null;
    onSelectedValueChange?: (value: string | null) => void;
    selectedValues?: string[];
    defaultSelectedValues?: string[];
    onSelectedValuesChange?: (values: string[]) => void;
  };

  const treeContext = useTreeRoot({
    expandedValues,
    defaultExpandedValues,
    onExpandedChange,
    selectionMode,
    selectedValue,
    defaultSelectedValue,
    onSelectedValueChange,
    selectedValues,
    defaultSelectedValues,
    onSelectedValuesChange,
  });

  return (
    <TreeContext.Provider value={treeContext}>
      <TreeLevelContext.Provider value={{ depth: 0, parentValue: null }}>
        <div
          role="tree"
          aria-multiselectable={selectionMode === "multiple" ? true : undefined}
          data-selection-mode={selectionMode}
          {...rest}
        >
          {children}
        </div>
      </TreeLevelContext.Provider>
    </TreeContext.Provider>
  );
}

/** @internal */
TreeRoot.displayName = "TreeRoot";

/**
 * A leaf treeitem — a selectable, focusable node with no children.
 * Renders a `<div role="treeitem">` by default; pass
 * {@link TreeItemProps.asChild | `asChild`} to merge the tree behaviour
 * onto a consumer element instead (e.g. an `<a>` for a navigable file).
 *
 * **Selection.** Clicking the item *replaces* the selection in single
 * mode. In multiple mode, `Ctrl`/`Cmd`+click toggles it into or out of
 * the set, and `Shift`+click selects the contiguous range (in visible
 * depth-first order, disabled nodes excluded) between the previous
 * selection anchor and this item.
 *
 * **Depth & registry.** The item reads its nesting depth and enclosing
 * branch from `TreeLevelContext`, emits `aria-level={depth + 1}`, and
 * registers itself (value, {@link TreeItemProps.label | `label`}, depth,
 * parent) in the tree's node registry. The registry keeps the last-seen
 * entry per value even after unmount, so `Tree.SelectionPath` and
 * {@link useTreePath} can resolve ancestry through a collapsed branch.
 *
 * **Keyboard** (while focused; movement is over *visible* items in
 * depth-first order, skipping collapsed subtrees and disabled nodes):
 *
 * | Key                     | Behaviour                                     |
 * | ----------------------- | --------------------------------------------- |
 * | `ArrowDown` / `ArrowUp` | Move focus to the next / previous visible item |
 * | `ArrowLeft`             | Move focus to the parent branch (no-op at root)|
 * | `Home` / `End`          | Focus the first / last visible item            |
 * | `Enter` / `Space`       | Select the item                                |
 *
 * A `disabled` item is removed from the roving order and ignores
 * selection, but `Home`/`End` still land on non-disabled neighbours.
 *
 * **Styling hooks.**
 * - `role="treeitem"`, `aria-level`, `aria-selected`, and `aria-disabled`
 *   (omitted when not disabled).
 * - `data-leaf=""` (always), `data-depth="{n}"`.
 * - `data-selected=""` when selected, `data-disabled=""` when disabled
 *   (both omitted otherwise).
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Tree.Item value="readme">readme</Tree.Item>
 * ```
 *
 * @example asChild — a navigable leaf
 * ```tsx
 * <Tree.Item asChild value="readme">
 *   <a href="/readme">readme</a>
 * </Tree.Item>
 * ```
 */
export function TreeItem({
  value,
  label,
  disabled = false,
  asChild = false,
  children,
  onClick,
  onFocus,
  onKeyDown,
  ...rest
}: TreeItemProps): ReactElement {
  const { depth, parentValue } = useTreeLevelContext();
  const { isSelected, select, registerNode, tabStop, setActiveValue } =
    useTreeContext();
  const selected = isSelected(value);
  const isTabStop = tabStop === value;
  const ref = useRef<HTMLDivElement>(null);
  const handleRovingKeyDown = useTreeItemKeyboard(value, {
    isBranch: false,
    parentValue,
    disabled,
  });

  useLayoutEffect(() => {
    registerNode(value, {
      value,
      element: ref.current!,
      isBranch: false,
      disabled,
      depth,
      parentValue,
      label: label ?? null,
    });
    return () => registerNode(value, null);
  }, [value, label, depth, parentValue, disabled, registerNode]);

  const itemProps = {
    ref,
    role: "treeitem",
    "aria-level": depth + 1,
    "aria-selected": selected,
    "aria-disabled": disabled || undefined,
    "data-depth": depth,
    "data-leaf": "",
    "data-selected": selected ? "" : undefined,
    "data-disabled": disabled ? "" : undefined,
    tabIndex: isTabStop ? 0 : -1,
    onClick: composeEventHandlers(onClick, (event) => {
      if (disabled) {
        return;
      }
      select(value, {
        meta: event.metaKey,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
      });
    }),
    onFocus: composeEventHandlers(onFocus, () => setActiveValue(value)),
    onKeyDown: composeEventHandlers(onKeyDown, handleRovingKeyDown),
    ...rest,
  } as const;

  return asChild ? (
    <Slot {...itemProps}>{children}</Slot>
  ) : (
    <div {...itemProps}>{children}</div>
  );
}

/** @internal */
TreeItem.displayName = "TreeItem";

/**
 * A branch treeitem — a node with a row (`Tree.BranchControl`) and a
 * nested group of children (`Tree.BranchContent`). Renders a
 * `<div role="treeitem">` containing both, partitioning the children
 * with `partitionBranchChildren`.
 *
 * The branch carries `aria-expanded`, `aria-selected`, `aria-level`,
 * and is labelled by its control row via `aria-labelledby` (an id
 * derived from the root id + this branch's `value`), so its accessible
 * name is the control text alone and not polluted by descendant text.
 * Content is unmounted while collapsed unless the inner
 * {@link TreeBranchContent} opts in to
 * {@link TreeBranchContentProps.forceMount | `forceMount`}.
 *
 * **Composition.** A `Tree.Branch` must contain exactly one
 * {@link TreeBranchControl} and at most one {@link TreeBranchContent};
 * both are matched however deeply they are wrapped in fragments (so
 * `{open && <BranchContent/>}` partitions the same as a bare element).
 * Violating that throws a descriptive error during render. The branch
 * provides `TreeItemContext` (its value, expanded/disabled state, and
 * control id) to those two sub-components.
 *
 * **Keyboard** (adds branch semantics on top of the roving keys shared
 * with {@link TreeItem}):
 *
 * | Key          | Behaviour                                                     |
 * | ------------ | ------------------------------------------------------------- |
 * | `ArrowRight` | Expand if collapsed; if already open, move focus to first child|
 * | `ArrowLeft`  | Collapse if open; otherwise move focus to the parent branch    |
 * | `Enter` / `Space` | Toggle expansion **and** select the branch in one gesture |
 *
 * A `disabled` branch keeps its row and current content rendered but
 * ignores expansion, selection, and the branch arrow keys, and is
 * skipped by roving navigation.
 *
 * **Styling hooks.**
 * - `role="treeitem"`, `aria-level`, `aria-expanded`, `aria-selected`,
 *   `aria-labelledby`, and `aria-disabled` (omitted when not disabled).
 * - `data-branch=""` (always), `data-depth="{n}"`,
 *   `data-state="open" | "closed"`.
 * - `data-selected=""` / `data-disabled=""` when applicable (omitted
 *   otherwise).
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Tree.Branch value="src">
 *   <Tree.BranchControl>
 *     <Tree.BranchIndicator>▸</Tree.BranchIndicator>
 *     src
 *   </Tree.BranchControl>
 *   <Tree.BranchContent>
 *     <Tree.Item value="index">index.ts</Tree.Item>
 *   </Tree.BranchContent>
 * </Tree.Branch>
 * ```
 */
export function TreeBranch({
  value,
  label,
  disabled = false,
  children,
  onFocus,
  onKeyDown,
  ...rest
}: TreeBranchProps): ReactElement {
  const { depth, parentValue } = useTreeLevelContext();
  const {
    rootId,
    isExpanded,
    isSelected,
    registerNode,
    tabStop,
    setActiveValue,
  } = useTreeContext();
  const { control, content } = partitionBranchChildren(children);
  const expanded = isExpanded(value);
  const selected = isSelected(value);
  const contentForceMount =
    content !== null &&
    (content.props as { forceMount?: boolean }).forceMount === true;
  const isTabStop = tabStop === value;
  const ref = useRef<HTMLDivElement>(null);
  const controlId = deriveId(rootId, "branch-control", value);
  const handleRovingKeyDown = useTreeItemKeyboard(value, {
    isBranch: true,
    parentValue,
    disabled,
  });

  useLayoutEffect(() => {
    registerNode(value, {
      value,
      element: ref.current!,
      isBranch: true,
      disabled,
      depth,
      parentValue,
      label: label ?? null,
    });
    return () => registerNode(value, null);
  }, [value, label, depth, parentValue, disabled, registerNode]);

  return (
    <TreeItemContext.Provider value={{ value, expanded, disabled, controlId }}>
      <div
        ref={ref}
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={expanded}
        aria-selected={selected}
        aria-disabled={disabled || undefined}
        aria-labelledby={controlId}
        data-depth={depth}
        data-branch=""
        data-state={expanded ? "open" : "closed"}
        data-selected={selected ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        tabIndex={isTabStop ? 0 : -1}
        onFocus={composeEventHandlers(onFocus, () => setActiveValue(value))}
        onKeyDown={composeEventHandlers(onKeyDown, handleRovingKeyDown)}
        {...rest}
      >
        {control}
        {expanded || contentForceMount ? content : null}
      </div>
    </TreeItemContext.Provider>
  );
}

/** @internal */
TreeBranch.displayName = "TreeBranch";

/**
 * The clickable row of a {@link TreeBranch | `Tree.Branch`}. Renders a
 * `<div>` by default, or any element via
 * {@link TreeBranchControlProps.asChild | `asChild`}. It carries the
 * `id` that the surrounding branch points `aria-labelledby` at, so its
 * text becomes the branch's accessible name — keep the label content
 * here rather than on the branch.
 *
 * Clicking the row toggles the branch's expansion **and** selects it in
 * a single gesture (with the same `Ctrl`/`Cmd` / `Shift` modifier rules
 * as {@link TreeItem}); the inner {@link TreeBranchIndicator} is purely
 * decorative. A disabled branch's control ignores the click. Reads its
 * value / disabled state / id from the branch's `TreeItemContext`, so it
 * must be rendered inside a `Tree.Branch`.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Tree.BranchControl asChild>
 *   <button type="button">src</button>
 * </Tree.BranchControl>
 * ```
 */
export function TreeBranchControl({
  asChild = false,
  children,
  onClick,
  ...rest
}: TreeBranchControlProps): ReactElement {
  const { value, disabled, controlId } = useTreeItemContext();
  const { toggleExpanded, select } = useTreeContext();

  const controlProps = {
    id: controlId,
    onClick: composeEventHandlers(onClick, (event) => {
      if (disabled) {
        return;
      }
      toggleExpanded(value);
      select(value, {
        meta: event.metaKey,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
      });
    }),
    ...rest,
  } as const;

  return asChild ? (
    <Slot {...controlProps}>{children}</Slot>
  ) : (
    <div {...controlProps}>{children}</div>
  );
}

/** @internal */
TreeBranchControl.displayName = "TreeBranchControl";

/**
 * The nested group of items inside a {@link TreeBranch | `Tree.Branch`}.
 * Renders a `<div role="group">` and deepens the `TreeLevelContext` for
 * its children (`depth + 1`, `parentValue` = the enclosing branch), so
 * they emit the correct `aria-level` and register under the right parent.
 *
 * By default the content is **unmounted** while the branch is collapsed —
 * the lean-DOM strategy. Pass
 * {@link TreeBranchContentProps.forceMount | `forceMount`} to keep it
 * mounted while collapsed with `aria-hidden="true"` and
 * `data-state="closed"`, so CSS can animate it in and out without the
 * browser tearing the subtree down.
 *
 * **Styling hooks.**
 * - `role="group"`, `data-depth="{n}"`, `data-state="open" | "closed"`.
 * - `aria-hidden="true"` only while force-mounted and collapsed.
 *
 * @extends HTMLDivElement
 *
 * @example forceMount for CSS transitions
 * ```tsx
 * <Tree.BranchContent forceMount>
 *   <Tree.Item value="index">index.ts</Tree.Item>
 * </Tree.BranchContent>
 * ```
 */
export function TreeBranchContent({
  children,
  forceMount = false,
  ...rest
}: TreeBranchContentProps): ReactElement {
  const { depth } = useTreeLevelContext();
  const { value: branchValue, expanded } = useTreeItemContext();

  return (
    <TreeLevelContext.Provider
      value={{ depth: depth + 1, parentValue: branchValue }}
    >
      <div
        role="group"
        data-depth={depth + 1}
        data-state={expanded ? "open" : "closed"}
        aria-hidden={forceMount && !expanded ? true : undefined}
        {...rest}
      >
        {children}
      </div>
    </TreeLevelContext.Provider>
  );
}

/** @internal */
TreeBranchContent.displayName = "TreeBranchContent";

/**
 * A purely decorative chevron / icon wrapper for a `Tree.Branch`.
 * Renders a `<span aria-hidden="true">` with `data-state="open"` or
 * `"closed"` so a consumer's CSS can rotate or swap the glyph. Only
 * meaningful inside a `Tree.BranchControl`.
 *
 * Pass {@link TreeBranchIndicatorProps.asChild | `asChild`} to merge the
 * indicator's props — including `aria-hidden` and `data-state` — onto the
 * supplied child element. This is useful when passing an icon component
 * that must receive `data-state` directly rather than inheriting it from
 * a wrapper. Reads its `expanded` state from the branch's
 * `TreeItemContext`, so it must be rendered inside a
 * {@link TreeBranchControl}.
 *
 * @extends HTMLSpanElement
 *
 * @example Default (wraps children in a `<span>`)
 * ```tsx
 * <Tree.BranchIndicator className="chevron">▸</Tree.BranchIndicator>
 * ```
 *
 * @example asChild (spreads onto the icon element itself)
 * ```tsx
 * <Tree.BranchIndicator asChild>
 *   <ChevronRight className="chevron" />
 * </Tree.BranchIndicator>
 * ```
 */
export function TreeBranchIndicator({
  children,
  asChild = false,
  ...rest
}: TreeBranchIndicatorProps): ReactElement {
  const { expanded } = useTreeItemContext();

  const indicatorProps = {
    "aria-hidden": true as const,
    "data-state": expanded ? "open" : "closed",
    ...rest,
  };

  return asChild ? (
    <Slot {...indicatorProps}>{children}</Slot>
  ) : (
    <span {...indicatorProps}>{children}</span>
  );
}

/** @internal */
TreeBranchIndicator.displayName = "TreeBranchIndicator";

/**
 * Renders breadcrumb trails for the currently-selected tree value(s).
 *
 * The default rendering composes the package's `Breadcrumb` primitive:
 * one `<nav aria-label="Breadcrumb"><ol>` per selected value, with
 * non-final segments as plain `<li>` text and the leaf as a
 * `Breadcrumb.Page` (`aria-current="page"`). Each segment falls back
 * to its `value` when no `label` prop was supplied on the originating
 * `Tree.Item` or `Tree.Branch`.
 *
 * - Empty selection — the wrapper still renders with `data-empty=""`
 *   so consumers can style a "no selection" placeholder; nothing is
 *   rendered inside.
 * - Multiple selection — one trail per selected value, in selection
 *   order.
 *
 * Pass `separator` to customise the divider glyph between segments.
 *
 * Pass {@link TreeSelectionPathProps.separator | `separator`} to
 * customise the divider glyph between segments, or a function as
 * `children` to take full control of rendering (e.g. wire up router
 * links). The function receives the resolved
 * {@link TreeSelectionPathRenderProps.paths | `paths`} and replaces the
 * default markup entirely.
 *
 * Backed by {@link useTreeSelectionPaths}, which reads ancestry from the
 * persistent node registry — so trails stay resolvable even when an
 * ancestor branch has collapsed and its descendants have unmounted.
 *
 * **Styling hooks.**
 * - `data-tree-selection-path=""` on the wrapper (always).
 * - `data-empty=""` on the wrapper when nothing is selected.
 * - `data-tree-selection-segment=""` + `data-value` (and `data-disabled`
 *   when the node is disabled) on each rendered segment.
 *
 * @extends HTMLDivElement
 *
 * @example Default rendering
 * ```tsx
 * <Tree.SelectionPath separator={<ChevronRight />} />
 * ```
 *
 * @example Render-prop escape hatch
 * ```tsx
 * <Tree.SelectionPath>
 *   {({ paths }) => paths.map((path, i) => (
 *     <Breadcrumb.Root key={i}>
 *       <Breadcrumb.List>
 *         {path.map((seg, j) => (
 *           <Breadcrumb.Item key={seg.value}>
 *             <Breadcrumb.Link asChild>
 *               <RouterLink to={`/files/${seg.value}`}>
 *                 {seg.label ?? seg.value}
 *               </RouterLink>
 *             </Breadcrumb.Link>
 *           </Breadcrumb.Item>
 *         ))}
 *       </Breadcrumb.List>
 *     </Breadcrumb.Root>
 *   ))}
 * </Tree.SelectionPath>
 * ```
 */
export function TreeSelectionPath({
  children,
  separator,
  ...rest
}: TreeSelectionPathProps): ReactElement {
  const paths = useTreeSelectionPaths();
  const empty = paths.length === 0;

  let content: React.ReactNode = null;
  if (typeof children === "function") {
    content = (
      children as (args: TreeSelectionPathRenderProps) => React.ReactNode
    )({
      paths,
    });
  } else if (!empty) {
    content = paths.map((path, pathIndex) => (
      <Breadcrumb.Root key={pathIndex}>
        <Breadcrumb.List>
          {path.map((segment, segmentIndex) => {
            const isLast = segmentIndex === path.length - 1;
            const label = segment.label ?? segment.value;
            return (
              <Fragment key={segment.value}>
                <Breadcrumb.Item>
                  {isLast ? (
                    <Breadcrumb.Page
                      data-tree-selection-segment=""
                      data-value={segment.value}
                      data-disabled={segment.disabled ? "" : undefined}
                    >
                      {label}
                    </Breadcrumb.Page>
                  ) : (
                    <span
                      data-tree-selection-segment=""
                      data-value={segment.value}
                      data-disabled={segment.disabled ? "" : undefined}
                    >
                      {label}
                    </span>
                  )}
                </Breadcrumb.Item>
                {!isLast ? (
                  <Breadcrumb.Separator>{separator}</Breadcrumb.Separator>
                ) : null}
              </Fragment>
            );
          })}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    ));
  }

  return (
    <div
      data-tree-selection-path=""
      data-empty={empty ? "" : undefined}
      {...rest}
    >
      {content}
    </div>
  );
}

/** @internal */
TreeSelectionPath.displayName = "TreeSelectionPath";

/**
 * The shape of the exported `Tree` value — callable as `Tree.Root` and
 * carrying every sub-component as a static property.
 */
export type TreeCompound = typeof TreeRoot & {
  Root: typeof TreeRoot;
  Item: typeof TreeItem;
  Branch: typeof TreeBranch;
  BranchControl: typeof TreeBranchControl;
  BranchContent: typeof TreeBranchContent;
  BranchIndicator: typeof TreeBranchIndicator;
  SelectionPath: typeof TreeSelectionPath;
};

/**
 * Headless, accessible **Tree** — a compound component implementing the
 * WAI-ARIA tree view pattern (`role="tree"` / `treeitem` / `group`) with
 * roving tabindex, single or multiple selection, and expandable branches,
 * with zero styles.
 *
 * `Tree` is both callable (an alias of {@link TreeRoot | `Tree.Root`}) and
 * carries its sub-components as static properties:
 *
 * - {@link TreeRoot | `Tree.Root`} — state owner, context provider, `role="tree"`.
 * - {@link TreeItem | `Tree.Item`} — a leaf `role="treeitem"`.
 * - {@link TreeBranch | `Tree.Branch`} — an expandable `role="treeitem"` with children.
 * - {@link TreeBranchControl | `Tree.BranchControl`} — the branch's selectable / toggling control.
 * - {@link TreeBranchContent | `Tree.BranchContent`} — the collapsible `role="group"` of child nodes.
 * - {@link TreeBranchIndicator | `Tree.BranchIndicator`} — expand/collapse affordance.
 * - {@link TreeSelectionPath | `Tree.SelectionPath`} — breadcrumb of the selected node's ancestry.
 *
 * @example
 * ```tsx
 * import { Tree } from "@primitiv-ui/react";
 *
 * <Tree.Root>
 *   <Tree.Branch value="src">
 *     <Tree.BranchControl>
 *       src <Tree.BranchIndicator />
 *     </Tree.BranchControl>
 *     <Tree.BranchContent>
 *       <Tree.Item value="index">index.ts</Tree.Item>
 *     </Tree.BranchContent>
 *   </Tree.Branch>
 * </Tree.Root>;
 * ```
 *
 * @see {@link TreeRoot} for the expansion / selection state modes and the
 *   single tree-wide roving tab stop.
 * @see {@link TreeItem} and {@link TreeBranch} for the keyboard tables and
 *   selection modifiers.
 * @see {@link useTreePath} / {@link useTreeSelectionPaths} for reading a
 *   node's ancestry outside `Tree.SelectionPath`.
 */
const TreeCompound: TreeCompound = Object.assign(TreeRoot, {
  Root: TreeRoot,
  Item: TreeItem,
  Branch: TreeBranch,
  BranchControl: TreeBranchControl,
  BranchContent: TreeBranchContent,
  BranchIndicator: TreeBranchIndicator,
  SelectionPath: TreeSelectionPath,
});

/** @internal */
TreeCompound.displayName = "Tree";

export { TreeCompound as Tree };
