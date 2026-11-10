/** The dropdown the Dropdown pages render, read from the URL so one spec drives each page. */
export type DropdownFixture = { open: boolean; subDisabled: boolean };

export function dropdownFixtureFromUrl(search: string = location.search): DropdownFixture {
  const params = new URLSearchParams(search);
  return { open: params.has("open"), subDisabled: params.has("subdisabled") };
}

/**
 * The plain-HTML rendering, as a server would send it — `popover="auto"` on
 * both menus, so they are hidden before the script loads — shared by the html
 * page and the HTMX fragments.
 */
export function dropdownHtml(
  fixture: Partial<DropdownFixture> = {},
  id = "dropdown",
  { label = "Options", inner = "" }: { label?: string; inner?: string } = {},
): string {
  return (
    `<primitiv-dropdown id="${id}"${fixture.open ? " open" : ""}>` +
    `<primitiv-dropdown-trigger><button type="button">${label}</button></primitiv-dropdown-trigger>` +
    `<primitiv-dropdown-content popover="auto">` +
    `<primitiv-dropdown-item><li>Copy <kbd id="${id}-copy-shortcut" aria-hidden="true">⌘C</kbd></li></primitiv-dropdown-item>` +
    `<primitiv-dropdown-sub id="${id === "dropdown" ? "share" : `${id}-share`}">` +
    `<primitiv-dropdown-sub-trigger${fixture.subDisabled ? " disabled" : ""}><li>Share <span id="${id}-share-chevron" aria-hidden="true">›</span></li></primitiv-dropdown-sub-trigger>` +
    `<primitiv-dropdown-sub-content popover="auto">` +
    `<primitiv-dropdown-item><li>Email</li></primitiv-dropdown-item><primitiv-dropdown-item><li>Link</li></primitiv-dropdown-item>` +
    `</primitiv-dropdown-sub-content></primitiv-dropdown-sub>` +
    `<primitiv-dropdown-checkbox-item><li>Show grid <primitiv-dropdown-item-indicator>✓</primitiv-dropdown-item-indicator></li></primitiv-dropdown-checkbox-item>` +
    inner +
    `<primitiv-dropdown-item><li>Delete</li></primitiv-dropdown-item>` +
    `</primitiv-dropdown-content></primitiv-dropdown>`
  );
}
