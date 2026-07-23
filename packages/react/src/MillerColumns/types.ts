import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Shared base for both {@link MillerColumnsRootProps} variants — the native
 * `<div>` attributes (minus `ref`, which the strip owns internally).
 */
export type MillerColumnsRootBaseProps = Omit<
  ComponentProps<"div">,
  "ref" | "defaultValue"
> & {
  /**
   * The strip's tree, authored recursively: root
   * {@link MillerColumnsColumnProps | Column(s)} whose branch
   * {@link MillerColumnsItemProps | Items} nest further Columns, plus an
   * optional trailing {@link MillerColumnsPreviewPanelProps | PreviewPanel}.
   * There is no `items` data prop — the JSX *is* the data.
   */
  children: ReactNode;
};

/**
 * Uncontrolled variant of {@link MillerColumnsRootProps}: the component owns
 * the selection path. Pass `defaultValue` (or omit it to start empty).
 */
export type MillerColumnsRootUncontrolledProps = MillerColumnsRootBaseProps & {
  /** Initial selection path on first render, root column first (e.g.
   * `["docs", "guides"]`). The component owns the path thereafter. */
  defaultValue?: string[];
  /** Forbidden in uncontrolled mode — use `defaultValue` instead. */
  value?: never;
  /** Forbidden in uncontrolled mode — pass `value` + `onValueChange` to
   * control the component. */
  onValueChange?: never;
};

/**
 * Controlled variant of {@link MillerColumnsRootProps}: the parent owns the
 * selection path. Pass `value` and `onValueChange` together.
 */
export type MillerColumnsRootControlledProps = MillerColumnsRootBaseProps & {
  /** Forbidden in controlled mode — use `value` instead. */
  defaultValue?: never;
  /** The controlled selection path, root column first. Must be kept in sync
   * by the parent via `onValueChange`. */
  value: string[];
  /** Called with the new selection path whenever the selection changes.
   * Required in controlled mode. */
  onValueChange: (path: string[]) => void;
};

/**
 * Props for {@link MillerColumnsRoot | `MillerColumns.Root`}.
 *
 * Resolves to either {@link MillerColumnsRootUncontrolledProps} or
 * {@link MillerColumnsRootControlledProps} — only one shape is accepted by
 * TypeScript at a time.
 */
export type MillerColumnsRootProps =
  | MillerColumnsRootUncontrolledProps
  | MillerColumnsRootControlledProps;

/**
 * Props for {@link MillerColumnsColumn | `MillerColumns.Column`}, a single
 * vertical list. Rendered element is portal-projected into the Root strip.
 */
export type MillerColumnsColumnProps = ComponentProps<"div"> & {
  /** The column's {@link MillerColumnsItemProps | Items} and, optionally, a
   * {@link MillerColumnsResizeHandleProps | ResizeHandle}. */
  children: ReactNode;
};

/**
 * Props for {@link MillerColumnsItem | `MillerColumns.Item`}, a single
 * selectable node within a column.
 *
 * Generic over the rendered element type so `asChild` consumers can type
 * the forwarded `ref` (e.g. `MillerColumns.Item<HTMLAnchorElement>`).
 */
export type MillerColumnsItemProps<T extends HTMLElement = HTMLDivElement> =
  Omit<ComponentProps<"div">, "ref"> & {
    /** Stable identifier used to match this item against the selection path.
     * The item is selected when the path entry at its depth equals `value`. */
    value: string;
    /**
     * When `true`, the item renders `aria-disabled` / `data-disabled` and is
     * skipped by roving navigation — it cannot be selected, focused, or
     * activated.
     * @default false
     */
    disabled?: boolean;
    /**
     * Render the cell as a single consumer-supplied child element (e.g. an
     * `<a>`) instead of the default `<div>`, merging the treeitem ARIA,
     * handlers, and ref onto it via the {@link Slot} pattern. Any nested
     * `<MillerColumns.Column>` remains a sibling of the cell element.
     * @default false
     */
    asChild?: boolean;
    /** The cell content and, for a branch item, a single nested
     * `<MillerColumns.Column>` (split out by `partitionItemChildren`). */
    children: ReactNode;
    /** Forwarded to the rendered element. Defaults to `HTMLDivElement`; when
     * using `asChild`, specify the child's element type. Composed with the
     * library's internal ref. */
    ref?: Ref<T>;
  };

/**
 * Props for {@link MillerColumnsItemIndicator | `MillerColumns.ItemIndicator`},
 * the branch chevron affordance (renders nothing for leaf items).
 */
export type MillerColumnsItemIndicatorProps = ComponentProps<"span"> & {
  /** The glyph to render (e.g. `▸`). Optional. */
  children?: ReactNode;
};

/**
 * Props for {@link MillerColumnsResizeHandle | `MillerColumns.ResizeHandle`},
 * the drag-to-resize separator for its containing column.
 */
export type MillerColumnsResizeHandleProps = ComponentProps<"div">;

/**
 * Props for {@link MillerColumnsPreviewPanel | `MillerColumns.PreviewPanel`},
 * the trailing preview pane.
 */
export type MillerColumnsPreviewPanelProps = ComponentProps<"div"> & {
  /** The preview content for the current selection (typically driven by
   * {@link useMillerColumnsSelection}). */
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
