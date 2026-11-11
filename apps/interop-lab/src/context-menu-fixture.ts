/** The context menu the Context Menu pages render, read from the URL so one spec drives each page. */
export type ContextMenuFixture = { open: boolean; disabled: boolean };

export function contextMenuFixtureFromUrl(search: string = location.search): ContextMenuFixture {
  const params = new URLSearchParams(search);
  return { open: params.has("open"), disabled: params.has("disabled") };
}

/**
 * The plain-HTML rendering, as a server would send it — `popover="manual"` on
 * the menu and `popover="auto"` on its submenu, so both are hidden before the
 * script loads — shared by the html page and the HTMX fragments.
 */
export function contextMenuHtml(
  fixture: Partial<ContextMenuFixture> = {},
  id = "context-menu",
  { label = "Right-click here", inner = "" }: { label?: string; inner?: string } = {},
): string {
  return (
    `<primitiv-context-menu id="${id}"${fixture.open ? " open" : ""}>` +
    `<primitiv-context-menu-trigger tabindex="0"${fixture.disabled ? " disabled" : ""}>${label}</primitiv-context-menu-trigger>` +
    `<primitiv-context-menu-content popover="manual">` +
    `<primitiv-context-menu-item><li>Copy</li></primitiv-context-menu-item>` +
    `<primitiv-context-menu-sub id="${id === "context-menu" ? "share" : `${id}-share`}">` +
    `<primitiv-context-menu-sub-trigger><li>Share</li></primitiv-context-menu-sub-trigger>` +
    `<primitiv-context-menu-sub-content popover="auto">` +
    `<primitiv-context-menu-item><li>Email</li></primitiv-context-menu-item><primitiv-context-menu-item><li>Link</li></primitiv-context-menu-item>` +
    `</primitiv-context-menu-sub-content></primitiv-context-menu-sub>` +
    inner +
    `<primitiv-context-menu-item><li>Delete</li></primitiv-context-menu-item>` +
    `</primitiv-context-menu-content></primitiv-context-menu>`
  );
}
