# DataTable

A framed data-table shell — a toolbar, a table and a footer that read as one
object, plus the anatomy that sorting, selection and expandable rows need.

**It owns anatomy, never state.** Sorting, selection, expansion, filtering and
pagination all arrive as props and leave as callbacks, so an external table
engine drives it without this component duplicating a single concept. There is
no `columns` / `data` API on purpose — see [Why no data model](#why-no-data-model).

```sh
primitiv add data-table
```

## Usage with TanStack Table

```tsx
const table = useReactTable({
  data,
  columns,
  state: { sorting, rowSelection, expanded, columnVisibility, pagination },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});

<DataTable size="md">
  <DataTableToolbar>
    <DataTableRegion align="start">
      <Input value={filter} onChange={…} placeholder="Filter deployments..." />
    </DataTableRegion>
    <DataTableRegion align="end">{/* your field menu */}</DataTableRegion>
  </DataTableToolbar>

  <TableScrollArea>
    <Table>
      <TableHead>
        <TableRow>
          <DataTableControlCell header>
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              aria-label="Select all rows"
            />
          </DataTableControlCell>
          <DataTableControlCell header />
          {headers.map((header) => (
            <DataTableSortHeader
              key={header.id}
              direction={header.column.getIsSorted() || "none"}
              onSort={header.column.getToggleSortingHandler()}
            >
              {header.label}
            </DataTableSortHeader>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <Table.Expandable
            key={row.id}
            expanded={row.getIsExpanded()}
            onExpandedChange={row.getToggleExpandedHandler()}
          >
            <TableRow aria-selected={row.getIsSelected()}>
              <DataTableControlCell>
                <Checkbox
                  checked={row.getIsSelected()}
                  onChange={row.getToggleSelectedHandler()}
                  aria-label={`Select ${row.original.name}`}
                />
              </DataTableControlCell>
              <DataTableControlCell>
                <DataTableExpandTrigger aria-label={`Show details for ${row.original.name}`} />
              </DataTableControlCell>
              {/* your cells */}
            </TableRow>

            <DataTableDetailRow
              colSpan={table.getVisibleLeafColumns().length + 2}
              gutter={2}
              forceMount
            >
              <DeploymentDetail row={row.original} />
            </DataTableDetailRow>
          </Table.Expandable>
        ))}
      </TableBody>
    </Table>
  </TableScrollArea>

  <DataTableFooter>
    <DataTableRegion align="start">{selectedSummary}</DataTableRegion>
    <DataTableRegion align="end">
      <Pagination label="Pages" size="sm">
        <PaginationSummary>Page {pageIndex + 1} of {table.getPageCount()}</PaginationSummary>
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} />
          </PaginationItem>
          {/* one PaginationItem + PaginationLink per page in your window */}
          <PaginationItem>
            <PaginationNext disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} />
          </PaginationItem>
        </PaginationList>
      </Pagination>
    </DataTableRegion>
  </DataTableFooter>
</DataTable>
```

Nothing above is TanStack-specific beyond the handler names — a plain `useState`
drives the same props.

## Parts

| Export | Renders | Notes |
| --- | --- | --- |
| `DataTable` | `<div>` | The framed shell. `size`, `frame`, `sticky`. |
| `DataTableToolbar` | `<div>` | The padded bar above the table. |
| `DataTableFooter` | `<div>` | The padded bar below it — identical mechanism. |
| `DataTableRegion` | `<div>` | One of the bar's three regions: `align="start" \| "center" \| "end"`. |
| `DataTableControlCell` | `<td>` / `<th>` | Square cell for a control. `header` renders a `<th>`. |
| `DataTableSortHeader` | `<th>` + `<button>` | A sortable column header, `aria-sort` included. `align` goes to the `<th>` **and** the button. Prefer this. |
| `DataTableSortButton` | `<button>` | The sort control alone, if you are assembling the `<th>` yourself. |
| `DataTableExpandTrigger` | `<button>` | The row's disclosure. Composes headless `Table.ExpandTrigger`. |
| `DataTableDetailRow` | `<tr>` | The revealed panel. Composes headless `Table.DetailRow`. |

### Aligning a numeric column

`DataTableSortHeader` takes `align` (`"start" | "center" | "end"`) and forwards it
to **both** the `<th>` and its sort button — and it has to. The button is a flex
row, so `justify-content` places its label and glyph; the `<th>`'s `text-align` is
what the column's `<td>`s match. Set the same `align` on the column's cells:

```tsx
<DataTableSortHeader align="end" direction={dir} onSort={toggle}>Duration</DataTableSortHeader>
…
<TableCell align="end">{ms}ms</TableCell>
```

Forwarding to the button alone was the original behaviour, and it made the
documented way to mark a numeric column produce a visibly broken one: a
right-aligned heading over left-aligned numbers. Cells carry their own `align`
because CSS cannot align a column (`text-align` does not apply to `<col>`).

Numeric cells need no `tabular-nums` of their own — the shell sets it, so every
cell inherits it.

The table itself is the `table` component's job — `Table`, `TableHead`,
`TableRow`, `TableHeader`, `TableCell`. This component never restyles it.

## The detail row's indent

The panel aligns with the first **data** column, not the table's edge — a
full-bleed panel starting under the checkbox reads as a new section of the table
rather than an opened row. Say how many control columns to clear and the table
layout does the rest:

```tsx
{/* select + expand, then the data columns */}
<DataTableDetailRow colSpan={table.getVisibleLeafColumns().length + 2} gutter={2} />
```

`gutter` renders one empty `<td>` spanning those columns, so the browser resolves
the width and the panel stays aligned at every size and density. There is
deliberately **no CSS indent knob**: an indent has to sum the control widths and
their paddings by hand, and the sum is only right at one size — the checkbox
scales with `size`, the chevron glyph does not, and the measured drift across
xs…xl was 7-21px. Nothing to configure beats a knob you can only set right once.

The parent row sheds its own bottom rule automatically while expanded, so the
row and its panel read as one block closed by the detail row's rule — detected
with `:has()` rather than asked for with a prop, since the DOM already knows.

## Transitions

Pass `forceMount` to `DataTableDetailRow` and the panel animates open with the
`display: grid` 0fr↔1fr technique (on a wrapper **inside** the cell — it cannot
go on a `<tr>` or `<td>` without collapsing column alignment). The chevron
rotates in lockstep. Both are disabled under `prefers-reduced-motion`.

A force-mounted collapsed row is `aria-hidden`, so animating never inflates the
table's announced row count.

## Sticky header

`sticky` pins the header and adds an opaque background — which the base `Table`
deliberately does not have, so without it rows scroll straight through the
header. Give the surrounding `TableScrollArea` a `max-block-size` so there is
something to scroll within. Two details are handled for you: sticky sits on the
`<th>` (unsupported on `<thead>`/`<tr>` in older Safari), and the header rule
becomes an inset shadow because `border-collapse` drops a stuck cell's border.

**Pass `sticky` only when there is something to scroll.** It reserves the
scrollbar gutter (`scrollbar-gutter: stable`), so the columns don't shift
sideways as rows are filtered in and out and the header's trailing edge stays
aligned with the body's. The gutter is reserved whether or not the body actually
overflows, so on a table shorter than its cap — a filtered-to-nothing result, an
empty state, five rows — it shows as a ~15px empty strip down the trailing edge.
Reserving it conditionally would need an overflow state query, which hasn't
shipped, so the call site decides:

```tsx
<DataTable sticky={sticky && rows.length > 0}>
```

Which is also the honest reading of the prop: pinning a header over a body that
does not scroll isn't doing anything.

## Why no data model

A `columns` / `data` API is shorter for the demo case and wrong for every case
after it: it re-invents the column definition every real engine already has, so
you write your columns twice; it needs a cell-renderer escape hatch within a
week, which is the parts model wearing a costume; and column groups, `colSpan`,
footer aggregates, per-row detail and virtualisation are all ordinary JSX here
and a new prop there. `NavigationMenu` refused to own nav data for the same
reason (RFC 0019 §4c), as did `avatar-group` and `breadcrumb-overflow`.

It also ships **no toolbar controls**, column visibility included — shipping that
would mean owning the column list. Compose it from `dropdown`.

## Accessibility

- Every row checkbox needs a name identifying **its row** ("Select harmoni-engine"),
  and the header's is "Select all rows". A column of identically-named checkboxes
  is unusable in a screen reader's element list.
- `aria-selected` on the row is a **styling hook only**; the checkbox's own
  checked state is what assistive technology reliably reports.
- `aria-sort` belongs on the `<th>`, one column at a time. `DataTableSortHeader`
  does it for you.
- The expander's state lives on the **button**, not the row: a row's
  `aria-expanded` is only reliably announced inside a `role="treegrid"`.
- Expanding into hierarchical child **rows** is a treegrid — a different pattern,
  and out of scope. This is a disclosure holding a detail panel.
- Add `aria-rowcount` to the table when paginated, or AT announces the page's row
  count as the whole table's.
- Give the empty actions/expand header cells a visually-hidden name.

## Files

| File | Purpose |
| --- | --- |
| `data-table.tsx` | The wrapper — the parts above. |
| `data-table.recipe.ts` | `cva` class recipes. |
| `styles.css` | The default theme (canonical). |
| `styles.scss` | The same, plus `$`-aliases for every custom property. |
| `contract.json` | Parts, modifiers and every `--primitiv-data-table-*` knob. |

## Dependencies

Components: `table`, `checkbox`, `button`, `dropdown`, `select`, `pagination`,
`empty-state`. Packages: `@primitiv-ui/react` (the headless `Table` seam) and
`class-variance-authority`. Glyphs are inlined, so no icon package is pulled in.

Badges and avatars in cells are content choices — add `badge` / `avatar` if you
want them.
