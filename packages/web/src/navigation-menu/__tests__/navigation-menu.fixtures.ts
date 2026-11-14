/**
 * Shared Navigation Menu markup for the element tests: one function, pure
 * string output, mirroring the other components' fixtures. It renders the
 * conformance suite's menu — "Docs" (Guides, API) and "Blog" (Latest)
 * disclosures, then a "Pricing" link — followed by a "Search" button outside.
 */
export type NavigationMenuFixture = {
  value?: string;
  orientation?: "horizontal" | "vertical";
  rtl?: boolean;
  openOnHover?: boolean;
  delay?: number;
  closeDelay?: number;
  /** Put the panels in a shared Viewport rather than in their items. */
  viewport?: boolean;
  indicator?: boolean;
  active?: boolean;
  /** `force-mount` on every content, the viewport and the indicator. */
  forceMount?: boolean;
  /** An id for the root. */
  id?: string;
};

export function navigationMenuHtml({
  value,
  orientation,
  rtl,
  openOnHover,
  delay,
  closeDelay,
  viewport,
  indicator,
  active,
  forceMount,
  id,
}: NavigationMenuFixture = {}): string {
  const rootAttrs = [
    id ? ` id="${id}"` : "",
    value ? ` value="${value}"` : "",
    orientation ? ` orientation="${orientation}"` : "",
    openOnHover === false ? ` open-on-hover="false"` : "",
    delay === undefined ? "" : ` delay-duration="${delay}"`,
    closeDelay === undefined ? "" : ` close-delay="${closeDelay}"`,
  ].join("");
  const mount = forceMount ? " force-mount" : "";
  const panel = (entry: string, links: string[]) =>
    `<primitiv-navigation-menu-content${viewport ? ` value="${entry}"` : ""}${mount}>` +
    links.map((l) => `<primitiv-navigation-menu-link><a href="#${l}">${l}</a></primitiv-navigation-menu-link>`).join("") +
    `</primitiv-navigation-menu-content>`;
  const docs = panel("docs", ["Guides", "API"]);
  const blog = panel("blog", ["Latest"]);
  return (
    `<div${rtl ? ` dir="rtl"` : ""}>` +
    `<primitiv-navigation-menu${rootAttrs}>` +
    `<primitiv-navigation-menu-list>` +
    `<primitiv-navigation-menu-item value="docs"><primitiv-navigation-menu-trigger><button type="button">Docs</button></primitiv-navigation-menu-trigger>${viewport ? "" : docs}</primitiv-navigation-menu-item>` +
    `<primitiv-navigation-menu-item value="blog"><primitiv-navigation-menu-trigger><button type="button">Blog</button></primitiv-navigation-menu-trigger>${viewport ? "" : blog}</primitiv-navigation-menu-item>` +
    `<primitiv-navigation-menu-item><primitiv-navigation-menu-link${active ? " active" : ""}><a href="#pricing">Pricing</a></primitiv-navigation-menu-link></primitiv-navigation-menu-item>` +
    `</primitiv-navigation-menu-list>` +
    (indicator ? `<primitiv-navigation-menu-indicator data-testid="indicator"${mount}></primitiv-navigation-menu-indicator>` : "") +
    (viewport ? `<primitiv-navigation-menu-viewport data-testid="viewport"${mount}>${docs}${blog}</primitiv-navigation-menu-viewport>` : "") +
    `</primitiv-navigation-menu>` +
    `<button type="button">Search</button>` +
    `</div>`
  );
}
