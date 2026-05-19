import { composeEventHandlers } from "../Slot";

import {
  TreeContext,
  TreeItemContext,
  TreeLevelContext,
  useTreeContext,
  useTreeItemContext,
  useTreeLevelContext,
} from "./TreeContext";
import { useTreeRoot } from "./hooks";
import { partitionBranchChildren } from "./utils";

import type {
  TreeRootProps,
  TreeItemProps,
  TreeBranchProps,
  TreeBranchControlProps,
  TreeBranchContentProps,
} from "./types";

export function TreeRoot({
  children,
  expandedValues,
  defaultExpandedValues,
  onExpandedChange,
  ...rest
}: TreeRootProps) {
  const treeContext = useTreeRoot(
    expandedValues,
    defaultExpandedValues,
    onExpandedChange,
  );

  return (
    <TreeContext.Provider value={treeContext}>
      <TreeLevelContext.Provider value={{ depth: 0 }}>
        <div role="tree" {...rest}>
          {children}
        </div>
      </TreeLevelContext.Provider>
    </TreeContext.Provider>
  );
}

TreeRoot.displayName = "TreeRoot";

export function TreeItem({ value: _value, children, ...rest }: TreeItemProps) {
  const { depth } = useTreeLevelContext();

  return (
    <div role="treeitem" aria-level={depth + 1} data-depth={depth} {...rest}>
      {children}
    </div>
  );
}

TreeItem.displayName = "TreeItem";

export function TreeBranch({ value, children, ...rest }: TreeBranchProps) {
  const { depth } = useTreeLevelContext();
  const { isExpanded } = useTreeContext();
  const { control, content } = partitionBranchChildren(children);
  const expanded = isExpanded(value);

  return (
    <TreeItemContext.Provider value={{ value, expanded }}>
      <div
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={expanded}
        data-depth={depth}
        {...rest}
      >
        {control}
        {expanded ? content : null}
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
  const { toggleExpanded } = useTreeContext();

  return (
    <div
      onClick={composeEventHandlers(onClick, () => toggleExpanded(value))}
      {...rest}
    >
      {children}
    </div>
  );
}

TreeBranchControl.displayName = "TreeBranchControl";

export function TreeBranchContent({
  children,
  ...rest
}: TreeBranchContentProps) {
  const { depth } = useTreeLevelContext();

  return (
    <TreeLevelContext.Provider value={{ depth: depth + 1 }}>
      <div role="group" data-depth={depth + 1} {...rest}>
        {children}
      </div>
    </TreeLevelContext.Provider>
  );
}

TreeBranchContent.displayName = "TreeBranchContent";

type TreeCompound = typeof TreeRoot & {
  Root: typeof TreeRoot;
  Item: typeof TreeItem;
  Branch: typeof TreeBranch;
  BranchControl: typeof TreeBranchControl;
  BranchContent: typeof TreeBranchContent;
};

const TreeCompound: TreeCompound = Object.assign(TreeRoot, {
  Root: TreeRoot,
  Item: TreeItem,
  Branch: TreeBranch,
  BranchControl: TreeBranchControl,
  BranchContent: TreeBranchContent,
});

TreeCompound.displayName = "Tree";

export { TreeCompound as Tree };
