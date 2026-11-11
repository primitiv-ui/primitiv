/**
 * Shared Context Menu markup for the element tests: one function, pure string
 * output, mirroring how `dropdown.fixtures.ts` keeps its suites' data in one place.
 */
export type ContextMenuFixture = {
  open?: boolean;
  id?: string;
  /** Whether the trigger region is disabled. */
  disabled?: boolean;
  /** Whether the submenu starts open. */
  subOpen?: boolean;
};

export const LABELS = {
  region: "Right-click here",
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

const item = (label: string, attrs = "") =>
  `<primitiv-context-menu-item${attrs}><li>${label}</li></primitiv-context-menu-item>`;

export function contextMenuHtml({ open, id, disabled, subOpen }: ContextMenuFixture = {}): string {
  return (
    `<primitiv-context-menu${id ? ` id="${id}"` : ""}${open ? " open" : ""}>` +
    `<primitiv-context-menu-trigger${disabled ? " disabled" : ""}>${LABELS.region}</primitiv-context-menu-trigger>` +
    `<primitiv-context-menu-content popover="manual">` +
    item(LABELS.copy) +
    item(LABELS.cut, " disabled") +
    `<primitiv-context-menu-checkbox-item><li>${LABELS.grid}` +
    `<primitiv-context-menu-item-indicator></primitiv-context-menu-item-indicator></li></primitiv-context-menu-checkbox-item>` +
    `<primitiv-context-menu-separator></primitiv-context-menu-separator>` +
    `<primitiv-context-menu-radio-group value="small">` +
    `<primitiv-context-menu-radio-item value="small"><li>${LABELS.small}</li></primitiv-context-menu-radio-item>` +
    `<primitiv-context-menu-radio-item value="large"><li>${LABELS.large}</li></primitiv-context-menu-radio-item>` +
    `</primitiv-context-menu-radio-group>` +
    `<primitiv-context-menu-sub${subOpen ? " open" : ""}>` +
    `<primitiv-context-menu-sub-trigger><li>${LABELS.share}</li></primitiv-context-menu-sub-trigger>` +
    `<primitiv-context-menu-sub-content popover="auto">${item(LABELS.email)}${item(LABELS.link)}</primitiv-context-menu-sub-content>` +
    `</primitiv-context-menu-sub>` +
    item(LABELS.remove) +
    `</primitiv-context-menu-content></primitiv-context-menu>`
  );
}
