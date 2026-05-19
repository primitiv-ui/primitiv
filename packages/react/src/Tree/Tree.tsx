import { TreeLevelContext, useTreeLevelContext } from "./TreeContext";

import type { TreeRootProps, TreeItemProps } from "./types";

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

type TreeCompound = typeof TreeRoot & {
  Root: typeof TreeRoot;
  Item: typeof TreeItem;
};

const TreeCompound: TreeCompound = Object.assign(TreeRoot, {
  Root: TreeRoot,
  Item: TreeItem,
});

TreeCompound.displayName = "Tree";

export { TreeCompound as Tree };
