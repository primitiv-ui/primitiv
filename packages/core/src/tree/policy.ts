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

/** The most parent links a path follows, so a parent cycle cannot loop forever. */
const MAX_PATH_DEPTH = 64;

/**
 * The root-to-leaf chain of nodes ending at `value`, read through `nodeOf`.
 * Empty when `value` or any ancestor is unknown, since a partial chain would
 * misplace it; a parent cycle stops after 64 hops.
 */
export function treePath<N extends Pick<TreeNode, "value" | "parent">>(
  nodeOf: (value: string) => N | undefined,
  value: string,
): N[] {
  const path: N[] = [];
  let cursor: string | null = value;
  while (cursor !== null && path.length < MAX_PATH_DEPTH) {
    const node = nodeOf(cursor);
    if (!node) return [];
    path.unshift(node);
    cursor = node.parent;
  }
  return path;
}

/**
 * The one item in the page's Tab order (the roving tab stop): the item focus
 * was last on while it is still visible, else the first enabled visible item,
 * else none.
 */
export function treeTabStop(state: {
  order: readonly string[];
  disabled: ReadonlySet<string>;
  active: string | null;
}): string | null {
  const { order, disabled, active } = state;
  if (active !== null && order.includes(active)) return active;
  return order.find((value) => !disabled.has(value)) ?? null;
}
