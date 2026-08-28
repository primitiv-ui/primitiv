"use client";

import type { CSSProperties, ReactNode } from "react";

import { Container } from "@/components/container";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Gutter = "responsive" | "none" | "sm" | "md" | "lg";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Container", componentId: "container", registryOnly: true });

/* The Container gets a dashed outline so its capped, centred width is visible;
   the inner block is filled so the gutter (the Container's inline padding) reads
   as the inset between the two. */
const outline: CSSProperties = {
  border: "var(--primitiv-border-width-1) dashed var(--primitiv-border-default)",
  borderRadius: "var(--primitiv-radii-8)",
};
const content: CSSProperties = {
  padding: "var(--primitiv-space-space-12)",
  background: "var(--primitiv-surface-raised)",
  borderRadius: "var(--primitiv-radii-8)",
  color: "var(--primitiv-content-secondary)",
  textAlign: "center",
};
const Content = ({ children }: { children: ReactNode }) => (
  <div style={content}>{children}</div>
);

/**
 * Container's page content.
 *
 * Registry-only, two modifiers (`size`, `gutter`). A centred, max-width content
 * column — the outermost wrapper on a page, capping the line length and holding
 * the page gutters. `gutter` sets the inline padding, and `responsive`
 * escalates it at the md and lg breakpoints.
 *
 * `size` is EXCLUDED from the playground: its caps run 360px (xs) to 1536px
 * (2xl), and the preview is ~590px wide, so only `xs` would visibly cap while
 * `sm`–`full` all render at the preview width — a control that looks dead. It is
 * demonstrated in the "Capping the content width" example instead, at a width
 * where the cap is real. Same call as Stack's `wrap`.
 */
export const containerSpec: ComponentSpec = {
  playground: {
    component: "Container",
    fill: true,
    excludeControls: ["size"],
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        `<Container gutter="${values.gutter}">`,
        `  {/* page content */}`,
        `</Container>`,
      ].join("\n"),
    render: (values) => (
      <Container gutter={values.gutter as Gutter} style={outline}>
        <Content>gutter={values.gutter}</Content>
      </Container>
    ),
  },

  examples: [
    {
      id: "width",
      title: "Capping the content width",
      render: () => (
        <InteractiveExample
          caption={"The Container's main job: cap how wide content can grow and centre it, so a long line of text never runs the full width of a large monitor. `size` picks the cap from the breakpoint scale — `md` for a reading column, `xl`/`2xl` for an app shell, `full` to opt out. It centres itself, so you do not add margins."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Container size="md">`,
              `  <article>{/* a comfortable reading column */}</article>`,
              `</Container>`,
            ].join("\n")
          }
        >
          {() => (
            <Container size="xs" style={outline}>
              <Content>A capped, centred column</Content>
            </Container>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "gutter",
      title: "Gutters",
      render: () => (
        <InteractiveExample
          caption={"`gutter` is the inline padding that keeps content off the screen edges on narrow viewports. The default `responsive` starts tight and escalates at the md and lg breakpoints, which is what you want for a page shell; the fixed steps (`sm`/`md`/`lg`) pin one value at every width, and `none` removes it for a Container that sits inside something already padded."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Container gutter="responsive">{/* escalates at md / lg */}</Container>`,
              `<Container gutter="lg">{/* a fixed, generous inset */}</Container>`,
              `<Container gutter="none">{/* already padded by a parent */}</Container>`,
            ].join("\n")
          }
        >
          {() => (
            <Container size="full" gutter="lg" style={outline}>
              <Content>Inset from the edges by the gutter</Content>
            </Container>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "Container renders a plain `<div>` — it is layout, not structure. Use `asChild` to render the real landmark it usually wraps (`<main>`, `<header>`) rather than nesting one inside an anonymous `<div>`.",
    "Capping the line length is itself an accessibility win: over-long lines are hard to track back to the next line, so a `md`-width reading column helps low-vision and dyslexic readers, not just aesthetics.",
    "It adds no interactive or ARIA surface of its own; the semantics come from what you put inside it.",
  ],
};
