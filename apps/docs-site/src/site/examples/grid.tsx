"use client";

import type { CSSProperties, ReactNode } from "react";

import { Grid } from "@/components/grid";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "stretch";
type Columns = 1 | 2 | 3 | 4 | 5 | 6;

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Grid", componentId: "grid", registryOnly: true });

const cell: CSSProperties = {
  padding: "var(--primitiv-space-space-8) var(--primitiv-space-space-12)",
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
      [
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
          code={(_density, mode) =>
            [
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
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Grid columns={3} gap="md" justify="center" align="center">`,
              `  <div>One</div>`,
              `  <div>Two</div>`,
              `  <div>Three</div>`,
              `</Grid>`,
            ].join("\n")
          }
        >
          {() => (
            <Grid
              columns={3}
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

  accessibility: [
    "Grid renders a plain `<div>` — visual layout only, no semantics. When the items are a list, use `asChild` to render a `<ul>` so the count and structure are announced rather than flattened.",
    "The visual grid does **not** change DOM order, so keyboard focus and screen-reader reading order follow the source. Avoid using grid placement to reorder items away from a sensible reading order.",
    "Tracks are `minmax(0, 1fr)`, so a cell with long unbreakable content is clipped by its track rather than forcing the whole row wider — which keeps the layout (and horizontal scrolling) predictable for everyone.",
  ],
};
