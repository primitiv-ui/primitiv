import { useCallback, type KeyboardEvent } from "react";

import {
  getKeyToActionMap,
  type RovingKeyAction,
} from "../utils/getKeyToActionMap";

type UseRovingTabindexOptions<K> = {
  /**
   * Which arrow-key axis is active. `"horizontal"` enables Arrow
   * Left/Right, `"vertical"` enables Arrow Up/Down, `"both"` enables all
   * four. {@link UseRovingTabindexOptions.dir} swaps the horizontal pair
   * under RTL for both `"horizontal"` and `"both"` orientation.
   */
  orientation: "horizontal" | "vertical" | "both";
  /**
   * Reading direction. When `"rtl"`, swaps the horizontal arrow pair —
   * meaningful for `"horizontal"` and `"both"` orientation. Defaults to
   * `"ltr"`.
   */
  dir?: "ltr" | "rtl";
  /**
   * The ordered list of keys the navigation should walk through. The
   * caller is responsible for filtering: e.g. RadioGroup and Accordion
   * pre-filter out disabled values (arrow skips them); Tabs passes the
   * unfiltered list (arrow lands on disabled tabs without activating
   * them, which is Tabs' specific keyboard contract).
   */
  navigable: K[];
  /**
   * The key of the trigger that owns the keydown event. Used as the
   * pivot for "next"/"prev" navigation.
   */
  currentKey: K;
  /**
   * Callback invoked with the chosen target and the abstract action
   * that produced it. The consumer decides what "go to" means — focus
   * only (Accordion), focus + select (RadioGroup), focus + maybe
   * activate (Tabs).
   *
   * Not called when no key matches and not called when `navigable` is
   * empty.
   */
  onNavigate: (targetKey: K, action: RovingKeyAction) => void;
  /**
   * When `true`, Home maps to "first" and End to "last". Defaults to
   * `false`.
   */
  includeHomeEnd?: boolean;
  /**
   * When `true`, Enter and Space map to "activate" and trigger
   * `onNavigate(currentKey, "activate")`. Defaults to `false`.
   */
  includeActivate?: boolean;
};

/**
 * The keyboard half of the WAI-ARIA roving-tabindex pattern: maps
 * arrow / Home / End / Enter-Space keys to navigation between siblings
 * in a compound widget, with optional RTL inversion and Home/End/
 * Enter-Space toggles. The state half (which key is the current Tab
 * stop, focus management, the actual selection / activation) lives in
 * the consumer — the hook just decides "given this key press, which
 * sibling should we navigate to?" and delegates via `onNavigate`.
 *
 * The orientation/dir/Home-End/activate keymap is built by
 * {@link getKeyToActionMap}, which the hook composes internally.
 *
 * The action passed to `onNavigate` is the abstract `RovingKeyAction`
 * vocabulary: `"next" | "prev" | "first" | "last" | "activate"`.
 * Consumers that only care about movement can ignore the action;
 * consumers that distinguish navigation-vs-activation (Tabs in manual
 * activation mode) branch on it.
 *
 * @example RadioGroup — select on every arrow, both orientations
 * ```ts
 * const enabledValues = itemValues.filter((v) => !disabledValues.has(v));
 * const { handleKeyDown } = useRovingTabindex({
 *   orientation: "both",
 *   navigable: enabledValues,
 *   currentKey: value,
 *   onNavigate: (target) => {
 *     select(target);
 *     focusItem(target);
 *   },
 * });
 * ```
 *
 * @example Tabs — land on disabled but only activate enabled, supports manual mode
 * ```ts
 * const { handleKeyDown } = useRovingTabindex({
 *   orientation, dir,
 *   navigable: triggerValues, // unfiltered: arrow lands on disabled
 *   currentKey: value,
 *   includeHomeEnd: true,
 *   includeActivate: true,
 *   onNavigate: (target, action) => {
 *     const isDisabled = disabledTriggerValues.has(target);
 *     const shouldActivate =
 *       !isDisabled &&
 *       (activationMode === "automatic" ||
 *         (activationMode === "manual" && action === "activate"));
 *     if (shouldActivate) activateTab(target);
 *     focusItem(target);
 *   },
 * });
 * ```
 */
export function useRovingTabindex<K>({
  orientation,
  dir = "ltr",
  navigable,
  currentKey,
  onNavigate,
  includeHomeEnd = false,
  includeActivate = false,
}: UseRovingTabindexOptions<K>): {
  handleKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
} {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const action = getKeyToActionMap({
        orientation,
        dir,
        homeEnd: includeHomeEnd,
        activate: includeActivate,
      })[e.key];

      if (!action) return;
      if (navigable.length === 0) return;

      if (action === "activate") {
        e.preventDefault();
        onNavigate(currentKey, action);
        return;
      }

      const total = navigable.length;
      const currentIndex = navigable.indexOf(currentKey);
      let targetIndex: number;
      switch (action) {
        case "first":
          targetIndex = 0;
          break;
        case "last":
          targetIndex = total - 1;
          break;
        case "next":
        case "prev":
          // Bail when the current key isn't in `navigable` — typically
          // because the consumer filtered out a disabled current item
          // (RadioGroup's contract: arrow keys do nothing while focus is
          // on a disabled radio). Home/End above still work regardless,
          // since they don't depend on a current position.
          if (currentIndex === -1) return;
          targetIndex =
            action === "next"
              ? (currentIndex + 1) % total
              : (currentIndex - 1 + total) % total;
          break;
      }

      e.preventDefault();
      onNavigate(navigable[targetIndex], action);
    },
    [
      orientation,
      dir,
      navigable,
      currentKey,
      onNavigate,
      includeHomeEnd,
      includeActivate,
    ],
  );

  return { handleKeyDown };
}
