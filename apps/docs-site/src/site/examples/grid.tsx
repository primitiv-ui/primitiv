"use client";

import type { CSSProperties, ReactNode } from "react";

import { Grid } from "@/components/grid";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import { withDemoCells } from "./layout-demo";
import type { ComponentSpec } from "./types";

type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "stretch";
type Columns = 1 | 2 | 3 | 4 | 5 | 6;

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Grid", componentId: "grid", registryOnly: true });

const cell: CSSProperties = {
  padding: "var(--primitiv-space-8) var(--primitiv-space-12)",
  background: "var(--primitiv-surface-raised)",
  border: "var(--primitiv-border-width-1) solid var(--primitiv-border-subtle)",
  borderRadius: "var(--primitiv-radii-8)",
  color: "var(--primitiv-content-secondary)",
  whiteSpace: "nowrap",
};
/* Some cells carry two lines (a `<br/>`), so a row is taller than the short
   cells for `align` to move within; `justify` shows because the cells are
   narrower than their tracks. */
const Cell = ({ children }: { children: ReactNode }) => (
  <div style={cell}>{children}</div>
);

/**
 * The Elements markup for a grid of plain `<div>` children. `columns` is the
 * full column-class list, so a breakpoint map reads as its tier classes.
 */
const gridHtml = (
  {
    columns = "primitiv-grid--cols-1",
    gap = "md",
    align = "stretch",
    justify = "stretch",
  }: Partial<Record<"columns" | "gap" | "align" | "justify", string>>,
  children: readonly string[],
) =>
  [
    `<div class="primitiv-grid ${columns} primitiv-grid--gap-${gap} primitiv-grid--align-${align} primitiv-grid--justify-${justify}">`,
    ...children.map((c) => `  <div>${c}</div>`),
    `</div>`,
  ].join("\n");

/** The preview's two-line cells, as the React previews draw them. */
const withTwoLineCells = (code: string, ...labels: string[]) =>
  withDemoCells(
    labels.reduce(
      (c, l) => c.replace(`<div>${l}</div>`, `<div>${l}<br>lines</div>`),
      code,
    ),
  );

/**
 * Grid's page content.
 *
 * Registry-only. Its headline feature is the mobile-first per-breakpoint
 * `columns` map that resolves to modifier classes, so the responsive column
 * count is correct in server-rendered markup on the first paint — no inline
 * style, no layout shift. `align`/`justify` set how each item sits within its
 * cell, which only shows when the item is smaller than the cell, so the demos
 * use uneven cells.
 */
export const gridSpec: ComponentSpec = {
  playground: {
    component: "Grid",
    fill: true,
    snippet: (values, mode) =>
      mode === "elements"
        ? gridHtml(
            { ...values, columns: `primitiv-grid--cols-${values.columns}` },
            ["One", "Two", "Three", "Four", "Five", "Six"],
          )
        : [
        imports(mode),
        ``,
        `<Grid`,
        `  columns={${values.columns}}`,
        `  gap="${values.gap}"`,
        `  align="${values.align}"`,
        `  justify="${values.justify}"`,
        `>`,
        `  <div>One</div>`,
        `  <div>Two</div>`,
        `  <div>Three</div>`,
        `  {/* ... */}`,
        `</Grid>`,
      ].join("\n"),
    elementsPreview: (code) =>
      withTwoLineCells(code, "Two", "Five").replace(
        'class="primitiv-grid ',
        'style="inline-size: 100%" class="primitiv-grid ',
      ),
    render: (values) => (
      <Grid
        columns={Number(values.columns) as Columns}
        gap={values.gap as Gap}
        align={values.align as Align}
        justify={values.justify as Justify}
        style={{ inlineSize: "100%" }}
      >
        <Cell>One</Cell>
        <Cell>
          Two
          <br />
          lines
        </Cell>
        <Cell>Three</Cell>
        <Cell>Four</Cell>
        <Cell>
          Five
          <br />
          lines
        </Cell>
        <Cell>Six</Cell>
      </Grid>
    ),
  },

  examples: [
    {
      id: "responsive",
      title: "Responsive columns",
      render: () => (
        <InteractiveExample
          caption={"The reason Grid exists rather than a raw `grid-template-columns`: `columns` takes a **mobile-first map**, one column on the smallest screens escalating to more as space allows. Because each tier is a modifier class, not an inline style, the right column count is in the server-rendered HTML on the first paint — no flash of the wrong layout, no `useEffect` measuring the viewport."}
          elementsCaption={"The reason Grid exists rather than a raw `grid-template-columns`: one class per breakpoint tier, mobile-first. `primitiv-grid--cols-2` applies everywhere and `primitiv-grid--md-cols-3` takes over from the `md` breakpoint up — each tier a floor, the widest matching one winning. It is plain CSS, so the server-rendered page has the right column count on the first paint, with no script measuring the viewport."}
          elementsPreview={(_density, code) =>
            withDemoCells(code).replace('class="primitiv-grid ', 'style="inline-size: 100%" class="primitiv-grid ')
          }
          code={(_density, mode) =>
            mode === "elements"
              ? gridHtml(
                  { columns: "primitiv-grid--cols-2 primitiv-grid--md-cols-3" },
                  ["One", "Two", "Three", "Four", "Five", "Six"],
                )
              : [
              imports(mode),
              ``,
              `<Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">`,
              `  <Card />`,
              `  <Card />`,
              `  <Card />`,
              `</Grid>`,
            ].join("\n")
          }
        >
          {() => (
            <Grid columns={{ base: 2, md: 3 }} gap="md" style={{ inlineSize: "100%" }}>
              {["One", "Two", "Three", "Four", "Five", "Six"].map((t) => (
                <Cell key={t}>{t}</Cell>
              ))}
            </Grid>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "cell-alignment",
      title: "Aligning items in their cells",
      render: () => (
        <InteractiveExample
          caption={"`align` (block axis) and `justify` (inline axis) set how each item sits inside its own cell. Both default to `stretch`, so items fill the cell — the usual choice for cards. Switch either to `start`/`center`/`end` when the items are smaller than their cells and should pin to an edge, like a row of controls of different sizes lined up along the same baseline."}
          elementsCaption={"`primitiv-grid--align-*` (block axis) and `primitiv-grid--justify-*` (inline axis) set how each item sits inside its own cell. Both default to `stretch`, so items fill the cell — the usual choice for cards. Switch either to `start`/`center`/`end` when the items are smaller than their cells and should pin to an edge."}
          elementsPreview={(_density, code) =>
            withTwoLineCells(code, "Two").replace('class="primitiv-grid ', 'style="inline-size: 100%" class="primitiv-grid ')
          }
          code={(_density, mode) =>
            mode === "elements"
              ? gridHtml(
                  {
                    columns: "primitiv-grid--cols-2 primitiv-grid--md-cols-3",
                    align: "center",
                    justify: "center",
                  },
                  ["One", "Two", "Three"],
                )
              : [
              imports(mode),
              ``,
              `<Grid columns={{ base: 2, md: 3 }} gap="md" justify="center" align="center">`,
              `  <div>One</div>`,
              `  <div>Two</div>`,
              `  <div>Three</div>`,
              `</Grid>`,
            ].join("\n")
          }
        >
          {() => (
            /* Two columns below md, three above. The cells are `nowrap` by
               design — they carry deliberate line breaks — so at a 320 viewport
               three padded cells need 68px in a 60px track and the widest was
               cut off. Saying so with the breakpoint map is better
               documentation than implying three fit: that map is this
               component's headline feature. The demo still shows what it is
               for, since `align` reads against the two-line cell either way. */
            <Grid
              columns={{ base: 2, md: 3 }}
              gap="md"
              justify="center"
              align="center"
              style={{ inlineSize: "100%" }}
            >
              <Cell>One</Cell>
              <Cell>
                Two
                <br />
                lines
              </Cell>
              <Cell>Three</Cell>
            </Grid>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A CSS grid as classes: `primitiv-grid`, a column count (with optional per-breakpoint tiers such as `primitiv-grid--md-cols-3`), a token-scaled gap, and how items sit in their cells.",
    accessibility: [
      "The class is visual layout only, with no semantics. When the items are a list, put it on a `<ul>` so the count and structure are announced rather than flattened.",
      "The visual grid does **not** change DOM order, so keyboard focus and screen-reader reading order follow the source. Avoid reordering items away from a sensible reading order.",
      "Tracks are `minmax(0, 1fr)`, so a cell with long unbreakable content is clipped by its track rather than forcing the whole row wider.",
    ],
  },

  accessibility: [
    "Grid renders a plain `<div>` — visual layout only, no semantics. When the items are a list, use `asChild` to render a `<ul>` so the count and structure are announced rather than flattened.",
    "The visual grid does **not** change DOM order, so keyboard focus and screen-reader reading order follow the source. Avoid using grid placement to reorder items away from a sensible reading order.",
    "Tracks are `minmax(0, 1fr)`, so a cell with long unbreakable content is clipped by its track rather than forcing the whole row wider — which keeps the layout (and horizontal scrolling) predictable for everyone.",
  ],
};
