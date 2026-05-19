import { useLayoutEffect, useRef } from "react";

import { composeEventHandlers } from "../Slot";

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
} from "./types";

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
          {...rest}
        >
          {children}
        </div>
      </TreeLevelContext.Provider>
    </TreeContext.Provider>
  );
}

TreeRoot.displayName = "TreeRoot";

export function TreeItem({
  value,
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
  });

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    registerNode(value, {
      value,
      element: ref.current,
      isBranch: false,
      depth,
      parentValue,
    });
    return () => registerNode(value, null);
  }, [value, depth, parentValue, registerNode]);

  return (
    <div
      ref={ref}
      role="treeitem"
      aria-level={depth + 1}
      aria-selected={selected}
      data-depth={depth}
      tabIndex={isTabStop ? 0 : -1}
      onClick={composeEventHandlers(onClick, (event) =>
        select(value, {
          meta: event.metaKey,
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
        }),
      )}
      onFocus={composeEventHandlers(onFocus, () => setActiveValue(value))}
      onKeyDown={composeEventHandlers(onKeyDown, handleRovingKeyDown)}
      {...rest}
    >
      {children}
    </div>
  );
}

TreeItem.displayName = "TreeItem";

export function TreeBranch({
  value,
  children,
  onFocus,
  onKeyDown,
  ...rest
}: TreeBranchProps) {
  const { depth, parentValue } = useTreeLevelContext();
  const { isExpanded, isSelected, registerNode, tabStop, setActiveValue } =
    useTreeContext();
  const { control, content } = partitionBranchChildren(children);
  const expanded = isExpanded(value);
  const selected = isSelected(value);
  const contentForceMount =
    content !== null &&
    (content.props as { forceMount?: boolean }).forceMount === true;
  const isTabStop = tabStop === value;
  const ref = useRef<HTMLDivElement>(null);
  const handleRovingKeyDown = useTreeItemKeyboard(value, {
    isBranch: true,
    parentValue,
  });

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    registerNode(value, {
      value,
      element: ref.current,
      isBranch: true,
      depth,
      parentValue,
    });
    return () => registerNode(value, null);
  }, [value, depth, parentValue, registerNode]);

  return (
    <TreeItemContext.Provider value={{ value, expanded }}>
      <div
        ref={ref}
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={expanded}
        aria-selected={selected}
        data-depth={depth}
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

export function TreeBranchControl({
  children,
  onClick,
  ...rest
}: TreeBranchControlProps) {
  const { value } = useTreeItemContext();
  const { toggleExpanded, select } = useTreeContext();

  return (
    <div
      onClick={composeEventHandlers(onClick, (event) => {
        toggleExpanded(value);
        select(value, {
          meta: event.metaKey,
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
        });
      })}
      {...rest}
    >
      {children}
    </div>
  );
}

TreeBranchControl.displayName = "TreeBranchControl";

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
