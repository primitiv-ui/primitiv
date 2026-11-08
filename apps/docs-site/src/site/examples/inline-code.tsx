"use client";

import { InlineCode } from "@/components/inline-code";
import { importBlock, markup } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "InlineCode", componentId: "inline-code", registryOnly: true });

/**
 * InlineCode's page content.
 *
 * Registry-only, one modifier (`size`). A `<code>` fragment on a tinted,
 * hairline chip — for a value, identifier or short command named mid-sentence.
 * The examples cover the inline case, sizing to the surrounding text, and the
 * `asChild` escape hatch.
 */

/** One code in Elements mode (RFC 0033): plain markup with the registry's
 *  classes, which is the whole component — it has no behaviour to load. */
const html = (children: string, { size = "md" }: { size?: string } = {}) =>
  markup({ element: "code", rootClass: "primitiv-inline-code", modifiers: [size], children });

export const inlineCodeSpec: ComponentSpec = {
  playground: {
    component: "InlineCode",
    snippetChildren: "npm install",
    snippetPrefix: (mode) => imports(mode),
    render: (values) => (
      <InlineCode size={values.size as Size}>npm install</InlineCode>
    ),
  },

  examples: [
    {
      id: "inline",
      title: "Inline in text",
      render: () => (
        <InteractiveExample
          elementsCaption={
            'A `<code>` fragment for a value, identifier or path named in running text — `querySelector`, `--primitiv-space-16`, `package.json`. It reads as code without breaking the line. Reach for a `<kbd>` key cap instead when the thing is a key to press.'
          }
          caption="A `<code>` fragment for a value, identifier or path named in running text — `useState`, `--primitiv-space-16`, `package.json`. It reads as code without breaking the line. Reach for `Kbd` instead when the thing is a key to press."
          code={(_density, mode) =>
            mode === "elements"
              ? [`<p>`, `  Import it from ${html("@primitiv-ui/react")}.`, `</p>`].join("\n")
              : [
              imports(mode),
              ``,
              `<p>`,
              `  Import it from <InlineCode>@primitiv-ui/react</InlineCode>.`,
              `</p>`,
            ].join("\n")
          }
        >
          {() => (
            <p>
              Every component is imported from{" "}
              <InlineCode>@primitiv-ui/react</InlineCode>, and its class is{" "}
              <InlineCode>.primitiv-button</InlineCode>.
            </p>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sizing",
      title: "Sizing to the text",
      render: () => (
        <InteractiveExample
          caption="`size` tracks the type around the chip — `sm` beside body text, `xs` inside a caption or a table cell — so the code never looms larger than the words it sits among. It inherits nothing from context, so set `size` at each call site."
          code={(_density, mode) =>
            mode === "elements"
              ? (["xs", "sm", "md"] as const).map((sz) => html(sz, { size: sz })).join("\n")
              : [
              imports(mode),
              ``,
              `<InlineCode size="xs">xs</InlineCode>`,
              `<InlineCode size="sm">sm</InlineCode>`,
              `<InlineCode size="md">md</InlineCode>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
              {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
                <InlineCode key={s} size={s}>
                  {s}
                </InlineCode>
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "as-child",
      title: "As a link (asChild)",
      elementsTitle: "As a link",
      render: () => (
        <InteractiveExample
          elementsCaption={
            "Put the classes on an `<a href>` for a code fragment that is also a link to an API reference, say. The chip's look is the classes, so it transfers to whatever element carries them."
          }
          caption="`asChild` renders your own element with the code styling merged on — a `<code>` fragment that is also a link to an API reference, say. The chip's look transfers to the element you supply."
          code={(_density, mode) =>
            mode === "elements"
              ? /* No asChild in markup: the classes go on the element itself. */ `<a class="primitiv-inline-code primitiv-inline-code--md" href="/api/use-state">useState</a>`
              : [
              imports(mode),
              ``,
              `<InlineCode asChild>`,
              `  <a href="/api/use-state">useState</a>`,
              `</InlineCode>`,
            ].join("\n")
          }
        >
          {() => (
            <p>
              See{" "}
              <InlineCode asChild>
                <a href="/components/">the components index</a>
              </InlineCode>{" "}
              for the full list.
            </p>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    accessibility: [
      "Use a real `<code>` element, so assistive tech treats it as code rather than emphasised prose — the semantics are the element's, not a style.",
      "The classes add no ARIA. On an `<a href>` the element stays a link.",
      "The chip is tint + a hairline border, not colour alone, so the distinction from surrounding text survives for low-vision readers and does not lean on a single hue.",
    ],
  },

  accessibility: [
    "InlineCode renders a real `<code>` element, so assistive tech treats it as code rather than emphasised prose — the semantics are the element's, not a style.",
    "It is presentational by default and adds no ARIA. Under `asChild` the semantics are whatever element you supply — a rendered `<a>` stays a link.",
    "The chip is tint + a hairline border, not colour alone, so the distinction from surrounding text survives for low-vision readers and does not lean on a single hue.",
  ],
};
