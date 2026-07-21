/**
 * Elements that can receive keyboard focus and take part in the natural tab
 * order. Two consumers rely on it: moving initial focus into a surface when it
 * opens (e.g. `Popover`), and locating the boundary elements of a focus trap
 * (e.g. `Modal`). `[tabindex="-1"]` is excluded because such elements are only
 * programmatically focusable, not tabbable.
 */
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");
