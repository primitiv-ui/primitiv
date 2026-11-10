/**
 * What a key press inside an open modal dialog needs to know: the key, whether
 * Shift was held, how many focusable elements the dialog holds, and which of
 * them (by index, in tab order) has focus — `-1` when focus is on none of them.
 */
export type ModalTabState = {
  key: string;
  shiftKey: boolean;
  /** The index of the focused element among the focusables, or `-1`. */
  active: number;
  /** How many focusable elements the dialog holds. */
  count: number;
};

/**
 * What a Tab press inside the dialog asks for: prevent the browser's default
 * and focus the focusable at `focus`, or, when `focus` is `null`, focus
 * nothing (there is nothing inside to focus).
 */
export type ModalTabOutcome = { focus: number | null };

/**
 * The modal dialog's focus trap (WAI-ARIA APG Modal Dialog). A native modal
 * `<dialog>` makes the page behind it inert but does not wrap: Tab past the last
 * element escapes to the browser chrome. So only the two boundary presses are
 * taken over — Tab on the last focusable moves to the first, Shift+Tab on the
 * first moves to the last — and a dialog with nothing focusable blocks Tab so
 * focus cannot leak out. Every interior press is left to the browser, whose
 * inert-aware order keeps radio groups and the like working.
 *
 * Returns `null` for anything to leave alone (no `preventDefault`).
 */
export function modalTabKeydown({ key, shiftKey, active, count }: ModalTabState): ModalTabOutcome | null {
  if (key !== "Tab") return null;
  if (count === 0) return { focus: null };
  const last = count - 1;
  if (!shiftKey && active === last) return { focus: 0 };
  if (shiftKey && active === 0) return { focus: last };
  return null;
}

/** A box in viewport coordinates, as `getBoundingClientRect()` reports one. */
export type ModalBox = { left: number; top: number; right: number; bottom: number };

/**
 * Whether a pointer at `point` landed outside the dialog's `box`. A modal
 * `<dialog>` paints its own `::backdrop` in the top layer, so a press on the
 * dimmed page targets the dialog itself; its coordinates are the only way to
 * tell the backdrop from the dialog. The box's edges count as inside.
 */
export function modalPointerOutside(box: ModalBox, point: { x: number; y: number }): boolean {
  return point.x < box.left || point.x > box.right || point.y < box.top || point.y > box.bottom;
}
