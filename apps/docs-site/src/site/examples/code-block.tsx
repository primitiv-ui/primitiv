"use client";

import { CodeBlock } from "@/components/code-block";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "CodeBlock", componentId: "code-block", registryOnly: true });

const SAMPLE = `import { Button } from "@primitiv-ui/react";

export function Save() {
  return <Button variant="primary" onClick={() => persistEverythingRightNow()}>Save changes</Button>;
}`;

/**
 * CodeBlock's page content.
 *
 * Registry-only, and the richest prose component: a bordered, tinted surface
 * with Prism syntax highlighting, an optional filename/copy header, an optional
 * line-number gutter, and a tabbed variant for showing one snippet across
 * several tools. `variant` (block vs inline) is excluded from the playground —
 * it is a fundamental shape change, shown in its own example.
 */
export const codeBlockSpec: ComponentSpec = {
  playground: {
    component: "CodeBlock",
    fill: true,
    excludeControls: ["variant"],
    snippet: (values, mode) => {
      const wrap = values.wrap === "true" ? " wrap" : "";
      return [
        imports(mode),
        ``,
        `<CodeBlock language="tsx" size="${values.size}"${wrap} code={source} />`,
      ].join("\n");
    },
    render: (values) => (
      <CodeBlock
        code={SAMPLE}
        language="tsx"
        size={values.size as Size}
        wrap={values.wrap === "true"}
        style={{ width: "100%" }}
      />
    ),
  },

  examples: [
    {
      id: "block",
      title: "A code block",
      render: () => (
        <InteractiveExample
          caption="The default: a bordered, tinted surface with mono type and Prism syntax highlighting, driven by `code` and `language`. `wrap` decides whether long lines wrap or the block scrolls horizontally — scroll is the default, since wrapping code changes where the line breaks fall."
          code={(_density, mode) =>
            [imports(mode), ``, `<CodeBlock language="tsx" code={source} />`].join("\n")
          }
        >
          {() => (
            <CodeBlock code={SAMPLE} language="tsx" style={{ width: "100%" }} />
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "header",
      title: "Filename and copy",
      render: () => (
        <InteractiveExample
          caption="Pass `filename` for a header naming the file, with a copy button beside it — the reader can see where the snippet belongs and take it in one click. Use `showHeader` to force the header (and its copy control) without a filename."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<CodeBlock filename="Save.tsx" language="tsx" code={source} />`,
            ].join("\n")
          }
        >
          {() => (
            <CodeBlock
              filename="Save.tsx"
              code={SAMPLE}
              language="tsx"
              style={{ width: "100%" }}
            />
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "line-numbers",
      title: "Line numbers",
      render: () => (
        <InteractiveExample
          caption={"`showLineNumbers` adds a gutter, for a longer listing you want to reference by line. It is ignored under `variant=\"inline\"`, where there is only one line to number."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<CodeBlock showLineNumbers language="tsx" code={source} />`,
            ].join("\n")
          }
        >
          {() => (
            <CodeBlock
              showLineNumbers
              code={SAMPLE}
              language="tsx"
              style={{ width: "100%" }}
            />
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "tabbed",
      title: "Tabbed (one snippet, several tools)",
      render: () => (
        <InteractiveExample
          caption="The tabbed variant shows the same step across tools — an install command in npm / pnpm / yarn — without stacking four blocks. Compose `CodeBlock.Tabs` with a `CodeBlock.Header` (holding a `CodeBlock.List` of `CodeBlock.Trigger`s and a `CodeBlock.Copy`) and one `CodeBlock.Content` per tab. It is the `Tabs` keyboard model, so the arrow keys move between triggers."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<CodeBlock.Tabs defaultValue="npm">`,
              `  <CodeBlock.Header>`,
              `    <CodeBlock.List label="Install with">`,
              `      <CodeBlock.Trigger value="npm">npm</CodeBlock.Trigger>`,
              `      <CodeBlock.Trigger value="pnpm">pnpm</CodeBlock.Trigger>`,
              `    </CodeBlock.List>`,
              `    <CodeBlock.Copy />`,
              `  </CodeBlock.Header>`,
              `  <CodeBlock.Content value="npm" language="bash" code="npx primitiv add button" />`,
              `  <CodeBlock.Content value="pnpm" language="bash" code="pnpm dlx primitiv add button" />`,
              `</CodeBlock.Tabs>`,
            ].join("\n")
          }
        >
          {() => (
            <CodeBlock.Tabs defaultValue="npm" style={{ width: "100%" }}>
              <CodeBlock.Header>
                <CodeBlock.List label="Install with">
                  <CodeBlock.Trigger value="npm">npm</CodeBlock.Trigger>
                  <CodeBlock.Trigger value="pnpm">pnpm</CodeBlock.Trigger>
                  <CodeBlock.Trigger value="yarn">yarn</CodeBlock.Trigger>
                </CodeBlock.List>
                <CodeBlock.Copy />
              </CodeBlock.Header>
              <CodeBlock.Content value="npm" language="bash" code="npx primitiv add button" />
              <CodeBlock.Content value="pnpm" language="bash" code="pnpm dlx primitiv add button" />
              <CodeBlock.Content value="yarn" language="bash" code="yarn dlx primitiv add button" />
            </CodeBlock.Tabs>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "inline",
      title: "Inline",
      render: () => (
        <InteractiveExample
          caption={"`variant=\"inline\"` is a single-line highlighted chip for code named mid-sentence when it needs syntax colour — an import path, a typed value. It is `InlineCode` with highlighting; reach for plain `InlineCode` when the fragment does not need a language."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<CodeBlock variant="inline" size="sm" language="tsx" code='import { Button } from "@primitiv-ui/react"' />`,
            ].join("\n")
          }
        >
          {/* A <div>, not a <p>: the inline CodeBlock's root is itself a
              <div>, so it flows inline in flow content but cannot sit inside a
              <p> (phrasing-content only). */}
          {() => (
            <div>
              Import it with{" "}
              <CodeBlock
                variant="inline"
                size="sm"
                language="tsx"
                code={'import { Button } from "@primitiv-ui/react"'}
              />
              .
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  anatomyMeta:
    "Two forms. The **block** is a single `CodeBlock` element driven by `code`/`language`. The **tabbed** form composes `CodeBlock.Tabs` with a header (a `CodeBlock.List` of `CodeBlock.Trigger`s and a `CodeBlock.Copy`) and one `CodeBlock.Content` per tab.",
  anatomy: [
    {
      label: "Block",
      code: () => "<CodeBlock code={…} language=\"tsx\" />",
    },
    {
      label: "Tabbed",
      code: () =>
        [
          "<CodeBlock.Tabs>",
          "  <CodeBlock.Header>",
          "    <CodeBlock.List>",
          "      <CodeBlock.Trigger />",
          "    </CodeBlock.List>",
          "    <CodeBlock.Copy />",
          "  </CodeBlock.Header>",
          "  <CodeBlock.Content />",
          "</CodeBlock.Tabs>",
        ].join("\n"),
    },
  ],

  accessibility: [
    "The copy control is a real `<button>` with an `aria-label`, and it announces success after a copy — so a keyboard or screen-reader user gets the same one-click affordance and the same confirmation as a mouse user.",
    "The tabbed variant is the `Tabs` pattern: the triggers share one tab stop and the arrow keys move between them, with each panel wired to its trigger — so a reader tabs into the group once, not through every tool.",
    "Syntax highlighting is colour on top of the code, never the only signal — the code reads correctly with colour off, and the mono face plus the bordered surface carry the “this is code” distinction.",
    "A horizontal scroll (the default over `wrap`) is keyboard-scrollable, and the region is focusable when it overflows, so a keyboard user can reach code that runs past the edge.",
  ],
};
