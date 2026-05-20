import { useLayoutEffect, useRef } from "react";

import { Slot, composeEventHandlers } from "../Slot";
import { deriveId } from "../utils";

import {
  TreeContext,
  TreeItemContext,
  TreeLevelContext,
  useTreeContext,
  useTreeItemContext,
  useTreeLevelContext,
} from "./TreeContext";
import { useTreeItemKeyboard, useTreeRoot } from "./hooks";
import { partitionBranchChildren } from "./utils";

import type {
  TreeRootProps,
  TreeItemProps,
  TreeBranchProps,
  TreeBranchControlProps,
  TreeBranchContentProps,
  TreeBranchIndicatorProps,
} from "./types";

/**
 * The state-owning container of a hierarchical tree view. Renders a
 * `<div role="tree">` and provides every descendant with the expansion
 * set, selection set, and roving-tabstop coordination.
 *
 * Expansion is controlled/uncontrolled via the `expandedValues` /
 * `defaultExpandedValues` pair (with `onExpandedChange`). Selection
 * follows the same shape under `selectionMode="single"` (default) or
 * `"multiple"`, the two modes statically discriminated so passing the
 * wrong prop pair is a type error.
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
export function TreeRoot(props: TreeRootProps) {
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

TreeRoot.displayName = "TreeRoot";

/**
 * A leaf treeitem — a selectable, focusable node that has no children.
 * Renders a `<div role="treeitem">` by default; pass `asChild` to merge
 * Tree behaviour onto a consumer element (e.g. `<a>`).
 *
 * Clicking the item replaces the selection in single mode and toggles
 * it under `Ctrl`/`Cmd` in multiple mode; `Shift+click` selects the
 * range between the previous click and this one.
 *
 * @example
 * ```tsx
 * <Tree.Item value="readme">readme</Tree.Item>
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
}: TreeItemProps) {
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

TreeItem.displayName = "TreeItem";

/**
 * A branch treeitem — a node with a row (`Tree.BranchControl`) and a
 * nested group of children (`Tree.BranchContent`). Renders a
 * `<div role="treeitem">` containing both, partitioning the children
 * with `partitionBranchChildren`.
 *
 * The branch carries `aria-expanded`, `aria-selected`, `aria-level`,
 * and is labelled by its control row via `aria-labelledby` so its
 * accessible name is not polluted by descendant text. Content is
 * unmounted while collapsed unless the inner `Tree.BranchContent`
 * opts in to `forceMount`.
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
}: TreeBranchProps) {
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
    <TreeItemContext.Provider
      value={{ value, expanded, disabled, controlId }}
    >
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

TreeBranch.displayName = "TreeBranch";

/**
 * The clickable row of a `Tree.Branch`. Renders a `<div>` by default
 * (or any element via `asChild`) and is identified by the id the
 * surrounding branch points `aria-labelledby` at. Clicking the row
 * toggles the branch's expansion and selects it in a single gesture;
 * the inner `Tree.BranchIndicator` is decorative.
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
}: TreeBranchControlProps) {
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

TreeBranchControl.displayName = "TreeBranchControl";

/**
 * The nested group of items inside a `Tree.Branch`. Renders a
 * `<div role="group">` whose children sit at one deeper nesting level.
 *
 * By default the content is unmounted while the branch is collapsed —
 * the lean DOM strategy. Pass `forceMount` to keep it mounted with
 * `aria-hidden="true"` and `data-state="closed"`, so CSS can animate
 * it in and out without the browser tearing the subtree down.
 */
export function TreeBranchContent({
  children,
  forceMount = false,
  ...rest
}: TreeBranchContentProps) {
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

TreeBranchContent.displayName = "TreeBranchContent";

/**
 * A purely decorative chevron / icon wrapper for a `Tree.Branch`.
 * Renders a `<span aria-hidden="true">` with `data-state="open"` or
 * `"closed"` so a consumer's CSS can rotate or swap the glyph. Only
 * meaningful inside a `Tree.BranchControl`.
 */
export function TreeBranchIndicator({
  children,
  ...rest
}: TreeBranchIndicatorProps) {
  const { expanded } = useTreeItemContext();

  return (
    <span
      aria-hidden="true"
      data-state={expanded ? "open" : "closed"}
      {...rest}
    >
      {children}
    </span>
  );
}

TreeBranchIndicator.displayName = "TreeBranchIndicator";

type TreeCompound = typeof TreeRoot & {
  Root: typeof TreeRoot;
  Item: typeof TreeItem;
  Branch: typeof TreeBranch;
  BranchControl: typeof TreeBranchControl;
  BranchContent: typeof TreeBranchContent;
  BranchIndicator: typeof TreeBranchIndicator;
};

const TreeCompound: TreeCompound = Object.assign(TreeRoot, {
  Root: TreeRoot,
  Item: TreeItem,
  Branch: TreeBranch,
  BranchControl: TreeBranchControl,
  BranchContent: TreeBranchContent,
  BranchIndicator: TreeBranchIndicator,
});

TreeCompound.displayName = "Tree";

export { TreeCompound as Tree };
