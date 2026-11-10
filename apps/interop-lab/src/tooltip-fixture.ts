/** The tooltips the Tooltip pages render, read from the URL so one spec drives each page. */
export const TOOLTIPS = [
  { id: "save", label: "Save", tip: "Saves your work" },
  { id: "share", label: "Share", tip: "Copies a link" },
] as const;

export type TooltipFixture = { open: boolean };

export function tooltipFixtureFromUrl(search: string = location.search): TooltipFixture {
  return { open: new URLSearchParams(search).has("open") };
}

/**
 * The plain-HTML rendering of one tooltip, as a server would send it —
 * `popover="manual"` on the content, so it is hidden before the script loads —
 * shared by the html page and the HTMX fragments.
 */
export function tooltipHtml(
  fixture: Partial<TooltipFixture> = {},
  { id, label, tip }: { id: string; label: string; tip: string } = TOOLTIPS[0],
): string {
  return (
    `<primitiv-tooltip id="${id}"${fixture.open ? " open" : ""}>` +
    `<primitiv-tooltip-trigger><button type="button">${label}</button></primitiv-tooltip-trigger>` +
    `<primitiv-tooltip-content popover="manual">${tip}</primitiv-tooltip-content>` +
    `</primitiv-tooltip>`
  );
}
