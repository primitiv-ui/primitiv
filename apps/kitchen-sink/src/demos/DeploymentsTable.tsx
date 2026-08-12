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
import { useMemo, useState, type ReactElement, type ReactNode } from "react";
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
  AvatarGroup,
  AvatarImage,
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
  Divider,
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownItemIndicator,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
  Grid,
  InlineCode,
  Input,
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationMenuItem,
  PaginationNext,
  PaginationPrevious,
  PaginationStatus,
  PaginationSummary,
  Progress,
  ProgressIndicator,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableScrollArea,
  Tag,
} from "../components";
import {
  Table as HeadlessTable,
  VisuallyHidden,
  paginationRange,
  useMediaQuery,
} from "@primitiv-ui/react";
import { Check, ChevronDown } from "@primitiv-ui/icons";
import { useChrome } from "../chrome";

type Environment = "production" | "staging" | "preview";
type Status = "Succeeded" | "Running" | "In review" | "Failed";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

type Deployment = {
  id: string;
  service: string;
  environment: Environment;
  status: Status;
  author: string;
  initials: string;
  face: string;
  durationSeconds: number;
  commits: number;
  deployedHoursAgo: number;
  commit: string;
  branch: string;
  /* The expanded panel's content. A detail panel that only restates the row is
     a demo of nothing — these are the fields a real deployments table would
     open onto, and they are what the panel's grid is sized around. */
  message: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  reviewers: Author[];
  checksPassed: number;
  checksTotal: number;
};

const SERVICES = [
  "harmoni-engine",
  "primitiv-registry",
  "docs-site",
  "figma-bridge",
  "primitiv-cli",
  "token-emitter",
  "palette-worker",
  "contract-schema",
  "icons-pipeline",
  "wasm-gateway",
  "kitchen-sink",
  "release-bot",
];
type Author = { name: string; initials: string; face: string };

/*
 * Real photographs, matched to each name — the same five faces the Avatar Group
 * demo uses, served from public/ (BASE_URL-relative, not imported: they are demo
 * fixtures, not bundled assets).
 *
 * avatar-2 and avatar-3 are the two male faces, so Alan Turing takes one and the
 * five women share the three female faces — which means two faces appear twice.
 * That is the asset set, not an oversight; add two more female photographs and
 * the repeats go away. Every Avatar still carries initials as its
 * AvatarFallback, which is what renders if an image 404s.
 */
const face = (n: number) => `${import.meta.env.BASE_URL}avatar-${n}.png`;

const AUTHORS: Author[] = [
  { name: "Ada Lovelace", initials: "AL", face: face(1) },
  { name: "Grace Hopper", initials: "GH", face: face(4) },
  { name: "Alan Turing", initials: "AT", face: face(2) },
  { name: "Katherine Johnson", initials: "KJ", face: face(5) },
  { name: "Barbara Liskov", initials: "BL", face: face(1) },
  { name: "Radia Perlman", initials: "RP", face: face(4) },
];
/* Written as real commit subjects — imperative mood, no trailing full stop —
   because the panel renders them as the deployment's headline. */
const MESSAGES = [
  "Bind the focus ring to per-side stroke weights",
  "Collapse the detail row with a grid row track",
  "Emit var() references for every alias format",
  "Reserve the scrollbar gutter on sticky tables",
  "Derive the anchor ident from useId, not a class",
  "Alias dropdown row text to the body scale",
  "Split the reset out of the token layer",
  "Cap the sticky scrollport at whole rows",
  "Re-point the row hover to the alpha ramp",
  "Compose the expander from a ghost Icon Button",
];

const ENVIRONMENTS: Environment[] = ["production", "staging", "preview"];
const STATUSES: Status[] = ["Succeeded", "Running", "In review", "Failed"];

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
    const author = AUTHORS[next(AUTHORS.length)];
    const status = STATUSES[next(STATUSES.length)];
    /* Checks track the status, or the panel contradicts its own row: a failed
       deployment with every check green is the kind of detail that makes a demo
       look generated. */
    const checksTotal = 24 + next(120);
    const checksPassed =
      status === "Succeeded"
        ? checksTotal
        : status === "Failed"
          ? checksTotal - (1 + next(6))
          : checksTotal - next(12);
    return {
      id: `dep-${String(index + 1).padStart(3, "0")}`,
      service: SERVICES[next(SERVICES.length)],
      environment: ENVIRONMENTS[next(ENVIRONMENTS.length)],
      status,
      author: author.name,
      initials: author.initials,
      face: author.face,
      durationSeconds: 14 + next(600),
      commits: 1 + next(180),
      deployedHoursAgo: 1 + next(320),
      commit: Array.from({ length: 7 }, () => "0123456789abcdef"[hex()]).join(
        "",
      ),
      branch:
        next(4) === 0 ? `feat/${SERVICES[next(SERVICES.length)]}` : "main",
      message: MESSAGES[next(MESSAGES.length)],
      filesChanged: 1 + next(40),
      additions: 3 + next(400),
      deletions: next(180),
      /* Two to four reviewers, never the author — a self-approval would read as
         a bug in the demo data rather than as a deliberate example. */
      reviewers: (() => {
        const pool = AUTHORS.filter((a) => a.name !== author.name);
        const wanted = 2 + next(3);
        const picked: Author[] = [];
        while (picked.length < wanted && picked.length < pool.length) {
          const candidate = pool[next(pool.length)];
          if (!picked.some((a) => a.name === candidate.name))
            picked.push(candidate);
        }
        return picked;
      })(),
      checksPassed,
      checksTotal,
    };
  });
}

const DEPLOYMENTS = buildDeployments(72);

const TONE_FOR: Record<Status, "success" | "warning" | "info" | "danger"> = {
  Succeeded: "success",
  Running: "info",
  "In review": "warning",
  Failed: "danger",
};

const formatDuration = (seconds: number) =>
  seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;

const formatWhen = (hours: number) =>
  hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;

const columnHelper = createColumnHelper<Deployment>();

/* Column definitions carry the LABEL and the sort/filter behaviour. They do not
   carry the cell markup for the rich columns — those are rendered inline below,
   which is exactly the escape hatch a config-driven API would have had to grow. */
const COLUMNS = [
  columnHelper.accessor("service", {
    header: "Service",
    filterFn: "includesString",
  }),
  columnHelper.accessor("environment", {
    header: "Environment",
    filterFn: "arrIncludesSome",
  }),
  columnHelper.accessor("status", {
    header: "Status",
    filterFn: "arrIncludesSome",
  }),
  columnHelper.accessor("author", { header: "Author" }),
  columnHelper.accessor("durationSeconds", { header: "Duration" }),
  columnHelper.accessor("commits", { header: "Commits" }),
  columnHelper.accessor("deployedHoursAgo", { header: "Deployed" }),
];

const NUMERIC = new Set(["durationSeconds", "commits"]);
const PAGE_SIZES = [10, 25, 50];

/*
 * A Dropdown, with nothing to wire.
 *
 * `dropdown` derives its own `anchor-name` / `position-anchor` pair from
 * useId(), so a menu-per-row needs no per-instance plumbing here — this helper
 * exists only to avoid repeating the trigger's Button + chevron five times.
 */
function AnchoredMenu({
  label,
  size,
  variant = "secondary",
  placement,
  ariaLabel,
  /* A labelled menu button takes the chevron — the disclosure affordance every
     other Dropdown trigger in this app carries. An icon-only trigger does not:
     the row-action ellipsis IS its own affordance, and a second glyph beside it
     reads as two controls. */
  chevron = true,
  children,
}: {
  label: ReactNode;
  size: Size;
  variant?: "secondary" | "ghost";
  placement?: "bottom-start" | "bottom-end";
  ariaLabel?: string;
  chevron?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant={variant} size={size} aria-label={ariaLabel}>
          {label}
          {chevron && <ChevronDown aria-hidden="true" />}
        </Button>
      </DropdownTrigger>
      <DropdownContent size={size} placement={placement}>
        {children}
      </DropdownContent>
    </Dropdown>
  );
}

/*
 * The expanded panel.
 *
 * Composed entirely from registry components so every part of it answers to the
 * global size and density controls — which is the point of showing it here: a
 * detail panel is where a data table stops being a grid of text and starts
 * needing the rest of the system. Nothing is laid out by hand: Stack and Grid
 * own the arrangement, Divider the seam, and the type comes from the table it
 * sits inside (a <tbody> descendant inherits the table's size-scaled type), so
 * there is no font-size written anywhere below.
 *
 * Structure: a headline (who, what, when) over a three-column grid of the facts
 * the row itself has no room for. The grid drops to one column on a narrow
 * viewport via .ks-dt__panel-grid in demos.css.
 */
function DeploymentDetail({
  deployment,
  size,
}: {
  deployment: Deployment;
  size: Size;
}): ReactElement {
  const checkRatio = Math.round(
    (deployment.checksPassed / deployment.checksTotal) * 100,
  );
  const allPassed = deployment.checksPassed === deployment.checksTotal;

  return (
    <Stack direction="column" gap="md" className="ks-dt__panel">
      {/* The headline is prose, so it is a <p> with the subject in <strong> —
          not a heading. `heading/h6` is 20px against body-md's 16px: the heading
          scale is page-level and would out-shout the table it sits inside, and it
          does not answer to the `size` prop either. */}
      <Stack direction="row" gap="md" align="center" wrap="wrap">
        <Avatar size={size}>
          <AvatarImage src={deployment.face} alt="" />
          <AvatarFallback>{deployment.initials}</AvatarFallback>
        </Avatar>
        <Stack direction="column" gap="none">
          <p>
            <strong>{deployment.message}</strong>
          </p>
          <p className="ks-dt__panel-byline">
            {deployment.author} committed{" "}
            {formatWhen(deployment.deployedHoursAgo)} to{" "}
            <InlineCode size={size}>{deployment.branch}</InlineCode>
          </p>
        </Stack>
      </Stack>

      <Divider />

      {/* Responsive columns come from Grid itself — one column on a narrow
          viewport, three from `lg` up. A media query in demo CSS would have
          fought the component's own mechanism (`columns` takes a mobile-first
          map, not just a count). */}
      <Grid columns={{ base: 1, lg: 3 }} gap="xl">
        {/* Every label→value pair is a real <dl> through DescriptionList.Term /
            .Details. Bare <dt>/<dd> inside it look identical at md and are a
            trap: the base reset dresses a bare description list with declarations
            ON the element, which beat the component's inherited values, so
            neither part responds to `size` at all. The parts carry the classes
            that do. */}
        <DescriptionList size={size} layout="inline">
          <DescriptionList.Term>Commit</DescriptionList.Term>
          <DescriptionList.Details>
            <InlineCode size={size}>{deployment.commit}</InlineCode>
          </DescriptionList.Details>
          <DescriptionList.Term>Environment</DescriptionList.Term>
          <DescriptionList.Details>
            <Tag size={size} tone="neutral">
              {deployment.environment}
            </Tag>
          </DescriptionList.Details>
          <DescriptionList.Term>Duration</DescriptionList.Term>
          <DescriptionList.Details className="ks-dt__nowrap">
            {formatDuration(deployment.durationSeconds)}
          </DescriptionList.Details>
          <DescriptionList.Term>Commits</DescriptionList.Term>
          <DescriptionList.Details>
            {deployment.commits.toLocaleString()}
          </DescriptionList.Details>
        </DescriptionList>

        <DescriptionList size={size} layout="stacked">
          <DescriptionList.Term>Changes</DescriptionList.Term>
          <DescriptionList.Details>
            <Stack direction="row" gap="xs" align="center" wrap="wrap">
              <Badge size={size} tone="success">
                +{deployment.additions.toLocaleString()}
              </Badge>
              <Badge size={size} tone="danger">
                -{deployment.deletions.toLocaleString()}
              </Badge>
              <span>
                across {deployment.filesChanged} file
                {deployment.filesChanged === 1 ? "" : "s"}
              </span>
            </Stack>
          </DescriptionList.Details>
          <DescriptionList.Term>Checks</DescriptionList.Term>
          <DescriptionList.Details>
            <Stack direction="column" gap="xs">
              {/* ProgressIndicator is a required child, not optional: the root is
                  only the track, so a Progress without one renders an empty bar. */}
              <Progress
                size={size}
                intent={allPassed ? "primary" : "danger"}
                value={deployment.checksPassed}
                max={deployment.checksTotal}
                aria-label={`${deployment.checksPassed} of ${deployment.checksTotal} checks passed`}
              >
                <ProgressIndicator />
              </Progress>
              <span>
                {deployment.checksPassed} of {deployment.checksTotal} passed (
                {checkRatio}%)
              </span>
            </Stack>
          </DescriptionList.Details>
        </DescriptionList>

        <DescriptionList size={size} layout="stacked">
          <DescriptionList.Term>Reviewed by</DescriptionList.Term>
          <DescriptionList.Details>
            <Stack direction="column" gap="xs">
              {/* max one below the pool, so the +N counter is exercised whenever
                  a deployment drew four reviewers. */}
              <AvatarGroup size={size} max={3}>
                {deployment.reviewers.map((reviewer) => (
                  <Avatar key={reviewer.name} size={size}>
                    <AvatarImage src={reviewer.face} alt="" />
                    <AvatarFallback>{reviewer.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
              <span>{deployment.reviewers.map((r) => r.name).join(", ")}</span>
            </Stack>
          </DescriptionList.Details>
        </DescriptionList>
      </Grid>
    </Stack>
  );
}

export function DeploymentsTable(): ReactElement {
  /* Size and density come from the app header — the single source of truth for
     every component on the page, this table's pagination and buttons included.
     Density is applied ambiently on <html> by the chrome provider, so nothing
     here has to thread it. */
  const { size } = useChrome();
  const [sticky, setSticky] = useState(true);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "deployedHoursAgo", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const table = useReactTable({
    data: DEPLOYMENTS,
    columns: COLUMNS,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
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
  /* The control columns live outside TanStack's column model, so they are
     counted here: two before the data (select, expand) and one after it (row
     actions). Named rather than inlined because the LEADING count is also the
     detail row's `gutter` — the same number in both places, and a table that
     grows a third control column has one line to change instead of two that
     could disagree. */
  const leadingControlColumns = 2;
  const trailingControlColumns = 1;
  const detailColSpan =
    visibleLeafCount + leadingControlColumns + trailingControlColumns;
  /* Every field switched off in the Fields menu. A real state, not an edge case:
     the menu lets you uncheck the last one, and TanStack is perfectly happy to
     report zero visible columns. */
  const noColumns = visibleLeafCount === 0;
  const selectedCount = Object.keys(rowSelection).filter(
    (id) => rowSelection[id],
  ).length;
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;

  const envFilter =
    (table.getColumn("environment")?.getFilterValue() as Environment[]) ?? [];
  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as Status[]) ?? [];

  const toggleFacet = <T extends string>(
    columnId: string,
    current: T[],
    value: T,
  ) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    table.getColumn(columnId)?.setFilterValue(next.length ? next : undefined);
  };

  /* `paginationRange` — the same arithmetic `usePagination` uses, exported
     separately for exactly this case: TanStack owns the page state, so the hook
     itself would be a second owner of it. Its default `window: "paged"` is the
     point. A window CENTRED on the current page re-labels every cell on every
     step, so clicking "3" renumbers the row under your cursor and reads as a
     flash; a paged window holds a block of five steady and only advances when
     you step outside it, so clicking a number activates it and moves nothing.
     Pages 1-based here, TanStack's index 0-based — the one conversion. */
  const pageItems = useMemo(
    () => paginationRange(pageIndex + 1, Math.max(pageCount, 1)),
    [pageIndex, pageCount],
  );

  /* Which pager presentation fits. Deliberately a WIDER threshold than the
     40rem at which the bars stack, because the two answer different questions:
     the bars stack to stop regions overlapping, while the pager collapses long
     before that — measured, a numbered pager over 8 pages occupies ~650px, so
     with a rows-per-page Select and a row count beside it the footer needs ~900px
     before all three sit on one line. At 820px the numbered pager squeezed the
     row count into a 39px column three lines deep.
     `compact` is the shipped answer for a narrow container (a "Page 1 of 8"
     readout between the two arrows), and picking the threshold is the consumer's
     job — the component cannot know whether it sits in a page or a sidebar. */
  const narrow = useMediaQuery("(max-width: 56rem)");

  /* Sticky asks for two things — a capped scrollport and a reserved scrollbar
     gutter — and both are wrong when the body has nothing to scroll: the cap does
     nothing and the gutter shows as an empty ~15px strip down the trailing edge
     (visible on the empty states, which is where it was spotted). Pinning a
     header over a body that does not scroll isn't doing anything either, so the
     prop follows the content rather than the checkbox alone. */
  const scrolls = !noColumns && rows.length > 0;
  const stickyHeader = sticky && scrolls;

  return (
    <div className="ks-dt">
      <div className="ks-dt__controls">
        <Checkbox size={size} checked={sticky} onCheckedChange={setSticky}>
          Sticky header
        </Checkbox>
      </div>

      <DataTable size={size} sticky={stickyHeader}>
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
            <AnchoredMenu
              size={size}
              label={`Environment${envFilter.length ? ` (${envFilter.length})` : ""}`}
            >
              <DropdownLabel>Filter by environment</DropdownLabel>
              {ENVIRONMENTS.map((value) => (
                <DropdownCheckboxItem
                  key={value}
                  checked={envFilter.includes(value)}
                  onCheckedChange={() =>
                    toggleFacet("environment", envFilter, value)
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  <DropdownItemIndicator>
                    <Check aria-hidden="true" />
                  </DropdownItemIndicator>
                  {value}
                </DropdownCheckboxItem>
              ))}
            </AnchoredMenu>

            <AnchoredMenu
              size={size}
              label={`Status${statusFilter.length ? ` (${statusFilter.length})` : ""}`}
            >
              <DropdownLabel>Filter by status</DropdownLabel>
              {STATUSES.map((value) => (
                <DropdownCheckboxItem
                  key={value}
                  checked={statusFilter.includes(value)}
                  onCheckedChange={() =>
                    toggleFacet("status", statusFilter, value)
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  <DropdownItemIndicator>
                    <Check aria-hidden="true" />
                  </DropdownItemIndicator>
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
                  onSelect={(event) => event.preventDefault()}
                >
                  <DropdownItemIndicator>
                    <Check aria-hidden="true" />
                  </DropdownItemIndicator>
                  {String(column.columnDef.header)}
                </DropdownCheckboxItem>
              ))}
            </AnchoredMenu>
          </DataTableRegion>
        </DataTableToolbar>

        <TableScrollArea>
          <Table size={size}>
            {/* The head goes with the columns. Left in place it would be a
                select-all checkbox and two hidden labels floating above a "no
                fields" message — a control that selects rows nothing is showing,
                which reads as a broken table rather than an empty one. */}
            {!noColumns && (
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
                      onCheckedChange={(checked) =>
                        table.toggleAllPageRowsSelected(checked)
                      }
                    />
                  </DataTableControlCell>
                  <DataTableControlCell header>
                    <VisuallyHidden>Expand</VisuallyHidden>
                  </DataTableControlCell>

                  {table.getVisibleLeafColumns().map((column) => (
                    <DataTableSortHeader
                      key={column.id}
                      direction={
                        column.getIsSorted() === "asc"
                          ? "asc"
                          : column.getIsSorted() === "desc"
                            ? "desc"
                            : "none"
                      }
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
            )}

            <TableBody>
              {/* Two empty states, and WHICH ONE wins matters: hiding every
                  column takes precedence over an empty filter result, because
                  with no columns there is nothing a row could show, so "no
                  deployments match" would be both unhelpful and possibly untrue.
                  Each names the control that gets the reader out of it — an empty
                  state that only reports the absence leaves them stuck. No action
                  Button on either: the way out is a menu in the toolbar they can
                  already see, and a button that just opens it would be a second
                  route to the same control. */}
              {noColumns ? (
                <TableRow>
                  <TableCell colSpan={detailColSpan}>
                    <EmptyState size={size}>
                      <EmptyStateTitle>No fields shown</EmptyStateTitle>
                      <EmptyStateDescription>
                        Every column is hidden. Choose at least one from the
                        Fields menu above to see your deployments.
                      </EmptyStateDescription>
                    </EmptyState>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={detailColSpan}>
                    <EmptyState size={size}>
                      <EmptyStateTitle>No deployments match</EmptyStateTitle>
                      <EmptyStateDescription>
                        Clear the filter or widen the environment and status
                        facets.
                      </EmptyStateDescription>
                    </EmptyState>
                  </TableCell>
                </TableRow>
              ) : null}

              {!noColumns &&
                rows.map((row) => {
                  const deployment = row.original;
                  const isOpen = Boolean(expanded[row.id]);
                  return (
                    <HeadlessTable.Expandable
                      key={row.id}
                      expanded={isOpen}
                      onExpandedChange={(next) =>
                        setExpanded((current) => ({
                          ...current,
                          [row.id]: next,
                        }))
                      }
                    >
                      <TableRow aria-selected={row.getIsSelected()}>
                        <DataTableControlCell>
                          <Checkbox
                            size={size}
                            aria-label={`Select ${deployment.service}`}
                            checked={row.getIsSelected()}
                            onCheckedChange={(checked) =>
                              row.toggleSelected(checked)
                            }
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
                              <TableCell key={key} className="ks-dt__nowrap">
                                {deployment.service}
                              </TableCell>
                            );
                          }
                          if (column.id === "status") {
                            return (
                              <TableCell key={key}>
                                <Badge
                                  size={size}
                                  tone={TONE_FOR[deployment.status]}
                                >
                                  {deployment.status}
                                </Badge>
                              </TableCell>
                            );
                          }
                          if (column.id === "author") {
                            return (
                              <TableCell key={key} className="ks-dt__nowrap">
                                {/* A real photograph, matched to the name (see
                                    AUTHORS), with the initials as the fallback if
                                    it 404s. Scales with the global control; the
                                    pair's layout is .ks-dt__author in demos.css. */}
                                <span className="ks-dt__author">
                                  <Avatar size={size}>
                                    <AvatarImage src={deployment.face} alt="" />
                                    <AvatarFallback>
                                      {deployment.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  {deployment.author}
                                </span>
                              </TableCell>
                            );
                          }
                          if (column.id === "durationSeconds") {
                            return (
                              <TableCell key={key} className="ks-dt__num">
                                {formatDuration(deployment.durationSeconds)}
                              </TableCell>
                            );
                          }
                          if (column.id === "commits") {
                            return (
                              <TableCell key={key} className="ks-dt__num">
                                {deployment.commits.toLocaleString()}
                              </TableCell>
                            );
                          }
                          if (column.id === "deployedHoursAgo") {
                            return (
                              <TableCell key={key}>
                                {formatWhen(deployment.deployedHoursAgo)}
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={key}>
                              {deployment.environment}
                            </TableCell>
                          );
                        })}

                        <DataTableControlCell>
                          <AnchoredMenu
                            size={size}
                            variant="ghost"
                            placement="bottom-end"
                            chevron={false}
                            label="..."
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

                      {/* forceMount is what makes it ANIMATE: without it a closed
                        row is `hidden` (display:none), and display:none cannot
                        transition — the panel would snap. Force-mounted, the row
                        stays in the layout at zero height and the grid-collapse
                        clip animates it open, while `aria-hidden` on the closed
                        row keeps it out of the announced row count. */}
                      <DataTableDetailRow
                        colSpan={detailColSpan}
                        gutter={leadingControlColumns}
                        forceMount
                      >
                        <DeploymentDetail deployment={deployment} size={size} />
                      </DataTableDetailRow>
                    </HeadlessTable.Expandable>
                  );
                })}
            </TableBody>
          </Table>
        </TableScrollArea>

        <DataTableFooter>
          <DataTableRegion align="start">
            {/* Colour only: the type comes from the data-table\'s own bar
                type family, which scales with size and density. This was a
                hardcoded `body-sm` — the same bug the pagination summary
                had, written by hand instead of omitted. */}
            {/* "…rows selected" wrapped onto two lines even at desktop width
                once the numbered pager and the Select took their share. The
                shorter phrase says the same thing on one line. */}
            <p className="ks-dt__count">
              {selectedCount} of {table.getFilteredRowModel().rows.length} selected
            </p>
          </DataTableRegion>

          <DataTableRegion align="end">
            <Select
              native
              size={size}
              aria-label="Rows per page"
              className="ks-dt__page-size"
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              {PAGE_SIZES.map((value) => (
                <option key={value} value={value}>{`${value} / page`}</option>
              ))}
            </Select>

            <Pagination
              label="Deployments pages"
              size={size}
              variant={narrow ? "compact" : "numbered"}
            >
              {/* Compact already carries the page readout between its arrows, so
                  the summary would say it twice. */}
              {!narrow && (
                <PaginationSummary>
                  Page {pageIndex + 1} of {Math.max(pageCount, 1)}
                </PaginationSummary>
              )}
              <PaginationList>
                <PaginationItem>
                  <PaginationPrevious
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                  />
                </PaginationItem>
                {/* `compact` is a re-presentation, not a different pager: the
                    same prev/next controls stay, and the number cells give way to
                    a readout. Rendering the cells with the compact class would
                    just be the numbered pager in disguise. */}
                {narrow ? (
                  <PaginationItem>
                    <PaginationStatus>
                      Page {pageIndex + 1} of {Math.max(pageCount, 1)}
                    </PaginationStatus>
                  </PaginationItem>
                ) : (
                  pageItems.map((item, index) =>
                    item.type === "page" ? (
                      <PaginationItem key={`page-${item.page}`}>
                        <PaginationLink
                          isActive={item.page === pageIndex + 1}
                          onClick={() => table.setPageIndex(item.page - 1)}
                        >
                          {item.page}
                        </PaginationLink>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={`gap-${index}`}>
                        <PaginationEllipsis>
                          {item.pages.map((hidden) => (
                            <PaginationMenuItem
                              key={hidden}
                              onSelect={() => table.setPageIndex(hidden - 1)}
                            >
                              {hidden}
                            </PaginationMenuItem>
                          ))}
                        </PaginationEllipsis>
                      </PaginationItem>
                    ),
                  )
                )}
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
