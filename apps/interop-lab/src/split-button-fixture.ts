/** The split button the SplitButton pages render, read from the URL so one spec drives each page. */
export type SplitButtonFixture = {
  disabled: boolean;
  open: boolean;
};

export function splitButtonFixtureFromUrl(search: string = location.search): SplitButtonFixture {
  const params = new URLSearchParams(search);
  return { disabled: params.has("disabled"), open: params.has("open") };
}

/** The plain-HTML rendering, as a server would send it, shared by the html page and the HTMX fragments. */
export function splitButtonHtml(fixture: Partial<SplitButtonFixture> = {}, id = "split", action = "Save"): string {
  return (
    `<primitiv-split-button id="${id}"${fixture.disabled ? " disabled" : ""}>` +
    `<primitiv-split-button-action><button type="button">${action}</button></primitiv-split-button-action>` +
    `<primitiv-dropdown${fixture.open ? " open" : ""}>` +
    `<primitiv-dropdown-trigger><button type="button">More</button></primitiv-dropdown-trigger>` +
    `<primitiv-dropdown-content popover="auto">` +
    `<primitiv-dropdown-item><li>${action} and close</li></primitiv-dropdown-item>` +
    `<primitiv-dropdown-item><li>${action} as draft</li></primitiv-dropdown-item>` +
    `</primitiv-dropdown-content>` +
    `</primitiv-dropdown>` +
    `</primitiv-split-button>`
  );
}
