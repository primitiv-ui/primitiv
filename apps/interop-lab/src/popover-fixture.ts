/** The popover the Popover pages render, read from the URL so one spec drives each page. */
export const POPOVER = { open: "Edit profile", title: "Profile", close: "Done" } as const;

export type PopoverFixture = { open: boolean };

export function popoverFixtureFromUrl(search: string = location.search): PopoverFixture {
  return { open: new URLSearchParams(search).has("open") };
}

/**
 * The plain-HTML rendering, as a server would send it — `popover="auto"` on
 * the panel, so it is hidden before the script loads — shared by the html page
 * and the HTMX fragments.
 */
export function popoverHtml(
  fixture: Partial<PopoverFixture> = {},
  id = "popover",
  { label = POPOVER.open, title = POPOVER.title, inner = "" }: { label?: string; title?: string; inner?: string } = {},
): string {
  return (
    `<primitiv-popover id="${id}"${fixture.open ? " open" : ""}>` +
    `<primitiv-popover-trigger><button type="button">${label}</button></primitiv-popover-trigger>` +
    `<primitiv-popover-content popover="auto">` +
    `<primitiv-popover-title><h2>${title}</h2></primitiv-popover-title>` +
    `<primitiv-popover-description><p>Your display name is shown on every comment.</p></primitiv-popover-description>` +
    `<label>Name <input name="name"></label>` +
    inner +
    `<primitiv-popover-close><button type="button">${POPOVER.close}</button></primitiv-popover-close>` +
    `</primitiv-popover-content></primitiv-popover>`
  );
}
