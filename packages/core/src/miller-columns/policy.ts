import { getKeyToActionMap } from "../keyboard/getKeyToActionMap.ts";
import { resolveRovingTarget } from "../keyboard/resolveRovingTarget.ts";

/**
 * Miller Columns' rules — a strip of vertical lists where selecting a branch
 * reveals its children in the next column — as pure functions. The selection is
 * one active path of values from the root column down; each surface keeps it
 * wherever it keeps state and describes its items as {@link MillerColumnsItem}s.
 */

/** Which way the columns run, so the step-in key mirrors right to left. */
export type MillerColumnsReadingDirection = "ltr" | "rtl";

/** One item, as a surface describes it: its column's depth and its value. */
export type MillerColumnsItem = {
  /** The depth of the item's column, 0 for the root column. */
  depth: number;
  value: string;
  disabled: boolean;
  /** A branch: an item with a column of children. */
  hasChildren: boolean;
};

/** Where an item sits: its column's depth and its value. */
export type MillerColumnsAddress = { depth: number; value: string };

/**
 * The path after selecting `value` at `depth`: the columns shallower than
 * `depth` are kept, `value` is appended, and every deeper column closes.
 */
export function millerColumnsSelect(path: readonly string[], depth: number, value: string): string[] {
  return [...path.slice(0, depth), value];
}

/**
 * The one item in the Tab order: the item focus was last on, else the deepest
 * selected item, else the first enabled item of the root column — or none.
 */
export function millerColumnsTabStop({
  active,
  path,
  items,
}: {
  active: MillerColumnsAddress | null;
  path: readonly string[];
  items: readonly MillerColumnsItem[];
}): MillerColumnsAddress | null {
  if (active) return active;
  if (path.length > 0) return { depth: path.length - 1, value: path[path.length - 1] };
  const first = items.find((item) => item.depth === 0 && !item.disabled);
  return first ? { depth: 0, value: first.value } : null;
}

/** What a key press on an item asks for. */
export type MillerColumnsKeyState = {
  path: readonly string[];
  dir: MillerColumnsReadingDirection;
  /** Every item the surface knows, in document order within each column. */
  items: readonly MillerColumnsItem[];
};

/**
 * What to do about a key: move focus to an item, select one, and focus the
 * first enabled item of a column once it has opened. An empty outcome is a key
 * consumed with nothing to do (Enter on a disabled item).
 */
export type MillerColumnsKeyOutcome = {
  focus?: MillerColumnsAddress;
  select?: MillerColumnsAddress;
  focusColumn?: number;
};

/**
 * The keymap (README "Keyboard interaction"): the vertical arrows, Home and End
 * move within the focused column, skipping disabled items and wrapping; Enter
 * and Space select; the step-in arrow (Right, or Left right to left) selects a
 * branch and moves into its column, and the step-out arrow returns to the
 * parent column's selected item. Returns `null` for a key it leaves alone,
 * which is then the caller's to offer to typeahead.
 */
export function millerColumnsKeydown(
  { path, dir, items }: MillerColumnsKeyState,
  { depth, value }: MillerColumnsAddress,
  key: string,
): MillerColumnsKeyOutcome | null {
  const item = items.find((candidate) => candidate.depth === depth && candidate.value === value);
  if (!item) return null;
  const stepIn = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const stepOut = dir === "rtl" ? "ArrowRight" : "ArrowLeft";

  if (key === stepIn) {
    if (!item.hasChildren || item.disabled) return null;
    return path[depth] === value
      ? { focusColumn: depth + 1 }
      : { select: { depth, value }, focusColumn: depth + 1 };
  }
  if (key === stepOut) {
    // A column below the root is open only because its parent item is selected.
    return depth === 0 ? null : { focus: { depth: depth - 1, value: path[depth - 1] } };
  }

  const action = getKeyToActionMap({ orientation: "vertical", homeEnd: true, activate: true })[key];
  const navigable = items
    .filter((candidate) => candidate.depth === depth && !candidate.disabled)
    .map((candidate) => candidate.value);
  const result = resolveRovingTarget({ action, navigable, currentKey: value });
  if (!result) return null;
  if (action === "activate") return item.disabled ? {} : { select: { depth, value } };
  return { focus: { depth, value: result.target } };
}

/**
 * Which depth each column sits at, for a surface whose columns are written as
 * siblings rather than nested: `parents` holds each column's parent item value
 * in document order (`null` for the root column). The first root column is
 * depth 0; then, for each selected value on the path, the first column naming
 * it is the next depth. A column off the path is `null` — not in the strip.
 */
export function millerColumnsColumnDepths(
  parents: readonly (string | null)[],
  path: readonly string[],
): (number | null)[] {
  const depths: (number | null)[] = parents.map(() => null);
  let column = parents.indexOf(null);
  for (let depth = 0; column !== -1; depth++) {
    depths[column] = depth;
    // Past the end of the path there is no value, so nothing names it: -1.
    column = parents.indexOf(path[depth]);
  }
  return depths;
}

/** A resize handle's width and bounds, for a key press on it. */
export type MillerColumnsResizeState = {
  width: number;
  min: number;
  max: number;
  /** Pixels per arrow press. */
  step: number;
  dir: MillerColumnsReadingDirection;
};

/**
 * The window-splitter keymap: the inline-end arrow widens the column by `step`
 * and the inline-start one narrows it (mirrored right to left); Home and End
 * jump to the bounds. The result is clamped. `null` leaves the key alone —
 * including End while the width is unbounded, since there is no largest width.
 */
export function millerColumnsResizeKeydown(
  { width, min, max, step, dir }: MillerColumnsResizeState,
  key: string,
): number | null {
  const grow = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const shrink = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
  const next =
    key === grow ? width + step : key === shrink ? width - step : key === "Home" ? min : key === "End" ? max : null;
  // `null` (no key of ours) and an unbounded End are both not finite.
  if (!Number.isFinite(next)) return null;
  return Math.min(max, Math.max(min, next as number));
}

/** The width a drag reaches: the start width plus the pointer's travel, clamped. */
export function millerColumnsResizeDrag({
  startWidth,
  startX,
  x,
  min,
  max,
}: {
  startWidth: number;
  startX: number;
  x: number;
  min: number;
  max: number;
}): number {
  return Math.min(max, Math.max(min, startWidth + x - startX));
}
