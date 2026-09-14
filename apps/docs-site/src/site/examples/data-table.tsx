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
      [
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
        const d = partNamer(mode, "DataTable");
        return [
          `<${d("Root")}>`,
          `  <DataTableToolbar>`,
          `    <DataTableRegion align="start">…</DataTableRegion>`,
          `  </DataTableToolbar>`,
          `  <TableScrollArea>`,
          `    <Table>`,
          `      <TableHead>`,
          `        <TableRow>`,
          `          <DataTableControlCell header />`,
          `          <DataTableSortHeader direction="none" onSort={…}>…</DataTableSortHeader>`,
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
          code={() =>
            [
              `import { useState } from "react";`,
              imports(),
              `import { Checkbox } from "@/components/ui/checkbox";`,
              `import { Input } from "@/components/ui/input";`,
              `import { Pagination, /* … */ } from "@/components/ui/pagination";`,
              ``,
              `// filter / sort / selection / page all live in your state.`,
              `<DataTable size="sm">`,
              `  <DataTableToolbar>`,
              `    <DataTableRegion align="start">`,
              `      <Input value={filter} onChange={…} placeholder="Filter deployments..." />`,
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
              `              <Checkbox checked={selected.has(row.id)} onCheckedChange={…} aria-label={\`Select \${row.name}\`} />`,
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
          code={() =>
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
          code={() =>
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
          code={() =>
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
          code={() =>
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
          code={() =>
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
              `    <TableScrollArea>{/* … */}</TableScrollArea>`,
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
