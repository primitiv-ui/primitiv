import { TreeLevelContext, useTreeLevelContext } from "./TreeContext";
import { partitionBranchChildren } from "./utils";

import type {
  TreeRootProps,
  TreeItemProps,
  TreeBranchProps,
  TreeBranchControlProps,
  TreeBranchContentProps,
} from "./types";

export function TreeRoot({ children, ...rest }: TreeRootProps) {
  return (
    <TreeLevelContext.Provider value={{ depth: 0 }}>
      <div role="tree" {...rest}>
        {children}
      </div>
    </TreeLevelContext.Provider>
  );
}

TreeRoot.displayName = "TreeRoot";

export function TreeItem({ value: _value, children, ...rest }: TreeItemProps) {
  useTreeLevelContext();

  return (
    <div role="treeitem" {...rest}>
      {children}
    </div>
  );
}

TreeItem.displayName = "TreeItem";

export function TreeBranch({
  value: _value,
  children,
  ...rest
}: TreeBranchProps) {
  useTreeLevelContext();
  const { control, content } = partitionBranchChildren(children);

  return (
    <div role="treeitem" {...rest}>
      {control}
      {content}
    </div>
  );
}

TreeBranch.displayName = "TreeBranch";

export function TreeBranchControl({
  children,
  ...rest
}: TreeBranchControlProps) {
  return <div {...rest}>{children}</div>;
}

TreeBranchControl.displayName = "TreeBranchControl";

export function TreeBranchContent({
  children,
  ...rest
}: TreeBranchContentProps) {
  const { depth } = useTreeLevelContext();

  return (
    <TreeLevelContext.Provider value={{ depth: depth + 1 }}>
      <div role="group" {...rest}>
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
