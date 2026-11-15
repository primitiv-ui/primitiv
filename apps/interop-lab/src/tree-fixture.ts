/** The tree the Tree pages render, read from the URL so one spec drives each page. */
export type TreeFixture = { expanded: string[]; selected: string[]; multiple: boolean; rtl: boolean };

export function treeFixtureFromUrl(search: string = location.search): TreeFixture {
  const params = new URLSearchParams(search);
  const listOf = (name: string) => (params.get(name) ?? "").split(",").filter(Boolean);
  return {
    expanded: listOf("expanded"),
    selected: listOf("selected"),
    multiple: params.has("multiple"),
    rtl: params.has("rtl"),
  };
}

/**
 * The plain-HTML rendering, as a server would send it — collapsed groups
 * `hidden`, so nothing shows before the script loads — shared by the html page
 * and the HTMX fragments: Docs (Guides (Intro, Setup), API) and Blog, with a
 * selection path.
 */
export function treeHtml(
  fixture: Partial<TreeFixture> = {},
  id = "tree",
  { attrs = "", extra = "" }: { attrs?: string; extra?: string } = {},
): string {
  const { expanded = [], selected = [], multiple } = fixture;
  const leaf = (label: string) =>
    `<primitiv-tree-item value="${label.toLowerCase()}" label="${label}">${label}</primitiv-tree-item>`;
  const branch = (label: string, children: string) => {
    const value = label.toLowerCase();
    return (
      `<primitiv-tree-branch value="${value}" label="${label}">` +
      `<primitiv-tree-branch-control>${label}</primitiv-tree-branch-control>` +
      `<primitiv-tree-branch-content${expanded.includes(value) ? "" : " hidden"}>${children}</primitiv-tree-branch-content>` +
      `</primitiv-tree-branch>`
    );
  };
  return (
    `<primitiv-tree id="${id}" aria-label="Site"` +
    (multiple ? ` selection-mode="multiple"` : "") +
    (expanded.length ? ` expanded="${expanded.join(" ")}"` : "") +
    (selected.length ? ` value="${selected.join(" ")}"` : "") +
    `${attrs}>` +
    branch("Docs", branch("Guides", leaf("Intro") + leaf("Setup")) + leaf("API")) +
    leaf("Blog") +
    extra +
    `<primitiv-tree-selection-path></primitiv-tree-selection-path>` +
    `</primitiv-tree>`
  );
}
