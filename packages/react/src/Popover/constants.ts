/**
 * Elements that can receive keyboard focus. Used to move focus into the
 * popover content when it opens (WAI-ARIA non-modal dialog focus behaviour).
 * `[tabindex="-1"]` is excluded because such elements are only
 * programmatically focusable, not part of the natural tab order.
 */
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");
