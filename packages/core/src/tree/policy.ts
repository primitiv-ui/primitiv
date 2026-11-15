/**
 * Tree's rules — the WAI-ARIA tree view: a vertical roving tab stop over the
 * visible items, branches expanded and collapsed with the horizontal arrows,
 * and single or multiple selection with Shift ranges and Ctrl / Meta toggles —
 * as pure functions. Each surface keeps the expanded and selected values
 * wherever it keeps state, and describes its nodes as {@link TreeNode}s.
 */

/** One node of the tree, as a surface describes it. */
export type TreeNode = {
  value: string;
  /** The enclosing branch's value, or `null` at the top level. */
  parent: string | null;
  isBranch: boolean;
  disabled: boolean;
};

/**
 * The values a keyboard user can reach: depth-first, into expanded branches
 * only. Siblings keep the order they appear in `nodes`; a parent need not come
 * before its children there, since React registers children first.
 */
export function treeVisibleOrder(nodes: readonly TreeNode[], expanded: readonly string[]): string[] {
  const children = new Map<string | null, TreeNode[]>();
  for (const node of nodes) children.set(node.parent, [...(children.get(node.parent) ?? []), node]);
  const order: string[] = [];
  const visit = (parent: string | null): void => {
    for (const node of children.get(parent) ?? []) {
      order.push(node.value);
      if (node.isBranch && expanded.includes(node.value)) visit(node.value);
    }
  };
  visit(null);
  return order;
}
