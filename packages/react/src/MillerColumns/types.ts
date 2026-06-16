import { ComponentProps, ReactNode, Ref } from "react";

/** Props common to both controlled and uncontrolled `MillerColumns.Root` modes. */
export type MillerColumnsRootBaseProps = Omit<ComponentProps<"div">, "ref"> & {
  /** The columns and panels that make up the strip. */
  children: ReactNode;
};

/**
 * Props for `MillerColumns.Root` in uncontrolled mode — the component owns the
 * selection path. Pass `defaultValue` to set the initial path.
 */
export type MillerColumnsRootUncontrolledProps = MillerColumnsRootBaseProps & {
  /** Initial selection path when uncontrolled. */
  defaultValue?: string[];
  /** Forbidden in uncontrolled mode. */
  value?: never;
  /** Forbidden in uncontrolled mode. */
  onValueChange?: never;
};

/**
 * Props for `MillerColumns.Root` in controlled mode — the parent owns the
 * selection path. Pass `value` and `onValueChange` together.
 */
export type MillerColumnsRootControlledProps = MillerColumnsRootBaseProps & {
  /** Forbidden in controlled mode. */
  defaultValue?: never;
  /** The controlled selection path, root column first. */
  value: string[];
  /** Called with the new path whenever the selection changes. */
  onValueChange: (path: string[]) => void;
};

/** Props for `MillerColumns.Root` — discriminated controlled/uncontrolled union. */
export type MillerColumnsRootProps =
  | MillerColumnsRootUncontrolledProps
  | MillerColumnsRootControlledProps;

/** Props for `MillerColumns.Column`, a single vertical list within the strip. */
export type MillerColumnsColumnProps = ComponentProps<"div"> & {
  /** The items (and optional resize handle) of this column. */
  children: ReactNode;
};

/** Props for `MillerColumns.Item`, a single selectable node within a column. */
export type MillerColumnsItemProps<T extends HTMLElement = HTMLDivElement> =
  Omit<ComponentProps<"div">, "ref"> & {
    /** Stable identifier used to match this item against the selection path. */
    value: string;
    /** When `true`, the item cannot be selected or focused. */
    disabled?: boolean;
    /** Render the child element instead of the default `<div>`. */
    asChild?: boolean;
    /** Cell content and, for a branch, a nested `<MillerColumns.Column>`. */
    children: ReactNode;
    /** Ref to the rendered element. Defaults to `HTMLDivElement`; when using
     * `asChild`, specify the child's element type. */
    ref?: Ref<T>;
  };

/** Props for `MillerColumns.ItemIndicator`, the branch chevron affordance. */
export type MillerColumnsItemIndicatorProps = ComponentProps<"span"> & {
  /** The glyph to render (defaults to none). */
  children?: ReactNode;
};

/** Props for `MillerColumns.ResizeHandle`, the drag-to-resize separator. */
export type MillerColumnsResizeHandleProps = ComponentProps<"div">;

/** Props for `MillerColumns.PreviewPanel`, the trailing preview pane. */
export type MillerColumnsPreviewPanelProps = ComponentProps<"div"> & {
  /** The preview content for the current selection. */
  children?: ReactNode;
};

/** The current selection, as returned by `useMillerColumnsSelection`. */
export type MillerColumnsSelection = {
  /** The full active path — selected item ids, root column first. */
  path: string[];
  /** The deepest selected item id, or `undefined` when nothing is selected. */
  selectedValue: string | undefined;
};

/** Metadata recorded for each registered item, used for column navigation. */
export type MillerColumnsItemMeta = {
  /** The item's stable identifier. */
  value: string;
  /** Whether the item is disabled. */
  disabled: boolean;
};

/** A depth + value pair locating an item within the strip. */
export type MillerColumnsItemAddress = {
  /** The zero-based column depth. */
  depth: number;
  /** The item's stable identifier. */
  value: string;
};

/** Value shared through the root MillerColumns context. */
export type MillerColumnsContextValue = {
  /** Portal slots keyed by column depth. */
  slots: Map<number, HTMLElement>;
  /** Per-depth column widths set via the resize handle. */
  columnWidths: Map<number, number>;
  /** Record a column's width at the given depth. */
  setColumnWidth: (depth: number, width: number) => void;
  /** The active selection path. */
  activePath: string[];
  /** Select the item at the given depth and value. */
  select: (depth: number, value: string) => void;
  /** Register (or unregister, with a `null` element) an item. */
  registerItem: (
    depth: number,
    value: string,
    element: HTMLElement | null,
    disabled: boolean,
  ) => void;
  /** Get the registered items for a column. */
  getColumnItems: (depth: number) => MillerColumnsItemMeta[];
  /** Move focus to the given item. */
  focusItem: (depth: number, value: string) => void;
  /** Focus the first item in a column; returns whether one was focused. */
  focusFirstInColumn: (depth: number) => boolean;
  /** Request that focus move into the given column. */
  requestColumnFocus: (depth: number) => void;
  /** The currently active (focused) item, if any. */
  activeItem: MillerColumnsItemAddress | null;
  /** Set the active (focused) item. */
  setActiveItem: (item: MillerColumnsItemAddress) => void;
};

/** Value shared through a column's context. */
export type MillerColumnsColumnContextValue = {
  /** The column's zero-based depth. */
  depth: number;
};

/** Value shared through an item's context. */
export type MillerColumnsItemContextValue = {
  /** Whether this item is on the active path. */
  selected: boolean;
  /** Whether this item has a nested child column. */
  hasChildren: boolean;
};
