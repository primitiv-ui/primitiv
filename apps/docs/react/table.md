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
  <Table.Caption>Q1 sales by region</Table.Caption>…
</Table.Root>;

{
  /* Caption above table */
}
<Table.Root>
  <Table.Caption captionSide="top">Q1 sales by region</Table.Caption>…
</Table.Root>;
```

When a visible caption is not desirable, use `aria-label` directly on
`Table.Root` instead:

```tsx
<Table.Root aria-label="Q1 sales by region">…</Table.Root>
```

## Responsive scrolling

Wrap `Table.Root` in `Table.ScrollArea` to allow horizontal scrolling on
narrow viewports instead of overflowing or compressing columns.

`Table.ScrollArea` applies `display: block`, `overflow-x: auto`, and
`max-width: 100%` as inline styles.

```tsx
<Table.ScrollArea>
  <Table.Root>…</Table.Root>
</Table.ScrollArea>
```

Any `style` properties you pass are merged with (and take priority over) the
base scroll styles, so you can layer additional styles freely:

```tsx
<Table.ScrollArea style={{ borderRadius: "8px" }}>
  <Table.Root>…</Table.Root>
</Table.ScrollArea>
```

## Multiple `<tbody>` groups

Multiple `Table.Body` elements are valid HTML and useful for visually
separating logical row groups within a single table:

```tsx
<Table.Root>
  <Table.Head>…</Table.Head>
  <Table.Body>
    {/* Group 1 */}
    <Table.Row>…</Table.Row>
  </Table.Body>
  <Table.Body>
    {/* Group 2 */}
    <Table.Row>…</Table.Row>
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

## Workbench example

Open the interactive version in the [workbench](/workbench/#/table). Its source:

<<< ../../../apps/workbench/src/pages/TableExample/TableExample.tsx
