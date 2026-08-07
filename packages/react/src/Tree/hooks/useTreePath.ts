import { useTreeContext, useTreeLevelContext } from "../TreeContext";

import type { TreePathSegment } from "../types";

/**
 * Returns the root-to-leaf ancestor chain of a tree value as an array
 * of {@link TreePathSegment}s, or an empty array if the value has
 * never been registered in the tree.
 *
 * Must be called from a component rendered inside `Tree.Root`.
 *
 * The segments are ordered **root → leaf** so the last entry is the
 * queried value itself. Each segment exposes its `label` (the `label`
 * prop passed to `Tree.Item` / `Tree.Branch`, or `null` when omitted),
 * `isBranch`, `disabled` and `depth` — enough to render breadcrumbs,
 * outline trails, or location indicators without a parallel data
 * lookup.
 *
 * Paths survive a branch collapsing without `forceMount`: the tree
 * keeps a durable copy of every node's metadata so ancestry remains
 * resolvable even after descendants unmount. A value never mounted
 * (e.g. a pre-selected item whose branch has not yet opened) returns
 * an empty array.
 *
 * @example
 * ```tsx
 * function CurrentPath({ value }: { value: string }) {
 *   const path = useTreePath(value);
 *   return <>{path.map((s) => s.label ?? s.value).join(" / ")}</>;
 * }
 * ```
 */
export function useTreePath(value: string): TreePathSegment[] {
  const { getPath } = useTreeContext();
  return getPath(value);
}

/**
 * Returns one path per currently-selected value, in selection order.
 * In single-selection mode the array has zero or one entry; in
 * multiple-selection mode it has one entry per selected value.
 *
 * Each inner array is the same shape as the return of
 * {@link useTreePath} — root → leaf segments with labels carried from
 * the `label` prop.
 *
 * Used by `Tree.SelectionPath` for its default rendering, and
 * available directly for fully-custom breadcrumb UIs.
 *
 * @example
 * ```tsx
 * function Crumbs() {
 *   const paths = useTreeSelectionPaths();
 *   if (paths.length === 0) return <span>Nothing selected</span>;
 *   return (
 *     <ul>
 *       {paths.map((path, i) => (
 *         <li key={i}>{path.map((s) => s.label ?? s.value).join(" / ")}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useTreeSelectionPaths(): TreePathSegment[][] {
  const { selectedOrder, getPath } = useTreeContext();
  return selectedOrder.map((value) => getPath(value));
}

/**
 * Read the current nesting depth inside a `Tree` — `0` for a node directly
 * under {@link TreeRoot | `Tree.Root`}, one deeper per enclosing
 * {@link TreeBranchContent | `Tree.BranchContent`}.
 *
 * A styling layer needs the depth as a *number* to compute a row's indent, and
 * so to make the row span the tree's full width (a hover or selected band that
 * runs edge to edge, as VS Code and most file trees do). Reading it back off
 * the `data-depth` attribute in CSS requires `attr(data-depth type(<integer>))`,
 * which Firefox does not support — hence this hook.
 *
 * @throws If called outside a `Tree.Root`.
 *
 * @example Indenting a row so its background still spans the full width
 * ```tsx
 * function StyledItem(props: TreeItemProps) {
 *   const { depth } = useTreeLevel();
 *   return (
 *     <Tree.Item
 *       {...props}
 *       style={{ "--depth": depth } as CSSProperties}
 *       className="row"
 *     />
 *   );
 * }
 * ```
 */
export function useTreeLevel(): { depth: number } {
  const { depth } = useTreeLevelContext();
  return { depth };
}
