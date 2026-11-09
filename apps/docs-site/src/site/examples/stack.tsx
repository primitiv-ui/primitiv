"use client";

import type { CSSProperties, ReactNode } from "react";

import { Stack } from "@/components/stack";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import { CELL_STYLE, withDemoCells, withRootStyle } from "./layout-demo";
import type { ComponentSpec } from "./types";

type Direction = "column" | "row" | "column-reverse" | "row-reverse";
type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";

/**
 * Stack is registry-only (RFC 0022), so `registryOnly` makes the import the
 * copied path — and there is no Headless tab, so every snippet on this page is
 * only ever shown in Styled mode. That is what lets these examples reference the
 * token scale and compose freely without a headless branch.
 */
const imports = (mode: Mode) =>
  importBlock({ mode, component: "Stack", componentId: "stack", registryOnly: true });

/* A visible demo cell — Stack itself paints nothing, so the preview needs
   children with a boundary to make direction/gap/alignment legible. Demo chrome,
   so the snippets show plain `<div>`s: the boxes' own styling is not what Stack
   does. */
const cell: CSSProperties = {
  padding: "var(--primitiv-space-space-8) var(--primitiv-space-space-12)",
  background: "var(--primitiv-surface-raised)",
  border: "var(--primitiv-border-width-1) solid var(--primitiv-border-subtle)",
  borderRadius: "var(--primitiv-radii-8)",
  color: "var(--primitiv-content-secondary)",
  whiteSpace: "nowrap",
};
const Cell = ({ children }: { children: ReactNode }) => (
  <div style={cell}>{children}</div>
);

/* A fixed preview height so the CROSS axis has slack in a row (for `align`) and
   the MAIN axis has slack in a column (for `justify`) — without it the Stack
   hugs its content on whichever axis is being tuned and the control looks dead.
   The cells are deliberately UNEVEN in both width and height (the middle one
   wraps to two lines) so `align` has something to move against on either
   axis. */
const playgroundBox: CSSProperties = { minBlockSize: "13rem" };

/** The Elements markup for a stack of plain `<div>` children. */
const stackHtml = (
  {
    direction = "column",
    gap = "md",
    align = "stretch",
    wrap = "nowrap",
    justify = "start",
  }: Partial<Record<"direction" | "gap" | "align" | "wrap" | "justify", string>>,
  children: readonly string[],
) =>
  [
    `<div class="primitiv-stack primitiv-stack--${direction} primitiv-stack--gap-${gap} primitiv-stack--align-${align} primitiv-stack--${wrap} primitiv-stack--justify-${justify}">`,
    ...children.map((c) => `  <div>${c}</div>`),
    `</div>`,
  ].join("\n");

const TAGS = [
  "Design",
  "Engineering",
  "Product",
  "Research",
  "Marketing",
  "Support",
  "Operations",
  "Finance",
];

/**
 * Stack's page content.
 *
 * A registry-only flex primitive whose five modifiers ARE the contract, so the
 * playground's controls are all derived — no spec-declared knobs. The examples
 * carry the axis model (direction, and that reversing is visual only), the
 * token-scaled density-aware `gap`, alignment on both axes, and wrapping.
 */
export const stackSpec: ComponentSpec = {
  playground: {
    component: "Stack",
    fill: true,
    /* `wrap` is dropped: it only shows an effect when the children overflow the
       main axis, which fights `justify` (free space) in the same fixed preview,
       so no cell-set demonstrates both. It has its own example below. The other
       four come from the contract's modifiers via `contractControls`. */
    excludeControls: ["wrap"],
    /* A custom snippet only because the generated `toJsx` would need placeholder
       children, which read better written out. */
    snippet: (values, mode) =>
      mode === "elements"
        ? stackHtml(values, ["One", "Two", "Three"])
        : [
        imports(mode),
        ``,
        `<Stack`,
        `  direction="${values.direction}"`,
        `  gap="${values.gap}"`,
        `  align="${values.align}"`,
        `  justify="${values.justify}"`,
        `>`,
        `  <div>One</div>`,
        `  <div>Two</div>`,
        `  <div>Three</div>`,
        `</Stack>`,
      ].join("\n"),
    /* The same slack and uneven middle cell as the React preview. */
    elementsPreview: (code) =>
      withDemoCells(
        withRootStyle(code, "primitiv-stack", "min-block-size: 13rem").replace(
          "<div>Two</div>",
          "<div>Two<br>lines</div>",
        ),
      ),
    render: (values) => (
      <Stack
        direction={values.direction as Direction}
        gap={values.gap as Gap}
        align={values.align as Align}
        justify={values.justify as Justify}
        style={playgroundBox}
      >
        <Cell>One</Cell>
        {/* Two lines + a longer label, so this cell is both taller and wider
            than its neighbours — that is what makes `align` visible on whichever
            axis is the cross axis. */}
        <div style={cell}>
          Two
          <br />
          lines
        </div>
        <Cell>Three</Cell>
      </Stack>
    ),
  },

  examples: [
    {
      id: "direction",
      title: "Direction",
      render: () => (
        <InteractiveExample
          elementsCaption={"`primitiv-stack--{direction}` sets the main axis. The default is `column` — a vertical stack — and `row` lays the children out horizontally. The two `-reverse` modifiers flip the visual order; see the note under Accessibility, because reversing is *visual only* and does not move the DOM order focus and screen readers follow."}
          caption={"`direction` sets the main axis. The default is `column` — a vertical stack — and `row` lays the children out horizontally. The two `-reverse` values flip the visual order; see the note under Accessibility, because reversing is *visual only* and does not move the DOM order focus and screen readers follow."}
          elementsPreview={(_density, code) => withDemoCells(code)}
          code={(_density, mode) =>
            mode === "elements"
              ? stackHtml({ direction: "row", gap: "sm" }, ["One", "Two", "Three"])
              : [
              imports(mode),
              ``,
              `<Stack direction="row" gap="sm">`,
              `  <div>One</div>`,
              `  <div>Two</div>`,
              `  <div>Three</div>`,
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm">
              <Cell>One</Cell>
              <Cell>Two</Cell>
              <Cell>Three</Cell>
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "gap",
      title: "Gap",
      render: () => (
        <InteractiveExample
          caption={"`gap` is a step on the space scale (`none`–`xl`), not a raw length — so the spacing stays on-system, and it **rescales with the nearest `data-density` ancestor**. Change the density above and the whole stack tightens or loosens: that is the Context system, resolved through `--primitiv-stack-gap-*`, not a fixed pixel value."}
          elementsCaption={"The `primitiv-stack--gap-*` classes are steps on the space scale (`none`–`xl`), not raw lengths — so the spacing stays on-system, and it **rescales with the nearest `data-density` ancestor**. Change the density above and the whole stack tightens or loosens: the attribute re-points `--primitiv-stack-gap-*` for everything inside it."}
          elementsPreview={(_density, code) => withDemoCells(code)}
          code={(density, mode) =>
            mode === "elements"
              ? [
                  `<div data-density="${density}">`,
                  ...stackHtml({ gap: "lg" }, ["One", "Two", "Three"])
                    .split("\n")
                    .map((l) => `  ${l}`),
                  `</div>`,
                ].join("\n")
              : [
              imports(mode),
              ``,
              `<div data-density="${density}">`,
              `  <Stack gap="lg">`,
              `    <div>One</div>`,
              `    <div>Two</div>`,
              `    <div>Three</div>`,
              `  </Stack>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack gap="lg">
              <Cell>One</Cell>
              <Cell>Two</Cell>
              <Cell>Three</Cell>
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "alignment",
      title: "Alignment",
      render: () => (
        <InteractiveExample
          elementsCaption={"Two axes: `primitiv-stack--align-*` positions children across the **cross** axis (the default `stretch` makes them fill it), and `primitiv-stack--justify-*` distributes them along the **main** axis, where `between`/`around`/`evenly` spread the free space. Both follow the direction, so on a row they mean the opposite screen axes they would on a column."}
          caption={"Two axes: `align` positions children across the **cross** axis (the default `stretch` makes them fill it — visible here because the cells have different heights), and `justify` distributes them along the **main** axis, where `between`/`around`/`evenly` spread the free space. Both follow `direction`, so on a `row` they mean the opposite screen axes they would on a `column`."}
          elementsPreview={(_density, code) =>
            withDemoCells(
              code.replace(
                "<div>A taller cell</div>",
                `<div style="${CELL_STYLE}; padding-block: var(--primitiv-space-space-24)">A taller cell</div>`,
              ),
            )
          }
          code={(_density, mode) =>
            mode === "elements"
              ? stackHtml(
                  { direction: "row", gap: "sm", align: "center", justify: "between" },
                  ["Short", "A taller cell", "End"],
                )
              : [
              imports(mode),
              ``,
              `<Stack direction="row" gap="sm" align="center" justify="between">`,
              `  <div>Short</div>`,
              `  <div>A taller cell</div>`,
              `  <div>End</div>`,
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm" align="center" justify="between">
              <Cell>Short</Cell>
              <div style={{ ...cell, paddingBlock: "var(--primitiv-space-space-24)" }}>
                A taller cell
              </div>
              <Cell>End</Cell>
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "wrapping",
      title: "Wrapping",
      render: () => (
        <InteractiveExample
          caption={"`wrap` defaults to `nowrap`, so a row that runs out of space overflows. Set `wrap=\"wrap\"` and the children break onto new lines instead — the usual choice for a row of tags or filters that must survive a narrow container. The `gap` applies between wrapped lines too."}
          elementsCaption={"`primitiv-stack--nowrap` is the default, so a row that runs out of space overflows. Swap in `primitiv-stack--wrap` and the children break onto new lines instead — the usual choice for a row of tags or filters that must survive a narrow container. The gap applies between wrapped lines too."}
          elementsPreview={(_density, code) => withDemoCells(code)}
          code={(_density, mode) =>
            mode === "elements"
              ? stackHtml({ direction: "row", gap: "sm", wrap: "wrap" }, TAGS)
              : [
              imports(mode),
              ``,
              `<Stack direction="row" gap="sm" wrap="wrap">`,
              `  {tags.map((t) => (`,
              `    <div key={t}>{t}</div>`,
              `  ))}`,
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack direction="row" gap="sm" wrap="wrap">
              {TAGS.map((t) => (
                <Cell key={t}>{t}</Cell>
              ))}
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A flex container as classes: `primitiv-stack` plus one modifier per axis — direction, a token-scaled gap, cross-axis `align`, main-axis `justify` and `wrap`. Every modifier has a default, so write all five or rely on the stylesheet's.",
    accessibility: [
      "The class adds no role or semantics — it is pure layout, so a screen reader sees straight through it to the children.",
      "When the group *is* something — a list, a set of navigation links — put the class on the right element (`<ul>`, `<nav>`, `<ol>`) instead of an anonymous `<div>`, so the structure is announced rather than flattened.",
      "`primitiv-stack--row-reverse` and `--column-reverse` change the **visual** order only. Keyboard focus and screen-reader reading order still follow the source, so reorder the markup instead when the reading order is meant to change too.",
      "The gap is space between items, not padding — the stack adds no inset of its own, so it never introduces a focus-ring-clipping edge.",
    ],
  },

  accessibility: [
    "Stack renders a plain `<div>` with no role or semantics — it is pure layout, so a screen reader sees straight through it to the children.",
    "When the group *is* something — a list, a set of navigation links — use `asChild` to render the right element (`<ul>`, `<nav>`, `<ol>`) instead of an anonymous `<div>`, so the structure is announced rather than flattened.",
    "`row-reverse` and `column-reverse` change the **visual** order only. The DOM order is unchanged, so keyboard focus and screen-reader reading order still follow the source — reverse a stack and they will disagree with what is on screen. Reorder the markup instead when the reading order is meant to change too.",
    "`gap` is space between items, not padding — Stack adds no inset of its own, so it never introduces a focus-ring-clipping edge. The children keep their own hit areas.",
  ],
};
