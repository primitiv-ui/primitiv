/** Everything a key on a split button's action depends on, as plain data. */
export type SplitButtonActionKey = {
  key: string;
  disabled: boolean;
};

/**
 * Whether a key on the action half opens the menu: ArrowDown does, the
 * standard split-button affordance for reaching the alternatives without
 * tabbing past the action. Every other key is the action's own, and a
 * disabled action opens nothing.
 */
export function splitButtonOpensMenu({ key, disabled }: SplitButtonActionKey): boolean {
  return !disabled && key === "ArrowDown";
}
