"use client";

import { List } from "@/components/list";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type ListType = "unordered" | "ordered";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "List", componentId: "list", registryOnly: true });

const ITEMS = ["Ships with zero styles", "Accessible by construction", "Yours to restyle"];

/**
 * A list as Elements markup (RFC 0033): `<ul>`/`<ol>` with the modifier classes,
 * each `<li>` with its content in the span the styled wrapper renders (the row
 * is a flex box, so mixed inline content needs one block to sit in). No
 * behaviour, no script.
 */
const html = (
  items: readonly string[],
  {
    type = "unordered",
    marker = true,
    indent = true,
    size = "md",
  }: { type?: string; marker?: boolean; indent?: boolean; size?: string } = {},
) => {
  const element = type === "ordered" ? "ol" : "ul";
  const classes = [
    "primitiv-list",
    `primitiv-list--${type}`,
    ...(marker ? [] : ["primitiv-list--no-marker"]),
    ...(indent ? ["primitiv-list--indent"] : []),
    `primitiv-list--${size}`,
  ].join(" ");
  return [
    `<${element} class="${classes}">`,
    ...items.map(
      (item) =>
        `  <li class="primitiv-list__item"><span class="primitiv-list__item-content">${item}</span></li>`,
    ),
    `</${element}>`,
  ].join("\n");
};

/**
 * List's page content.
 *
 * Registry-only. `List` renders the `<ul>`/`<ol>`; `List.Item` the `<li>`.
 * `type` picks the element, and `marker`/`indent` toggle the bullet and the
 * inset independently — a `marker={false} indent={false}` list is a flush prose
 * list that is still a real `<ul>`.
 */
export const listSpec: ComponentSpec = {
  playground: {
    component: "List",
    fill: true,
    snippet: (values, mode) => {
      if (mode === "elements")
        return html(ITEMS, {
          type: values.type,
          marker: values.marker !== "false",
          indent: values.indent !== "false",
          size: values.size,
        });
      const attrs = [
        `type="${values.type}"`,
        values.marker === "false" ? "marker={false}" : "",
        values.indent === "false" ? "indent={false}" : "",
        `size="${values.size}"`,
      ]
        .filter(Boolean)
        .join(" ");
      return [
        imports(mode),
        ``,
        `<List ${attrs}>`,
        `  <List.Item>Ships with zero styles</List.Item>`,
        `  <List.Item>Accessible by construction</List.Item>`,
        `  <List.Item>Yours to restyle</List.Item>`,
        `</List>`,
      ].join("\n");
    },
    render: (values) => (
      <List
        type={values.type as ListType}
        marker={values.marker !== "false"}
        indent={values.indent !== "false"}
        size={values.size as Size}
      >
        {ITEMS.map((t) => (
          <List.Item key={t}>{t}</List.Item>
        ))}
      </List>
    ),
  },

  examples: [
    {
      id: "ordered-unordered",
      title: "Ordered and unordered",
      render: () => (
        <InteractiveExample
          elementsCaption="Write a `<ul>` with `primitiv-list--unordered` for token-coloured bullets, or an `<ol>` with `primitiv-list--ordered` for numbers. The markers are drawn by the stylesheet, not the browser default, so they take the type colour and sit on the baseline."
          caption="`type` picks the element and the marker: `unordered` is a `<ul>` with token-coloured bullets, `ordered` an `<ol>` with numbers. The markers are drawn by the component, not the browser default, so they inherit the type colour and sit on the baseline."
          code={(_density, mode) =>
            mode === "elements"
              ? [html(ITEMS), html(["Run the CLI", "Copy the files", "Edit them"], { type: "ordered" })].join("\n\n")
              : [
              imports(mode),
              ``,
              `<List type="ordered">`,
              `  <List.Item>Run the CLI</List.Item>`,
              `  <List.Item>Copy the files</List.Item>`,
              `  <List.Item>Edit them</List.Item>`,
              `</List>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", gap: "3rem" }}>
              <List type="unordered">
                {ITEMS.map((t) => (
                  <List.Item key={t}>{t}</List.Item>
                ))}
              </List>
              <List type="ordered">
                <List.Item>Run the CLI</List.Item>
                <List.Item>Copy the files</List.Item>
                <List.Item>Edit them</List.Item>
              </List>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "flush",
      title: "A flush prose list",
      render: () => (
        <InteractiveExample
          elementsCaption="`primitiv-list--no-marker` drops the bullet (the equivalent of `list-style: none`, gap and all), and leaving out `primitiv-list--indent` removes the inset — together they give a list that reads as plain lines, for prose or a nav, while staying a real `<ul>` so its semantics are unchanged. The two are independent."
          caption="`marker={false}` drops the bullet (the equivalent of `list-style: none`, gap and all) and `indent={false}` removes the inset — combine both for a list that reads as plain lines, for prose or a nav, while staying a real `<ul>` so its semantics are unchanged. The two are independent."
          code={(_density, mode) =>
            mode === "elements"
              ? html(ITEMS.slice(0, 2), { marker: false, indent: false })
              : [
              imports(mode),
              ``,
              `<List marker={false} indent={false}>`,
              `  <List.Item>Ships with zero styles</List.Item>`,
              `  <List.Item>Accessible by construction</List.Item>`,
              `</List>`,
            ].join("\n")
          }
        >
          {() => (
            <List marker={false} indent={false}>
              {ITEMS.map((t) => (
                <List.Item key={t}>{t}</List.Item>
              ))}
            </List>
          )}
        </InteractiveExample>
      ),
    },
  ],

  anatomyMeta:
    "Two parts: `List` renders the `<ul>` or `<ol>` (per `type`) and owns the marker/indent/size knobs; `List.Item` renders each `<li>`.",
  anatomy: [
    {
      label: "Parts",
      code: (mode) =>
        mode === "elements"
          ? [
              `<ul class="primitiv-list">`,
              `  <li class="primitiv-list__item">`,
              `    <span class="primitiv-list__item-content"></span>`,
              `  </li>`,
              `</ul>`,
            ].join("\n")
          : ["<List>", "  <List.Item />", "</List>"].join("\n"),
    },
  ],

  elements: {
    anatomyMeta:
      "Two parts: the `<ul>` or `<ol>` carries the type, marker, indent and size classes; each `<li class=\"primitiv-list__item\">` holds its content in a `primitiv-list__item-content` span, the block the row lays out beside its marker.",
    accessibility: [
      "Use a real `<ul>` or `<ol>` with real `<li>` items, so assistive tech announces the item count and position — dropping the marker with `primitiv-list--no-marker` changes the look, never the semantics.",
      "The markers are drawn by the stylesheet rather than `list-style`, so they take the type colour and stay aligned, but they remain decoration on top of the native list structure.",
      "`data-disabled` on an item dims the row (50% opacity) as a visual state only — a list item is not itself a control.",
    ],
  },

  accessibility: [
    "List renders a real `<ul>` or `<ol>` and `List.Item` a real `<li>`, so assistive tech announces the item count and position — dropping the marker with `marker={false}` changes the look, never the semantics.",
    "The markers are drawn by the component rather than `list-style`, so they take the type colour and stay aligned, but they remain decoration on top of the native list structure.",
    "`List.Item` accepts `disabled`, which dims the row (50% opacity) as a visual state — it is presentational here, since a list item is not itself a control.",
  ],
};
