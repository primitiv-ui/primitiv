"use client";

import type { CSSProperties, ReactNode } from "react";

import { Stack } from "@/components/stack";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Direction = "column" | "row" | "column-reverse" | "row-reverse";
type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";
type Wrap = "nowrap" | "wrap";

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
    /* The five controls come from the contract's modifiers via
       `contractControls` — direction, gap, align, wrap, justify. A custom
       snippet only because the generated `toJsx` would need placeholder
       children, which reads better written out than threaded through
       `snippetChildren`. */
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        `<Stack`,
        `  direction="${values.direction}"`,
        `  gap="${values.gap}"`,
        `  align="${values.align}"`,
        `  justify="${values.justify}"`,
        `  wrap="${values.wrap}"`,
        `>`,
        `  <div>One</div>`,
        `  <div>Two</div>`,
        `  <div>Three</div>`,
        `</Stack>`,
      ].join("\n"),
    render: (values) => (
      <Stack
        direction={values.direction as Direction}
        gap={values.gap as Gap}
        align={values.align as Align}
        justify={values.justify as Justify}
        wrap={values.wrap as Wrap}
      >
        <Cell>One</Cell>
        <Cell>Two</Cell>
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
          caption={"`direction` sets the main axis. The default is `column` — a vertical stack — and `row` lays the children out horizontally. The two `-reverse` values flip the visual order; see the note under Accessibility, because reversing is *visual only* and does not move the DOM order focus and screen readers follow."}
          code={(_density, mode) =>
            [
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
          code={(density, mode) =>
            [
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
          caption={"Two axes: `align` positions children across the **cross** axis (the default `stretch` makes them fill it — visible here because the cells have different heights), and `justify` distributes them along the **main** axis, where `between`/`around`/`evenly` spread the free space. Both follow `direction`, so on a `row` they mean the opposite screen axes they would on a `column`."}
          code={(_density, mode) =>
            [
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
          code={(_density, mode) =>
            [
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
              {[
                "Design",
                "Engineering",
                "Product",
                "Research",
                "Marketing",
                "Support",
                "Operations",
                "Finance",
              ].map((t) => (
                <Cell key={t}>{t}</Cell>
              ))}
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "Stack renders a plain `<div>` with no role or semantics — it is pure layout, so a screen reader sees straight through it to the children.",
    "When the group *is* something — a list, a set of navigation links — use `asChild` to render the right element (`<ul>`, `<nav>`, `<ol>`) instead of an anonymous `<div>`, so the structure is announced rather than flattened.",
    "`row-reverse` and `column-reverse` change the **visual** order only. The DOM order is unchanged, so keyboard focus and screen-reader reading order still follow the source — reverse a stack and they will disagree with what is on screen. Reorder the markup instead when the reading order is meant to change too.",
    "`gap` is space between items, not padding — Stack adds no inset of its own, so it never introduces a focus-ring-clipping edge. The children keep their own hit areas.",
  ],
};
