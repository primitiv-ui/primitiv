/** The menu the Navigation Menu pages render, read from the URL so one spec drives each page. */
export const NAVIGATION_MENU = { docs: "Docs", blog: "Blog", link: "Pricing" } as const;

export type NavigationMenuFixture = { value?: string; rtl: boolean; viewport: boolean };

export function navigationMenuFixtureFromUrl(search: string = location.search): NavigationMenuFixture {
  const params = new URLSearchParams(search);
  return {
    value: params.get("value") ?? undefined,
    rtl: params.has("rtl"),
    viewport: params.has("viewport"),
  };
}

/**
 * The plain-HTML rendering, as a server would send it — every panel `hidden`,
 * so nothing shows before the script loads — shared by the html page and the
 * HTMX fragments. With `viewport`, the panels sit in the shared viewport, each
 * naming its entry with `value`, where React's panels project.
 */
export function navigationMenuHtml(
  fixture: Partial<NavigationMenuFixture> = {},
  id = "nav",
  { label = NAVIGATION_MENU.docs, inner = "", attrs = "" }: { label?: string; inner?: string; attrs?: string } = {},
): string {
  const { value, viewport } = fixture;
  const panel = (entry: string, links: string[], extra = "") =>
    `<primitiv-navigation-menu-content${viewport ? ` value="${entry}"` : ""}${value === entry ? "" : " hidden"}>` +
    links.map((l) => `<primitiv-navigation-menu-link><a href="#${l.toLowerCase()}">${l}</a></primitiv-navigation-menu-link>`).join("") +
    extra +
    `</primitiv-navigation-menu-content>`;
  const docs = panel("docs", ["Guides", "API"], inner);
  const blog = panel("blog", ["Latest"]);
  return (
    `<primitiv-navigation-menu id="${id}"${value ? ` value="${value}"` : ""} delay-duration="0" close-delay="0"${attrs}>` +
    `<primitiv-navigation-menu-list>` +
    `<primitiv-navigation-menu-item value="docs"><primitiv-navigation-menu-trigger><button type="button">${label}</button></primitiv-navigation-menu-trigger>${viewport ? "" : docs}</primitiv-navigation-menu-item>` +
    `<primitiv-navigation-menu-item value="blog"><primitiv-navigation-menu-trigger><button type="button">${NAVIGATION_MENU.blog}</button></primitiv-navigation-menu-trigger>${viewport ? "" : blog}</primitiv-navigation-menu-item>` +
    `<primitiv-navigation-menu-item><primitiv-navigation-menu-link><a href="#pricing">${NAVIGATION_MENU.link}</a></primitiv-navigation-menu-link></primitiv-navigation-menu-item>` +
    `</primitiv-navigation-menu-list>` +
    `<primitiv-navigation-menu-indicator data-testid="indicator"></primitiv-navigation-menu-indicator>` +
    (viewport ? `<primitiv-navigation-menu-viewport data-testid="viewport">${docs}${blog}</primitiv-navigation-menu-viewport>` : "") +
    `</primitiv-navigation-menu>`
  );
}
