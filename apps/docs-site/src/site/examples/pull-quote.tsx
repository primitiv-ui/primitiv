"use client";

import { PullQuote } from "@/components/pull-quote";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "PullQuote", componentId: "pull-quote", registryOnly: true });

const QUOTE = "The best interface is the one you never have to think about.";

/**
 * PullQuote's page content.
 *
 * Registry-only. `size` rides the heading scale (`xs`→h5 … `xl`→h1); `marks` is
 * a headless boolean (a decorative quotation glyph), so it is a spec-declared
 * control with its own snippet. Distinct from Blockquote: large, centred, no
 * accent bar, no attribution.
 */
export const pullQuoteSpec: ComponentSpec = {
  playground: {
    component: "PullQuote",
    fill: true,
    /* `marks` is a headless prop, not a contract modifier, so it is declared
       here and kept in the snippet by a custom writer (the generated `toJsx`
       would print `marks="true"` rather than the valueless boolean). */
    controls: [
      {
        name: "marks",
        options: ["false", "true"],
        defaultValue: "true",
        description: "Show the decorative quotation glyph above the quote.",
      },
    ],
    snippet: (values, mode) => {
      const marks = values.marks === "true" ? " marks" : "";
      return [
        imports(mode),
        ``,
        `<PullQuote size="${values.size}"${marks}>`,
        `  ${QUOTE}`,
        `</PullQuote>`,
      ].join("\n");
    },
    render: (values) => (
      <PullQuote size={values.size as Size} marks={values.marks === "true"}>
        {QUOTE}
      </PullQuote>
    ),
  },

  examples: [
    {
      id: "editorial",
      title: "An editorial pull",
      render: () => (
        <InteractiveExample
          caption="A large, centred statement lifted out of the flow — the sentence an article is built around. Unlike `Blockquote` it has no accent bar and no attribution: it is a typographic moment, not a cited passage. `size` steps it along the heading scale."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<PullQuote size="lg">`,
              `  ${QUOTE}`,
              `</PullQuote>`,
            ].join("\n")
          }
        >
          {() => (
            <PullQuote size="lg" style={{ width: "100%" }}>
              {QUOTE}
            </PullQuote>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "marks",
      title: "Decorative marks",
      render: () => (
        <InteractiveExample
          caption="`marks` adds an oversized quotation glyph above the quote — the magazine treatment. It is purely decorative and `aria-hidden`, so it adds visual weight without changing what a screen reader reads."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<PullQuote marks size="lg">`,
              `  ${QUOTE}`,
              `</PullQuote>`,
            ].join("\n")
          }
        >
          {() => (
            <PullQuote marks size="lg" style={{ width: "100%" }}>
              {QUOTE}
            </PullQuote>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "PullQuote renders a real `<blockquote>`, so the passage is announced as a quotation even though it reads visually as a heading-scale statement.",
    "The `marks` glyph is decorative and `aria-hidden`, so it is skipped by assistive tech — the quote is read once, without a stray quotation mark spelled out.",
    "Reach for `Blockquote` when the quote is *cited* — PullQuote carries no attribution by design, so an unattributed editorial lift is its whole job.",
  ],
};
