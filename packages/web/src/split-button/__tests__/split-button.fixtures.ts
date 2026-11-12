/**
 * Shared SplitButton markup for the element tests: one function, pure string
 * output, mirroring how `tabs.fixtures.ts` keeps its suites' data in one place.
 */
export type SplitButtonFixture = {
  disabled?: boolean;
  open?: boolean;
  /** Attributes written on the action `<button>` itself. */
  actionAttrs?: string;
  /** Attributes written on the trigger `<button>` itself. */
  triggerAttrs?: string;
  /** A `disabled` on the action part alone. */
  actionDisabled?: boolean;
  /** A `disabled` on the trigger part alone. */
  triggerDisabled?: boolean;
  /** The root's own id. */
  id?: string;
};

export function splitButtonHtml({
  disabled = false,
  open = false,
  actionAttrs = "",
  triggerAttrs = "",
  actionDisabled = false,
  triggerDisabled = false,
  id,
}: SplitButtonFixture = {}): string {
  return (
    `<primitiv-split-button${id ? ` id="${id}"` : ""}${disabled ? " disabled" : ""}>` +
    `<primitiv-split-button-action${actionDisabled ? " disabled" : ""}><button type="button"${actionAttrs}>Squash and merge</button></primitiv-split-button-action>` +
    `<primitiv-dropdown${open ? " open" : ""}>` +
    `<primitiv-dropdown-trigger${triggerDisabled ? " disabled" : ""}><button type="button"${triggerAttrs}>More merge options</button></primitiv-dropdown-trigger>` +
    `<primitiv-dropdown-content popover="auto">` +
    `<primitiv-dropdown-item><li>Create a merge commit</li></primitiv-dropdown-item>` +
    `<primitiv-dropdown-item><li>Rebase and merge</li></primitiv-dropdown-item>` +
    `</primitiv-dropdown-content>` +
    `</primitiv-dropdown>` +
    `</primitiv-split-button>`
  );
}
