"use client";

import type { CSSProperties } from "react";

import { Divider } from "@/components/divider";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

/**
 * The Divider import, in the current mode.
 *
 * A single part, so unlike Select there are no part names to disagree about —
 * only the specifier changes (`@primitiv-ui/react` vs the copied
 * `@/components/ui/divider`). `orientation` is a real prop of the primitive in
 * BOTH modes, so it needs none of `contractAttr`'s styled-vs-headless handling.
 *
 * The layout scaffolding in these examples is plain flex on a `<div>`, NOT a
 * `Stack`: `Stack` is a registry-only styled surface, so naming it in a snippet
 * a headless consumer reads points at an import they do not have. Divider is the
 * subject here, so the surrounding box stays mode-neutral — the only thing that
 * changes between modes is the Divider import line.
 */
const imports = (mode: Mode) =>
  importBlock({ mode, component: "Divider", componentId: "divider" });

/* Shared demo scaffolding. Kept as constants so the live render and the snippet
   string below it stay in exact parity — the snippet shows the same inline
   style the preview applies. */
const columnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};
const rowStyle: CSSProperties = { display: "flex", gap: "1rem" };

/** Reserve space through the knob for the block-flow example, via a real token. */
const reservedSpacing = {
  "--primitiv-divider-spacing": "var(--primitiv-space-space-16)",
} as CSSProperties;

/**
 * Divider's page content.
 *
 * A single-part, non-interactive primitive, so there is no anatomy tree and no
 * keyboard model to document — a separator has neither. The one knob worth a
 * control is `orientation`, and the examples carry the two things a props table
 * cannot: that a vertical rule needs a flex row to take its height, and that the
 * component reserves no separation of its own on purpose.
 */
export const dividerSpec: ComponentSpec = {
  playground: {
    component: "Divider",
    fill: true,
    /*
     * `orientation` is a HEADLESS prop — it sets `aria-orientation` and picks
     * the axis — not a `contract.json` modifier, so `contractControls` finds
     * nothing and this is the page's only control. Being spec-declared, it is
     * kept under the Headless tab rather than dropped (it exists in both modes),
     * which is exactly why the playground needs its own `snippet`: the generated
     * path drops every control under Headless and would print a bare `<Divider />`
     * there, hiding the one thing the control changes.
     */
    controls: [
      {
        name: "orientation",
        options: ["horizontal", "vertical"],
        defaultValue: "horizontal",
        description:
          "Axis the rule runs along. Sets `aria-orientation` on the `role=\"separator\"` element and switches between a full-width and a full-height hairline.",
      },
    ],
    snippet: (values, mode) =>
      [imports(mode), ``, `<Divider orientation="${values.orientation}" />`].join(
        "\n",
      ),
    render: (values) => {
      const orientation = (values.orientation ?? "horizontal") as
        | "horizontal"
        | "vertical";

      /* A vertical rule takes its height from its flex row (a flex item stretches
         to the cross-axis by default), so the preview has to give it one. A
         horizontal rule spans the filled preview on its own. */
      return orientation === "vertical" ? (
        <div style={rowStyle}>
          <span>Overview</span>
          <Divider orientation="vertical" />
          <span>Pricing</span>
          <Divider orientation="vertical" />
          <span>Docs</span>
        </div>
      ) : (
        <div style={columnStyle}>
          <span>Section one</span>
          <Divider />
          <span>Section two</span>
        </div>
      );
    },
  },

  examples: [
    {
      id: "separating-sections",
      title: "Separating sections",
      render: () => (
        <InteractiveExample
          caption={"The default: a full-width hairline that spans its container and reads as a real `role=\"separator\"` to assistive tech. Note the breathing room around it is the container's `gap`, not the rule — `Divider` reserves no separation of its own (see below)."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>`,
              `  <section>{/* ... */}</section>`,
              `  <Divider />`,
              `  <section>{/* ... */}</section>`,
              `</div>`,
            ].join("\n")
          }
        >
          {/* `docs-example-stack` claims the full column so the rule spans;
              the centred `docs-example-row` default would shrink this to the
              text width. The snippet shows the plain flex column a reader
              writes — a block container is full-width in real markup without
              the harness's help. */}
          {() => (
            <div className="docs-example-stack">
              <span>Section one</span>
              <Divider />
              <span>Section two</span>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "vertical-rule",
      title: "A vertical rule",
      render: () => (
        <InteractiveExample
          caption={"`orientation=\"vertical\"` sets `aria-orientation` and turns the rule 90°. A vertical divider takes its height from the flex row it sits in — a flex item stretches to the row's cross-axis by default — so a plain block or column gives it no height to span. Ideal between inline metadata or toolbar groups."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<div style={{ display: "flex", gap: "1rem" }}>`,
              `  <span>Overview</span>`,
              `  <Divider orientation="vertical" />`,
              `  <span>Pricing</span>`,
              `  <Divider orientation="vertical" />`,
              `  <span>Docs</span>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={rowStyle}>
              <span>Overview</span>
              <Divider orientation="vertical" />
              <span>Pricing</span>
              <Divider orientation="vertical" />
              <span>Docs</span>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "spacing",
      title: "Spacing belongs to the container",
      render: () => (
        <InteractiveExample
          caption="`Divider` ships **no margin** by default — separation is the container's job. A gap-based container already spaces its children, and a margin baked into the rule would double that, could never reach `0`, and could not track `data-density`. For a plain block-flow context that has no gap of its own, reach for the escape hatch: set `--primitiv-divider-spacing` to reserve margin along the rule's axis."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `{/* Plain block flow — no container gap, so the rule reserves its own. */}`,
              `<article>`,
              `  <p>{/* ... */}</p>`,
              `  <Divider style={{ "--primitiv-divider-spacing": "var(--primitiv-space-space-16)" }} />`,
              `  <p>{/* ... */}</p>`,
              `</article>`,
            ].join("\n")
          }
        >
          {/* Full-width block flow, no container gap — the only separation is
              the rule's own reserved margin, which is the point. */}
          {() => (
            <div style={{ width: "100%" }}>
              <p>Above the rule.</p>
              <Divider style={reservedSpacing} />
              <p>Below the rule.</p>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "decorative",
      title: "Decorative vs semantic",
      render: () => (
        <InteractiveExample
          caption={"Left to itself, a `Divider` announces as a separator. When the rule is purely visual — the surrounding structure already groups the content — pass `aria-hidden=\"true\"` to drop it from the accessibility tree so a screen reader is not told about a line that carries no meaning. Keep the semantic form when the divider genuinely separates distinct groups, like sections of a menu."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `{/* Semantic: a real boundary between content groups. */}`,
              `<Divider />`,
              ``,
              `{/* Decorative: purely visual, hidden from assistive tech. */}`,
              `<Divider aria-hidden="true" />`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <span>Semantic separator</span>
              <Divider />
              <span>Decorative rule</span>
              <Divider aria-hidden="true" />
              <span>End</span>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "The rule renders as `<span role=\"separator\">`, so assistive tech announces it as a boundary between content groups rather than as decoration.",
    "`orientation` sets `aria-orientation` on that element — `\"horizontal\"` (the default) or `\"vertical\"` — so the announced axis matches what is drawn.",
    "There is no keyboard interaction: a separator is not focusable and takes no input, which is correct — it marks a boundary, it does not act on one.",
    "For a purely decorative rule, pass `aria-hidden=\"true\"`. A separator whose meaning is already carried by the surrounding structure is noise in the accessibility tree, and hiding it is the right call there.",
  ],
};
