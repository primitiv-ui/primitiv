import type { ComponentProps, ReactNode } from "react";

/** Mode-independent props shared by every `Tree.Root` variant. */
export type TreeRootBaseProps = ComponentProps<"div"> & {
  children: ReactNode;
};

/** Uncontrolled expansion — initial expanded branches via `defaultExpandedValues`. */
export type TreeRootUncontrolledExpansionProps = {
  /** Branch values expanded on first render when uncontrolled. */
  defaultExpandedValues?: string[];
  expandedValues?: never;
  onExpandedChange?: (values: string[]) => void;
};

/** Controlled expansion — the expanded set is owned by the consumer. */
export type TreeRootControlledExpansionProps = {
  defaultExpandedValues?: never;
  /** The set of expanded branch values, owned by the consumer. */
  expandedValues: string[];
  onExpandedChange: (values: string[]) => void;
};

/** Single-selection mode, uncontrolled — initial value via `defaultSelectedValue`. */
export type TreeRootSingleUncontrolledSelectionProps = {
  selectionMode?: "single";
  /** The value selected on first render when uncontrolled. */
  defaultSelectedValue?: string | null;
  selectedValue?: never;
  onSelectedValueChange?: (value: string | null) => void;
  defaultSelectedValues?: never;
  selectedValues?: never;
  onSelectedValuesChange?: never;
};

/** Single-selection mode, controlled — the selected value is owned by the consumer. */
export type TreeRootSingleControlledSelectionProps = {
  selectionMode?: "single";
  defaultSelectedValue?: never;
  /** The selected value, owned by the consumer. */
  selectedValue: string | null;
  onSelectedValueChange: (value: string | null) => void;
  defaultSelectedValues?: never;
  selectedValues?: never;
  onSelectedValuesChange?: never;
};

/** Multiple-selection mode, uncontrolled — initial values via `defaultSelectedValues`. */
export type TreeRootMultipleUncontrolledSelectionProps = {
  selectionMode: "multiple";
  /** The values selected on first render when uncontrolled. */
  defaultSelectedValues?: string[];
  selectedValues?: never;
  onSelectedValuesChange?: (values: string[]) => void;
  defaultSelectedValue?: never;
  selectedValue?: never;
  onSelectedValueChange?: never;
};

/** Multiple-selection mode, controlled — the selected values are owned by the consumer. */
export type TreeRootMultipleControlledSelectionProps = {
  selectionMode: "multiple";
  defaultSelectedValues?: never;
  /** The selected values, owned by the consumer. */
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  defaultSelectedValue?: never;
  selectedValue?: never;
  onSelectedValueChange?: never;
};

/**
 * Props for `Tree.Root`. Combines the shared {@link TreeRootBaseProps} with
 * one expansion arm (controlled / uncontrolled) and one selection arm
 * (single / multiple, controlled / uncontrolled), so the relevant
 * `value` / `defaultValue` / `onChange` shape is enforced per mode.
 */
export type TreeRootProps = TreeRootBaseProps &
  (TreeRootUncontrolledExpansionProps | TreeRootControlledExpansionProps) &
  (
    | TreeRootSingleUncontrolledSelectionProps
    | TreeRootSingleControlledSelectionProps
    | TreeRootMultipleUncontrolledSelectionProps
    | TreeRootMultipleControlledSelectionProps
  );

/** Props for `Tree.Item` — a selectable, focusable leaf treeitem. */
export type TreeItemProps = ComponentProps<"div"> & {
  /** Stable identifier for this item, unique within the tree. */
  value: string;
  /**
   * Optional display label for this item. Stored alongside the value
   * in the tree's node registry so {@link useTreePath} and
   * `Tree.SelectionPath` can surface it without an external lookup.
   * Has no effect on what `Tree.Item` renders.
   */
  label?: string;
  /** Disable selection and remove the item from roving navigation. */
  disabled?: boolean;
  /** Render the item as the supplied child element instead of `<div>`. */
  asChild?: boolean;
  children: ReactNode;
};

/** Props for `Tree.Branch` — an expandable treeitem with nested children. */
export type TreeBranchProps = Omit<ComponentProps<"div">, "ref"> & {
  /** Stable identifier for this branch, unique within the tree. */
  value: string;
  /**
   * Optional display label for this branch. Stored alongside the value
   * in the tree's node registry so {@link useTreePath} and
   * `Tree.SelectionPath` can surface it without an external lookup.
   * Has no effect on what `Tree.Branch` renders.
   */
  label?: string;
  /**
   * Disable selection, expansion-toggling, and roving navigation for
   * this branch. The branch and its current content remain rendered.
   */
  disabled?: boolean;
  children: ReactNode;
};

/** Props for `Tree.BranchControl` — the branch's selectable, toggling control row. */
export type TreeBranchControlProps = ComponentProps<"div"> & {
  /** Render the control as the supplied child element instead of `<div>`. */
  asChild?: boolean;
  children: ReactNode;
};

/** Props for `Tree.BranchContent` — the collapsible group of a branch's child nodes. */
export type TreeBranchContentProps = ComponentProps<"div"> & {
  children: ReactNode;
  /**
   * Keep the content mounted while the branch is collapsed so CSS can
   * animate it in and out. When collapsed it is hidden from assistive
   * technology with `aria-hidden`.
   */
  forceMount?: boolean;
};

/** Props for `Tree.BranchIndicator` — the expand/collapse affordance. */
export type TreeBranchIndicatorProps = ComponentProps<"span"> & {
  /** Render as the supplied child element instead of `<span>`. */
  asChild?: boolean;
};

/** Arguments passed to the `Tree.SelectionPath` render-prop form. */
export type TreeSelectionPathRenderProps = {
  /** One root-to-leaf chain per currently-selected value, in selection order. */
  paths: TreePathSegment[][];
};

/**
 * Props for `Tree.SelectionPath` — a breadcrumb of the selected node's
 * root-to-leaf ancestry, with an optional render-prop for custom layout.
 */
export type TreeSelectionPathProps = Omit<ComponentProps<"div">, "children"> & {
  /**
   * Either standard React children (ignored — the subcomponent does its
   * own rendering) or a render-prop receiving the resolved selection
   * paths so consumers can lay out custom markup.
   */
  children?: ReactNode | ((args: TreeSelectionPathRenderProps) => ReactNode);
  /**
   * Node passed to each `Breadcrumb.Separator` in the default rendering.
   * Defaults to Breadcrumb's built-in `"/"` glyph.
   */
  separator?: ReactNode;
};

/** Per-level context — the nesting depth and enclosing branch value, shared down each subtree. */
export type TreeLevelContextValue = {
  /** Zero-based nesting depth — `0` for items directly inside `Tree.Root`. */
  depth: number;
  /** The value of the enclosing branch, or `null` at the tree root. */
  parentValue: string | null;
};

/** Registry entry for one tree node — its value, element, and structural metadata. */
export type TreeNodeMeta = {
  value: string;
  element: HTMLElement;
  isBranch: boolean;
  disabled: boolean;
  depth: number;
  parentValue: string | null;
  label: string | null;
};

/**
 * One segment of an ancestor chain returned by {@link useTreePath} or
 * `TreeContextValue.getPath`. The array is ordered **root → leaf**, so
 * the last segment is the queried item itself.
 */
export type TreePathSegment = {
  value: string;
  label: string | null;
  isBranch: boolean;
  disabled: boolean;
  depth: number;
};

/** Whether the tree allows one selected node (`"single"`) or many (`"multiple"`). */
export type SelectionMode = "single" | "multiple";

/** Keyboard/pointer modifiers that influence a selection gesture. */
export type TreeSelectModifiers = {
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
};

/**
 * Context shared from `Tree.Root` to every descendant — selection and
 * expansion state, the node registry, roving-tabindex bookkeeping, and the
 * path resolver.
 */
export type TreeContextValue = {
  /** Stable id shared across the tree, used to derive ARIA wiring ids. */
  rootId: string;
  selectionMode: SelectionMode;
  isExpanded: (value: string) => boolean;
  toggleExpanded: (value: string) => void;
  isSelected: (value: string) => boolean;
  select: (value: string, modifiers?: TreeSelectModifiers) => void;
  registerNode: (value: string, meta: TreeNodeMeta | null) => void;
  getVisibleOrder: () => string[];
  isNodeDisabled: (value: string) => boolean;
  /** Value of the treeitem currently holding the single roving tabstop. */
  tabStop: string | null;
  setActiveValue: (value: string) => void;
  focusItem: (value: string) => void;
  /**
   * Returns the root-to-leaf chain of segments for the given value, or
   * an empty array if the value has never been registered. Walks the
   * persistent node registry so paths remain resolvable even when an
   * ancestor branch has collapsed and its descendants unmounted.
   */
  getPath: (value: string) => TreePathSegment[];
  /**
   * The currently-selected values in selection order. Mirrors
   * `selectedValues` in multiple mode and `[selectedValue]` (or `[]`)
   * in single mode.
   */
  selectedOrder: readonly string[];
};

/** Context a branch shares with its own control and content — its value, expanded/disabled state, and control id. */
export type TreeItemContextValue = {
  value: string;
  expanded: boolean;
  disabled: boolean;
  /** DOM `id` of the branch's `BranchControl`, for `aria-labelledby`. */
  controlId: string;
};
