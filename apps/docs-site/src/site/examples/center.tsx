"use client";

import type { CSSProperties, ReactNode } from "react";

import { Center } from "@/components/center";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Axis = "both" | "horizontal" | "vertical";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Center", componentId: "center", registryOnly: true });

/* A bordered box larger than its child, so where the child sits is visible.
   Centering needs slack on the axis being centred — height for vertical, width
   for horizontal — so the frame fixes a height and fills the width. */
const frame: CSSProperties = {
  minBlockSize: "12rem",
  inlineSize: "100%",
  border: "var(--primitiv-border-width-1) solid var(--primitiv-border-subtle)",
  borderRadius: "var(--primitiv-radii-8)",
};
const puck: CSSProperties = {
  padding: "var(--primitiv-space-space-8) var(--primitiv-space-space-16)",
  background: "var(--primitiv-surface-raised)",
  borderRadius: "var(--primitiv-radii-8)",
  color: "var(--primitiv-content-secondary)",
};
const Puck = ({ children }: { children: ReactNode }) => (
  <div style={puck}>{children}</div>
);

/** The preview's frame and puck, as HTML style values. */
const FRAME_STYLE =
  "min-block-size: 12rem; inline-size: 100%; border: var(--primitiv-border-width-1) solid var(--primitiv-border-subtle); border-radius: var(--primitiv-radii-8)";
const PUCK_STYLE =
  "padding: var(--primitiv-space-space-8) var(--primitiv-space-space-16); background: var(--primitiv-surface-raised); border-radius: var(--primitiv-radii-8); color: var(--primitiv-content-secondary)";

const centerHtml = (axis: string, child: string, style = "") =>
  [
    `<div class="primitiv-center primitiv-center--${axis}"${style ? ` style="${style}"` : ""}>`,
    `  ${child}`,
    `</div>`,
  ].join("\n");

/** Frames each centring box (replacing any demo `min-block-size`) and fills its child. */
const elementsDemo = (code: string) =>
  code
    .replace(/ style="min-block-size: 12rem"/g, "")
    .replaceAll('<div class="primitiv-center ', `<div style="${FRAME_STYLE}" class="primitiv-center `)
    .replace(/<(p|button)>/g, `<$1 style="${PUCK_STYLE}; margin: 0">`);

/**
 * Center's page content.
 *
 * Registry-only, one modifier (`axis`). A Flexbox centring box — the
 * two-declaration idiom (`display: flex; place-items: center`) you would
 * otherwise re-type on every hero, empty state, or icon button. The examples
 * cover both-axis and single-axis centring; centring only shows when the box is
 * larger than its child, so the demos give it room.
 */
export const centerSpec: ComponentSpec = {
  playground: {
    component: "Center",
    fill: true,
    snippet: (values, mode) =>
      mode === "elements"
        ? centerHtml(values.axis, "<p>Centered content</p>")
        : [
        imports(mode),
        ``,
        `<Center axis="${values.axis}">`,
        `  <p>Centered content</p>`,
        `</Center>`,
      ].join("\n"),
    elementsPreview: elementsDemo,
    render: (values) => (
      <Center axis={values.axis as Axis} style={frame}>
        <Puck>Centered</Puck>
      </Center>
    ),
  },

  examples: [
    {
      id: "both",
      title: "Both axes",
      render: () => (
        <InteractiveExample
          caption={"The default. `axis=\"both\"` centres its child horizontally and vertically — the empty-state message in a panel, a spinner while data loads, the glyph inside an icon button. It replaces the `display: flex; place-items: center` you would otherwise hand-write every time, and it only takes effect when the box is taller and wider than the child."}
          elementsCaption={"The default. `primitiv-center--both` centres its child horizontally and vertically — the empty-state message in a panel, a spinner while data loads. It replaces the `display: flex; place-items: center` you would otherwise hand-write every time, and it only takes effect when the box is taller and wider than the child."}
          elementsPreview={(_density, code) => elementsDemo(code)}
          code={(_density, mode) =>
            mode === "elements"
              ? centerHtml("both", "<p>Nothing here yet</p>", "min-block-size: 12rem")
              : [
              imports(mode),
              ``,
              `<Center style={{ minBlockSize: "12rem" }}>`,
              `  <p>Nothing here yet</p>`,
              `</Center>`,
            ].join("\n")
          }
        >
          {() => (
            <Center style={frame}>
              <Puck>Nothing here yet</Puck>
            </Center>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "single-axis",
      title: "One axis only",
      render: () => (
        <InteractiveExample
          caption={"`axis=\"horizontal\"` centres across the inline axis but leaves the block axis alone (the child stays at the top); `axis=\"vertical\"` does the reverse. Reach for a single axis when only one direction needs centring — a call-to-action centred across a section but sitting at its natural vertical position."}
          elementsCaption={"`primitiv-center--horizontal` centres across the inline axis but leaves the block axis alone (the child stays at the top); `primitiv-center--vertical` does the reverse. Reach for a single axis when only one direction needs centring."}
          elementsPreview={(_density, code) =>
            `<div style="display: flex; gap: 1rem; inline-size: 100%">${elementsDemo(code).replaceAll("inline-size: 100%", "flex: 1")}</div>`
          }
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  centerHtml("horizontal", "<p>horizontal</p>"),
                  centerHtml("vertical", "<p>vertical</p>"),
                ].join("\n")
              : [
              imports(mode),
              ``,
              `<Center axis="horizontal">`,
              `  <button>Get started</button>`,
              `</Center>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", gap: "1rem" }}>
              <Center axis="horizontal" style={frame}>
                <Puck>horizontal</Puck>
              </Center>
              <Center axis="vertical" style={frame}>
                <Puck>vertical</Puck>
              </Center>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A flexbox centring box: `primitiv-center` plus an axis modifier. Centring only shows when the box is larger than its child, so give it room.",
    accessibility: [
      "The class adds no semantics — it is a layout wrapper, so a screen reader reads straight through to the child.",
      "When the centred region is a landmark or a labelled section, put the class on the right element (`<section>`, `<main>`) rather than an anonymous `<div>`.",
      "Centring is purely visual and does not touch DOM order, so reading and focus order are unaffected.",
    ],
  },

  accessibility: [
    "Center renders a plain `<div>` with no semantics — it is a layout wrapper, so a screen reader reads straight through to the child.",
    "When the centred region is a landmark or a labelled section, use `asChild` to render the right element (`<section>`, `<main>`) rather than nesting one inside an anonymous `<div>`.",
    "Centring is purely visual and does not touch DOM order, so reading and focus order are unaffected — safe to use anywhere without desyncing the tab sequence.",
  ],
};
