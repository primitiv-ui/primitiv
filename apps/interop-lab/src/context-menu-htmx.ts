// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases
// that apply to a menu, run against Context Menu. The controls that act on an open
// menu are its own items, so reaching them does not close it first.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { contextMenuHtml } from "./context-menu-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: a dropdown whose menu arrives out of band.
set(
  "oob-region",
  '<primitiv-context-menu id="oob"><primitiv-context-menu-trigger>Out of band</primitiv-context-menu-trigger></primitiv-context-menu>',
);
// 3: the dropdown the server re-renders.
set("rerender-region", contextMenuHtml({}, "rerendered", { label: "Rerendered" }));
// 4: a preserved dropdown inside a region that one of its own items swaps.
set(
  "preserve-region",
  contextMenuHtml({}, "preserved", {
    label: "Preserved",
    inner:
      '<primitiv-context-menu-item><li hx-get="/fragments/context-menu-preserve" hx-target="#preserve-region" hx-swap="outerHTML">Swap region</li></primitiv-context-menu-item>',
  }).replace("<primitiv-context-menu ", '<primitiv-context-menu hx-preserve="true" '),
);
// Its item must keep the menu open while the swap runs: veto that select.
document.addEventListener("primitiv-context-menu-select", (event) => {
  if ((event.target as Element).textContent === "Swap region") event.preventDefault();
});
// 5: a dropdown that loads more items into itself when opened.
set(
  "lazy-region",
  contextMenuHtml({}, "lazy", {
    label: "Lazy",
    inner:
      '<primitiv-context-menu-item><li>Load more</li></primitiv-context-menu-item><div id="lazy-slot" hx-get="/fragments/context-menu-lazy" hx-trigger="primitiv-context-menu-change from:#lazy" hx-swap="innerHTML"></div>',
  }),
);
// 6: posts each change to the server; vetoes closing once opened.
set(
  "echo-region",
  contextMenuHtml({}, "echo", { label: "Echo" }).replace(
    "<primitiv-context-menu ",
    `<primitiv-context-menu hx-get="/fragments/context-menu-echo" hx-trigger="primitiv-context-menu-change" hx-target="#echo-target" hx-vals='js:{open: event.detail.open}' hx-on:primitiv-context-menu-change="if (!event.detail.open) event.preventDefault()" `,
  ),
);

htmx.process(document.body);
