/** A node of the tree the Miller Columns pages render; its value is its label in lower case. */
export type MillerNode = { label: string; children?: MillerNode[] };

export const MILLER_TREE: MillerNode[] = [
  { label: "Docs", children: [{ label: "Guides", children: [{ label: "Intro" }, { label: "Setup" }] }, { label: "API" }] },
  { label: "Blog", children: [{ label: "Post" }] },
  { label: "Readme" },
];

export type MillerColumnsFixture = {
  value: string[];
  dir?: "ltr" | "rtl";
  disabled?: readonly string[];
  /** Leave a branch's column out, so a fragment can bring it later. */
  omit?: readonly string[];
};

export function millerColumnsFixtureFromUrl(search: string = location.search): MillerColumnsFixture {
  const params = new URLSearchParams(search);
  return {
    value: (params.get("value") ?? "").split(" ").filter(Boolean),
    dir: params.get("dir") === "rtl" ? "rtl" : undefined,
    disabled: params.getAll("disabled"),
  };
}

/** One column, naming its parent item, as a server would render it. */
export function millerColumnHtml(nodes: MillerNode[], parent: string | null, disabled: readonly string[] = []): string {
  const items = nodes
    .map((node) => {
      const value = node.label.toLowerCase();
      const indicator = node.children
        ? "<primitiv-miller-columns-item-indicator>▸</primitiv-miller-columns-item-indicator>"
        : "";
      return `<primitiv-miller-columns-item value="${value}"${disabled.includes(value) ? " disabled" : ""}>${node.label}${indicator}</primitiv-miller-columns-item>`;
    })
    .join("");
  return `<primitiv-miller-columns-column${parent ? ` parent="${parent}"` : ""}>${items}</primitiv-miller-columns-column>`;
}

/**
 * The plain-HTML rendering, as a server would send it — every column a sibling
 * naming its parent — shared by the html page and the HTMX fragments.
 */
export function millerColumnsHtml(
  { value, dir, disabled = [], omit = [] }: MillerColumnsFixture,
  id = "miller",
  label = "Files",
): string {
  const columns: string[] = [];
  const walk = (nodes: MillerNode[], parent: string | null) => {
    if (parent && omit.includes(parent)) return;
    columns.push(millerColumnHtml(nodes, parent, disabled));
    for (const node of nodes) if (node.children) walk(node.children, node.label.toLowerCase());
  };
  walk(MILLER_TREE, null);
  return (
    `<primitiv-miller-columns id="${id}" value="${value.join(" ")}"${dir ? ` dir="${dir}"` : ""}>` +
    `<primitiv-miller-columns-tree aria-label="${label}">${columns.join("")}</primitiv-miller-columns-tree>` +
    `<primitiv-miller-columns-preview-panel>Preview</primitiv-miller-columns-preview-panel></primitiv-miller-columns>`
  );
}
