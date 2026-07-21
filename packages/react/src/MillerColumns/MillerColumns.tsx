import { Ref } from "react";
import type { ReactElement, ReactPortal } from "react";
import { createPortal } from "react-dom";

import { Slot } from "../Slot/index.ts";

import {
  MillerColumnsContext,
  MillerColumnsColumnContext,
  MillerColumnsItemContext,
} from "./MillerColumnsContext";
import {
  useMillerColumnsColumn,
  useMillerColumnsContext,
  useMillerColumnsItem,
  useMillerColumnsItemContext,
  useMillerColumnsResizeHandle,
  useMillerColumnsRoot,
} from "./hooks/index.ts";

import { partitionItemChildren } from "./utils";

import type {
  MillerColumnsRootProps,
  MillerColumnsColumnProps,
  MillerColumnsItemProps,
  MillerColumnsItemIndicatorProps,
  MillerColumnsResizeHandleProps,
  MillerColumnsPreviewPanelProps,
} from "./types";

/**
 * The root of a Miller Columns widget — a horizontal strip of vertical
 * lists where selecting a node reveals its children in the next column.
 *
 * Renders the strip container (`role="tree"`, `data-orientation="horizontal"`)
 * into which every {@link MillerColumnsColumn | `MillerColumns.Column`}
 * projects itself via a portal. Authoring the tree is **recursive** and
 * data-less: there is no `items` prop — an {@link MillerColumnsItem | `Item`}
 * declares its child column as a *nested* `<MillerColumns.Column>`, and the
 * strip flattens those nested columns into a single left-to-right row by
 * rendering one `display: contents` slot per visible depth and portalling
 * each column into its slot. This fixes left-to-right DOM order by slot
 * order rather than by portal commit order.
 *
 * **Controlled vs uncontrolled.** State is the *selection path* — an array
 * of item ids, root column first (`["docs", "guides"]`). The two modes are
 * statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass {@link MillerColumnsRootUncontrolledProps.defaultValue | `defaultValue`}
 *   (or omit it to start empty). The component owns the path.
 * - **Controlled** — pass {@link MillerColumnsRootControlledProps.value | `value`}
 *   and {@link MillerColumnsRootControlledProps.onValueChange | `onValueChange`}
 *   together; every selection defers back through the callback.
 *
 * **Roving tabindex.** The whole tree has exactly **one** Tab stop
 * (`tabIndex={0}`), not one per column. It follows the last-focused item;
 * before any focus it defaults to the deepest selected item, falling back
 * to the first enabled root item. Within a column, Up/Down/Home/End move
 * focus; ArrowRight opens (and steps into) a branch item's child column,
 * ArrowLeft returns to the parent item.
 *
 * **Context.** Root establishes {@link MillerColumnsContext} (selection
 * path, portal slots, item registry, column widths, and focus commands);
 * each Column provides {@link MillerColumnsColumnContext} (its depth) and
 * each Item {@link MillerColumnsItemContext} (`selected` / `hasChildren`).
 * Read the current selection from consumer content with
 * {@link useMillerColumnsSelection}.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <MillerColumns.Root>
 *   <MillerColumns.Column>
 *     <MillerColumns.Item value="docs">Docs</MillerColumns.Item>
 *   </MillerColumns.Column>
 * </MillerColumns.Root>
 * ```
 */
export function MillerColumnsRoot({
  children,
  defaultValue,
  value,
  onValueChange,
  ...rest
}: MillerColumnsRootProps): ReactElement {
  const { contextValue, columnCount, registerSlotRef, stripRef } =
    useMillerColumnsRoot(value, defaultValue, onValueChange);

  return (
    <MillerColumnsContext.Provider value={contextValue}>
      <div
        ref={stripRef}
        role="tree"
        data-miller-columns-strip=""
        data-orientation="horizontal"
        {...rest}
      >
        {Array.from({ length: columnCount }, (_, depth) => (
          <div
            key={depth}
            data-miller-columns-slot=""
            style={{ display: "contents" }}
            ref={registerSlotRef(depth)}
          />
        ))}
        {children}
      </div>
    </MillerColumnsContext.Provider>
  );
}

/** @internal */
MillerColumnsRoot.displayName = "MillerColumnsRoot";

/**
 * A single vertical list of items within the strip. Renders a
 * `<div role="group">` (carrying `data-depth`) that is **portal-projected**
 * into the {@link MillerColumnsRoot | `Root`} strip's depth slot, so a
 * `Column` nested inside an `Item` still appears side-by-side with its
 * ancestors rather than in document flow. Until its slot has mounted the
 * component renders `null`.
 *
 * It reads its depth from {@link MillerColumnsContext} and re-provides it to
 * descendant {@link MillerColumnsItem | Items} via
 * {@link MillerColumnsColumnContext}. A width set by a
 * {@link MillerColumnsResizeHandle | `ResizeHandle`} in this column is
 * applied here as an inline `width` style (consumer `style` still wins for
 * every other property).
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <MillerColumns.Column>
 *   <MillerColumns.Item value="a">A</MillerColumns.Item>
 * </MillerColumns.Column>
 * ```
 */
export function MillerColumnsColumn({
  children,
  style,
  ...rest
}: MillerColumnsColumnProps): ReactPortal | null {
  const { slot, depth, width, columnContextValue } = useMillerColumnsColumn();

  if (!slot) {
    return null;
  }

  return createPortal(
    <MillerColumnsColumnContext.Provider value={columnContextValue}>
      <div
        role="group"
        data-miller-columns-column=""
        data-depth={depth}
        style={{ ...style, ...(width !== undefined ? { width } : {}) }}
        {...rest}
      >
        {children}
      </div>
    </MillerColumnsColumnContext.Provider>,
    slot,
  );
}

/** @internal */
MillerColumnsColumn.displayName = "MillerColumnsColumn";

/**
 * A single selectable node within a {@link MillerColumnsColumn | `Column`}.
 * Renders a `<div role="treeitem">` for its cell content, with
 * `aria-selected`, `aria-level` (1-based depth), and `data-state` /
 * `data-depth` styling hooks.
 *
 * The {@link MillerColumnsItemProps.value | `value`} prop is the stable
 * identifier used to match this item against the active selection path.
 *
 * **Branch vs leaf.** An `Item` becomes a *branch* by nesting a
 * `<MillerColumns.Column>` among its children — `partitionItemChildren`
 * splits the children into the cell content and that single optional
 * nested column (matched however deeply it is wrapped in fragments; a
 * second nested column throws). A branch carries `aria-expanded` and
 * mounts its child column (projecting it into the strip) only while the
 * item is selected; an item with no nested column is a *leaf*.
 *
 * **Keyboard & selection.** Clicking or activating (Enter/Space) selects
 * the item, truncating the path to this depth. ArrowRight on a branch opens
 * and steps into the child column; ArrowLeft returns focus to the parent
 * item. The item participates in the tree-wide single roving Tab stop.
 *
 * **Disabled.** Pass `disabled` to render `aria-disabled="true"` /
 * `data-disabled`; the item is skipped by roving navigation and cannot be
 * selected, focused, or activated.
 *
 * **`asChild` prop.** Pass `asChild` to render the cell as a
 * consumer-supplied element (e.g. an `<a>`) instead of the default
 * `<div>`. All treeitem ARIA attributes, event handlers, and the internal
 * ref are merged onto that child via the {@link Slot} pattern. A nested
 * `<MillerColumns.Column>` is still declared as a sibling of the cell
 * element.
 *
 * **Ref forwarding.** A `ref` prop (React 19 ref-as-prop style) is
 * forwarded to the rendered element and composed with the library's
 * internal ref.
 *
 * @extends HTMLDivElement
 *
 * @example Leaf
 * ```tsx
 * <MillerColumns.Item value="guides">Guides</MillerColumns.Item>
 * ```
 *
 * @example Branch
 * ```tsx
 * <MillerColumns.Item value="docs">
 *   Docs
 *   <MillerColumns.Column>
 *     <MillerColumns.Item value="guides">Guides</MillerColumns.Item>
 *   </MillerColumns.Column>
 * </MillerColumns.Item>
 * ```
 */
export function MillerColumnsItem<T extends HTMLElement = HTMLDivElement>({
  children,
  ref,
  asChild = false,
  ...props
}: MillerColumnsItemProps<T>): ReactElement {
  const { cell, column } = partitionItemChildren(children);
  const { itemProps, selected, itemContextValue } = useMillerColumnsItem(
    { ref: ref as Ref<HTMLDivElement>, ...props },
    column !== null,
  );

  return (
    <MillerColumnsItemContext.Provider value={itemContextValue}>
      {asChild ? (
        <Slot {...itemProps}>{cell[0]}</Slot>
      ) : (
        <div {...itemProps}>{cell}</div>
      )}
      {selected ? column : null}
    </MillerColumnsItemContext.Provider>
  );
}

/** @internal */
MillerColumnsItem.displayName = "MillerColumnsItem";

/**
 * An optional, decorative affordance for a branch item — typically a
 * chevron or arrow signalling "this item reveals a child column".
 *
 * Renders a `<span aria-hidden="true">` (so the glyph is ignored by
 * assistive technology) **only for branch items**; for a leaf item it
 * renders nothing. Place it among an `Item`'s cell content.
 *
 * **Styling hooks.**
 * - `data-state="selected" | "unselected"` — mirrors the parent item.
 * - `data-has-children` — always present (the indicator only renders
 *   for branch items).
 *
 * @extends HTMLSpanElement
 *
 * @example
 * ```tsx
 * <MillerColumns.Item value="docs">
 *   Docs
 *   <MillerColumns.ItemIndicator>▸</MillerColumns.ItemIndicator>
 *   <MillerColumns.Column>…</MillerColumns.Column>
 * </MillerColumns.Item>
 * ```
 */
export function MillerColumnsItemIndicator({
  children,
  ...rest
}: MillerColumnsItemIndicatorProps): ReactElement | null {
  const { selected, hasChildren } = useMillerColumnsItemContext();

  if (!hasChildren) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      data-state={selected ? "selected" : "unselected"}
      data-has-children=""
      {...rest}
    >
      {children}
    </span>
  );
}

/** @internal */
MillerColumnsItemIndicator.displayName = "MillerColumnsItemIndicator";

/**
 * A drag-to-resize affordance for the column it is rendered in. Renders a
 * `<div role="separator" aria-orientation="vertical">` that, while
 * pointer-dragged, drives that column's width as state on the `Root`.
 *
 * Must be rendered among a {@link MillerColumnsColumn | `MillerColumns.Column`}'s
 * children — it reads the column's depth from
 * {@link MillerColumnsColumnContext}. Position it with CSS (typically
 * absolutely, against the column's trailing edge).
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <MillerColumns.Column>
 *   <MillerColumns.ResizeHandle />
 *   <MillerColumns.Item value="a">A</MillerColumns.Item>
 * </MillerColumns.Column>
 * ```
 */
export function MillerColumnsResizeHandle(
  props: MillerColumnsResizeHandleProps,
): ReactElement {
  const { handleProps } = useMillerColumnsResizeHandle(props);

  return <div {...handleProps} />;
}

/** @internal */
MillerColumnsResizeHandle.displayName = "MillerColumnsResizeHandle";

/**
 * A trailing panel for previewing the current selection — the
 * macOS-Finder-style preview pane.
 *
 * Renders a plain `<div data-miller-columns-preview>` as the last child
 * of the strip, sitting to the right of the columns. The component is
 * deliberately content-agnostic: it does not know how to preview an
 * item, so the consumer supplies whatever the panel should show.
 *
 * Pair it with {@link useMillerColumnsSelection} to render content for
 * the current selection. Author it as the **last child** of `Root`, a
 * sibling of the root `Column`. It subscribes to
 * {@link MillerColumnsContext} (so it must live inside a `Root`) but does
 * not portal — it stays in document flow after the projected columns.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * function FilePreview() {
 *   const { selectedValue } = useMillerColumnsSelection();
 *   return selectedValue ? <Preview id={selectedValue} /> : null;
 * }
 *
 * <MillerColumns.Root>
 *   <MillerColumns.Column>{items}</MillerColumns.Column>
 *   <MillerColumns.PreviewPanel>
 *     <FilePreview />
 *   </MillerColumns.PreviewPanel>
 * </MillerColumns.Root>;
 * ```
 */
export function MillerColumnsPreviewPanel({
  children,
  ...rest
}: MillerColumnsPreviewPanelProps): ReactElement {
  useMillerColumnsContext();

  return (
    <div data-miller-columns-preview="" {...rest}>
      {children}
    </div>
  );
}

/** @internal */
MillerColumnsPreviewPanel.displayName = "MillerColumnsPreviewPanel";

/** Type of the {@link MillerColumns} compound — the Root callable plus its sub-components. */
type MillerColumnsCompound = typeof MillerColumnsRoot & {
  /** The root strip, owning selection state and portal slots. */
  Root: typeof MillerColumnsRoot;
  /** A single vertical list within the strip. */
  Column: typeof MillerColumnsColumn;
  /** A selectable node within a column. */
  Item: typeof MillerColumnsItem;
  /** The branch-item chevron affordance. */
  ItemIndicator: typeof MillerColumnsItemIndicator;
  /** The drag-to-resize separator. */
  ResizeHandle: typeof MillerColumnsResizeHandle;
  /** The trailing preview pane. */
  PreviewPanel: typeof MillerColumnsPreviewPanel;
};

/**
 * MillerColumns — a horizontal strip of vertical lists where selecting a
 * node reveals its children in the next column. Use as a namespace
 * (`MillerColumns.Root`, `MillerColumns.Column`, `MillerColumns.Item`, …);
 * the default export is also callable as the Root.
 */
const MillerColumnsCompound: MillerColumnsCompound = Object.assign(
  MillerColumnsRoot,
  {
    Root: MillerColumnsRoot,
    Column: MillerColumnsColumn,
    Item: MillerColumnsItem,
    ItemIndicator: MillerColumnsItemIndicator,
    ResizeHandle: MillerColumnsResizeHandle,
    PreviewPanel: MillerColumnsPreviewPanel,
  },
);

MillerColumnsCompound.displayName = "MillerColumns";

export { MillerColumnsCompound as MillerColumns };
