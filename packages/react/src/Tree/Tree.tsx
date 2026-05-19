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

export function TreeItem({
  value,
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
    });
    return () => registerNode(value, null);
  }, [value, depth, parentValue, disabled, registerNode]);

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

export function TreeBranch({
  value,
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
    });
    return () => registerNode(value, null);
  }, [value, depth, parentValue, disabled, registerNode]);

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
