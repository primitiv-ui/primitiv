---
title: Table
---

# Table

A compound component wrapping standard HTML table elements. Follows the
[WAI-ARIA table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/)
with zero styles shipped.

```tsx
import { Table } from "@primitiv-ui/react";

<Table.ScrollArea>
  <Table.Root>
    <Table.Caption>Team members</Table.Caption>
    <Table.Head>
      <Table.Row>
        <Table.Header scope="col">Name</Table.Header>
        <Table.Header scope="col">Role</Table.Header>
        <Table.Header scope="col">Location</Table.Header>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      <Table.Row>
        <Table.Cell>Alice</Table.Cell>
        <Table.Cell>Engineer</Table.Cell>
        <Table.Cell>London</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>Bob</Table.Cell>
        <Table.Cell>Designer</Table.Cell>
        <Table.Cell>Berlin</Table.Cell>
      </Table.Row>
    </Table.Body>
    <Table.Footer>
      <Table.Row>
        <Table.Cell colSpan={3}>2 team members</Table.Cell>
      </Table.Row>
    </Table.Footer>
  </Table.Root>
</Table.ScrollArea>;
```

## Sub-components

| Export             | Renders     | Notes                                                                                       |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------- |
| `Table.Root`       | `<table>`   | Implicit `role="table"`. Accepts all `TableHTMLAttributes`.                                 |
| `Table.Head`       | `<thead>`   | Groups header rows. Browsers may repeat on printed pages.                                   |
| `Table.Body`       | `<tbody>`   | Groups data rows. Multiple `<tbody>` elements are valid.                                    |
| `Table.Footer`     | `<tfoot>`   | Groups footer/summary rows. Browsers may repeat on printed pages.                           |
| `Table.Row`        | `<tr>`      | Individual row. May contain `Table.Header` or `Table.Cell` children.                        |
| `Table.Header`     | `<th>`      | Header cell. Set `scope` for accessibility — see [Accessible headers](#accessible-headers). |
| `Table.Cell`       | `<td>`      | Data cell. Accepts `colSpan` and `rowSpan`.                                                 |
| `Table.ScrollArea` | `<div>`     | Horizontal-scroll wrapper — see [Responsive scrolling](#responsive-scrolling).              |
| `Table.Caption`    | `<caption>` | Visible table label — see [Caption](#caption).                                              |
| `Table.Expandable` | *nothing*   | Pairs a row with its detail row — see [Expandable rows](#expandable-rows).                   |
| `Table.ExpandTrigger` | `<button>` | The row's disclosure control; owns `aria-expanded` / `aria-controls`.                     |
| `Table.DetailRow`  | `<tr>`      | The revealed panel, as a `<td colSpan>`. `gutter` offsets it to the first data column.       |

## Accessible headers

The `scope` attribute on `Table.Header` tells assistive technology which data
cells a header describes. Always set it — without `scope`, screen readers may
struggle to announce the correct header for each cell.

| Value        | Associates header with                               |
| ------------ | ---------------------------------------------------- |
| `"col"`      | All cells in the same column                         |
| `"row"`      | All cells in the same row                            |
| `"colgroup"` | All cells in the column group spanned by this header |
| `"rowgroup"` | All cells in the row group spanned by this header    |

```tsx
<Table.Head>
  <Table.Row>
    <Table.Header scope="col">Name</Table.Header>
    <Table.Header scope="col">Role</Table.Header>
  </Table.Row>
</Table.Head>
<Table.Body>
  <Table.Row>
    {/* Row header for each data row */}
    <Table.Header scope="row">Alice</Table.Header>
    <Table.Cell>Engineer</Table.Cell>
  </Table.Row>
</Table.Body>
```

## Caption

A `Table.Caption` is the preferred way to give a table an accessible name.
The browser programmatically associates `<caption>` with the `<table>`, so
assistive technology announces it when the user enters the table — no
`aria-label` on `Table.Root` is needed.

**`captionSide` prop.** Controls whether the caption appears above or below
the table via the CSS `caption-side` property. Defaults to `"bottom"`.

```tsx
{
  /* Caption below table (default) */
}
<Table.Root>
  <Table.Caption>Q1 sales by region</Table.Caption>...
</Table.Root>;

{
  /* Caption above table */
}
<Table.Root>
  <Table.Caption captionSide="top">Q1 sales by region</Table.Caption>...
</Table.Root>;
```

When a visible caption is not desirable, use `aria-label` directly on
`Table.Root` instead:

```tsx
<Table.Root aria-label="Q1 sales by region">...</Table.Root>
```

## Responsive scrolling

Wrap `Table.Root` in `Table.ScrollArea` to allow horizontal scrolling on
narrow viewports instead of overflowing or compressing columns.

`Table.ScrollArea` applies `display: block`, `overflow-x: auto`, and
`max-width: 100%` as inline styles.

```tsx
<Table.ScrollArea>
  <Table.Root>...</Table.Root>
</Table.ScrollArea>
```

Any `style` properties you pass are merged with (and take priority over) the
base scroll styles, so you can layer additional styles freely:

```tsx
<Table.ScrollArea style={{ borderRadius: "8px" }}>
  <Table.Root>...</Table.Root>
</Table.ScrollArea>
```

## Multiple `<tbody>` groups

Multiple `Table.Body` elements are valid HTML and useful for visually
separating logical row groups within a single table:

```tsx
<Table.Root>
  <Table.Head>...</Table.Head>
  <Table.Body>
    {/* Group 1 */}
    <Table.Row>...</Table.Row>
  </Table.Body>
  <Table.Body>
    {/* Group 2 */}
    <Table.Row>...</Table.Row>
  </Table.Body>
</Table.Root>
```

## Spanning cells

`Table.Cell` and `Table.Header` accept `colSpan` and `rowSpan`:

```tsx
<Table.Row>
  <Table.Cell colSpan={3}>Spans three columns</Table.Cell>
</Table.Row>
```

## Styling hooks

`Table` is a static layout component — it emits no `data-state` or
`data-orientation` attributes. Style it via element or attribute selectors
with whatever system you use:

```css
table {
  border-collapse: collapse;
  width: 100%;
}
th,
td {
  padding: 0.5rem 1rem;
  text-align: left;
}
thead {
  background: #f9fafb;
}
tfoot {
  font-weight: bold;
}
tr:nth-child(even) td {
  background: #f3f4f6;
}
[scope="col"] {
  font-weight: 600;
}
caption {
  font-size: 0.875rem;
  color: #6b7280;
}
```

---

[Back to @primitiv-ui/react](../../README.md)

## Expandable rows

A row can open onto a detail panel. This is a **disclosure**, not a
[treegrid](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/): expanding into
hierarchical child *rows* is a different pattern with a full cell-navigation
keyboard model, and is deliberately out of scope here.

`Table.Expandable` renders no DOM of its own — it is a context provider, so both
`<tr>`s stay direct children of the `<tbody>` and the table's structure is
untouched.

```tsx
<Table.Body>
  <Table.Expandable expanded={open} onExpandedChange={setOpen}>
    <Table.Row>
      <Table.Cell>
        <Table.ExpandTrigger>
          <ChevronIcon aria-hidden="true" />
          <span className="sr-only">Show details for Ada Lovelace</span>
        </Table.ExpandTrigger>
      </Table.Cell>
      <Table.Cell>Ada Lovelace</Table.Cell>
    </Table.Row>

    <Table.DetailRow colSpan={2}>
      <ContributorDetail />
    </Table.DetailRow>
  </Table.Expandable>
</Table.Body>
```

Controlled via `expanded` + `onExpandedChange` (what an external table engine
drives), or uncontrolled with `defaultExpanded`.

### Why the state is on the button

`role="row"` does list `aria-expanded` among its supported properties, but a
**button's** expanded state is announced universally while a row's is only
reliably announced inside a `role="treegrid"`. So the button owns
`aria-expanded` and `aria-controls`, and the detail row publishes the matching
`id`.

Give the trigger a name that identifies **its row**. A column of buttons all
called "Expand" is the same defect as a column of checkboxes all called
"Select": obvious on screen, useless in a screen reader's element list.

### `colSpan` is required

It must cover every column the table renders, control columns included. It is a
prop rather than a count taken from context on purpose: counting would mean the
table registering its own columns, and an external engine already knows the
number (TanStack Table: `table.getVisibleLeafColumns().length`).

### `gutter` aligns the panel with the first data column

A panel that starts at the table's edge, under the checkbox, reads as a new
section of the table rather than as an opened row. `gutter` is how many leading
columns to leave empty — the control columns in front of the data:

```tsx
{/* select + expand columns, then eight data columns */}
<Table.DetailRow colSpan={10} gutter={2}>
```

The panel spans what remains, so `colSpan` keeps its meaning: the table's full
column count, gutter included.

It renders **one** empty `<td colSpan={gutter}>`, not `gutter` of them — a
spanning cell takes the full width of the columns it covers, so the alignment is
identical and the row gains a single blank cell instead of several.

Aligning by empty cell rather than by a CSS indent is the point: the browser's
own table layout resolves the width, so it stays exact across every size,
density and control-column set. Indenting instead means summing control widths
and paddings by hand, which is right at one size and wrong at the other four —
measured drift of 7-21px across xs...xl before this existed.

### `forceMount` and the row count

By default a collapsed detail row is `hidden`, so it is absent from the
accessibility tree — which matters more here than on a `<div>`-based disclosure,
because a mounted `<tr>` is still a **row**: 24 data rows each with a
force-mounted detail row would announce 48.

Pass `forceMount` to keep it mounted so CSS can transition it. While collapsed it
then carries `aria-hidden="true"`, so the announced row count stays truthful
either way.

### Styling hooks

`data-state="open" | "closed"` on both the trigger and the detail row.

Note that the `display: grid` 0fr↔1fr open/close technique used by Accordion and
Collapsible **cannot** go on the `<tr>` or the `<td>` — `display: grid` on either
takes it out of the table layout algorithm and column alignment collapses with
it. Put the animated wrapper inside the cell, and zero the cell's block padding
so a closed row leaves no padded band. The registry `data-table` component does
this for you.

## Workbench example

Open the interactive version in the [workbench](/workbench/#/table). Its source:

<<< ../../../apps/workbench/src/pages/TableExample/TableExample.tsx
