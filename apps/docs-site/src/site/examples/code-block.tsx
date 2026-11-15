"use client";

import { Prism } from "prism-react-renderer";

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


// ── Elements (RFC 0033) ──────────────────────────────────────────────────────

/* The Elements form is the markup a server or build step writes: the code run
   through Prism once (here, the same Prism the React block uses), in the
   registry's classes, with `<primitiv-code-block-copy>` around the copy button.
   Nothing highlights in the browser. */

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** What a server's highlighter returns: Prism's token spans, or escaped text for a language it lacks. */
const highlight = (code: string, language: string) => {
  const grammar = Prism.languages[language];
  return grammar ? Prism.highlight(code, grammar, language) : escapeHtml(code);
};

/* The copy button one step below the block, as the React block sizes it. */
const COPY_SIZE: Record<Size, Size> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

const COPY_GLYPHS =
  `<svg data-copy-state="idle" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.75 7.25v13.5H7.25V7.25zm-12 12h10.5V8.75H8.75z" /><path d="M15.25 4.75H4.75v10.5h4v1.5h-5.5V3.25h13.5v5.5h-1.5z" /></svg>` +
  `<svg data-copy-state="copied" hidden viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.057 5.904 10.05 19.111 2.939 12 4 10.94l5.95 5.949 9.954-11.946z" /></svg>`;

const copyControl = (size: Size) =>
  [
    `<primitiv-code-block-copy>`,
    `  <button type="button" class="primitiv-button primitiv-button--secondary primitiv-button--${COPY_SIZE[size]} primitiv-code-block__copy" aria-label="Copy code">${COPY_GLYPHS}</button>`,
    `</primitiv-code-block-copy>`,
  ];

/** The `<pre>`: the highlighted code, or one span a line with an aria-hidden number, each keeping its newline. */
function elementsPre(code: string, language: string, lineNumbers = false): string {
  const html = highlight(code, language);
  const body = lineNumbers
    ? html
        .split("\n")
        .map(
          (line, i) =>
            `<span class="primitiv-code-block__line"><span class="primitiv-code-block__ln" aria-hidden="true">${i + 1}</span>` +
            `<span class="primitiv-code-block__line-content">${line}\n</span></span>`,
        )
        .join("")
    : html;
  return `<pre class="primitiv-code-block__pre language-${language}"${lineNumbers ? " data-line-numbers" : ""}><code class="primitiv-code-block__code">${body}</code></pre>`;
}

type ElementsBlock = {
  code?: string;
  language?: string;
  size?: Size;
  wrap?: boolean;
  filename?: string;
  /** The header with its copy control, with or without a filename. */
  header?: boolean;
  lineNumbers?: boolean;
};

function elementsBlock({ code = SAMPLE, language = "tsx", size = "md", wrap = true, filename, header, lineNumbers }: ElementsBlock): string {
  const root = ["primitiv-code-block", `primitiv-code-block--${size}`, wrap ? "" : "primitiv-code-block--nowrap"].filter(Boolean).join(" ");
  const head =
    header || filename
      ? [
          `  <div class="primitiv-code-block__header">`,
          ...(filename ? [`    <span class="primitiv-code-block__filename">${filename}</span>`] : []),
          ...copyControl(size).map((line) => `    ${line}`),
          `  </div>`,
        ]
      : [];
  return [`<div class="${root}">`, ...head, `  ${elementsPre(code, language, lineNumbers)}`, `</div>`].join("\n");
}

const INSTALLS = [
  ["npm", "npx primitiv add button"],
  ["pnpm", "pnpm dlx primitiv add button"],
  ["yarn", "yarn dlx primitiv add button"],
] as const;

/** The tabbed form: the Tabs elements wearing the code block's classes, the copy control beside the list. */
const elementsTabbed = () =>
  [
    `<primitiv-tabs value="npm" class="primitiv-code-block primitiv-code-block--md primitiv-tabs primitiv-tabs--md">`,
    `  <div class="primitiv-code-block__header">`,
    `    <primitiv-tabs-list label="Install with" class="primitiv-tabs__list">`,
    ...INSTALLS.map(
      ([name]) =>
        `      <primitiv-tabs-trigger value="${name}"><button type="button" class="primitiv-tabs__trigger"><span class="primitiv-tabs__trigger-label">${name}</span></button></primitiv-tabs-trigger>`,
    ),
    `    </primitiv-tabs-list>`,
    ...copyControl("md").map((line) => `    ${line}`),
    `  </div>`,
    ...INSTALLS.map(
      ([name, command], i) =>
        `  <primitiv-tabs-content value="${name}" class="primitiv-code-block__panel"${i === 0 ? "" : " hidden"}>${elementsPre(command, "bash")}</primitiv-tabs-content>`,
    ),
    `</primitiv-tabs>`,
  ].join("\n");

const INLINE_SAMPLE = 'import { Button } from "@primitiv-ui/react"';
const elementsInline = () =>
  [
    `<div>`,
    `  Import it with`,
    `  <div class="primitiv-code-block primitiv-code-block--inline primitiv-code-block--sm">${elementsPre(INLINE_SAMPLE, "tsx")}</div>.`,
    `</div>`,
  ].join("\n");

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
      if (mode === "elements") return elementsBlock({ size: values.size as Size, wrap: values.wrap === "true" });
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
          elementsCaption="The block as your server or build step writes it: the code run through Prism once, whose token classes the stylesheet colours with the `--primitiv-code-syntax-*` palette, inside a `<pre>` in the block's classes. Nothing highlights in the browser and no script is needed. `primitiv-code-block--nowrap` keeps long lines whole and scrolls the block instead."
          code={(_density, mode) =>
            mode === "elements" ? elementsBlock({}) : [imports(mode), ``, `<CodeBlock language="tsx" code={source} />`].join("\n")
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
          elementsCaption={"A `primitiv-code-block__header` names the file, and `<primitiv-code-block-copy>` around its `<button>` puts the code on the clipboard: the text of the block's `<code>`, exactly as shown. While copied, for two seconds, the button reads `Copied` and shows the glyph marked `data-copy-state=\"copied\"`. Drop the filename and keep the header for a copy button on its own."}
          code={(_density, mode) =>
            mode === "elements" ? elementsBlock({ filename: "Save.tsx" }) :
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
          elementsCaption={"A gutter is one `primitiv-code-block__line` per line, its number in an `aria-hidden` `primitiv-code-block__ln` and `data-line-numbers` on the `<pre>`. Keep each line's newline at the end of its line — the copy control copies the text as shown and leaves the `aria-hidden` numbers out."}
          code={(_density, mode) =>
            mode === "elements" ? elementsBlock({ lineNumbers: true }) :
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
          elementsCaption={"The tabbed form is the Tabs elements wearing the code block's classes — load `tabs.js` alongside `code-block.js`. The copy control sits beside the `<primitiv-tabs-list>` and copies the panel that is shown, skipping the `hidden` ones, so it follows the tabs with no wiring. It is the Tabs keyboard model: the arrow keys move between the triggers."}
          code={(_density, mode) =>
            mode === "elements" ? elementsTabbed() :
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
          elementsCaption={"`primitiv-code-block--inline` is a single-line highlighted chip for code named mid-sentence — the same Prism markup, sized to its content and sitting on the baseline. It has no header or copy control. Reach for `inline-code` when the fragment needs no highlighting."}
          code={(_density, mode) =>
            mode === "elements" ? elementsInline() :
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
      code: (mode) =>
        mode === "elements"
          ? [
              `<div class="primitiv-code-block">`,
              `  <div class="primitiv-code-block__header">`,
              `    <span class="primitiv-code-block__filename">...</span>`,
              `    <primitiv-code-block-copy><button type="button" class="primitiv-code-block__copy">...</button></primitiv-code-block-copy>`,
              `  </div>`,
              `  <pre class="primitiv-code-block__pre"><code class="primitiv-code-block__code"><!-- highlighted --></code></pre>`,
              `</div>`,
            ].join("\n")
          : "<CodeBlock code={...} language=\"tsx\" />",
    },
    {
      label: "Tabbed",
      code: (mode) =>
        mode === "elements"
          ? [
              `<primitiv-tabs class="primitiv-code-block primitiv-tabs">`,
              `  <div class="primitiv-code-block__header">`,
              `    <primitiv-tabs-list>`,
              `      <primitiv-tabs-trigger>...</primitiv-tabs-trigger>`,
              `    </primitiv-tabs-list>`,
              `    <primitiv-code-block-copy>...</primitiv-code-block-copy>`,
              `  </div>`,
              `  <primitiv-tabs-content class="primitiv-code-block__panel"><pre>...</pre></primitiv-tabs-content>`,
              `</primitiv-tabs>`,
            ].join("\n")
          : [
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

  elements: {
    description:
      "A block of source code — a bordered, tinted surface with mono type, an optional filename and copy header, an optional line-number gutter, and syntax colour from Prism's token classes. The highlighting is your server's or your build step's: write the code Prism has already highlighted, and the one element, `<primitiv-code-block-copy>`, puts it on the clipboard.",
    anatomyMeta:
      "Two forms. The **block** is a `primitiv-code-block` `<div>` holding an optional `__header` (a `__filename` and the copy control) and the `<pre>` / `<code>`. The **tabbed** form is the Tabs elements wearing the block's classes: a header holding the `<primitiv-tabs-list>` and the copy control, then one `<primitiv-tabs-content>` per tab. `<primitiv-code-block-copy>` wraps the `<button>` you write.",
    accessibility: [
      "The copy control is a real `<button>` — give it an `aria-label` (`Copy code`). While copied, the element swaps that label to `Copied` (set `copied-label` to translate it) and back after two seconds, keeping the original in `data-label`, so a screen-reader user hears the same confirmation a sighted user sees.",
      "What is copied is what is shown: the `<code>`'s text, without the `aria-hidden` line numbers. Keep each line's newline in the markup.",
      "The tabbed form is the Tabs pattern: the triggers share one tab stop and the arrow keys move between them, with each panel wired to its trigger.",
      "Syntax colour is never the only signal — the code reads correctly with colour off, and the mono face plus the bordered surface carry the “this is code” distinction.",
    ],
  },

  accessibility: [
    "The copy control is a real `<button>` with an `aria-label`, and it announces success after a copy — so a keyboard or screen-reader user gets the same one-click affordance and the same confirmation as a mouse user.",
    "The tabbed variant is the `Tabs` pattern: the triggers share one tab stop and the arrow keys move between them, with each panel wired to its trigger — so a reader tabs into the group once, not through every tool.",
    "Syntax highlighting is colour on top of the code, never the only signal — the code reads correctly with colour off, and the mono face plus the bordered surface carry the “this is code” distinction.",
    "A horizontal scroll (the default over `wrap`) is keyboard-scrollable, and the region is focusable when it overflows, so a keyboard user can reach code that runs past the edge.",
  ],
};
