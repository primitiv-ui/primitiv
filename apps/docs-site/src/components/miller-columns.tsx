import "../styles/primitiv/miller-columns/styles.css";
/*
 * MillerColumns — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: `Root` renders TWO elements (the strip container plus an inner
 * role="tree" widget) and splits its props between them, `Column` portal-projects
 * itself into that tree rather than rendering in place, and `ResizeHandle` is a
 * window splitter whose value props have no counterpart in the generator's model —
 * none of which `emit_wrapper` handles. It therefore carries no committed-wrapper
 * drift test; it is type-checked by scripts/check-registry-types.mjs.
 *
 * COLUMN RENDERS ITS OWN EMPTY LINE. Selecting a childless branch opens a column
 * with nothing in it, and by definition there are no children through which a
 * consumer could pass a message — so the wrapper renders one itself, controlled
 * by `emptyLabel` (`null` for a silent column). It is ALWAYS rendered and the
 * stylesheet reveals it only under `[data-empty]`: whether a column is empty is
 * the headless component's answer, derived from its registered items, and cannot
 * be inferred from `children` — a column holding nothing but a ResizeHandle has
 * a child yet no items.
 *
 * THE PREVIEW PANE FOLLOWS FINDER. It occupies the slot *after* the selected
 * item, so it exists only where that item has no children to open there
 * instead — select a folder and you get its contents, not a preview; select
 * nothing and there is no preview at all. The headless enforces this; pass
 * `forceMount` for a persistent inspector pane. Because of that rule the pane
 * has no "nothing selected" state to render under normal use, so it is given no
 * empty line of its own; `.primitiv-miller-columns__empty` remains available as
 * a part for a force-mounted pane.
 *
 * ROW CHEVRON: `ItemIndicator` ships its own chevron, so `<MillerColumnsItemIndicator />`
 * needs no icon package and no glyph from the consumer. It renders only for branch
 * items (the headless returns null for leaves) and never rotates — it encodes
 * "children open to the right", a direction rather than an open/closed state.
 *
 * Keep this file, contract.json, and the stylesheet in sync by hand.
 */
import {
  MILLER_COLUMNS_PART,
  MillerColumns as MillerColumnsPrimitive,
} from "@primitiv-ui/react";
import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  millerColumns,
  millerColumnsColumn,
  millerColumnsEmpty,
  millerColumnsItem,
  millerColumnsItemIndicator,
  millerColumnsItemLabel,
  millerColumnsPreview,
  millerColumnsResizeHandle,
  type MillerColumnsVariants,
} from "./miller-columns.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

const cx = (...values: Array<string | undefined>) =>
  values.filter(Boolean).join(" ");

/**
 * Wrap bare text children in a label span so they become the flex item that
 * absorbs the row's free space and truncates. Runs per child rather than on
 * `children` as a whole, because a row usually mixes an indicator element with a
 * bare string — the `typeof children === "string"` shortcut would miss it.
 * Mirrors the generator's `wrapTextChildren`.
 */
function wrapRowTextNodes(
  children: ReactNode,
  className: string,
  asChild?: boolean,
): ReactNode {
  // Under `asChild` the child is the CONSUMER's element, so its text sits one
  // level deeper than `Children.map` reaches and nothing would wrap it — the
  // row's label span is what absorbs the free space and truncates, so without
  // this an asChild row neither fills nor ellipsises. One level only.
  if (asChild && isValidElement<{ children?: ReactNode }>(children)) {
    return cloneElement(
      children,
      undefined,
      wrapRowTextNodes(children.props.children, className),
    );
  }
  const mapped = Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span className={className}>{child}</span>
    ) : (
      child
    ),
  );
  return Array.isArray(mapped) && mapped.length === 1 ? mapped[0] : mapped;
}

/**
 * Props for {@link MillerColumns} — the headless `MillerColumns.Root` props
 * plus the `size` modifier.
 *
 * `className` is narrowed to `string` (the headless accepts the wider DOM
 * type) because it is composed with the recipe's output.
 */
export type MillerColumnsProps = DistributiveOmit<
  ComponentPropsWithRef<typeof MillerColumnsPrimitive.Root>,
  "className"
> &
  MillerColumnsVariants & {
    /**
     * Row and column size for the whole strip. `data-density` scales each
     * size further.
     * @default "md"
     */
    size?: MillerColumnsVariants["size"];
    /** Merged with the recipe's classes on the strip container. */
    className?: string;
  };

/**
 * The styled Miller Columns strip — a horizontal run of vertical lists where
 * selecting a node reveals its children in the next column.
 *
 * **Renders two elements.** The strip container (`.primitiv-miller-columns`,
 * the horizontal scroll container you lay out) and, inside it, the
 * `role="tree"` widget holding only the columns. A tree may own nothing but
 * `treeitem` and `group`, so a
 * {@link MillerColumnsPreviewPanel | `MillerColumnsPreviewPanel`} is a sibling
 * of the tree rather than a child of it. Because of that split **`aria-*`
 * props land on the tree** — an `aria-label` must name the widget, not its
 * scroll container — and everything else lands on the strip.
 *
 * State is the *selection path*, an array of item ids root-column-first.
 * Pass `defaultValue` for an uncontrolled strip, or `value` + `onValueChange`
 * to control it; the two shapes are discriminated at the type level.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <MillerColumns aria-label="Files" defaultValue={["documents"]}>
 *   <MillerColumnsColumn>
 *     <MillerColumnsItem value="documents">Documents</MillerColumnsItem>
 *   </MillerColumnsColumn>
 * </MillerColumns>
 * ```
 */
export function MillerColumns({
  size,
  className,
  ...props
}: MillerColumnsProps): ReactElement {
  return (
    <MillerColumnsPrimitive.Root
      className={cx(millerColumns({ size }), className)}
      {...(props as ComponentPropsWithRef<typeof MillerColumnsPrimitive.Root>)}
    />
  );
}

/** Props for {@link MillerColumnsColumn}. */
export type MillerColumnsColumnProps = ComponentPropsWithRef<
  typeof MillerColumnsPrimitive.Column
> & {
  /**
   * Muted line shown when the column holds no items. Always rendered and
   * revealed by the stylesheet under `[data-empty]`, so it reflects the
   * headless component's own answer rather than a guess from `children`.
   * Pass `null` for a silent column.
   * @default "This folder is empty"
   */
  emptyLabel?: ReactNode;
};

/**
 * One vertical list within the strip, rendered as a `role="group"`.
 *
 * Although child columns are authored *nested* inside a branch
 * {@link MillerColumnsItem | `MillerColumnsItem`}, every column is
 * portal-projected into the strip, so depth is purely a left-to-right
 * position. A branch's column is mounted only while that branch is selected.
 *
 * Drop a {@link MillerColumnsResizeHandle | `MillerColumnsResizeHandle`} among
 * its children to make the column resizable.
 *
 * **Empty is not an error state.** Selecting a childless branch legitimately
 * opens a column with nothing in it; it shows one muted line rather than an
 * `EmptyState` block, which is far too heavy for a 140-288px column.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <MillerColumnsColumn emptyLabel="Nothing here">
 *   <MillerColumnsResizeHandle aria-label="Resize column" />
 *   <MillerColumnsItem value="a">A</MillerColumnsItem>
 * </MillerColumnsColumn>
 * ```
 */
export function MillerColumnsColumn({
  className,
  children,
  emptyLabel = "This folder is empty",
  ...props
}: MillerColumnsColumnProps): ReactElement {
  return (
    <MillerColumnsPrimitive.Column
      className={cx(millerColumnsColumn(), className)}
      {...props}
    >
      {children}
      {emptyLabel === null ? null : (
        <p className={millerColumnsEmpty()}>{emptyLabel}</p>
      )}
    </MillerColumnsPrimitive.Column>
  );
}

/** Props for {@link MillerColumnsItem}. */
/**
 * Declare that this wrapper stands in for `MillerColumns.Column`.
 *
 * `Item` partitions its children *before* rendering them, so it sees this
 * component rather than the part it returns. Without the marker a nested
 * `<MillerColumnsColumn>` is mis-read as cell content: the row stops being a
 * branch (no `aria-expanded`, no chevron, no ArrowRight) and its column
 * projects into whatever depth slot is open — so selecting one branch reveals
 * every sibling's children at once.
 */
MillerColumnsColumn[MILLER_COLUMNS_PART] = "column";

export type MillerColumnsItemProps = ComponentPropsWithRef<
  typeof MillerColumnsPrimitive.Item
>;

/**
 * A selectable row, rendered as a `role="treeitem"`. Bare text children are
 * wrapped in a label span so the name absorbs the row's free space and
 * truncates rather than pushing the chevron out of the column.
 *
 * **Branch vs leaf.** An item becomes a *branch* by nesting a
 * {@link MillerColumnsColumn | `MillerColumnsColumn`} among its children; an
 * item with no nested column is a *leaf*.
 *
 * **Ancestors and the terminal row look different, deliberately.** Every item
 * on the active path gets `data-state="selected"`, and the deepest one — the
 * row actually clicked — also gets `data-terminal`. Three distinct steps on the
 * neutral-alpha ramp, because all three can be on screen at once: hover 3%,
 * ancestor 6%, terminal 14%. That gap is the strip's whole depth cue — styled
 * alike, there is no way to tell which of several highlighted rows was chosen.
 * **Hover never applies to a path row**, since its tint is carrying selection
 * rather than pointer state; hover is also the faintest step, so a row you
 * merely point at cannot be mistaken for one on the path.
 *
 * Pass `disabled` to skip the item in roving navigation; it stays in the DOM
 * and focusable for discovery. Pass `asChild` to render the cell as your own
 * element (an `<a>`, say) — a nested column stays a sibling of it.
 *
 * @extends HTMLDivElement
 *
 * @example Branch
 * ```tsx
 * <MillerColumnsItem value="docs">
 *   Docs
 *   <MillerColumnsItemIndicator />
 *   <MillerColumnsColumn>...</MillerColumnsColumn>
 * </MillerColumnsItem>
 * ```
 */
export function MillerColumnsItem({
  className,
  children,
  ...props
}: MillerColumnsItemProps): ReactElement {
  return (
    <MillerColumnsPrimitive.Item
      className={cx(millerColumnsItem(), className)}
      {...props}
    >
      {wrapRowTextNodes(children, millerColumnsItemLabel(), props.asChild)}
    </MillerColumnsPrimitive.Item>
  );
}

/** Props for {@link MillerColumnsItemIndicator}. */
export type MillerColumnsItemIndicatorProps = ComponentPropsWithRef<
  typeof MillerColumnsPrimitive.ItemIndicator
>;

/**
 * The branch chevron — a decorative, `aria-hidden` affordance that renders
 * **only for branch items** (nothing at all for a leaf).
 *
 * Ships its own glyph, so it needs no icon package and no children; pass
 * `children` to substitute your own. Place it among a branch item's cell
 * content.
 *
 * **It never rotates.** In Accordion, Collapsible and Tree a chevron encodes
 * expanded-vs-collapsed; here it encodes "this row has children, and they open
 * to the right" — a direction, not a state. Whether they are currently open is
 * carried by the existence of the next column, which shows it far more plainly.
 * A leaf reserves no trailing slot either, so labels in a mixed column stay
 * aligned without a spacer.
 *
 * @extends HTMLSpanElement
 */
export function MillerColumnsItemIndicator({
  className,
  children,
  ...props
}: MillerColumnsItemIndicatorProps): ReactElement {
  return (
    <MillerColumnsPrimitive.ItemIndicator
      className={cx(millerColumnsItemIndicator(), className)}
      {...props}
    >
      {children ?? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="m9 6 6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </MillerColumnsPrimitive.ItemIndicator>
  );
}

/**
 * Props for {@link MillerColumnsResizeHandle} — the headless splitter's
 * `minWidth` / `maxWidth` / `step` plus the native `<div>` attributes.
 */
export type MillerColumnsResizeHandleProps = ComponentPropsWithRef<
  typeof MillerColumnsPrimitive.ResizeHandle
>;

/**
 * The drag-and-keyboard resize grip for the column it is rendered in — the
 * WAI-ARIA window splitter, as a focusable
 * `<div role="separator" aria-orientation="vertical">`.
 *
 * Drag it, or focus it and use the arrow keys: the inline-end arrow widens by
 * `step` and the inline-start arrow narrows (mirrored under `dir="rtl"`), with
 * Home and End jumping to `minWidth` / `maxWidth`. Both paths clamp to the same
 * bounds, and those two props also back `aria-valuemin` / `aria-valuemax`.
 * `aria-valuenow` tracks the column's real rendered width via a
 * `ResizeObserver`, so it is truthful before the first resize.
 *
 * **Give it an `aria-label`** — without one it announces as an unnamed
 * separator.
 *
 * Styling notes: the grip sits *inside* the column's trailing edge, because a
 * column is a scroll container and clips anything hanging past it. At rest it
 * paints nothing — the hairline you see is the column's own border — and on
 * hover its ink grows out of that border and darkens, easing back on leave;
 * both the width and the colour transition. `cursor` comes from
 * `--primitiv-miller-columns-resize-cursor` (`col-resize`).
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <MillerColumnsResizeHandle
 *   aria-label="Resize column"
 *   minWidth={120}
 *   maxWidth={400}
 * />
 * ```
 */
export function MillerColumnsResizeHandle({
  className,
  ...props
}: MillerColumnsResizeHandleProps): ReactElement {
  return (
    <MillerColumnsPrimitive.ResizeHandle
      className={cx(millerColumnsResizeHandle(), className)}
      {...props}
    />
  );
}

/** Props for {@link MillerColumnsPreviewPanel}. */
export type MillerColumnsPreviewPanelProps = ComponentPropsWithRef<
  typeof MillerColumnsPrimitive.PreviewPanel
>;

/**
 * The trailing preview pane — the Finder-style "preview" column, rendered as
 * the last child of the strip and **outside** the `role="tree"` widget (a tree
 * may own only `treeitem` and `group`).
 *
 * Deliberately **content-agnostic**: the component cannot know how to preview
 * an item, so you decide what it shows. Read the current selection from any
 * component inside the strip with `useMillerColumnsSelection`, imported from
 * `@primitiv-ui/react` — this surface does not re-export it.
 *
 * It carries `data-empty` while nothing is selected. Unlike a column it is not
 * given a message of its own — it always has your children, and inventing one
 * would fight them; use the `.primitiv-miller-columns__empty` class if you want
 * the same muted treatment for your own "nothing selected" copy.
 *
 * Its field is `surface/default`, the same as the columns, separated only by
 * the last column's hairline: tinting it makes the pane read as chrome wrapped
 * around the list rather than as its last pane. It fills the strip's remaining
 * width and centres its content as a block, following Finder — so a single
 * wrapper element around your preview content is the shape that lands best.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * import { useMillerColumnsSelection } from "@primitiv-ui/react";
 *
 * function FilePreview() {
 *   const { selectedValue } = useMillerColumnsSelection();
 *   if (!selectedValue) {
 *     return <p className="primitiv-miller-columns__empty">Nothing selected</p>;
 *   }
 *   return <Preview id={selectedValue} />;
 * }
 * ```
 */
export function MillerColumnsPreviewPanel({
  className,
  ...props
}: MillerColumnsPreviewPanelProps): ReactElement {
  return (
    <MillerColumnsPrimitive.PreviewPanel
      className={cx(millerColumnsPreview(), className)}
      {...props}
    />
  );
}
