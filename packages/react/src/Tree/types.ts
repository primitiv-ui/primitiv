import { ComponentProps, ReactNode } from "react";

export type TreeRootProps = ComponentProps<"div"> & {
  children: ReactNode;
};

export type TreeItemProps = ComponentProps<"div"> & {
  /** Stable identifier for this item, unique within the tree. */
  value: string;
  children: ReactNode;
};

export type TreeLevelContextValue = {
  /** Zero-based nesting depth — `0` for items directly inside `Tree.Root`. */
  depth: number;
};
