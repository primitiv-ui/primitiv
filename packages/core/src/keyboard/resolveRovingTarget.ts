import type { RovingKeyAction } from "./getKeyToActionMap.ts";

/** Input to {@link resolveRovingTarget}. */
export type ResolveRovingTargetOptions<K> = {
  /** The abstract action a key press mapped to (see `getKeyToActionMap`). */
  action: RovingKeyAction;
  /**
   * The ordered keys navigation walks through. The caller filters it: RadioGroup
   * and Accordion leave disabled items out so arrows skip them, while Tabs keeps
   * them in so arrows land on a disabled tab without activating it.
   */
  navigable: readonly K[];
  /** The key of the item that owns the key press: the pivot for next / prev. */
  currentKey: K;
};

/**
 * Resolves which item a roving-tabindex action lands on: the index arithmetic
 * of the WAI-ARIA roving-tabindex pattern, with no DOM and no framework.
 *
 * - `"next"` / `"prev"` move one step and wrap at either end. They resolve
 *   nothing when `currentKey` is not in `navigable`, which is RadioGroup's
 *   contract: arrows do nothing while focus sits on a disabled radio.
 * - `"first"` / `"last"` jump to either end, whatever the current key.
 * - `"activate"` targets the current key, so the caller confirms it.
 * - An empty `navigable` resolves nothing, for every action.
 *
 * The result is wrapped as `{ target }`, with `null` for "nothing", because a
 * key can itself be `null` or `undefined` (Combobox navigates `string | null`).
 *
 * @example
 * ```ts
 * const action = getKeyToActionMap({ orientation: "horizontal" })[event.key];
 * const result = action && resolveRovingTarget({ action, navigable, currentKey });
 * if (result) focusItem(result.target);
 * ```
 */
export function resolveRovingTarget<K>({
  action,
  navigable,
  currentKey,
}: ResolveRovingTargetOptions<K>): { target: K } | null {
  const total = navigable.length;
  if (total === 0) return null;

  switch (action) {
    case "activate":
      return { target: currentKey };
    case "first":
      return { target: navigable[0] };
    case "last":
      return { target: navigable[total - 1] };
    case "next":
    case "prev": {
      const currentIndex = navigable.indexOf(currentKey);
      if (currentIndex === -1) return null;
      const step = action === "next" ? 1 : total - 1;
      return { target: navigable[(currentIndex + step) % total] };
    }
  }
}
