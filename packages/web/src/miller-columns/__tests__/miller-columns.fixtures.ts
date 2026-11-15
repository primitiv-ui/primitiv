/** A node of the fixture tree; its value is its label in lower case. */
export type Node = { label: string; children?: Node[] };

export const TREE: Node[] = [
  { label: "Docs", children: [{ label: "Guides", children: [{ label: "Intro" }, { label: "Setup" }] }, { label: "API" }] },
  { label: "Blog", children: [{ label: "Post" }] },
  { label: "Readme" },
];

export type MillerColumnsHtml = {
  value?: string[];
  disabled?: string[];
  dir?: "ltr" | "rtl";
  id?: string;
  label?: string;
  /** Render a preview panel after the tree, with these attributes. */
  preview?: string;
  /** Render a resize handle in the root column, with these attributes. */
  resize?: string;
  tree?: Node[];
};

/** A strip as the elements are written: every column a sibling, naming its parent item. */
export function millerColumnsHtml({
  value = [],
  disabled = [],
  dir,
  id,
  label = "Files",
  preview,
  resize,
  tree = TREE,
}: MillerColumnsHtml = {}): string {
  const columns: string[] = [];
  const column = (nodes: Node[], parent: string | null, handle: boolean) => {
    const items = nodes
      .map((node) => {
        const value = node.label.toLowerCase();
        const indicator = node.children
          ? "<primitiv-miller-columns-item-indicator>▸</primitiv-miller-columns-item-indicator>"
          : "";
        return `<primitiv-miller-columns-item value="${value}"${disabled.includes(value) ? " disabled" : ""}>${node.label}${indicator}</primitiv-miller-columns-item>`;
      })
      .join("");
    const grip = handle
      ? `<primitiv-miller-columns-resize-handle aria-label="Resize column"${resize}></primitiv-miller-columns-resize-handle>`
      : "";
    columns.push(
      `<primitiv-miller-columns-column${parent ? ` parent="${parent}"` : ""}>${grip}${items}</primitiv-miller-columns-column>`,
    );
    for (const node of nodes) if (node.children) column(node.children, node.label.toLowerCase(), false);
  };
  column(tree, null, resize !== undefined);
  const panel =
    preview === undefined ? "" : `<primitiv-miller-columns-preview-panel${preview}>Preview</primitiv-miller-columns-preview-panel>`;
  return (
    `<primitiv-miller-columns${id ? ` id="${id}"` : ""} value="${value.join(" ")}"${dir ? ` dir="${dir}"` : ""}>` +
    `<primitiv-miller-columns-tree aria-label="${label}">${columns.join("")}</primitiv-miller-columns-tree>` +
    `${panel}</primitiv-miller-columns>`
  );
}
