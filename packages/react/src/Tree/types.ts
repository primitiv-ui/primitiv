import { ComponentProps, ReactNode } from "react";

type TreeRootBaseProps = ComponentProps<"div"> & {
  children: ReactNode;
};

type TreeRootUncontrolledExpansionProps = {
  /** Branch values expanded on first render when uncontrolled. */
  defaultExpandedValues?: string[];
  expandedValues?: never;
  onExpandedChange?: (values: string[]) => void;
};

type TreeRootControlledExpansionProps = {
  defaultExpandedValues?: never;
  /** The set of expanded branch values, owned by the consumer. */
  expandedValues: string[];
  onExpandedChange: (values: string[]) => void;
};

export type TreeRootProps = TreeRootBaseProps &
  (TreeRootUncontrolledExpansionProps | TreeRootControlledExpansionProps);

export type TreeItemProps = ComponentProps<"div"> & {
  /** Stable identifier for this item, unique within the tree. */
  value: string;
  children: ReactNode;
};

export type TreeBranchProps = Omit<ComponentProps<"div">, "ref"> & {
  /** Stable identifier for this branch, unique within the tree. */
  value: string;
  children: ReactNode;
};

export type TreeBranchControlProps = ComponentProps<"div"> & {
  children: ReactNode;
};

export type TreeBranchContentProps = ComponentProps<"div"> & {
  children: ReactNode;
};

export type TreeLevelContextValue = {
  /** Zero-based nesting depth — `0` for items directly inside `Tree.Root`. */
  depth: number;
};

export type TreeContextValue = {
  isExpanded: (value: string) => boolean;
  toggleExpanded: (value: string, next?: boolean) => void;
};

export type TreeItemContextValue = {
  value: string;
  expanded: boolean;
};
