"use client";

import { Fragment } from "react";

import { DescriptionList } from "@/components/description-list";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Layout = "stacked" | "inline";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "DescriptionList", componentId: "description-list", registryOnly: true });

const PAIRS: readonly [string, string][] = [
  ["Version", "0.1.32"],
  ["License", "MIT"],
  ["Registry", "primitiv add"],
];

/* dt and dd are SIBLINGS in a <dl>, so each pair is a keyed Fragment — not a
   wrapper element, which would be invalid inside a <dl>. */
const Pairs = () => (
  <>
    {PAIRS.map(([term, detail]) => (
      <Fragment key={term}>
        <DescriptionList.Term>{term}</DescriptionList.Term>
        <DescriptionList.Details>{detail}</DescriptionList.Details>
      </Fragment>
    ))}
  </>
);

/**
 * A description list as Elements markup (RFC 0033): a `<dl>` with the layout and
 * size classes, and a classed `<dt>` + `<dd>` per pair. No behaviour, no script.
 */
const html = (
  pairs: readonly (readonly [string, string])[],
  { layout = "stacked", size = "md" }: { layout?: string; size?: string } = {},
) =>
  [
    `<dl class="primitiv-description-list primitiv-description-list--${size} primitiv-description-list--${layout}">`,
    ...pairs.flatMap(([term, detail]) => [
      `  <dt class="primitiv-description-list__term">${term}</dt>`,
      `  <dd class="primitiv-description-list__details">${detail}</dd>`,
    ]),
    `</dl>`,
  ].join("\n");

/**
 * DescriptionList's page content.
 *
 * Registry-only. A `<dl>` compound — one `DescriptionList.Term` (`<dt>`) + one
 * `DescriptionList.Details` (`<dd>`) per pair. `layout` picks `stacked` (dt
 * above dd) or `inline` (dt : dd side by side); `size` scales the pair.
 */
export const descriptionListSpec: ComponentSpec = {
  playground: {
    component: "DescriptionList",
    fill: true,
    snippet: (values, mode) =>
      mode === "elements" ? html(PAIRS.slice(0, 2), { layout: values.layout, size: values.size }) : [
        imports(mode),
        ``,
        `<DescriptionList layout="${values.layout}" size="${values.size}">`,
        `  <DescriptionList.Term>Version</DescriptionList.Term>`,
        `  <DescriptionList.Details>0.1.32</DescriptionList.Details>`,
        `  <DescriptionList.Term>License</DescriptionList.Term>`,
        `  <DescriptionList.Details>MIT</DescriptionList.Details>`,
        `</DescriptionList>`,
      ].join("\n"),
    render: (values) => (
      <DescriptionList
        layout={values.layout as Layout}
        size={values.size as Size}
      >
        <Pairs />
      </DescriptionList>
    ),
  },

  examples: [
    {
      id: "stacked-inline",
      title: "Stacked and inline",
      render: () => (
        <InteractiveExample
          elementsCaption="The layout class picks how each pair reads: `primitiv-description-list--stacked` puts the `<dd>` under its `<dt>` (indented) for longer values, `primitiv-description-list--inline` sets them `dt : dd` side by side for a compact key/value table — the metadata block on a settings page or a package summary."
          caption="`layout` picks how each pair reads: `stacked` puts the `<dd>` under its `<dt>` (indented) for longer values, `inline` sets them `dt : dd` side by side for a compact key/value table — the metadata block on a settings page or a package summary."
          code={(_density, mode) =>
            mode === "elements"
              ? [html(PAIRS, { layout: "stacked" }), html(PAIRS, { layout: "inline" })].join("\n\n")
              : [
              imports(mode),
              ``,
              `<DescriptionList layout="inline">`,
              `  <DescriptionList.Term>Version</DescriptionList.Term>`,
              `  <DescriptionList.Details>0.1.32</DescriptionList.Details>`,
              `</DescriptionList>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <DescriptionList layout="stacked">
                <Pairs />
              </DescriptionList>
              <DescriptionList layout="inline">
                <Pairs />
              </DescriptionList>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  anatomyMeta:
    "Three parts: `DescriptionList` renders the `<dl>` and owns `layout`/`size`; compose one `DescriptionList.Term` (`<dt>`) and one `DescriptionList.Details` (`<dd>`) per pair.",
  anatomy: [
    {
      label: "Parts",
      code: (mode) =>
        mode === "elements"
          ? [
              `<dl class="primitiv-description-list">`,
              `  <dt class="primitiv-description-list__term"></dt>`,
              `  <dd class="primitiv-description-list__details"></dd>`,
              `</dl>`,
            ].join("\n")
          : [
          "<DescriptionList>",
          "  <DescriptionList.Term />",
          "  <DescriptionList.Details />",
          "</DescriptionList>",
        ].join("\n"),
    },
  ],

  elements: {
    anatomyMeta:
      "Three parts: the `<dl>` carries the layout and size classes; write one `<dt class=\"primitiv-description-list__term\">` and one `<dd class=\"primitiv-description-list__details\">` per pair.",
    accessibility: [
      "Use a real `<dl>`/`<dt>`/`<dd>`, so assistive tech announces the term/description association — the classes only style that structure.",
      "Write one `<dt>` and one `<dd>` per pair in source order; the association is positional in a `<dl>`, so keeping them adjacent is what makes the pairing correct for a screen reader.",
      "It is content, not a control — no focus or keyboard surface, and no script.",
    ],
  },

  accessibility: [
    "The component renders a real `<dl>`/`<dt>`/`<dd>`, so assistive tech announces the term/description association — the styling never replaces that structure.",
    "Compose one `Term` and one `Details` per pair in source order; the association is positional in a `<dl>`, so keeping them adjacent is what makes the pairing correct for a screen reader.",
    "It is content, not a control — no focus or keyboard surface of its own.",
  ],
};
