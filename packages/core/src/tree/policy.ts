import { getKeyToActionMap } from "../keyboard/getKeyToActionMap.ts";
import { resolveRovingTarget } from "../keyboard/resolveRovingTarget.ts";

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
  // `null` is never in the order, so it falls through with any other unknown value.
  if (order.includes(active as string)) return active;
  return order.find((value) => !disabled.has(value)) ?? null;
}

/** The expanded values after toggling the branch `value`. */
export function treeToggle(expanded: readonly string[], value: string): string[] {
  return expanded.includes(value) ? expanded.filter((current) => current !== value) : [...expanded, value];
}

/** Whether one value or many can be selected. */
export type TreeSelectionMode = "single" | "multiple";

/** What a selection is decided from. */
export type TreeSelectState = {
  mode: TreeSelectionMode;
  /** The selected values, in the order they were selected. */
  selected: readonly string[];
  /** The value a Shift range pins to — the last one selected without Shift — or `null`. */
  anchor: string | null;
  /** The visible order, which a Shift range spans. */
  order: readonly string[];
  disabled: ReadonlySet<string>;
};

/** The modifier keys held during a click. */
export type TreeSelectModifiers = { shift?: boolean; ctrl?: boolean; meta?: boolean };

/**
 * The selection a click or key on `value` asks for, and the anchor afterwards,
 * or `null` when it changes nothing (so no change is reported):
 *
 * - single mode selects `value`;
 * - multiple mode: Shift selects the enabled visible range from the anchor (or
 *   `value`) to `value`, keeping the anchor; Ctrl or Meta toggles `value`; a
 *   plain click selects `value` alone. Both of the last two anchor at `value`.
 */
export function treeSelect(
  state: TreeSelectState,
  value: string,
  modifiers: TreeSelectModifiers = {},
): { selected: string[]; anchor: string | null } | null {
  const { mode, selected, anchor, order, disabled } = state;
  const already = selected.includes(value);
  if (mode === "single") return already ? null : { selected: [value], anchor: value };
  if (modifiers.shift) {
    const from = order.indexOf(anchor ?? value);
    const to = order.indexOf(value);
    if (from === -1 || to === -1) return { selected: [value], anchor };
    const range = order.slice(Math.min(from, to), Math.max(from, to) + 1);
    return { selected: range.filter((candidate) => !disabled.has(candidate)), anchor };
  }
  if (modifiers.ctrl || modifiers.meta) {
    return { selected: already ? selected.filter((current) => current !== value) : [...selected, value], anchor: value };
  }
  if (already && selected.length === 1) return null;
  return { selected: [value], anchor: value };
}

/** What a key press on a tree item is decided from. */
export type TreeKeyState = {
  /** The visible order, from {@link treeVisibleOrder}. */
  order: readonly string[];
  expanded: readonly string[];
  disabled: ReadonlySet<string>;
  /** The node a value names. */
  nodeOf: (value: string) => TreeNode | undefined;
};

/**
 * What a key press asks for — a value to focus, a branch to toggle, a value to
 * select (a branch toggles first) — or `null` to leave the event alone. An
 * empty outcome claims the key and does nothing.
 */
export type TreeKeyOutcome = { focus?: string; toggle?: string; select?: string };

/**
 * The tree's keyboard contract for a key press on `focused`:
 *
 * - ArrowRight expands a collapsed branch, or moves to an expanded one's first
 *   child; ArrowLeft collapses an expanded branch, or moves to the parent;
 * - ArrowUp / ArrowDown move through the enabled visible items, wrapping, and
 *   Home / End jump to the ends — which is how focus escapes a disabled item,
 *   where the arrows do nothing;
 * - Enter / Space activate: a branch toggles and is selected, a leaf is
 *   selected, a disabled item does nothing.
 */
export function treeKeydown(state: TreeKeyState, focused: string, key: string): TreeKeyOutcome | null {
  const { order, expanded, disabled } = state;
  const node = state.nodeOf(focused);
  const isBranch = node?.isBranch === true;
  const off = disabled.has(focused);
  const open = expanded.includes(focused);

  if (key === "ArrowRight") {
    if (!isBranch || off) return null;
    if (!open) return { toggle: focused };
    const next = order[order.indexOf(focused) + 1];
    return next === undefined ? {} : { focus: next };
  }
  if (key === "ArrowLeft") {
    if (off) return null;
    if (isBranch && open) return { toggle: focused };
    const parent = node?.parent ?? null;
    return parent === null ? null : { focus: parent };
  }

  const action = getKeyToActionMap({ orientation: "vertical", homeEnd: true, activate: true })[key];
  const navigable = order.filter((value) => !disabled.has(value));
  const result = resolveRovingTarget({ action, navigable, currentKey: focused });
  if (!result) return null;
  if (action !== "activate") return { focus: result.target };
  if (off) return {};
  return isBranch ? { toggle: focused, select: focused } : { select: focused };
}
