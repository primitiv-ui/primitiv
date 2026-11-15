/**
 * Shared Tree markup for the element tests: one function, pure string output.
 * It renders the conformance suite's tree — Docs (Guides (Intro, Setup), API)
 * and Blog — followed by a "Search" button outside it.
 */
export type TreeFixture = {
  expanded?: string[];
  selected?: string[];
  multiple?: boolean;
  disabled?: string[];
  selectionPath?: boolean;
  /** `force-mount` on every branch content. */
  forceMount?: boolean;
  /** An id for the root. */
  id?: string;
  /** Markup inside the selection path (a `<template>`, say). */
  pathInner?: string;
};

export function treeHtml({
  expanded = [],
  selected = [],
  multiple,
  disabled = [],
  selectionPath,
  forceMount,
  id,
  pathInner = "",
}: TreeFixture = {}): string {
  const off = (value: string) => (disabled.includes(value) ? " disabled" : "");
  const leaf = (label: string) => {
    const value = label.toLowerCase();
    return `<primitiv-tree-item value="${value}" label="${label}"${off(value)}>${label}</primitiv-tree-item>`;
  };
  const branch = (label: string, children: string) => {
    const value = label.toLowerCase();
    const hidden = expanded.includes(value) || forceMount ? "" : " hidden";
    return (
      `<primitiv-tree-branch value="${value}" label="${label}"${off(value)}>` +
      `<primitiv-tree-branch-control>${label}</primitiv-tree-branch-control>` +
      `<primitiv-tree-branch-content${forceMount ? " force-mount" : ""}${hidden}>${children}</primitiv-tree-branch-content>` +
      `</primitiv-tree-branch>`
    );
  };
  const attrs = [
    id ? ` id="${id}"` : "",
    ` aria-label="Site"`,
    multiple ? ` selection-mode="multiple"` : "",
    expanded.length ? ` expanded="${expanded.join(" ")}"` : "",
    selected.length ? ` value="${selected.join(" ")}"` : "",
  ].join("");
  return (
    `<primitiv-tree${attrs}>` +
    branch("Docs", branch("Guides", leaf("Intro") + leaf("Setup")) + leaf("API")) +
    leaf("Blog") +
    (selectionPath ? `<primitiv-tree-selection-path>${pathInner}</primitiv-tree-selection-path>` : "") +
    `</primitiv-tree><button type="button">Search</button>`
  );
}
