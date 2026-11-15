/** The code the Code Block pages render, read from the URL so one spec drives each page. */
export const CODE = "const a = 1;\nconst b = 2;";

export type CodeBlockFixture = {
  /** Render a line-number gutter (aria-hidden), each line keeping its newline. */
  lineNumbers: boolean;
  /** Copy the block `for` names instead of the nearest. */
  forId: string | null;
};

export function codeBlockFixtureFromUrl(search: string = location.search): CodeBlockFixture {
  const params = new URLSearchParams(search);
  return { lineNumbers: params.has("line-numbers"), forId: params.get("for") };
}

/** The copy control: a labelled icon button with both states, the copied one hidden. */
export const copyHtml = (attrs = "") =>
  `<primitiv-code-block-copy${attrs}><button type="button" aria-label="Copy code">` +
  `<span data-copy-state="idle">⧉</span><span data-copy-state="copied" hidden>✓</span></button></primitiv-code-block-copy>`;

/** A `<pre><code>` as a server writes it: plain lines, or lines with an aria-hidden gutter. */
export function preHtml(code: string, lineNumbers = false): string {
  const body = lineNumbers
    ? code
        .split("\n")
        .map((line, i) => `<span><span aria-hidden="true">${i + 1} </span><span>${line}\n</span></span>`)
        .join("")
    : `${code}\n`;
  return `<pre><code>${body}</code></pre>`;
}

/** One block: a header holding a filename and the copy control, then the code. */
export function codeBlockHtml(fixture: Partial<CodeBlockFixture> = {}, id = "block", code = CODE): string {
  const forAttr = fixture.forId ? ` for="${fixture.forId}"` : "";
  return `<div id="${id}"><div><span>app.ts</span>${copyHtml(forAttr)}</div>${preHtml(code, fixture.lineNumbers)}</div>`;
}

/** A tabbed block: the Tabs elements, with the copy control beside the tab list. */
export function tabbedCodeBlockHtml(id = "tabbed", value = "npm"): string {
  const commands = { npm: "npm install primitiv", pnpm: "pnpm add primitiv" } as const;
  const triggers = Object.keys(commands)
    .map((name) => `<primitiv-tabs-trigger value="${name}"><button type="button">${name}</button></primitiv-tabs-trigger>`)
    .join("");
  const panels = Object.entries(commands)
    .map(
      ([name, command]) =>
        `<primitiv-tabs-content value="${name}"${name === value ? "" : " hidden"}>${preHtml(command)}</primitiv-tabs-content>`,
    )
    .join("");
  return (
    `<primitiv-tabs id="${id}" value="${value}"><div><primitiv-tabs-list label="Install with">${triggers}</primitiv-tabs-list>` +
    `${copyHtml()}</div>${panels}</primitiv-tabs>`
  );
}

/** A block that highlights itself: the code as plain (escaped) text, indented as pasted, and a language. */
export function highlightingBlockHtml(id = "highlighting", attrs = ' language="ts" line-numbers', code = "const a = 1;\nif (a) {\n  run();\n}"): string {
  const pasted = code
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
  return `<primitiv-code-block id="${id}"${attrs}><div>${copyHtml()}</div><pre><code>\n${pasted.replace(/&/g, "&amp;").replace(/</g, "&lt;")}\n  </code></pre></primitiv-code-block>`;
}
