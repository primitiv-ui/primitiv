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
      [
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
          caption="`layout` picks how each pair reads: `stacked` puts the `<dd>` under its `<dt>` (indented) for longer values, `inline` sets them `dt : dd` side by side for a compact key/value table — the metadata block on a settings page or a package summary."
          code={(_density, mode) =>
            [
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
      code: () =>
        [
          "<DescriptionList>",
          "  <DescriptionList.Term />",
          "  <DescriptionList.Details />",
          "</DescriptionList>",
        ].join("\n"),
    },
  ],

  accessibility: [
    "The component renders a real `<dl>`/`<dt>`/`<dd>`, so assistive tech announces the term/description association — the styling never replaces that structure.",
    "Compose one `Term` and one `Details` per pair in source order; the association is positional in a `<dl>`, so keeping them adjacent is what makes the pairing correct for a screen reader.",
    "It is content, not a control — no focus or keyboard surface of its own.",
  ],
};
