/** Selector for enabled listbox options (disabled ones are skipped). */
export const OPTION_SELECTOR = '[role="option"]:not([aria-disabled="true"])';

/** Selector for the currently-selected option. */
export const SELECTED_OPTION_SELECTOR = '[role="option"][aria-selected="true"]';

/** Typeahead accumulation window, in milliseconds. */
export const TYPEAHEAD_RESET_MS = 500;
