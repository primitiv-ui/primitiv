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
          caption="`tone` sets the left accent bar: `default` for a neutral pulled-out passage, `accent` when the quote is a highlight you want the eye to land on. Both are a bar plus the quote — no icon, no fill."
          code={(_density, mode) =>
            [
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
          caption="`cite` adds an attribution line in a `<cite>` beneath the quote. It is the narrowed native `blockquote cite` — pass the author or source as text; omit it for an unattributed passage."
          code={(_density, mode) =>
            [
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
          caption="`size` scales the quote against the surrounding type — `sm` for a quote inside a card, `lg` for a section-leading pull. It is not `PullQuote`: reach for that when you want a large, centred, marks-decorated statement with no attribution."
          code={(_density, mode) =>
            [
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

  accessibility: [
    "Blockquote renders a real `<blockquote>`, and `cite` a real `<cite>`, so the quotation and its attribution are announced with the right semantics rather than as styled paragraphs.",
    "The accent bar is decoration on top of that structure, not the thing that marks the quote — the `<blockquote>` element carries the meaning, so the distinction survives with styles off.",
    "It is content, not a control: no focus or keyboard surface of its own.",
  ],
};
