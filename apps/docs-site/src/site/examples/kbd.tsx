"use client";

import { Kbd } from "@/components/kbd";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Kbd", componentId: "kbd", registryOnly: true });

/**
 * Kbd's page content.
 *
 * Registry-only, one modifier (`size`). A `<kbd>` on a raised key cap — the
 * physical-keycap sibling of Inline Code. The examples cover a single key, a
 * combination, and a key inline in prose.
 */
export const kbdSpec: ComponentSpec = {
  playground: {
    component: "Kbd",
    snippetChildren: "Esc",
    snippetPrefix: (mode) => imports(mode),
    render: (values) => <Kbd size={values.size as Size}>Esc</Kbd>,
  },

  examples: [
    {
      id: "single",
      title: "A single key",
      render: () => (
        <InteractiveExample
          caption="A `<kbd>` fragment styled as a raised key cap. Use it for the name of a single key — `Esc`, `Enter`, `Tab` — anywhere you refer to a keystroke in running text or a shortcuts list."
          code={(_density, mode) =>
            [imports(mode), ``, `<Kbd>Esc</Kbd>`, `<Kbd>Enter</Kbd>`].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Kbd>Esc</Kbd>
              <Kbd>Enter</Kbd>
              <Kbd>Tab</Kbd>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "combination",
      title: "Key combinations",
      render: () => (
        <InteractiveExample
          caption="A combination is **separate `Kbd`s** joined by a plain `+`, not one `Kbd` with the whole string — each physical key is its own cap, and a screen reader announces them one at a time. Keep the joiner (`+` or a thin space) outside the caps."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<span>`,
              `  <Kbd>⌘</Kbd> + <Kbd>K</Kbd>`,
              `</span>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Kbd>⌘</Kbd>
              <span>+</span>
              <Kbd>K</Kbd>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "in-prose",
      title: "Inline in prose",
      render: () => (
        <InteractiveExample
          caption="`Kbd` sizes off the text around it, so a key named mid-sentence sits on the line without disturbing it. Reach for `Kbd` when the thing is a **key to press**; for a literal value or a command, that is `InlineCode`."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<p>`,
              `  Press <Kbd size="sm">/</Kbd> to focus the search field.`,
              `</p>`,
            ].join("\n")
          }
        >
          {() => (
            <p>
              Press <Kbd size="sm">/</Kbd> to focus the search field, or{" "}
              <Kbd size="sm">Esc</Kbd> to close it.
            </p>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "Kbd renders a real `<kbd>` element, so assistive tech announces it as keyboard input rather than as plain text — the semantics come for free from the right element.",
    "For a combination, give each key its own `Kbd` and keep the `+` joiner outside them: a screen reader then reads the keys individually instead of spelling out one run-together string.",
    "It is presentational, not interactive — a `<kbd>` naming a key is not itself a control. The actual keyboard handling lives on the component the shortcut drives.",
  ],
};
