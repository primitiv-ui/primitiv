/*
 * The A11Y-01 sequence — one array, so the timing is readable in one screen and
 * the same script drives every theme and density.
 *
 * Two things about it are findings, not choices:
 *
 * 1. The Select opens on **Enter**, not ArrowDown. The registry trigger is a
 *    plain <button> whose only opener is `onClick`, so a native Enter/Space
 *    activation opens it and ArrowDown does nothing (probed, 2026-09-04 —
 *    ArrowDown on the trigger leaves `aria-expanded=false`). The APG's listbox
 *    pattern says ArrowDown should open it, so this is a real gap in the
 *    component; the recording shows what the code does, not what the brief
 *    hoped it did.
 * 2. Once open, focus moves onto the option itself, so each row's highlight is
 *    a real `:focus-visible` ring rather than a painted "cursor" state.
 *
 * `hold` is the pause AFTER the action, in milliseconds. Nothing here is
 * shortened to fit a target length: the brief's "do not speed it up" is the
 * whole point of an image about someone using a keyboard.
 */
export const SEQUENCE = [
  { action: "hold", hold: 900, note: "idle — nothing focused, no pointer" },

  { action: "key", key: "Tab", hold: 550, note: "focus: Full name" },
  { action: "type", text: "Ada Lovelace", perChar: 85, hold: 500 },

  { action: "key", key: "Tab", hold: 600, note: "focus: Country" },
  { action: "key", key: "Enter", hold: 620, note: "opens the listbox" },
  { action: "key", key: "ArrowDown", hold: 430 },
  { action: "key", key: "ArrowDown", hold: 480 },
  { action: "key", key: "Enter", hold: 780, note: "chooses Canada, closes, refocuses trigger" },

  { action: "key", key: "Tab", hold: 520, note: "focus: checkbox" },
  { action: "key", key: " ", hold: 640, note: "checks it" },

  { action: "key", key: "Tab", hold: 520, note: "focus: switch" },
  { action: "key", key: " ", hold: 700, note: "turns it on" },

  { action: "key", key: "Tab", hold: 1100, note: "focus: Create account — stop" },
];

/** Playwright's name for a key, from the DOM `key` value the sequence uses. */
export function pressName(key) {
  return key === " " ? "Space" : key;
}
