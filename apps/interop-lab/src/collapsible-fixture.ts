/** The collapsible the Collapsible pages render, read from the URL so one spec drives each page. */
export const COLLAPSIBLE = { label: "Toggle", panel: "Hidden content" } as const;

export type CollapsibleFixture = {
  open: boolean;
  disabled: boolean;
  /** The panel's `collapsed-height`, verbatim. */
  collapsedHeight: string | null;
};

export function collapsibleFixtureFromUrl(search: string = location.search): CollapsibleFixture {
  const params = new URLSearchParams(search);
  return {
    open: params.has("open"),
    disabled: params.has("disabled"),
    collapsedHeight: params.get("collapsed-height"),
  };
}

/**
 * The plain-HTML rendering, as a server would send it — a closed panel already
 * `hidden` — shared by the html page and the HTMX fragments.
 */
export function collapsibleHtml(
  fixture: Partial<CollapsibleFixture> = {},
  id = "collapsible",
  { label = COLLAPSIBLE.label, panel = COLLAPSIBLE.panel }: { label?: string; panel?: string } = {},
): string {
  const { open, disabled, collapsedHeight } = fixture;
  const attrs = [`id="${id}"`, open ? "open" : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
  const content = [
    collapsedHeight ? `collapsed-height="${collapsedHeight}"` : "",
    open || collapsedHeight ? "" : "hidden",
  ]
    .filter(Boolean)
    .map((attr) => ` ${attr}`)
    .join("");
  return (
    `<primitiv-collapsible ${attrs}><primitiv-collapsible-trigger><button type="button">${label}</button>` +
    `</primitiv-collapsible-trigger><primitiv-collapsible-content${content}>${panel}</primitiv-collapsible-content>` +
    `</primitiv-collapsible>`
  );
}
