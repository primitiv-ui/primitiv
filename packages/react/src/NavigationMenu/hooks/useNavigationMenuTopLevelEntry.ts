import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent, RefObject } from "react";

import { useNavigationMenuContext } from "../NavigationMenuContext";

/** Keydown handler for an element that is not a top-level entry: every travel
 * key is left to the browser, so `Home` inside an open panel still scrolls the
 * page rather than jumping out of the panel. */
function ignoreTravelKeys(): void {}

/**
 * Joins an element to the nav's top-level travel order: registers it so the
 * arrow keys can reach it, and returns the keydown handler that does the
 * reaching.
 *
 * This is deliberately **not** a roving tabindex — no `tabIndex={-1}` is
 * handed back, so every top-level entry stays in the tab order. That is the
 * ARIA APG *Disclosure Navigation Menu* contract: these are links to pages, and
 * a keyboard user must be able to Tab through them without learning that
 * arrows are required. The travel keymap is core's, run by the shared
 * controller.
 *
 * @param enabled Whether this element is a top-level entry at all. A
 *   `NavigationMenu.Link` inside a `NavigationMenu.Content` passes `false`:
 *   panel links are reached by Tab, not by the top-level arrow keys.
 */
export function useNavigationMenuTopLevelEntry<T extends HTMLElement>(
  enabled = true,
): {
  entryRef: RefObject<T | null>;
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
} {
  const { controller, registerEntry } = useNavigationMenuContext();
  const key = useId();
  const entryRef = useRef<T | null>(null);

  useEffect(
    () => {
      if (!enabled) return;
      registerEntry(key, entryRef.current);
      // Unregistering is what keeps a removed entry out of the travel order.
      return () => registerEntry(key, null);
    },
    // `key` is a `useId`, `registerEntry` a stable context callback, and
    // `enabled` is fixed by this element's position in the tree (inside a
    // Content panel or not) — none can change while the entry stays mounted.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependencies.
    [enabled, key, registerEntry],
  );

  // The shared controller's top-level travel: arrows along the axis (mirrored
  // under RTL) and Home / End move focus only. Enter and Space are left alone,
  // so a button's click and a link's navigation stay native.
  const travel = (event: KeyboardEvent<HTMLElement>) =>
    controller.travel(entryRef.current as HTMLElement, event.nativeEvent);

  // A panel link must not be able to reach the top-level order — not with the
  // arrows, and not with Home/End either — so it gets no travel handler at all.
  return { entryRef, handleKeyDown: enabled ? travel : ignoreTravelKeys };
}
