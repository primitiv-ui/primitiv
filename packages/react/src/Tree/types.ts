import type { ComponentProps, ReactNode } from "react";

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

type TreeRootSingleUncontrolledSelectionProps = {
  selectionMode?: "single";
  /** The value selected on first render when uncontrolled. */
  defaultSelectedValue?: string | null;
  selectedValue?: never;
  onSelectedValueChange?: (value: string | null) => void;
  defaultSelectedValues?: never;
  selectedValues?: never;
  onSelectedValuesChange?: never;
};

type TreeRootSingleControlledSelectionProps = {
  selectionMode?: "single";
  defaultSelectedValue?: never;
  /** The selected value, owned by the consumer. */
  selectedValue: string | null;
  onSelectedValueChange: (value: string | null) => void;
  defaultSelectedValues?: never;
  selectedValues?: never;
  onSelectedValuesChange?: never;
};

type TreeRootMultipleUncontrolledSelectionProps = {
  selectionMode: "multiple";
  /** The values selected on first render when uncontrolled. */
  defaultSelectedValues?: string[];
  selectedValues?: never;
  onSelectedValuesChange?: (values: string[]) => void;
  defaultSelectedValue?: never;
  selectedValue?: never;
  onSelectedValueChange?: never;
};

type TreeRootMultipleControlledSelectionProps = {
  selectionMode: "multiple";
  defaultSelectedValues?: never;
  /** The selected values, owned by the consumer. */
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  defaultSelectedValue?: never;
  selectedValue?: never;
  onSelectedValueChange?: never;
};

export type TreeRootProps = TreeRootBaseProps &
  (TreeRootUncontrolledExpansionProps | TreeRootControlledExpansionProps) &
  (
    | TreeRootSingleUncontrolledSelectionProps
    | TreeRootSingleControlledSelectionProps
    | TreeRootMultipleUncontrolledSelectionProps
    | TreeRootMultipleControlledSelectionProps
  );

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
  /**
   * Keep the content mounted while the branch is collapsed so CSS can
   * animate it in and out. When collapsed it is hidden from assistive
   * technology with `aria-hidden`.
   */
  forceMount?: boolean;
};

export type TreeBranchIndicatorProps = ComponentProps<"span">;

export type TreeLevelContextValue = {
  /** Zero-based nesting depth — `0` for items directly inside `Tree.Root`. */
  depth: number;
  /** The value of the enclosing branch, or `null` at the tree root. */
  parentValue: string | null;
};

export type TreeNodeMeta = {
  value: string;
  element: HTMLElement;
  isBranch: boolean;
  depth: number;
  parentValue: string | null;
};

export type SelectionMode = "single" | "multiple";

export type TreeSelectModifiers = {
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
};

export type TreeContextValue = {
  selectionMode: SelectionMode;
  isExpanded: (value: string) => boolean;
  toggleExpanded: (value: string, next?: boolean) => void;
  isSelected: (value: string) => boolean;
  select: (value: string, modifiers?: TreeSelectModifiers) => void;
  registerNode: (value: string, meta: TreeNodeMeta | null) => void;
  getVisibleOrder: () => string[];
  /** Value of the treeitem currently holding the single roving tabstop. */
  tabStop: string | null;
  setActiveValue: (value: string) => void;
  focusItem: (value: string) => void;
};

export type TreeItemContextValue = {
  value: string;
  expanded: boolean;
};
