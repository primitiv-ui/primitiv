"use client";

import { Blockquote } from "@/components/blockquote";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Tone = "default" | "accent";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Blockquote", componentId: "blockquote", registryOnly: true });

const QUOTE =
  "A design system is a product serving products, not a gallery of components.";

/**
 * One blockquote as Elements markup (RFC 0033): the classes on a real
 * `<blockquote>`, with the quote in its own paragraph and the attribution in a
 * `<cite>` — the structure the styled wrapper renders. No behaviour, no script.
 */
const html = ({
  tone = "default",
  size = "md",
  cite,
}: { tone?: string; size?: string; cite?: string } = {}) =>
  [
    `<blockquote class="primitiv-blockquote primitiv-blockquote--${tone} primitiv-blockquote--${size}">`,
    `  <p class="primitiv-blockquote__quote">${QUOTE}</p>`,
    ...(cite ? [`  <cite class="primitiv-blockquote__citation">${cite}</cite>`] : []),
    `</blockquote>`,
  ].join("\n");

/**
 * Blockquote's page content.
 *
 * Registry-only, two modifiers (`tone`, `size`) plus a `cite` attribution. A
 * `<blockquote>` with a left accent bar — the quoted-passage sibling of Pull
 * Quote (which is large, centred and marks-only). Examples cover the tones, the
 * attribution line, and sizing.
 */
export const blockquoteSpec: ComponentSpec = {
  playground: {
    component: "Blockquote",
    snippetChildren: QUOTE,
    elementsChildren: `\n  <p class="primitiv-blockquote__quote">${QUOTE}</p>\n`,
    snippetPrefix: (mode) => imports(mode),
    fill: true,
    render: (values) => (
      <Blockquote tone={values.tone as Tone} size={values.size as Size}>
        {QUOTE}
      </Blockquote>
    ),
  },

  examples: [
    {
      id: "tones",
      title: "Tones",
      render: () => (
        <InteractiveExample
          elementsCaption="The tone class sets the left accent bar: `primitiv-blockquote--default` for a neutral pulled-out passage, `primitiv-blockquote--accent` when the quote is a highlight you want the eye to land on. Both are a bar plus the quote — no icon, no fill."
          caption="`tone` sets the left accent bar: `default` for a neutral pulled-out passage, `accent` when the quote is a highlight you want the eye to land on. Both are a bar plus the quote — no icon, no fill."
          code={(_density, mode) =>
            mode === "elements" ? [html(), html({ tone: "accent" })].join("\n\n") : [
              imports(mode),
              ``,
              `<Blockquote>${QUOTE}</Blockquote>`,
              ``,
              `<Blockquote tone="accent">${QUOTE}</Blockquote>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
              <Blockquote>{QUOTE}</Blockquote>
              <Blockquote tone="accent">{QUOTE}</Blockquote>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "attribution",
      title: "With attribution",
      render: () => (
        <InteractiveExample
          elementsCaption={'A `<cite class="primitiv-blockquote__citation">` after the quote adds the attribution line beneath it. Leave it out for an unattributed passage.'}
          caption="`cite` adds an attribution line in a `<cite>` beneath the quote. It is the narrowed native `blockquote cite` — pass the author or source as text; omit it for an unattributed passage."
          code={(_density, mode) =>
            mode === "elements" ? html({ tone: "accent", cite: "Jina Anne" }) : [
              imports(mode),
              ``,
              `<Blockquote tone="accent" cite="Jina Anne">`,
              `  ${QUOTE}`,
              `</Blockquote>`,
            ].join("\n")
          }
        >
          {() => (
            <Blockquote tone="accent" cite="Jina Anne">
              {QUOTE}
            </Blockquote>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sizing",
      title: "Sizing",
      render: () => (
        <InteractiveExample
          elementsCaption="The size class scales the quote against the surrounding type — `primitiv-blockquote--sm` for a quote inside a card, `primitiv-blockquote--lg` for a section-leading pull. It is not Pull Quote: reach for that when you want a large, centred statement with no attribution."
          caption="`size` scales the quote against the surrounding type — `sm` for a quote inside a card, `lg` for a section-leading pull. It is not `PullQuote`: reach for that when you want a large, centred, marks-decorated statement with no attribution."
          code={(_density, mode) =>
            mode === "elements" ? [html({ size: "sm" }), html({ size: "lg" })].join("\n\n") : [
              imports(mode),
              ``,
              `<Blockquote size="sm">${QUOTE}</Blockquote>`,
              `<Blockquote size="lg">${QUOTE}</Blockquote>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
              <Blockquote size="sm">{QUOTE}</Blockquote>
              <Blockquote size="lg">{QUOTE}</Blockquote>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    accessibility: [
      "Use a real `<blockquote>`, and a real `<cite>` for the attribution, so the quotation and its source are announced with the right semantics rather than as styled paragraphs.",
      "The accent bar is decoration on top of that structure, not the thing that marks the quote — the `<blockquote>` element carries the meaning, so the distinction survives with styles off.",
      "It is content, not a control: no focus or keyboard surface of its own, and no script to load.",
    ],
  },

  accessibility: [
    "Blockquote renders a real `<blockquote>`, and `cite` a real `<cite>`, so the quotation and its attribution are announced with the right semantics rather than as styled paragraphs.",
    "The accent bar is decoration on top of that structure, not the thing that marks the quote — the `<blockquote>` element carries the meaning, so the distinction survives with styles off.",
    "It is content, not a control: no focus or keyboard surface of its own.",
  ],
};
