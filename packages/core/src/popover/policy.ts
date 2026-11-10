/** What a key press inside an open popover asks for: the open state to move to. */
export type PopoverKeyOutcome = { open: false };

/**
 * The popover's keyboard contract for a key press inside its panel: Escape
 * closes it (and the caller hands focus back to the trigger, since focus moved
 * into the panel on open). Returns `null` for any other key, which tells the
 * caller to leave the event alone.
 */
export function popoverKeydown(key: string): PopoverKeyOutcome | null {
  return key === "Escape" ? { open: false } : null;
}

/** Where a press landed, relative to an open popover, and whether the browser handles it. */
export type PopoverPress = {
  /** Whether the popover is open. */
  open: boolean;
  /** Whether the browser light-dismisses `popover="auto"` itself (the Popover API exists). */
  nativeLightDismiss: boolean;
  /** Whether the press landed on (or in) the trigger. */
  inTrigger: boolean;
  /** Whether the press landed inside a popover — this one, or one nested in it. */
  inPopover: boolean;
};

/**
 * Whether a press dismisses the popover. A browser with the Popover API
 * light-dismisses an `auto` popover on an outside press and reports it with a
 * `toggle` event, so this only answers where it does not; answering there too
 * would catch the very click that opened the popover from an outside control
 * and close it again. A press on the trigger toggles it instead, and one inside
 * any popover is inside.
 */
export function popoverPressDismisses({ open, nativeLightDismiss, inTrigger, inPopover }: PopoverPress): boolean {
  return open && !nativeLightDismiss && !inTrigger && !inPopover;
}
