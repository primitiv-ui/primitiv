"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/table";
import { importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Rows = "plain" | "striped";

const DATA = [
  { project: "Design system", owner: "Ada L.", commits: 128 },
  { project: "Docs site", owner: "Grace H.", commits: 342 },
  { project: "Engine", owner: "Alan T.", commits: 87 },
];

const imports = (mode: Mode) =>
  importBlock({
    mode,
    component: "Table",
    componentId: "table",
    parts: ["Head", "Body", "Row", "Header", "Cell", "Caption"],
  });

/** A small three-column table, parameterised. `alignCommits` right-aligns the numeric column. */
function DataTable({ size, rows, alignCommits = false }: { size?: Size; rows?: Rows; alignCommits?: boolean }) {
  return (
    <Table size={size} rows={rows}>
      <TableHead>
        <TableRow>
          <TableHeader>Project</TableHeader>
          <TableHeader>Owner</TableHeader>
          <TableHeader align={alignCommits ? "end" : "start"}>Commits</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {DATA.map((r) => (
          <TableRow key={r.project}>
            <TableCell>{r.project}</TableCell>
            <TableCell>{r.owner}</TableCell>
            <TableCell align={alignCommits ? "end" : "start"}>{r.commits}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Table markup as snippet lines, mode-aware. */
const tableLines = (
  mode: Mode,
  { attrs = "", alignCommits = false, caption }: { attrs?: string; alignCommits?: boolean; caption?: string } = {},
): string[] => {
  const t = partNamer(mode, "Table");
  const a = alignCommits ? ' align="end"' : "";
  return [
    `<${t("Root")}${attrs}>`,
    ...(caption ? [`  <${t("Caption")}>${caption}</${t("Caption")}>`] : []),
    `  <${t("Head")}>`,
    `    <${t("Row")}>`,
    `      <${t("Header")}>Project</${t("Header")}>`,
    `      <${t("Header")}${a}>Commits</${t("Header")}>`,
    `    </${t("Row")}>`,
    `  </${t("Head")}>`,
    `  <${t("Body")}>`,
    `    {rows.map((r) => (`,
    `      <${t("Row")} key={r.id}>`,
    `        <${t("Cell")}>{r.project}</${t("Cell")}>`,
    `        <${t("Cell")}${a}>{r.commits}</${t("Cell")}>`,
    `      </${t("Row")}>`,
    `    ))}`,
    `  </${t("Body")}>`,
    `</${t("Root")}>`,
  ];
};

/**
 * Table's page content — scoped to the styled registry surface.
 *
 * A `registry` compound with a headless primitive, documented across its nine
 * parts: `Table` (the `<table>`, owning `size` / `rows`), `Table.Head` / `.Body`
 * / `.Footer`, `Table.Row`, `Table.Header` (`<th>`, `align`) / `Table.Cell`
 * (`<td>`, `align`), `Table.ScrollArea` and `Table.Caption`.
 *
 * **Expandable rows are deliberately out of scope here.** The headless `Table`
 * primitive adds `Table.Expandable` / `.ExpandTrigger` / `.DetailRow` for
 * disclosure rows, but the styled registry surface this page documents does not
 * carry them — so there is nothing to demo in the default (styled) mode. They
 * are noted in the accessibility section as the headless escape hatch.
 *
 * No Keyboard section: a table is not interactive (the one interactive part,
 * the expand trigger, belongs to the out-of-scope headless feature).
 */
export const tableSpec: ComponentSpec = {
  playground: {
    component: "Table",
    /* `align` is a per-cell prop (Header/Cell), not a whole-table one — a single
       table-wide toggle would misrepresent it, so it is shown in the Alignment
       example instead. */
    excludeControls: ["align"],
    fill: true,
    snippet: (values, mode) =>
      [imports(mode), ``, ...tableLines(mode, { attrs: ` size="${values.size}" rows="${values.rows}"` })].join("\n"),
    render: (values) => <DataTable size={values.size as Size} rows={values.rows as Rows} />,
  },

  anatomyMeta:
    "Nine parts, mapping onto the native table elements. `Table` is the `<table>` and owns `size` / `rows`. `Table.Caption` names it; `Table.Head` / `Table.Body` / `Table.Footer` are `<thead>` / `<tbody>` / `<tfoot>`; `Table.Row` is a `<tr>`; `Table.Header` is a `<th>` and `Table.Cell` a `<td>`, both taking `align`. `Table.ScrollArea` is a wrapping `<div>` for wide tables. Use the real semantic parts — a table built from `Box`/`Stack` reads as layout, not data, to assistive technology.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const t = partNamer(mode, "Table");
        return [
          `<${t("Root")}>`,
          `  <${t("Caption")}>…</${t("Caption")}>`,
          `  <${t("Head")}>`,
          `    <${t("Row")}>`,
          `      <${t("Header")}>…</${t("Header")}>`,
          `    </${t("Row")}>`,
          `  </${t("Head")}>`,
          `  <${t("Body")}>`,
          `    <${t("Row")}>`,
          `      <${t("Cell")}>…</${t("Cell")}>`,
          `    </${t("Row")}>`,
          `  </${t("Body")}>`,
          `</${t("Root")}>`,
        ].join("\n");
      },
    },
  ],

  examples: [
    {
      id: "basic",
      title: "A basic table",
      render: () => (
        <InteractiveExample
          caption="The core shape: a `Table.Head` of `Table.Header` cells over a `Table.Body` of `Table.Row`s and `Table.Cell`s, with a `Table.Caption` naming the whole thing. The parts render the real `<table>` / `<thead>` / `<th>` / `<td>` elements, so the browser and assistive technology get a genuine data table — row and column relationships and all — for free."
          code={(_density, mode) =>
            [imports(mode), ``, ...tableLines(mode, { caption: "Active projects" })].join("\n")
          }
        >
          {() => (
            <Table>
              <TableCaption>Active projects</TableCaption>
              <TableHead>
                <TableRow>
                  <TableHeader>Project</TableHeader>
                  <TableHeader>Owner</TableHeader>
                  <TableHeader align="end">Commits</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {DATA.map((r) => (
                  <TableRow key={r.project}>
                    <TableCell>{r.project}</TableCell>
                    <TableCell>{r.owner}</TableCell>
                    <TableCell align="end">{r.commits}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "striped",
      title: "Striped rows",
      render: () => (
        <InteractiveExample
          caption="`rows=&quot;striped&quot;` on the root shades alternate body rows, which helps the eye track across a wide or dense table. It is purely visual — the stripes carry no meaning and are not announced — so reach for it when scanning is hard, not as decoration on a three-row table."
          code={(_density, mode) =>
            [imports(mode), ``, ...tableLines(mode, { attrs: ` rows="striped"` })].join("\n")
          }
        >
          {() => <DataTable rows="striped" />}
        </InteractiveExample>
      ),
    },
    {
      id: "alignment",
      title: "Column alignment",
      render: () => (
        <InteractiveExample
          caption="Numbers read best right-aligned, so their digits line up. `align` is a **per-cell** prop, not a column one — CSS `text-align` does not apply to a `<col>`, so set `align=&quot;end&quot;` on the header **and every cell** in that column. `start` / `end` are direction-aware and flip under RTL, so a numeric column stays edge-aligned in either reading direction."
          code={(_density, mode) =>
            [imports(mode), ``, ...tableLines(mode, { alignCommits: true })].join("\n")
          }
        >
          {() => <DataTable alignCommits />}
        </InteractiveExample>
      ),
    },
    {
      id: "scroll",
      title: "Wide tables: horizontal scroll",
      render: () => (
        <InteractiveExample
          caption="A table wider than its container should scroll rather than squeeze or overflow the page. Wrap it in `Table.ScrollArea` — a focusable, labelled scroll region — so a wide table pans horizontally on its own. Give the region an `aria-label` and it becomes keyboard-scrollable, so the columns past the edge are reachable without a mouse."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<${partNamer(mode, "Table")("ScrollArea")} aria-label="Projects" tabIndex={0}>`,
              `  <${partNamer(mode, "Table")("Root")}>{/* many columns */}</${partNamer(mode, "Table")("Root")}>`,
              `</${partNamer(mode, "Table")("ScrollArea")}>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ maxInlineSize: "22rem" }}>
              <TableScrollArea aria-label="Project details" tabIndex={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Project</TableHeader>
                      <TableHeader>Owner</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Updated</TableHeader>
                      <TableHeader align="end">Commits</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {DATA.map((r) => (
                      <TableRow key={r.project}>
                        <TableCell>{r.project}</TableCell>
                        <TableCell>{r.owner}</TableCell>
                        <TableCell>Active</TableCell>
                        <TableCell>2 days ago</TableCell>
                        <TableCell align="end">{r.commits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScrollArea>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "**Name the table.** A `Table.Caption` (or an `aria-label` on the root) gives the table an accessible name, so a screen-reader user landing on it knows what it holds before reading cells. `Table.Caption` also takes `captionSide` to place it visually above or below while staying the table's caption semantically.",
    "**Header cells are `<th>`, and they carry `scope`.** `Table.Header` renders a real `<th>`; column headers should be `scope=\"col\"` (the default for a head-row header) and a row's leading label cell `scope=\"row\"`, so assistive technology can announce the row and column a cell belongs to. Use header cells for headers — never a styled `<td>`.",
    "**`align` is visual only.** It aligns the text; it changes nothing in the accessibility tree, and it is per-cell because CSS cannot align a whole column — set it on the header and every cell alike, or the column won't line up.",
    "**A wide table needs a keyboard-scrollable region.** `Table.ScrollArea` should be focusable (`tabIndex={0}`) and labelled (`aria-label`) so a keyboard user can scroll to the off-screen columns — a scroll region reachable only by mouse hides data from them.",
    "**Striped rows are decoration.** `rows=\"striped\"` conveys nothing to assistive technology; do not lean on the shading to communicate state (a failed row, say) — put that in the cell's content.",
    "**Need expandable/disclosure rows?** That lives in the headless `Table` primitive (`Table.Expandable` / `Table.ExpandTrigger` / `Table.DetailRow`), which wires the trigger's `aria-expanded` / `aria-controls` to the detail row. The styled registry surface documented here doesn't include it — reach for `@primitiv-ui/react` directly when you need it.",
    "**Don't build tables out of layout primitives.** A grid of `Box`/`Stack` looks like a table but reads as ungrouped text — no row/column relationships, no navigation. Use the real `Table` parts whenever the data is genuinely tabular.",
  ],
};
