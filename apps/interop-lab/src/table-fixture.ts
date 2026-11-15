/** The rows the Table pages render: each has an expand trigger and a detail row. */
export const TABLE_ROWS = ["Ada", "Grace"] as const;

export type TableFixture = {
  /** The rows expanded at first. */
  expanded: readonly string[];
  disabled: boolean;
  forceMount: boolean;
};

export function tableFixtureFromUrl(search: string = location.search): TableFixture {
  const params = new URLSearchParams(search);
  return { expanded: params.getAll("expanded"), disabled: params.has("disabled"), forceMount: params.has("force-mount") };
}

/** One row and its detail row, as a server would send them — a closed detail row already `hidden`. */
export function tableRowHtml(name: string, id: string, fixture: Partial<TableFixture> = {}, detail = `${name}'s details`): string {
  const { expanded = [], disabled, forceMount } = fixture;
  const open = expanded.includes(name);
  const attrs = [open ? " expanded" : "", disabled ? " disabled" : "", forceMount ? " force-mount" : ""].join("");
  const rowId = `${id}-${name.toLowerCase()}-details`;
  const closed = open ? "" : forceMount ? ' aria-hidden="true"' : " hidden";
  return (
    `<tr><td><primitiv-table-expand-trigger${attrs}><button type="button" aria-controls="${rowId}">Show details for ${name}</button>` +
    `</primitiv-table-expand-trigger></td><td>${name}</td></tr>` +
    `<tr id="${rowId}"${closed}><td colspan="2">${detail}</td></tr>`
  );
}

/** The whole table, shared by the html page and the HTMX fragments. */
export function tableHtml(fixture: Partial<TableFixture> = {}, id = "table", rows: readonly string[] = TABLE_ROWS): string {
  return (
    `<table id="${id}"><thead><tr><th scope="col">Details</th><th scope="col">Name</th></tr></thead>` +
    `<tbody>${rows.map((name) => tableRowHtml(name, id, fixture)).join("")}</tbody></table>`
  );
}
