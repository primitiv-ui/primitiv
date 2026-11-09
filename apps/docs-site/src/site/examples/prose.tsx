"use client";

import { Prose } from "@/components/prose";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Prose", componentId: "prose", registryOnly: true });

/* Shared demo content — a heading and two paragraphs, so the vertical rhythm
   between DIRECT children is what the eye reads. */
const Content = () => (
  <>
    <h3>Flow rhythm</h3>
    <p>
      A flow container spaces its direct children with a one-directional owl:
      each child gets margin above it, scaled to the density around it.
    </p>
    <p>
      Nothing here sets a margin of its own — the rhythm comes from the context,
      so headings, paragraphs, lists and media all share one vertical scale.
    </p>
  </>
);

/** The demo content's two paragraphs, shared by the React demo and the markup. */
const PARAGRAPHS = [
  "A flow container spaces its direct children with a one-directional owl: each child gets margin above it, scaled to the density around it.",
  "Nothing here sets a margin of its own — the rhythm comes from the context, so headings, paragraphs, lists and media all share one vertical scale.",
] as const;

/**
 * Prose as Elements markup (RFC 0033): the flow class on whatever element you
 * write — a `<div>`, or an `<article>` / `<section>` where the region means
 * something. It has no behaviour, so the classes are the whole component; the
 * content is real, because the preview renders exactly this.
 */
const elementsTree = ({
  element = "div",
  measure = false,
  heading = "Flow rhythm",
}: { element?: string; measure?: boolean; heading?: string } = {}) =>
  [
    `<${element} class="primitiv-flow${measure ? " primitiv-flow--measure" : ""}">`,
    `  <h3>${heading}</h3>`,
    ...PARAGRAPHS.map((text) => `  <p>${text}</p>`),
    `</${element}>`,
  ].join("\n");

/**
 * Prose's page content.
 *
 * Registry-only. A flow-rhythm wrapper: it applies `.primitiv-flow` so every
 * direct child gets density-scoped vertical spacing (RFC 0016's owl), with zero
 * behaviour of its own. `measure` caps the reading width; `asChild` renders a
 * semantic element. No Figma set — it is a context wrapper, not a drawn
 * component.
 */
export const proseSpec: ComponentSpec = {
  playground: {
    component: "Prose",
    fill: true,
    /* `measure` is the contract's one modifier (a boolean → a Switch). The
       snippet is hand-written because the generated `toJsx` prints
       `measure="true"` rather than the valueless boolean, and because Prose's
       point is the CHILDREN it spaces. */
    snippet: (values, mode) => {
      if (mode === "elements") return elementsTree({ measure: values.measure === "true" });
      const measure = values.measure === "true" ? " measure" : "";
      return [
        imports(mode),
        ``,
        `<Prose${measure}>`,
        `  <h3>Flow rhythm</h3>`,
        `  <p>{/* ... */}</p>`,
        `  <p>{/* ... */}</p>`,
        `</Prose>`,
      ].join("\n");
    },
    render: (values) => (
      <Prose measure={values.measure === "true"}>
        <Content />
      </Prose>
    ),
  },

  examples: [
    {
      id: "rhythm",
      title: "Vertical rhythm",
      render: () => (
        <InteractiveExample
          elementsCaption="Put `primitiv-flow` on the element around a run of content and every **direct** child gets vertical spacing from the context — no `margin` on the elements themselves. It is a one-directional owl (`* + * { margin-block-start }`), so the first child has no stray top margin, a heading gets more room above it than a paragraph, and the gaps scale with the nearest `data-density`."
          caption="Wrap a run of content and every **direct** child gets vertical spacing from the context — no `margin` on the elements themselves. It is a one-directional owl (`* + * { margin-block-start }`), so the first child has no stray top margin, and the gaps scale with the nearest `data-density`. Change the density above and the whole rhythm shifts."
          code={(_density, mode) =>
            mode === "elements" ? elementsTree() : [
              imports(mode),
              ``,
              `<Prose>`,
              `  <h3>Flow rhythm</h3>`,
              `  <p>{/* ... */}</p>`,
              `  <p>{/* ... */}</p>`,
              `</Prose>`,
            ].join("\n")
          }
        >
          {() => (
            <Prose style={{ width: "100%" }}>
              <Content />
            </Prose>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "measure",
      title: "Reading measure",
      render: () => (
        <InteractiveExample
          elementsCaption="`primitiv-flow--measure` caps the column at a comfortable reading line length (~68 characters), which keeps long-form text scannable. It is **opt-in**: a flow context is often a whole region holding grids and media, and a reading-width cap would break those — so add the class only on a genuine reading column."
          caption="`measure` caps the column at a comfortable reading line length (~68 characters), which keeps long-form text scannable. It is **opt-in**: a flow context is often a whole region holding grids and media, and a reading-width cap would break those — so you add `measure` only on a genuine reading column."
          code={(_density, mode) =>
            mode === "elements" ? elementsTree({ measure: true, heading: "A reading column" }) : [
              imports(mode),
              ``,
              `<Prose measure>`,
              `  <h3>A reading column</h3>`,
              `  <p>{/* long-form text, capped at the measure */}</p>`,
              `</Prose>`,
            ].join("\n")
          }
        >
          {() => (
            <Prose measure style={{ width: "100%" }}>
              <Content />
            </Prose>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "as-child",
      title: "As a semantic element",
      elementsTitle: "On a semantic element",
      render: () => (
        <InteractiveExample
          elementsCaption="The classes go on any element, so put them on the one the region already is — an `<article>` or `<section>` that also spaces its children — rather than wrapping it in an anonymous `<div>`. The rhythm still lands on the direct children of that element."
          caption="`asChild` renders your own element with the flow context applied — an `<article>` or `<section>` that also spaces its children — rather than wrapping one in an anonymous `<div>`. The rhythm still lands on the direct children of that element."
          code={(_density, mode) =>
            mode === "elements" ? elementsTree({ element: "article", measure: true, heading: "Title" }) : [
              imports(mode),
              ``,
              `<Prose asChild measure>`,
              `  <article>`,
              `    <h3>Title</h3>`,
              `    <p>{/* ... */}</p>`,
              `  </article>`,
              `</Prose>`,
            ].join("\n")
          }
        >
          {() => (
            <Prose asChild measure style={{ width: "100%" }}>
              <article>
                <Content />
              </article>
            </Prose>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A flow-rhythm container: put `primitiv-flow` on an element and every direct child gets density-scoped vertical spacing from one owl rule (RFC 0016). No behaviour and no script — the class is the whole component, on whichever element the region already is.",
    accessibility: [
      "The flow class adds spacing, nothing else — no semantics, no ARIA — so a screen reader reads straight through to the content. Put it on an `<article>` or `<section>` when the region is one, rather than on a `<div>` inside it.",
      "Capping the line length with `primitiv-flow--measure` is itself an accessibility win: over-long lines are hard to track back to the next line, so a reading column helps low-vision and dyslexic readers.",
      "It has no behaviour and loads no script: the meaning is entirely in the content it wraps.",
    ],
  },

  accessibility: [
    "Prose renders a plain `<div>` with no semantics — it is a spacing context, so a screen reader reads straight through to the content. Use `asChild` to make it a real `<article>`/`<section>` when the region is a landmark.",
    "Capping the line length with `measure` is itself an accessibility win: over-long lines are hard to track back to the next line, so a reading column helps low-vision and dyslexic readers.",
    "It adds no interactive or ARIA surface; the meaning is entirely in the content it wraps.",
  ],
};
