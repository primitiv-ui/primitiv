/**
 * Shared Dropdown markup for the element tests: one function, pure string
 * output, mirroring how `tooltip.fixtures.ts` keeps its suites' data in one place.
 */
export type DropdownFixture = {
  open?: boolean;
  id?: string;
  /** Root attributes, verbatim (` dir="rtl"`). */
  attrs?: string;
  /** The checkbox item's `checked` attribute, verbatim (` checked`). */
  checked?: string;
  /** The radio group's value. */
  value?: string;
  /** Whether the submenu starts open. */
  subOpen?: boolean;
};

export const LABELS = {
  trigger: "Options",
  copy: "Copy",
  cut: "Cut",
  grid: "Show grid",
  small: "Small",
  large: "Large",
  share: "Share",
  email: "Email",
  link: "Link",
  remove: "Delete",
} as const;

const item = (label: string, attrs = "") => `<primitiv-dropdown-item${attrs}><li>${label}</li></primitiv-dropdown-item>`;

export function dropdownHtml({ open, id, attrs = "", checked = "", value = "small", subOpen }: DropdownFixture = {}): string {
  return (
    `<primitiv-dropdown${id ? ` id="${id}"` : ""}${open ? " open" : ""}${attrs}>` +
    `<primitiv-dropdown-trigger><button type="button">${LABELS.trigger}</button></primitiv-dropdown-trigger>` +
    `<primitiv-dropdown-content popover="auto">` +
    item(LABELS.copy) +
    item(LABELS.cut, " disabled") +
    `<primitiv-dropdown-checkbox-item${checked}><li>${LABELS.grid}` +
    `<primitiv-dropdown-item-indicator></primitiv-dropdown-item-indicator></li></primitiv-dropdown-checkbox-item>` +
    `<primitiv-dropdown-separator></primitiv-dropdown-separator>` +
    `<primitiv-dropdown-group><primitiv-dropdown-label>Size</primitiv-dropdown-label>` +
    `<primitiv-dropdown-radio-group value="${value}">` +
    `<primitiv-dropdown-radio-item value="small"><li>${LABELS.small}` +
    `<primitiv-dropdown-item-indicator></primitiv-dropdown-item-indicator></li></primitiv-dropdown-radio-item>` +
    `<primitiv-dropdown-radio-item value="large"><li>${LABELS.large}` +
    `<primitiv-dropdown-item-indicator></primitiv-dropdown-item-indicator></li></primitiv-dropdown-radio-item>` +
    `</primitiv-dropdown-radio-group></primitiv-dropdown-group>` +
    `<primitiv-dropdown-sub${subOpen ? " open" : ""}>` +
    `<primitiv-dropdown-sub-trigger><li>${LABELS.share}</li></primitiv-dropdown-sub-trigger>` +
    `<primitiv-dropdown-sub-content popover="auto">${item(LABELS.email)}${item(LABELS.link)}</primitiv-dropdown-sub-content>` +
    `</primitiv-dropdown-sub>` +
    item(LABELS.remove) +
    `</primitiv-dropdown-content></primitiv-dropdown>`
  );
}
