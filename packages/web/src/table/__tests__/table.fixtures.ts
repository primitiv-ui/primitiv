import { TABLE_EXPAND_ROWS } from "@primitiv-ui/conformance";

export type TableExpandHtml = {
  expanded?: readonly string[];
  forceMount?: boolean;
  /** Extra attributes on every expand trigger element. */
  attrs?: string;
};

/**
 * The table as the elements are written: each data row's expand trigger sits
 * in a cell and wraps the button, which names its detail row with
 * `aria-controls`; the detail row follows as an ordinary `<tr>`.
 */
export function tableExpandHtml({ expanded = [], forceMount, attrs = "" }: TableExpandHtml = {}): string {
  const rows = TABLE_EXPAND_ROWS.map((name) => {
    const id = `${name.toLowerCase()}-details`;
    const open = expanded.includes(name);
    return (
      `<tr><td><primitiv-table-expand-trigger${open ? " expanded" : ""}${forceMount ? " force-mount" : ""}${attrs}>` +
      `<button type="button" aria-controls="${id}">Show details for ${name}</button>` +
      `</primitiv-table-expand-trigger></td><td>${name}</td></tr>` +
      `<tr id="${id}"${open || forceMount ? "" : " hidden"}><td colspan="2">${name}'s details</td></tr>`
    );
  }).join("");
  return `<table><tbody>${rows}</tbody></table>`;
}
