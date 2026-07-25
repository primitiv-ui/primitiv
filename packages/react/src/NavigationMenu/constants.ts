/** Focusable descendants a panel can hand focus to when the keyboard opens it
 * with the enter-panel arrow. Deliberately narrow: nav panels hold links and
 * the occasional button, and the first of those is the useful landing spot. */
export const PANEL_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
