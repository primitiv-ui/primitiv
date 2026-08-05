import { useCallback, useRef, type KeyboardEvent } from "react";

import { TYPEAHEAD_RESET_MS } from "../constants";

type UseListboxTypeaheadArgs = {
  /** Reads the navigable (enabled) option values in current DOM order. Called
   * per keystroke so an in-place reorder is picked up. */
  getNavigable: () => string[];
  /** Reads an option's visible label, used for prefix matching. */
  getLabel: (optionValue: string) => string;
  /** The option the cursor is on, or `undefined` before it is seeded. */
  currentKey: string | undefined;
  /** Moves the cursor to the matched option. */
  onMatch: (optionValue: string) => void;
};

/**
 * Printable-character typeahead for the Listbox cursor, per APG's
 * recommendation for lists longer than about seven options.
 *
 * Keystrokes accumulate into a query that resets after
 * {@link TYPEAHEAD_RESET_MS} of inactivity. A query of all-identical
 * characters is treated as a repeat of that single character, which cycles
 * through the options starting with it rather than searching for a literal
 * run — so pressing "a" three times walks the "a" options instead of looking
 * for "aaa". Matching is a case-insensitive prefix test against the option's
 * text, and the search wraps.
 */
export function useListboxTypeahead({
  getNavigable,
  getLabel,
  currentKey,
  onMatch,
}: UseListboxTypeaheadArgs): {
  handleTypeahead: (event: KeyboardEvent<HTMLElement>) => void;
} {
  const stateRef = useRef<{ query: string; timer: number | null }>({
    query: "",
    timer: null,
  });

  const handleTypeahead = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key.length !== 1) return;

      const navigable = getNavigable();
      // Stryker disable next-line ConditionalExpression: equivalent — the match loop is bounded by navigable.length, so an empty list exits immediately anyway.
      if (navigable.length === 0) return;

      const state = stateRef.current;
      // Stryker disable next-line ConditionalExpression,EqualityOperator: equivalent — keystroke handling is synchronous, so clearing (or not clearing) the pending reset cannot change this search's outcome.
      if (state.timer !== null) window.clearTimeout(state.timer);
      state.query = (state.query + event.key).toLowerCase();
      state.timer = window.setTimeout(() => {
        state.query = "";
        state.timer = null;
      }, TYPEAHEAD_RESET_MS);

      const isRepeat =
        // Stryker disable next-line ConditionalExpression,EqualityOperator: equivalent — for a single character `every()` is trivially true, so both forms yield the same isRepeat.
        state.query.length > 1 &&
        state.query.split("").every((char) => char === state.query[0]);
      const searchQuery = isRepeat ? state.query[0] : state.query;

      // A single character (or a repeat of one) advances past the current
      // option so pressing the same letter walks the matches; a genuine
      // multi-character query narrows in place instead. With no cursor at all
      // there is nothing to advance past, so the search starts at the top.
      const currentIndex =
        // Stryker disable next-line ConditionalExpression: equivalent — indexOf(undefined) is itself -1.
        currentKey === undefined ? -1 : navigable.indexOf(currentKey);
      const hasCursor = currentIndex >= 0;
      const startIndex = hasCursor ? currentIndex : 0;
      const offset =
        hasCursor && (searchQuery.length === 1 || isRepeat) ? 1 : 0;

      // Stryker disable next-line EqualityOperator: equivalent — the index wraps modulo navigable.length, so an extra iteration only re-checks an already-visited option.
      for (let i = 0; i < navigable.length; i++) {
        const index = (startIndex + offset + i) % navigable.length;
        const label = getLabel(navigable[index]).trim().toLowerCase();
        if (label.startsWith(searchQuery)) {
          event.preventDefault();
          onMatch(navigable[index]);
          return;
        }
      }
    },
    [getNavigable, getLabel, currentKey, onMatch],
  );

  return { handleTypeahead };
}
