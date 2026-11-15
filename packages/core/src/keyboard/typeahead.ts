/** How long, in milliseconds, a typeahead query lasts after the last key before it starts afresh. */
export const LISTBOX_TYPEAHEAD_RESET_MS: number = 500;

/** A key press to search the options by, with the query typed so far. */
export type ListboxTypeaheadState = {
  /** The query typed so far, lower-cased; empty once it has lapsed. */
  query: string;
  /** The key pressed. */
  key: string;
  /** Each enabled option's text, in order. */
  labels: readonly string[];
  /** The index of the option under the cursor, or `-1` when there is none. */
  active: number;
};

/** The query after a typeahead key, and the option to move to (`null` when none matches). */
export type ListboxTypeaheadOutcome = { query: string; focus: number | null };

/**
 * Typeahead (APG): a one-character key extends the query and moves to the
 * first option whose text starts with it, ignoring case and surrounding space.
 * A single character, or one character repeated, searches after the cursor so
 * repeating it cycles through the matches; a longer query may match the option
 * under the cursor. With no cursor the search starts at the top. The search
 * wraps. Returns `null` for a key longer than one character, or when there are
 * no options, which tells the caller to leave the event alone; the caller
 * prevents the default only when an option matched, and lapses the query after
 * {@link LISTBOX_TYPEAHEAD_RESET_MS}.
 */
export function listboxTypeahead({ query, key, labels, active }: ListboxTypeaheadState): ListboxTypeaheadOutcome | null {
  if (key.length !== 1 || labels.length === 0) return null;
  const next = (query + key).toLowerCase();
  const repeated = [...next].every((char) => char === next[0]);
  const search = repeated ? next[0] : next;
  const start = active === -1 ? 0 : active + (search.length === 1 ? 1 : 0);
  const order = [...labels.keys()].map((i) => (start + i) % labels.length);
  const focus = order.find((index) => labels[index].trim().toLowerCase().startsWith(search));
  return { query: next, focus: focus ?? null };
}
