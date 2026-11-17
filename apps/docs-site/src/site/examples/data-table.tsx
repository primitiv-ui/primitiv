"use client";

import { useState } from "react";

import { Table as HeadlessTable } from "@primitiv-ui/react";

import { Checkbox } from "@/components/checkbox";
import {
  DataTable,
  DataTableControlCell,
  DataTableDetailRow,
  DataTableExpandTrigger,
  DataTableFooter,
  DataTableRegion,
  DataTableSortHeader,
  DataTableToolbar,
} from "@/components/data-table";
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "@/components/empty-state";
import { Input } from "@/components/input";
import {
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@/components/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableScrollArea } from "@/components/table";
import { importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type SortDir = "asc" | "desc";

const ROWS = [
  { id: "harmoni", name: "harmoni-engine", env: "Production", status: "Success", duration: 142 },
  { id: "docs", name: "docs-site", env: "Preview", status: "Success", duration: 88 },
  { id: "registry", name: "registry-api", env: "Production", status: "Failed", duration: 203 },
  { id: "tokens", name: "tokens-cdn", env: "Production", status: "Success", duration: 54 },
  { id: "figma", name: "figma-sync", env: "Preview", status: "Building", duration: 176 },
  { id: "cli", name: "primitiv-cli", env: "Production", status: "Success", duration: 121 },
  { id: "web", name: "marketing-web", env: "Preview", status: "Success", duration: 67 },
  { id: "auth", name: "auth-gateway", env: "Production", status: "Failed", duration: 245 },
];
type Row = (typeof ROWS)[number];

const imports = () =>
  [
    `import {`,
    `  DataTable, DataTableToolbar, DataTableFooter, DataTableRegion,`,
    `  DataTableControlCell, DataTableSortHeader,`,
    `} from "@/components/ui/data-table";`,
    `import {`,
    `  Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableScrollArea,`,
    `} from "@/components/ui/table";`,
  ].join("\n");

/* ---- The headline: a full shell driven by plain useState ---- */

function DeploymentsTable() {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<{ col: keyof Row | null; dir: SortDir }>({ col: null, dir: "asc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const PAGE = 4;

  const filtered = ROWS.filter((r) => r.name.toLowerCase().includes(filter.toLowerCase()));
  const sorted =
    sort.col === null
      ? filtered
      : [...filtered].sort((a, b) => {
          const av = a[sort.col!];
          const bv = b[sort.col!];
          const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? cmp : -cmp;
        });
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE));
  const pageIndex = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(pageIndex * PAGE, pageIndex * PAGE + PAGE);

  const toggleSort = (col: keyof Row) =>
    setSort((s) => (s.col !== col ? { col, dir: "asc" } : s.dir === "asc" ? { col, dir: "desc" } : { col: null, dir: "asc" }));
  const dirFor = (col: keyof Row) => (sort.col === col ? sort.dir : "none");

  const pageIds = pageRows.map((r) => r.id);
  const headerChecked: boolean | "indeterminate" = pageIds.every((id) => selected.has(id))
    ? pageIds.length > 0
    : pageIds.some((id) => selected.has(id))
      ? "indeterminate"
      : false;
  const toggleAll = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  const toggleRow = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <DataTable size="sm">
      <DataTableToolbar>
        <DataTableRegion align="start">
          <Input
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
            placeholder="Filter deployments..."
            aria-label="Filter deployments"
          />
        </DataTableRegion>
      </DataTableToolbar>

      <TableScrollArea>
        <Table size="sm">
          <TableHead>
            <TableRow>
              <DataTableControlCell header>
                <Checkbox checked={headerChecked} onCheckedChange={toggleAll} aria-label="Select all rows on this page" />
              </DataTableControlCell>
              <DataTableSortHeader direction={dirFor("name")} onSort={() => toggleSort("name")}>
                Deployment
              </DataTableSortHeader>
              <TableHeader>Environment</TableHeader>
              <TableHeader>Status</TableHeader>
              <DataTableSortHeader align="end" direction={dirFor("duration")} onSort={() => toggleSort("duration")}>
                Duration
              </DataTableSortHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.id} aria-selected={selected.has(row.id)}>
                <DataTableControlCell>
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(c) => toggleRow(row.id, c)}
                    aria-label={`Select ${row.name}`}
                  />
                </DataTableControlCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.env}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell align="end">{row.duration}ms</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>

      <DataTableFooter>
        <DataTableRegion align="start">
          <span className="docs-example-caption">{selected.size} selected</span>
        </DataTableRegion>
        <DataTableRegion align="end">
          <Pagination label="Deployment pages" size="sm">
            <PaginationList>
              <PaginationItem>
                <PaginationPrevious disabled={pageIndex === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} />
              </PaginationItem>
              {Array.from({ length: pageCount }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink isActive={i === pageIndex} onClick={() => setPage(i)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  disabled={pageIndex >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                />
              </PaginationItem>
            </PaginationList>
          </Pagination>
        </DataTableRegion>
      </DataTableFooter>
    </DataTable>
  );
}

/* ---- Row selection, isolated ---- */

function SelectableTable() {
  const rows = ROWS.slice(0, 5);
  const [selected, setSelected] = useState<Set<string>>(new Set(["docs"]));
  const ids = rows.map((r) => r.id);
  const allChecked: boolean | "indeterminate" = ids.every((id) => selected.has(id))
    ? true
    : ids.some((id) => selected.has(id))
      ? "indeterminate"
      : false;

  return (
    <DataTable size="sm">
      <TableScrollArea>
        <Table size="sm">
          <TableHead>
            <TableRow>
              <DataTableControlCell header>
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(c) => setSelected(c ? new Set(ids) : new Set())}
                  aria-label="Select all rows"
                />
              </DataTableControlCell>
              <TableHeader>Deployment</TableHeader>
              <TableHeader>Environment</TableHeader>
              <TableHeader align="end">Duration</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} aria-selected={selected.has(row.id)}>
                <DataTableControlCell>
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(c) =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (c) next.add(row.id);
                        else next.delete(row.id);
                        return next;
                      })
                    }
                    aria-label={`Select ${row.name}`}
                  />
                </DataTableControlCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.env}</TableCell>
                <TableCell align="end">{row.duration}ms</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
      <DataTableFooter>
        <DataTableRegion align="start">
          <span className="docs-example-caption">
            {selected.size} of {rows.length} selected
          </span>
        </DataTableRegion>
      </DataTableFooter>
    </DataTable>
  );
}

/* ---- Pagination, isolated ---- */

function PaginatedTable() {
  const PAGE = 3;
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(ROWS.length / PAGE);
  const pageIndex = Math.min(page, pageCount - 1);
  const start = pageIndex * PAGE;
  const pageRows = ROWS.slice(start, start + PAGE);

  return (
    <DataTable size="sm">
      <TableScrollArea>
        {/* aria-rowcount is the FULL count, so AT doesn't announce the page's
            rows as the whole table's. */}
        <Table size="sm" aria-rowcount={ROWS.length}>
          <TableHead>
            <TableRow>
              <TableHeader>Deployment</TableHeader>
              <TableHeader>Environment</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader align="end">Duration</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.env}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell align="end">{row.duration}ms</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
      <DataTableFooter>
        <DataTableRegion align="start">
          <span className="docs-example-caption">
            Showing {start + 1}–{start + pageRows.length} of {ROWS.length}
          </span>
        </DataTableRegion>
        <DataTableRegion align="end">
          <Pagination label="Deployment pages" size="sm">
            <PaginationList>
              <PaginationItem>
                <PaginationPrevious disabled={pageIndex === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} />
              </PaginationItem>
              {Array.from({ length: pageCount }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink isActive={i === pageIndex} onClick={() => setPage(i)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  disabled={pageIndex >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                />
              </PaginationItem>
            </PaginationList>
          </Pagination>
        </DataTableRegion>
      </DataTableFooter>
    </DataTable>
  );
}

/* ---- Expandable rows ---- */

function ExpandableTable() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["registry"]));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const rows = ROWS.slice(0, 4);

  return (
    <DataTable size="sm">
      <TableScrollArea>
        <Table size="sm">
          <TableHead>
            <TableRow>
              <DataTableControlCell header>
                <span className="docs-visually-hidden">Details</span>
              </DataTableControlCell>
              <TableHeader>Deployment</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader align="end">Duration</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <HeadlessTable.Expandable key={row.id} expanded={expanded.has(row.id)} onExpandedChange={() => toggle(row.id)}>
                <TableRow>
                  <DataTableControlCell>
                    <DataTableExpandTrigger aria-label={`Show details for ${row.name}`} />
                  </DataTableControlCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell align="end">{row.duration}ms</TableCell>
                </TableRow>
                <DataTableDetailRow colSpan={4} gutter={1} forceMount>
                  <div style={{ display: "grid", gap: "0.25rem" }}>
                    <strong>{row.name}</strong>
                    <span className="docs-example-caption">
                      {row.env} · finished in {row.duration}ms · triggered by a push to main.
                    </span>
                  </div>
                </DataTableDetailRow>
              </HeadlessTable.Expandable>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
    </DataTable>
  );
}


// ── Elements (RFC 0033) ──────────────────────────────────────────────────────

/* The same tables as plain markup, in the shape `primitiv add data-table
   --surface elements` prints. Only the expand trigger is an element; sorting,
   selection, filtering and paging are the page's to do, so those examples show
   the markup in one state, and Row selection wires a short script. */

const SORT_PATHS = {
  none: "M5 6.5 5 13M5 13 3 11M5 13l2-2M11 9.5 11 3M11 3 9 5M11 3l2 2",
  asc: "m4 10 4-4 4 4",
  desc: "m4 6 4 4 4-4",
} as const;
const ARIA_SORT = { none: "none", asc: "ascending", desc: "descending" } as const;
const glyph = (cls: string, d: string) =>
  `<svg class="${cls}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}" /></svg>`;

type ElementsColumn = { label: string; key: "name" | "env" | "status" | "duration"; end?: boolean; sort?: "none" | "asc" | "desc" };
const cellText = (row: Row, key: ElementsColumn["key"]) => (key === "duration" ? `${row.duration}ms` : row[key]);

const headerCell = (col: ElementsColumn) => {
  const align = col.end ? "end" : "start";
  if (!col.sort) return `<th class="primitiv-table__header primitiv-table__header--${align}" scope="col">${col.label}</th>`;
  const mods = col.end ? " primitiv-data-table__sort--end" : "";
  // All three glyphs, each marked with its direction: the header's aria-sort
  // shows the matching one, so sorting means writing that one attribute.
  const glyphs = (["none", "asc", "desc"] as const)
    .map((direction) =>
      glyph("primitiv-data-table__sort-icon", SORT_PATHS[direction]).replace(
        "<svg ",
        `<svg data-sort-direction="${ARIA_SORT[direction]}" `,
      ),
    )
    .join("");
  return (
    `<th class="primitiv-table__header primitiv-table__header--${align}" scope="col" aria-sort="${ARIA_SORT[col.sort]}">` +
    `<button type="button" class="primitiv-data-table__sort${mods}">${col.label}${glyphs}</button></th>`
  );
};

const checkbox = (label: string, checked: boolean) =>
  `<label class="primitiv-checkbox primitiv-checkbox--md"><input type="checkbox" aria-label="${label}"${checked ? " checked" : ""}><span class="primitiv-checkbox__control"><span class="primitiv-checkbox__indicator"></span></span></label>`;

type ElementsTable = {
  size?: Size;
  frame?: "framed" | "bare";
  sticky?: boolean;
  columns: ElementsColumn[];
  rows: readonly Row[];
  /** A checkbox column: the ids checked. */
  select?: { checked: readonly string[]; allLabel: string };
  /** An expand column: the ids expanded. */
  expand?: { expanded: readonly string[] };
  toolbar?: string;
  footer?: string;
  scrollStyle?: string;
  /** Replaces the table, keeping the shell. */
  empty?: string;
};

const indent = (lines: string[], by: string) => lines.map((line) => by + line);

function elementsTable(t: ElementsTable): string {
  const size = t.size ?? "sm";
  const root = ["primitiv-data-table", `primitiv-data-table--${size}`, t.frame === "bare" ? "primitiv-data-table--bare" : "", t.sticky ? "primitiv-data-table--sticky" : ""]
    .filter(Boolean)
    .join(" ");
  const controls = (t.select ? 1 : 0) + (t.expand ? 1 : 0);
  const head = [
    ...(t.select ? [`<th class="primitiv-table__header primitiv-table__header--start primitiv-data-table__control-cell" scope="col">${checkbox(t.select.allLabel, t.select.checked.length === t.rows.length)}</th>`] : []),
    ...(t.expand ? [`<th class="primitiv-table__header primitiv-table__header--start primitiv-data-table__control-cell" scope="col" aria-label="Details"></th>`] : []),
    ...t.columns.map(headerCell),
  ];
  const body = t.rows.flatMap((row) => {
    const selected = t.select?.checked.includes(row.id);
    const open = t.expand?.expanded.includes(row.id);
    const cells = [
      ...(t.select ? [`<td class="primitiv-table__cell primitiv-table__cell--start primitiv-data-table__control-cell">${checkbox(`Select ${row.name}`, !!selected)}</td>`] : []),
      ...(t.expand
        ? [
            `<td class="primitiv-table__cell primitiv-table__cell--start primitiv-data-table__control-cell"><primitiv-table-expand-trigger${open ? " expanded" : ""} force-mount>` +
              `<button type="button" class="primitiv-button primitiv-button--ghost primitiv-button--xs primitiv-data-table__expand" aria-controls="${row.id}-details" aria-label="Show details for ${row.name}">` +
              `${glyph("primitiv-data-table__expand-icon", "m6 4 4 4-4 4")}</button></primitiv-table-expand-trigger></td>`,
          ]
        : []),
      ...t.columns.map((col) => `<td class="primitiv-table__cell primitiv-table__cell--${col.end ? "end" : "start"}">${cellText(row, col.key)}</td>`),
    ];
    const tr = [`<tr class="primitiv-table__row"${t.select ? ` aria-selected="${!!selected}"` : ""}>`, ...indent(cells, "  "), `</tr>`];
    if (!t.expand) return tr;
    return [
      ...tr,
      `<tr id="${row.id}-details" class="primitiv-data-table__detail-row"${open ? "" : ` aria-hidden="true"`}>`,
      `  <td></td>`,
      `  <td colspan="${t.columns.length + controls - 1}"><div class="primitiv-data-table__detail-clip"><div class="primitiv-data-table__detail-body"><div class="primitiv-data-table__detail-content">` +
        `<strong>${row.name}</strong> · ${row.env} · finished in ${row.duration}ms.</div></div></div></td>`,
      `</tr>`,
    ];
  });
  const table = t.empty
    ? [t.empty]
    : [
        `<div class="primitiv-table__scroll-area" tabindex="0" role="region" aria-label="Deployments"${t.scrollStyle ? ` style="${t.scrollStyle}"` : ""}>`,
        `  <table class="primitiv-table primitiv-table--${size}">`,
        `    <thead class="primitiv-table__head">`,
        `      <tr class="primitiv-table__row">`,
        ...indent(head, "        "),
        `      </tr>`,
        `    </thead>`,
        `    <tbody class="primitiv-table__body">`,
        ...indent(body, "      "),
        `    </tbody>`,
        `  </table>`,
        `</div>`,
      ];
  return [
    `<div class="${root}">`,
    ...(t.toolbar ? [`  <div class="primitiv-data-table__toolbar">`, `    ${t.toolbar}`, `  </div>`] : []),
    ...indent(table, "  "),
    ...(t.footer ? [`  <div class="primitiv-data-table__footer">`, ...indent(t.footer.split("\n"), "    "), `  </div>`] : []),
    `</div>`,
  ].join("\n");
}

const region = (align: "start" | "end", content: string) =>
  `<div class="primitiv-data-table__region primitiv-data-table__region--${align}">${content}</div>`;

const FILTER = (value = "") =>
  region("start", `<input type="text" class="primitiv-input primitiv-input--md" placeholder="Filter deployments..." aria-label="Filter deployments"${value ? ` value="${value}"` : ""}>`);

const PAGE_PREV = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m16.06 5-7 7 7 7L15 20.06 6.94 12 15 3.94 16.06 5Z" /></svg>`;
const PAGE_NEXT = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.06 12 9 20.06 7.94 19l7-7-7-7L9 3.94 17.06 12Z" /></svg>`;
const pagination = (pages: number, current: number) =>
  [
    `<nav aria-label="Deployment pages" class="primitiv-pagination primitiv-pagination--numbered primitiv-pagination--sm">`,
    `  <ul class="primitiv-pagination__controls">`,
    `    <li class="primitiv-pagination__cell"><button type="button" class="primitiv-button primitiv-button--ghost primitiv-button--sm primitiv-pagination__nav" aria-label="Go to previous page"${current === 1 ? " disabled" : ""}>${PAGE_PREV}</button></li>`,
    ...Array.from({ length: pages }, (_, i) =>
      i + 1 === current
        ? `    <li class="primitiv-pagination__cell"><button type="button" class="primitiv-button primitiv-button--primary primitiv-button--sm primitiv-pagination__item" aria-current="page"><span class="primitiv-button__label">${i + 1}</span></button></li>`
        : `    <li class="primitiv-pagination__cell"><button type="button" class="primitiv-button primitiv-button--secondary primitiv-button--sm primitiv-pagination__item"><span class="primitiv-button__label">${i + 1}</span></button></li>`,
    ),
    `    <li class="primitiv-pagination__cell"><button type="button" class="primitiv-button primitiv-button--ghost primitiv-button--sm primitiv-pagination__nav" aria-label="Go to next page"${current === pages ? " disabled" : ""}>${PAGE_NEXT}</button></li>`,
    `  </ul>`,
    `</nav>`,
  ].join("\n");

const SUMMARY = (text: string) => region("start", `<span>${text}</span>`);

const BASIC_COLUMNS: ElementsColumn[] = [
  { label: "Deployment", key: "name" },
  { label: "Status", key: "status" },
  { label: "Duration", key: "duration", end: true },
];

const ELEMENTS = {
  complete: () =>
    elementsTable({
      toolbar: FILTER(),
      columns: [
        { label: "Deployment", key: "name", sort: "none" },
        { label: "Environment", key: "env" },
        { label: "Status", key: "status" },
        { label: "Duration", key: "duration", end: true, sort: "none" },
      ],
      rows: ROWS.slice(0, 4),
      select: { checked: [], allLabel: "Select all rows on this page" },
      footer: [SUMMARY("0 selected"), region("end", pagination(2, 1))].join("\n"),
    }),
  selection: () =>
    elementsTable({
      columns: [
        { label: "Deployment", key: "name" },
        { label: "Environment", key: "env" },
        { label: "Duration", key: "duration", end: true },
      ],
      rows: ROWS.slice(0, 5),
      select: { checked: ["docs"], allLabel: "Select all rows" },
      footer: SUMMARY(`<output data-selected-count>1 of 5 selected</output>`),
    }),
  pagination: () =>
    elementsTable({
      columns: BASIC_COLUMNS,
      rows: ROWS.slice(0, 3),
      footer: [SUMMARY(`Showing 1–3 of ${ROWS.length}`), region("end", pagination(3, 1))].join("\n"),
    }),
  expandable: () =>
    elementsTable({ columns: BASIC_COLUMNS, rows: ROWS.slice(0, 4), expand: { expanded: ["registry"] } }),
  sticky: () =>
    elementsTable({ sticky: true, columns: BASIC_COLUMNS, rows: ROWS, scrollStyle: "max-block-size: 12rem" }),
  empty: () =>
    elementsTable({
      toolbar: FILTER("zzz"),
      columns: BASIC_COLUMNS,
      rows: [],
      empty: `<div role="status" class="primitiv-empty-state primitiv-empty-state--vertical primitiv-empty-state--sm"><p class="primitiv-empty-state__title">No deployments</p><p class="primitiv-empty-state__description">Nothing matches this filter — try a broader search.</p></div>`,
    }),
};

/* Row selection's script: the select-all box checks every row, a row's box
   keeps the header's mixed state honest, and aria-selected follows each row. */
const SELECTION_SCRIPT = [
  `<script>`,
  `  const table = document.querySelector(".primitiv-data-table");`,
  `  const all = table.querySelector("thead input");`,
  `  const rows = [...table.querySelectorAll("tbody input")];`,
  `  const sync = () => {`,
  `    const count = rows.filter((box) => box.checked).length;`,
  `    all.checked = count === rows.length;`,
  `    all.indeterminate = count > 0 && count < rows.length;`,
  `    for (const box of rows) box.closest("tr").setAttribute("aria-selected", String(box.checked));`,
  `    table.querySelector("[data-selected-count]").textContent = \`\${count} of \${rows.length} selected\`;`,
  `  };`,
  `  all.addEventListener("change", () => { for (const box of rows) box.checked = all.checked; sync(); });`,
  `  for (const box of rows) box.addEventListener("change", sync);`,
  `  sync();`,
  `</script>`,
].join("\n");

/** The same behaviour for the live preview, scoped to the preview root. */
const wireSelection = (root: HTMLElement) => {
  const all = root.querySelector<HTMLInputElement>("thead input");
  const rows = [...root.querySelectorAll<HTMLInputElement>("tbody input")];
  const count = root.querySelector("[data-selected-count]");
  if (!all || !count) return;
  const sync = () => {
    const checked = rows.filter((box) => box.checked).length;
    all.checked = checked === rows.length;
    all.indeterminate = checked > 0 && checked < rows.length;
    for (const box of rows) box.closest("tr")?.setAttribute("aria-selected", String(box.checked));
    count.textContent = `${checked} of ${rows.length} selected`;
  };
  const onAll = () => {
    for (const box of rows) box.checked = all.checked;
    sync();
  };
  all.addEventListener("change", onAll);
  for (const box of rows) box.addEventListener("change", sync);
  sync();
  return () => {
    all.removeEventListener("change", onAll);
    for (const box of rows) box.removeEventListener("change", sync);
  };
};

/**
 * DataTable's page content — the library's most composed component.
 *
 * A framed shell (toolbar + table + footer) plus the anatomy that sorting,
 * selection and expandable rows need. **It owns anatomy, never state** — there
 * is no `columns` / `data` prop; sorting, selection, expansion, filtering and
 * pagination all arrive as props and leave as callbacks, so an engine
 * (TanStack, or plain `useState` as here) drives it. The table itself is the
 * `table` component's job; this shell never restyles it. It composes `table`,
 * `checkbox`, `input`, `pagination` and `empty-state`.
 *
 * Registry-only (no headless primitive of its own), so its snippets are the
 * copied file whichever way you read them. The expandable-rows example reaches
 * for the headless `Table.Expandable` seam directly.
 */
export const dataTableSpec: ComponentSpec = {
  playground: {
    component: "DataTable",
    /* `sticky` only does something with a scrolling body, so it is shown in its
       own example rather than as a dead toggle over a short table. */
    excludeControls: ["sticky"],
    fill: true,
    snippet: (values, mode) =>
      mode === "elements"
        ? elementsTable({ size: values.size as Size, frame: values.frame as "framed" | "bare", columns: BASIC_COLUMNS, rows: ROWS.slice(0, 3) })
        : [
        imports(),
        ``,
        `<${partNamer(mode, "DataTable")("Root")} size="${values.size}" frame="${values.frame}">`,
        `  <DataTableToolbar>{/* filter, field menu */}</DataTableToolbar>`,
        `  <TableScrollArea>`,
        `    <Table>{/* Table.Head / Table.Body — the table component */}</Table>`,
        `  </TableScrollArea>`,
        `  <DataTableFooter>{/* selection summary, Pagination */}</DataTableFooter>`,
        `</${partNamer(mode, "DataTable")("Root")}>`,
      ].join("\n"),
    render: (values) => (
      <div style={{ inlineSize: "100%" }}>
        <DataTable size={values.size as Size} frame={values.frame as "framed" | "bare"}>
          <TableScrollArea>
            <Table size={values.size as Size}>
              <TableHead>
                <TableRow>
                  <TableHeader>Deployment</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader align="end">Duration</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.slice(0, 3).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell align="end">{r.duration}ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScrollArea>
        </DataTable>
      </div>
    ),
  },

  anatomyMeta:
    "The shell is `DataTable` wrapping three things: a `DataTableToolbar` (with `DataTableRegion`s that align content start/center/end), the `Table` itself (the `table` component — never restyled here) inside a `TableScrollArea`, and a `DataTableFooter`. The interactive anatomy lives in cells: `DataTableControlCell` holds a checkbox or the expand trigger; `DataTableSortHeader` is a sortable `<th>` (it wires `aria-sort` and composes a `DataTableSortButton`); `DataTableExpandTrigger` + `DataTableDetailRow` (inside a headless `Table.Expandable`) make a disclosure row. There is deliberately no data model — you bring your own rows.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<div class="primitiv-data-table">`,
            `  <div class="primitiv-data-table__toolbar">`,
            `    <div class="primitiv-data-table__region primitiv-data-table__region--start">...</div>`,
            `  </div>`,
            `  <div class="primitiv-table__scroll-area">`,
            `    <table class="primitiv-table">`,
            `      <thead class="primitiv-table__head">`,
            `        <tr class="primitiv-table__row">`,
            `          <th class="primitiv-table__header primitiv-data-table__control-cell" scope="col"><!-- checkbox --></th>`,
            `          <th class="primitiv-table__header" scope="col" aria-sort="none"><button type="button" class="primitiv-data-table__sort">...</button></th>`,
            `        </tr>`,
            `      </thead>`,
            `      <tbody class="primitiv-table__body">`,
            `        <tr class="primitiv-table__row">`,
            `          <td class="primitiv-table__cell primitiv-data-table__control-cell">`,
            `            <primitiv-table-expand-trigger><button type="button" class="primitiv-data-table__expand" aria-controls="row-details">...</button></primitiv-table-expand-trigger>`,
            `          </td>`,
            `        </tr>`,
            `        <tr id="row-details" class="primitiv-data-table__detail-row" hidden>...</tr>`,
            `      </tbody>`,
            `    </table>`,
            `  </div>`,
            `  <div class="primitiv-data-table__footer">`,
            `    <div class="primitiv-data-table__region primitiv-data-table__region--end"><!-- pagination --></div>`,
            `  </div>`,
            `</div>`,
          ].join("\n");
        const d = partNamer(mode, "DataTable");
        return [
          `<${d("Root")}>`,
          `  <DataTableToolbar>`,
          `    <DataTableRegion align="start">...</DataTableRegion>`,
          `  </DataTableToolbar>`,
          `  <TableScrollArea>`,
          `    <Table>`,
          `      <TableHead>`,
          `        <TableRow>`,
          `          <DataTableControlCell header />`,
          `          <DataTableSortHeader direction="none" onSort={...}>...</DataTableSortHeader>`,
          `        </TableRow>`,
          `      </TableHead>`,
          `      <TableBody>{/* rows */}</TableBody>`,
          `    </Table>`,
          `  </TableScrollArea>`,
          `  <DataTableFooter>`,
          `    <DataTableRegion align="end">{/* Pagination */}</DataTableRegion>`,
          `  </DataTableFooter>`,
          `</${d("Root")}>`,
        ].join("\n");
      },
    },
  ],

  examples: [
    {
      id: "complete",
      title: "A complete data table",
      render: () => (
        <InteractiveExample
          caption="Everything at once, driven by plain `useState` — filter the toolbar, sort the **Deployment** and **Duration** columns (click to cycle ascending → descending → off), select rows with the checkboxes, and page through with the footer. The shell owns none of that state: it renders the toolbar/table/footer anatomy and forwards every interaction to your handlers, so you could swap the `useState` here for TanStack Table without touching the markup."
          elementsCaption={"Every part at once, as markup. Only the expand trigger in the Expandable rows example is an element: filtering, sorting, selection and paging are **your script's** (or your server's) to do, so this is the table in one state. Sorting is a `<button>` in the `<th>` — on its click, reorder the rows and move `aria-sort` (`ascending` / `descending` / `none`) and the `primitiv-data-table__sort--unsorted` class to match. Selection is native checkboxes, and paging is the `pagination` component's buttons or links."}
          code={(_density, mode) => mode === "elements" ? ELEMENTS.complete() :
            [
              `import { useState } from "react";`,
              imports(),
              `import { Checkbox } from "@/components/ui/checkbox";`,
              `import { Input } from "@/components/ui/input";`,
              `import { Pagination, /* ... */ } from "@/components/ui/pagination";`,
              ``,
              `// filter / sort / selection / page all live in your state.`,
              `<DataTable size="sm">`,
              `  <DataTableToolbar>`,
              `    <DataTableRegion align="start">`,
              `      <Input value={filter} onChange={...} placeholder="Filter deployments..." />`,
              `    </DataTableRegion>`,
              `  </DataTableToolbar>`,
              ``,
              `  <TableScrollArea>`,
              `    <Table size="sm">`,
              `      <TableHead>`,
              `        <TableRow>`,
              `          <DataTableControlCell header>`,
              `            <Checkbox checked={headerChecked} onCheckedChange={toggleAll} aria-label="Select all rows" />`,
              `          </DataTableControlCell>`,
              `          <DataTableSortHeader direction={dir("name")} onSort={() => toggleSort("name")}>`,
              `            Deployment`,
              `          </DataTableSortHeader>`,
              `          <DataTableSortHeader align="end" direction={dir("duration")} onSort={() => toggleSort("duration")}>`,
              `            Duration`,
              `          </DataTableSortHeader>`,
              `        </TableRow>`,
              `      </TableHead>`,
              `      <TableBody>`,
              `        {rows.map((row) => (`,
              `          <TableRow key={row.id} aria-selected={selected.has(row.id)}>`,
              `            <DataTableControlCell>`,
              `              <Checkbox checked={selected.has(row.id)} onCheckedChange={...} aria-label={\`Select \${row.name}\`} />`,
              `            </DataTableControlCell>`,
              `            <TableCell>{row.name}</TableCell>`,
              `            <TableCell align="end">{row.duration}ms</TableCell>`,
              `          </TableRow>`,
              `        ))}`,
              `      </TableBody>`,
              `    </Table>`,
              `  </TableScrollArea>`,
              ``,
              `  <DataTableFooter>`,
              `    <DataTableRegion align="start">{selected.size} selected</DataTableRegion>`,
              `    <DataTableRegion align="end">{/* <Pagination> */}</DataTableRegion>`,
              `  </DataTableFooter>`,
              `</DataTable>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <DeploymentsTable />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "selection",
      title: "Row selection",
      render: () => (
        <InteractiveExample
          caption="Selection on its own. A `DataTableControlCell header` holds a select-all `Checkbox` — `checked` is `true` / `false` / `&quot;indeterminate&quot;` from your state — and each row a `DataTableControlCell` with its own. Put `aria-selected` on the `TableRow` to get the selected-row highlight; it is a **styling hook only**, so the checkbox's checked state stays the real source of truth for assistive technology. Name every row checkbox for its row (`Select docs-site`), or a column of identical “Select” labels is unusable in a screen reader."
          elementsCaption={"Selection on its own: a native checkbox in each `primitiv-data-table__control-cell`, and a select-all box in the header. The script below keeps them in step — the header box goes `indeterminate` while only some rows are checked — and puts `aria-selected` on each `<tr>` for the selected-row highlight. `aria-selected` is a **styling hook only**: the checkbox is what assistive technology reads. Name every row's checkbox for its row (`Select docs-site`)."}
          elementsPreview={(_density, code) => code.slice(0, code.indexOf("\n\n<script"))}
          wire={wireSelection}
          code={(_density, mode) => mode === "elements" ? [ELEMENTS.selection(), ``, SELECTION_SCRIPT].join("\n") :
            [
              imports(),
              `import { Checkbox } from "@/components/ui/checkbox";`,
              ``,
              `<TableHead>`,
              `  <TableRow>`,
              `    <DataTableControlCell header>`,
              `      <Checkbox checked={allChecked} onCheckedChange={toggleAll} aria-label="Select all rows" />`,
              `    </DataTableControlCell>`,
              `    <TableHeader>Deployment</TableHeader>`,
              `  </TableRow>`,
              `</TableHead>`,
              `<TableBody>`,
              `  {rows.map((row) => (`,
              `    <TableRow key={row.id} aria-selected={selected.has(row.id)}>`,
              `      <DataTableControlCell>`,
              `        <Checkbox`,
              `          checked={selected.has(row.id)}`,
              `          onCheckedChange={(c) => toggleRow(row.id, c)}`,
              `          aria-label={\`Select \${row.name}\`}`,
              `        />`,
              `      </DataTableControlCell>`,
              `      <TableCell>{row.name}</TableCell>`,
              `    </TableRow>`,
              `  ))}`,
              `</TableBody>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <SelectableTable />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "pagination",
      title: "Pagination",
      render: () => (
        <InteractiveExample
          caption="Paging lives in the `DataTableFooter` — a `DataTableRegion` for a “showing X–Y of N” summary, and another holding the `Pagination` component. The shell owns **no** page state: you slice your own rows and drive `Pagination` from your `page` value. One accessibility must: set `aria-rowcount` on the `Table` to the **full** row count, or assistive technology announces the current page's rows as the whole table."
          elementsCaption={"Paging lives in the footer: a `primitiv-data-table__region` for a “showing X–Y of N” summary, and another holding the `pagination` component — buttons your script handles, or links to `?page=2` your server renders. The shell owns no page state. Set `aria-rowcount` on the `<table>` to the **full** row count, or assistive technology announces this page's rows as the whole table."}
          code={(_density, mode) => mode === "elements" ? ELEMENTS.pagination() :
            [
              imports(),
              `import { Pagination, PaginationList, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";`,
              ``,
              `<DataTable>`,
              `  <TableScrollArea>`,
              `    <Table aria-rowcount={total}>{/* just this page's rows */}</Table>`,
              `  </TableScrollArea>`,
              `  <DataTableFooter>`,
              `    <DataTableRegion align="start">Showing {start}–{end} of {total}</DataTableRegion>`,
              `    <DataTableRegion align="end">`,
              `      <Pagination label="Pages" size="sm">`,
              `        <PaginationList>`,
              `          <PaginationItem>`,
              `            <PaginationPrevious disabled={page === 0} onClick={() => setPage(page - 1)} />`,
              `          </PaginationItem>`,
              `          {pages.map((i) => (`,
              `            <PaginationItem key={i}>`,
              `              <PaginationLink isActive={i === page} onClick={() => setPage(i)}>{i + 1}</PaginationLink>`,
              `            </PaginationItem>`,
              `          ))}`,
              `          <PaginationItem>`,
              `            <PaginationNext disabled={page === last} onClick={() => setPage(page + 1)} />`,
              `          </PaginationItem>`,
              `        </PaginationList>`,
              `      </Pagination>`,
              `    </DataTableRegion>`,
              `  </DataTableFooter>`,
              `</DataTable>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <PaginatedTable />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "expandable",
      title: "Expandable rows",
      render: () => (
        <InteractiveExample
          caption="A disclosure row: a `DataTableExpandTrigger` in a control cell reveals a `DataTableDetailRow` beneath. The expanded state is yours — the pairing is a headless `Table.Expandable` (the one seam this shell reaches into `@primitiv-ui/react` for), which wires the trigger's `aria-expanded` / `aria-controls` to the detail row. The panel's `gutter={1}` clears the one control column so it aligns under the first *data* column, not the table's edge; `forceMount` lets it animate open."
          elementsCaption={"A disclosure row: `<primitiv-table-expand-trigger>` wraps the `<button>` in a control cell, and the button names its detail row with `aria-controls`. The element sits **in a cell** because the HTML parser moves anything written between a table's rows out of the table. It writes `hidden` / `aria-hidden` and `data-state` on the detail row, and reflects `expanded` as the user toggles. `force-mount` keeps a closed row rendered (only `aria-hidden`) so it animates open; the empty first `<td>` lines the panel up under the first data column."}
          code={(_density, mode) => mode === "elements" ? ELEMENTS.expandable() :
            [
              `import { Table } from "@primitiv-ui/react";`,
              `import {`,
              `  DataTableControlCell, DataTableExpandTrigger, DataTableDetailRow,`,
              `} from "@/components/ui/data-table";`,
              ``,
              `<Table.Expandable expanded={open} onExpandedChange={setOpen}>`,
              `  <TableRow>`,
              `    <DataTableControlCell>`,
              `      <DataTableExpandTrigger aria-label={\`Show details for \${row.name}\`} />`,
              `    </DataTableControlCell>`,
              `    <TableCell>{row.name}</TableCell>`,
              `  </TableRow>`,
              `  <DataTableDetailRow colSpan={4} gutter={1} forceMount>`,
              `    <DeploymentDetail row={row} />`,
              `  </DataTableDetailRow>`,
              `</Table.Expandable>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <ExpandableTable />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sticky",
      title: "Sticky header",
      render: () => (
        <InteractiveExample
          caption="`sticky` pins the header while the body scrolls — give the `TableScrollArea` a `max-block-size` so there is something to scroll within. It also reserves the scrollbar gutter so columns don't shift as rows filter in and out, which is why you should pass it **only when the body actually scrolls** (`sticky={rows.length > 0}`) — pinning a header over a body that doesn't scroll just leaves an empty strip down the edge."
          elementsCaption={"`primitiv-data-table--sticky` pins the header while the body scrolls — give the scroll area a `max-block-size` so there is something to scroll within. It also reserves the scrollbar gutter, so add the class **only when the body actually scrolls**: a pinned header over a short body leaves an empty strip down the edge."}
          code={(_density, mode) => mode === "elements" ? ELEMENTS.sticky() :
            [
              imports(),
              ``,
              `<DataTable sticky>`,
              `  <TableScrollArea style={{ maxBlockSize: "16rem" }}>`,
              `    <Table>{/* a head + many rows */}</Table>`,
              `  </TableScrollArea>`,
              `</DataTable>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <DataTable size="sm" sticky>
                <TableScrollArea style={{ maxBlockSize: "12rem" }}>
                  <Table size="sm">
                    <TableHead>
                      <TableRow>
                        <TableHeader>Deployment</TableHeader>
                        <TableHeader>Environment</TableHeader>
                        <TableHeader>Status</TableHeader>
                        <TableHeader align="end">Duration</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ROWS.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.env}</TableCell>
                          <TableCell>{r.status}</TableCell>
                          <TableCell align="end">{r.duration}ms</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableScrollArea>
              </DataTable>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "empty",
      title: "Empty state",
      render: () => (
        <InteractiveExample
          caption="When there are no rows — nothing yet, or a filter that matched nothing — swap the table for an `EmptyState` inside the shell, so the toolbar and frame stay put and only the body changes. The shell composes `empty-state`; keep the toolbar mounted so the control that clears the filter is still reachable."
          elementsCaption={"When there are no rows — nothing yet, or a filter that matched nothing — put an `empty-state` inside the shell in place of the scroll area, so the toolbar and frame stay put. Keep the toolbar so the control that clears the filter is still reachable."}
          code={(_density, mode) => mode === "elements" ? ELEMENTS.empty() :
            [
              imports(),
              `import { EmptyState, EmptyStateTitle, EmptyStateDescription } from "@/components/ui/empty-state";`,
              ``,
              `<DataTable>`,
              `  <DataTableToolbar>{/* filter stays reachable */}</DataTableToolbar>`,
              `  {rows.length === 0 ? (`,
              `    <EmptyState>`,
              `      <EmptyStateTitle>No deployments</EmptyStateTitle>`,
              `      <EmptyStateDescription>Nothing matches this filter.</EmptyStateDescription>`,
              `    </EmptyState>`,
              `  ) : (`,
              `    <TableScrollArea>{/* ... */}</TableScrollArea>`,
              `  )}`,
              `</DataTable>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <DataTable size="sm">
                <DataTableToolbar>
                  <DataTableRegion align="start">
                    <Input placeholder="Filter deployments..." aria-label="Filter deployments" defaultValue="nothing-matches" />
                  </DataTableRegion>
                </DataTableToolbar>
                <EmptyState size="sm">
                  <EmptyStateTitle>No deployments</EmptyStateTitle>
                  <EmptyStateDescription>Nothing matches this filter — try a broader search.</EmptyStateDescription>
                </EmptyState>
              </DataTable>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A framed data-table shell — a toolbar, a table and a footer that read as one object, plus the anatomy sorting, selection and expandable rows need. It is plain markup in the registry's classes, with one custom element: `<primitiv-table-expand-trigger>`, which shows and hides a row's detail row. Sorting, selection, filtering and paging are your page's or your server's — the shell lays them out and owns none of their state.",
    anatomyMeta:
      "The shell is a `primitiv-data-table` `<div>` around three things: a `primitiv-data-table__toolbar` (with `__region`s that align content start / center / end), the `table` component's markup inside its scroll area, and a `primitiv-data-table__footer`. The interactive anatomy lives in cells: a `primitiv-data-table__control-cell` holds a checkbox or the expand trigger; a sortable `<th>` holds a `primitiv-data-table__sort` button and carries `aria-sort`; `<primitiv-table-expand-trigger>` wraps a row's expand button, which names its `primitiv-data-table__detail-row` with `aria-controls`.",
    accessibility: [
      "**Every checkbox names its row.** A row's checkbox needs an `aria-label` that identifies *that* row (`Select harmoni-engine`), and the header's is `Select all rows` — a column of identically-named checkboxes is unusable in a screen reader's element list.",
      "**`aria-selected` on the row is a styling hook only.** The checkbox's own checked state is what assistive technology reports reliably; keep `aria-selected` in step for the highlight, but don't rely on it to convey selection.",
      "**Sort state goes on the `<th>`, one column at a time.** Move `aria-sort` (`ascending` / `descending` / `none`) as your script sorts — only one column should carry a value other than `none`.",
      "**The expander's state lives on the button, not the row.** `<primitiv-table-expand-trigger>` writes `aria-expanded` on the `<button>` and reads its `aria-controls` to find the detail row, which it keeps `hidden` (or `aria-hidden` under `force-mount`) while closed, so the announced row count stays truthful. Expanding into hierarchical child *rows* is a treegrid, a different pattern and out of scope.",
      "**Give the empty control-column headers a name.** The `<th>` over the expander column has no visible text, so give it an `aria-label` — an unlabelled column header reads as a gap.",
      "**Paginating? Add `aria-rowcount` to the `<table>`.** Otherwise assistive technology announces the current page's row count as the whole table's.",
    ],
  },

  accessibility: [
    "**Every checkbox names its row.** A row's checkbox needs a name that identifies *that* row (`Select harmoni-engine`), and the header's is `Select all rows` — a column of identically-named checkboxes is unusable in a screen reader's element list.",
    "**`aria-selected` on the row is a styling hook only.** The checkbox's own checked state is what assistive technology reports reliably; don't rely on `aria-selected` to convey selection to AT.",
    "**Sort state goes on the `<th>`, one column at a time.** `DataTableSortHeader` sets `aria-sort` (`ascending`/`descending`/`none`) for you — only one column should be sorted, and therefore only one `aria-sort` other than `none`, at a time.",
    "**The expander's state lives on the button, not the row.** A row's `aria-expanded` is only reliably announced inside a `role=\"treegrid\"`; `DataTableExpandTrigger` carries `aria-expanded` / `aria-controls` itself. This is a disclosure holding a detail *panel* — expanding into hierarchical child *rows* is a treegrid, a different pattern and out of scope.",
    "**Give the empty control-column headers a name.** The `<th>` over the checkbox and expander columns has no visible text, so give it a visually-hidden label — an unlabelled column header reads as a gap.",
    "**Paginating? Add `aria-rowcount` to the table.** Otherwise assistive technology announces the current page's row count as the whole table's. Pagination is your engine's job; the shell only lays the controls out.",
    "**No data model, by design.** There is no `columns`/`data` prop — you bring the rows as ordinary `Table` markup, and column visibility, grouping, `colSpan` and footer aggregates stay plain JSX rather than new props. Toolbar controls (a field menu, filters) are yours to compose from `dropdown` / `input`.",
  ],
};
