/*
 * Deployments — the Data Table demo, driven end-to-end by TanStack Table.
 *
 * The point of this file is that the registry `data-table` component owns no
 * state: sorting, selection, expansion, filtering, column visibility and
 * pagination all live in TanStack, and every part below just renders what it is
 * handed. Swap TanStack for a plain `useState` and the markup is unchanged.
 *
 * Pinned to TanStack Table v8 deliberately: v9 replaces `useReactTable` with a
 * feature-based `useTable`, and v8 is both the API almost every consumer has
 * today and the one `data-table`'s README documents. The parts model is
 * engine-agnostic, so a v9 migration changes this file's hooks and none of its
 * markup.
 */
import { Fragment, useId, useMemo, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
} from "@tanstack/react-table";

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Checkbox,
  DataTable,
  DescriptionList,
  DataTableControlCell,
  DataTableDetailRow,
  DataTableExpandTrigger,
  DataTableFooter,
  DataTableRegion,
  DataTableSortHeader,
  DataTableToolbar,
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
  Input,
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  PaginationSummary,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableScrollArea,
} from "../components";
import { Table as HeadlessTable, VisuallyHidden } from "@primitiv-ui/react";

type Environment = "production" | "staging" | "preview";
type Status = "succeeded" | "running" | "in review" | "failed";
type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Density = "dense" | "compact" | "comfortable" | "spacious";

type Deployment = {
  id: string;
  service: string;
  environment: Environment;
  status: Status;
  author: string;
  initials: string;
  durationSeconds: number;
  commits: number;
  deployedHoursAgo: number;
  commit: string;
  branch: string;
};

const SERVICES = [
  "harmoni-engine", "primitiv-registry", "docs-site", "figma-bridge", "primitiv-cli",
  "token-emitter", "palette-worker", "contract-schema", "icons-pipeline", "wasm-gateway",
  "kitchen-sink", "release-bot",
];
const AUTHORS: [string, string][] = [
  ["Ada Lovelace", "AL"], ["Grace Hopper", "GH"], ["Alan Turing", "AT"],
  ["Katherine Johnson", "KJ"], ["Barbara Liskov", "BL"], ["Radia Perlman", "RP"],
];
const ENVIRONMENTS: Environment[] = ["production", "staging", "preview"];
const STATUSES: Status[] = ["succeeded", "running", "in review", "failed"];

/* Deterministic, so the demo never reshuffles between renders (and so a
   screenshot is reproducible). A small LCG beats Math.random here. */
function buildDeployments(count: number): Deployment[] {
  let seed = 20260812;
  const next = (max: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    /* High bits, not low: an LCG's low-order bits have very short periods, and
       reading them directly made every commit SHA come out as 0000000. */
    return Math.floor(seed / 65536) % max;
  };
  const hex = () => next(16);
  return Array.from({ length: count }, (_, index) => {
    const [author, initials] = AUTHORS[next(AUTHORS.length)];
    const status = STATUSES[next(STATUSES.length)];
    return {
      id: `dep-${String(index + 1).padStart(3, "0")}`,
      service: SERVICES[next(SERVICES.length)],
      environment: ENVIRONMENTS[next(ENVIRONMENTS.length)],
      status,
      author,
      initials,
      durationSeconds: 14 + next(600),
      commits: 1 + next(180),
      deployedHoursAgo: 1 + next(320),
      commit: Array.from({ length: 7 }, () => "0123456789abcdef"[hex()]).join(""),
      branch: next(4) === 0 ? `feat/${SERVICES[next(SERVICES.length)]}` : "main",
    };
  });
}

const DEPLOYMENTS = buildDeployments(72);

const TONE_FOR: Record<Status, "success" | "warning" | "info" | "danger"> = {
  succeeded: "success",
  running: "info",
  "in review": "warning",
  failed: "danger",
};

const formatDuration = (seconds: number) =>
  seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;

const formatWhen = (hours: number) =>
  hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;

const columnHelper = createColumnHelper<Deployment>();

/* Column definitions carry the LABEL and the sort/filter behaviour. They do not
   carry the cell markup for the rich columns — those are rendered inline below,
   which is exactly the escape hatch a config-driven API would have had to grow. */
const COLUMNS = [
  columnHelper.accessor("service", { header: "Service", filterFn: "includesString" }),
  columnHelper.accessor("environment", { header: "Environment", filterFn: "arrIncludesSome" }),
  columnHelper.accessor("status", { header: "Status", filterFn: "arrIncludesSome" }),
  columnHelper.accessor("author", { header: "Author" }),
  columnHelper.accessor("durationSeconds", { header: "Duration" }),
  columnHelper.accessor("commits", { header: "Commits" }),
  columnHelper.accessor("deployedHoursAgo", { header: "Deployed" }),
];

const NUMERIC = new Set(["durationSeconds", "commits"]);
const PAGE_SIZES = [10, 25, 50];


/*
 * A Dropdown with its CSS anchor positioning wired up.
 *
 * The bare `dropdown` component deliberately leaves `anchor-name` /
 * `position-anchor` to the consumer, and with neither set every panel falls back
 * to the viewport corner. A static class pair (the `.ks-anchor-dd` convention)
 * cannot serve a menu-per-row, so the ident is derived from useId — the same fix
 * breadcrumb-overflow makes internally. useId's output is colon-bracketed and so
 * not a valid CSS <custom-ident>, hence the replace.
 */
function AnchoredMenu({
  label,
  size,
  variant = "secondary",
  ariaLabel,
  children,
}: {
  label: ReactNode;
  size: Size;
  variant?: "secondary" | "ghost";
  ariaLabel?: string;
  children: ReactNode;
}): ReactElement {
  const anchor = `--dt-menu-${useId().replace(/[^A-Za-z0-9_-]/g, "-")}`;
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          variant={variant}
          size={size}
          aria-label={ariaLabel}
          className="dt-anchor"
          style={{ "--dt-anchor": anchor } as CSSProperties}
        >
          {label}
        </Button>
      </DropdownTrigger>
      <DropdownContent
        size={size}
        className="dt-anchored"
        style={{ "--dt-anchor": anchor } as CSSProperties}
      >
        {children}
      </DropdownContent>
    </Dropdown>
  );
}

export function DeploymentsTable(): ReactElement {
  const [size, setSize] = useState<Size>("sm");
  const [density, setDensity] = useState<Density>("comfortable");
  const [sticky, setSticky] = useState(true);

  const [sorting, setSorting] = useState<SortingState>([{ id: "deployedHoursAgo", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const table = useReactTable({
    data: DEPLOYMENTS,
    columns: COLUMNS,
    state: { sorting, globalFilter, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const rows = table.getRowModel().rows;
  const visibleLeafCount = table.getVisibleLeafColumns().length;
  /* +2 for the two control columns (select, expand) the table renders outside
     TanStack's column model. */
  const detailColSpan = visibleLeafCount + 2;
  const selectedCount = Object.keys(rowSelection).filter((id) => rowSelection[id]).length;
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;

  const envFilter = (table.getColumn("environment")?.getFilterValue() as Environment[]) ?? [];
  const statusFilter = (table.getColumn("status")?.getFilterValue() as Status[]) ?? [];

  const toggleFacet = <T extends string>(columnId: string, current: T[], value: T) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    table.getColumn(columnId)?.setFilterValue(next.length ? next : undefined);
  };

  const pageWindow = useMemo(() => {
    const window: number[] = [];
    const span = 3;
    const first = Math.max(0, Math.min(pageIndex - 1, pageCount - span));
    for (let page = first; page < Math.min(pageCount, first + span); page += 1) window.push(page);
    return window;
  }, [pageIndex, pageCount]);

  return (
    <div
      data-density={density}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        /* Without these the table's min-content width widens the whole content
           column and slides it under the page nav. */
        minInlineSize: 0,
        maxInlineSize: "100%",
      }}
    >
      {/* Size / density / sticky switchers — proof the whole thing is
          token-driven rather than an assertion that it is. */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "end", flexWrap: "wrap" }}>
        <Select native size="sm" aria-label="Table size" value={size} onValueChange={(v) => setSize(v as Size)} style={{ inlineSize: "auto" }}>
          {(["xs", "sm", "md", "lg", "xl"] as Size[]).map((value) => (
            <option key={value} value={value}>{`size: ${value}`}</option>
          ))}
        </Select>
        <Select native size="sm" aria-label="Density" value={density} onValueChange={(v) => setDensity(v as Density)} style={{ inlineSize: "auto" }}>
          {(["dense", "compact", "comfortable", "spacious"] as Density[]).map((value) => (
            <option key={value} value={value}>{`density: ${value}`}</option>
          ))}
        </Select>
        <Checkbox size="sm" checked={sticky} onCheckedChange={setSticky}>
          Sticky header
        </Checkbox>
      </div>

      <DataTable
        size={size}
        sticky={sticky}
        style={{
          maxInlineSize: "100%",
          /* The panel aligns with the first DATA column. Only the consumer knows
             which control columns exist, so only the consumer can sum them: two
             square control cells + the first data cell's own inline padding.
             KNOWN LIMITATION: the control's own width is a literal here, so this
             is exact at the default size and drifts a few px at the extremes.
             The proper fix is for DetailRow to emit empty gutter <td>s matching
             the control columns and let table layout do the aligning — no
             arithmetic at all. Logged as follow-up. */
          ["--primitiv-data-table-detail-indent" as string]:
            "calc(2 * (2 * var(--primitiv-table-cell-padding-block) + 1rem) + var(--primitiv-table-cell-padding-inline))",
        }}
      >
        <DataTableToolbar>
          <DataTableRegion align="start">
            <Input
              size={size}
              type="search"
              placeholder="Filter deployments..."
              aria-label="Filter deployments"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
            />
          </DataTableRegion>

          <DataTableRegion align="end">
            {/* Faceted filters and the field menu are the CONSUMER's
                composition — data-table ships no toolbar controls, because
                shipping the field menu would mean owning the column list. */}
            <AnchoredMenu size={size} label={`Environment${envFilter.length ? ` (${envFilter.length})` : ""}`}>
              <DropdownLabel>Filter by environment</DropdownLabel>
              {ENVIRONMENTS.map((value) => (
                <DropdownCheckboxItem
                  key={value}
                  checked={envFilter.includes(value)}
                  onCheckedChange={() => toggleFacet("environment", envFilter, value)}
                >
                  {value}
                </DropdownCheckboxItem>
              ))}
            </AnchoredMenu>

            <AnchoredMenu size={size} label={`Status${statusFilter.length ? ` (${statusFilter.length})` : ""}`}>
              <DropdownLabel>Filter by status</DropdownLabel>
              {STATUSES.map((value) => (
                <DropdownCheckboxItem
                  key={value}
                  checked={statusFilter.includes(value)}
                  onCheckedChange={() => toggleFacet("status", statusFilter, value)}
                >
                  {value}
                </DropdownCheckboxItem>
              ))}
            </AnchoredMenu>

            <AnchoredMenu size={size} label="Fields">
              <DropdownLabel>Show fields</DropdownLabel>
              {table.getAllLeafColumns().map((column) => (
                <DropdownCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={() => column.toggleVisibility()}
                >
                  {String(column.columnDef.header)}
                </DropdownCheckboxItem>
              ))}
            </AnchoredMenu>
          </DataTableRegion>
        </DataTableToolbar>

        <TableScrollArea style={sticky ? { maxBlockSize: "26rem" } : undefined}>
          <Table size={size}>
            <TableHead>
              <TableRow>
                <DataTableControlCell header>
                  <Checkbox
                    size={size}
                    aria-label="Select all rows on this page"
                    checked={
                      table.getIsAllPageRowsSelected()
                        ? true
                        : table.getIsSomePageRowsSelected()
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
                  />
                </DataTableControlCell>
                <DataTableControlCell header>
                  <VisuallyHidden>Expand</VisuallyHidden>
                </DataTableControlCell>

                {table.getVisibleLeafColumns().map((column) => (
                  <DataTableSortHeader
                    key={column.id}
                    direction={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : "none"}
                    align={NUMERIC.has(column.id) ? "end" : "start"}
                    onSort={() => column.toggleSorting(undefined, false)}
                  >
                    {String(column.columnDef.header)}
                  </DataTableSortHeader>
                ))}

                <DataTableControlCell header>
                  <VisuallyHidden>Actions</VisuallyHidden>
                </DataTableControlCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={detailColSpan}>
                    <EmptyState size={size}>
                      <EmptyStateTitle>No deployments match</EmptyStateTitle>
                      <EmptyStateDescription>
                        Clear the filter or widen the environment and status facets.
                      </EmptyStateDescription>
                    </EmptyState>
                  </TableCell>
                </TableRow>
              )}

              {rows.map((row) => {
                const deployment = row.original;
                const isOpen = Boolean(expanded[row.id]);
                return (
                  <HeadlessTable.Expandable
                    key={row.id}
                    expanded={isOpen}
                    onExpandedChange={(next) =>
                      setExpanded((current) => ({ ...current, [row.id]: next }))
                    }
                  >
                    <TableRow aria-selected={row.getIsSelected()}>
                      <DataTableControlCell>
                        <Checkbox
                          size={size}
                          aria-label={`Select ${deployment.service}`}
                          checked={row.getIsSelected()}
                          onCheckedChange={(checked) => row.toggleSelected(checked)}
                        />
                      </DataTableControlCell>
                      <DataTableControlCell>
                        <DataTableExpandTrigger
                          aria-label={`Show details for ${deployment.service}`}
                        />
                      </DataTableControlCell>

                      {table.getVisibleLeafColumns().map((column) => {
                        const key = `${row.id}-${column.id}`;
                        if (column.id === "service") {
                          return (
                            <TableCell key={key} style={{ whiteSpace: "nowrap" }}>
                              {deployment.service}
                            </TableCell>
                          );
                        }
                        if (column.id === "status") {
                          return (
                            <TableCell key={key}>
                              <Badge size={size === "xs" ? "xs" : "sm"} tone={TONE_FOR[deployment.status]}>
                                {deployment.status}
                              </Badge>
                            </TableCell>
                          );
                        }
                        if (column.id === "author") {
                          return (
                            <TableCell key={key} style={{ whiteSpace: "nowrap" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                                <Avatar size="xs">
                                  <AvatarFallback>{deployment.initials}</AvatarFallback>
                                </Avatar>
                                {deployment.author}
                              </span>
                            </TableCell>
                          );
                        }
                        if (column.id === "durationSeconds") {
                          return (
                            <TableCell key={key} style={{ textAlign: "end", fontVariantNumeric: "tabular-nums" }}>
                              {formatDuration(deployment.durationSeconds)}
                            </TableCell>
                          );
                        }
                        if (column.id === "commits") {
                          return (
                            <TableCell key={key} style={{ textAlign: "end", fontVariantNumeric: "tabular-nums" }}>
                              {deployment.commits.toLocaleString()}
                            </TableCell>
                          );
                        }
                        if (column.id === "deployedHoursAgo") {
                          return <TableCell key={key}>{formatWhen(deployment.deployedHoursAgo)}</TableCell>;
                        }
                        return <TableCell key={key}>{deployment.environment}</TableCell>;
                      })}

                      <DataTableControlCell>
                        <AnchoredMenu
                          size={size === "xs" ? "xs" : "sm"}
                          variant="ghost"
                          label="⋯"
                          ariaLabel={`Actions for ${deployment.service}`}
                        >
                          <DropdownItem>View logs</DropdownItem>
                          <DropdownItem>Redeploy</DropdownItem>
                          <DropdownItem>Copy commit SHA</DropdownItem>
                          <DropdownSeparator />
                          <DropdownItem>Roll back</DropdownItem>
                        </AnchoredMenu>
                      </DataTableControlCell>
                    </TableRow>

                    {/* No forceMount: a collapsed row is then `hidden`, i.e.
                        display:none, so it cannot occupy height. The animated
                        variant (forceMount + the grid-collapse clip) is still
                        available on the component and wants a browser check. */}
                    <DataTableDetailRow colSpan={detailColSpan}>
                      <DescriptionList
                        size={size === "xs" ? "xs" : "sm"}
                        layout="inline"
                        style={{ margin: 0 }}
                      >
                        {[
                          ["Commit", <code key="c">{deployment.commit}</code>],
                          ["Branch", deployment.branch],
                          ["Environment", deployment.environment],
                          ["Triggered by", deployment.author],
                          ["Duration", formatDuration(deployment.durationSeconds)],
                          ["Commits in deploy", deployment.commits.toLocaleString()],
                        ].map(([label, value]) => (
                          /* dt/dd are native children by design: the prose family
                             styles bare elements, and description-list exports
                             only its <dl> root. */
                          <Fragment key={String(label)}>
                            <dt>{label}</dt>
                            <dd style={{ whiteSpace: "nowrap" }}>{value}</dd>
                          </Fragment>
                        ))}
                      </DescriptionList>
                    </DataTableDetailRow>
                  </HeadlessTable.Expandable>
                );
              })}
            </TableBody>
          </Table>
        </TableScrollArea>

        <DataTableFooter>
          <DataTableRegion align="start">
            <span style={{ color: "var(--primitiv-content-muted)", fontSize: "var(--primitiv-body-sm-font-size)" }}>
              {selectedCount} of {table.getFilteredRowModel().rows.length} rows selected
            </span>
          </DataTableRegion>

          <DataTableRegion align="end">
            <Select
              native
              size={size === "xs" ? "xs" : "sm"}
              aria-label="Rows per page"
              style={{ inlineSize: "auto" }}
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              {PAGE_SIZES.map((value) => (
                <option key={value} value={value}>{`${value} / page`}</option>
              ))}
            </Select>

            <Pagination label="Deployments pages" size={size === "xs" ? "xs" : "sm"}>
              <PaginationSummary>
                Page {pageIndex + 1} of {Math.max(pageCount, 1)}
              </PaginationSummary>
              <PaginationList>
                <PaginationItem>
                  <PaginationPrevious
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                  />
                </PaginationItem>
                {pageWindow.map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === pageIndex}
                      onClick={() => table.setPageIndex(page)}
                    >
                      {page + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                  />
                </PaginationItem>
              </PaginationList>
            </Pagination>
          </DataTableRegion>
        </DataTableFooter>
      </DataTable>
    </div>
  );
}
