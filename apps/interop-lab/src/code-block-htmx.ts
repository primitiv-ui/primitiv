// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the element's own lifecycle (RFC 0033 §5.4, §7.4) — the swap cases
// that apply to a copy control.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { codeBlockHtml, highlightingBlockHtml, tabbedCodeBlockHtml } from "./code-block-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: a block whose code the server re-renders.
set("rerender-region", codeBlockHtml({}, "rerendered"));
// 3: a tabbed block whose pnpm panel arrives empty.
set("oob-region", tabbedCodeBlockHtml("oob").replace(/(<primitiv-tabs-content value="pnpm" hidden>)<pre>[\s\S]*?<\/pre>/, "$1"));
// 4: a preserved block inside a region that gets swapped.
set("preserve-region", codeBlockHtml({}, "preserved").replace('<div id="preserved">', '<div id="preserved" hx-preserve="true">'));
// 6: posts each copy to the server.
set(
  "echo-region",
  codeBlockHtml({}, "echo").replace(
    "<primitiv-code-block-copy>",
    `<primitiv-code-block-copy hx-get="/fragments/code-block-echo" hx-trigger="primitiv-code-block-copy" hx-target="#echo-target" hx-vals='js:{text: event.detail.text}'>`,
  ),
);

// 7: a highlighting block whose code the server replaces with new plain text.
set("swap-region", highlightingBlockHtml("swapped-code", ' language="js"', "let old = 1;"));
// 5: the blocks history restore must bring back — idle, and still highlighted.
set("history-region", codeBlockHtml({}, "history") + highlightingBlockHtml("history-highlighted", ' language="js"', "let kept = 1;"));

htmx.process(document.body);
