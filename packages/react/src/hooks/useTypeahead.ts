import { useCallback, useRef, type KeyboardEvent } from "react";

import { listboxTypeahead } from "@primitiv-ui/core";

type UseTypeaheadArgs = {
  /** Reads the navigable (enabled) option values in current DOM order. Called
   * per keystroke so an in-place reorder is picked up. */
  getNavigable: () => string[];
  /** Reads an option's visible label, used for prefix matching. */
  getLabel: (optionValue: string) => string;
  /** The option the cursor is on, or `undefined` before it is seeded. */
  currentKey: string | undefined;
  /** Moves the cursor to the matched option. */
  onMatch: (optionValue: string) => void;
  /** Milliseconds of inactivity after which the accumulated query resets. */
  resetMs: number;
};

/**
 * Printable-character typeahead for a list cursor, per APG's
 * recommendation for lists longer than about seven options, used by
 * `MillerColumns` (which scopes it to the focused column). The matching is
 * core's `listboxTypeahead`, the same rule the Listbox controller runs; this
 * hook keeps only the query and its reset timer, which live with a React
 * lifetime.
 *
 * Keystrokes accumulate into a query that resets after `resetMs` of
 * inactivity. A query of all-identical
 * characters is treated as a repeat of that single character, which cycles
 * through the options starting with it rather than searching for a literal
 * run — so pressing "a" three times walks the "a" options instead of looking
 * for "aaa". Matching is a case-insensitive prefix test against the option's
 * text, and the search wraps.
 */
export function useTypeahead({
  getNavigable,
  getLabel,
  currentKey,
  onMatch,
  resetMs,
}: UseTypeaheadArgs): {
  handleTypeahead: (event: KeyboardEvent<HTMLElement>) => void;
} {
  const stateRef = useRef<{ query: string; timer: number | null }>({
    query: "",
    timer: null,
  });

  const handleTypeahead = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const navigable = getNavigable();
      // The matching rules are core's, shared with the elements' ListboxController.
      const match = listboxTypeahead({
        query: stateRef.current.query,
        key: event.key,
        labels: navigable.map(getLabel),
        // No cursor reads as -1, the same as a cursor that is not in the list.
        active: navigable.indexOf(currentKey as string),
      });
      if (!match) return;

      const state = stateRef.current;
      state.query = match.query;
      // Stryker disable next-line ConditionalExpression,EqualityOperator: equivalent — keystroke handling is synchronous, so clearing (or not clearing) the pending reset cannot change this search's outcome.
      if (state.timer !== null) window.clearTimeout(state.timer);
      state.timer = window.setTimeout(() => {
        state.query = "";
        state.timer = null;
      }, resetMs);

      if (match.focus === null) return;
      event.preventDefault();
      onMatch(navigable[match.focus]);
    },
    [getNavigable, getLabel, currentKey, onMatch, resetMs],
  );

  return { handleTypeahead };
}
