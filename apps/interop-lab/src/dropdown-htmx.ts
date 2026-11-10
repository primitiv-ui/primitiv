// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases
// that apply to a menu, run against Dropdown. The controls that act on an open
// menu are its own items, so reaching them does not light-dismiss it first.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { dropdownHtml } from "./dropdown-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: a dropdown whose menu arrives out of band.
set(
  "oob-region",
  '<primitiv-dropdown id="oob"><primitiv-dropdown-trigger><button type="button">Out of band</button>' +
    "</primitiv-dropdown-trigger></primitiv-dropdown>",
);
// 3: the dropdown the server re-renders.
set("rerender-region", dropdownHtml({}, "rerendered", { label: "Rerendered" }));
// 4: a preserved dropdown inside a region that one of its own items swaps.
set(
  "preserve-region",
  dropdownHtml({}, "preserved", {
    label: "Preserved",
    inner:
      '<primitiv-dropdown-item><li hx-get="/fragments/dropdown-preserve" hx-target="#preserve-region" hx-swap="outerHTML">Swap region</li></primitiv-dropdown-item>',
  }).replace("<primitiv-dropdown ", '<primitiv-dropdown hx-preserve="true" '),
);
// Its item must keep the menu open while the swap runs: veto that select.
document.addEventListener("primitiv-dropdown-select", (event) => {
  if ((event.target as Element).textContent === "Swap region") event.preventDefault();
});
// 5: a dropdown that loads more items into itself when opened.
set(
  "lazy-region",
  dropdownHtml({}, "lazy", {
    label: "Lazy",
    inner:
      '<primitiv-dropdown-item><li>Load more</li></primitiv-dropdown-item><div id="lazy-slot" hx-get="/fragments/dropdown-lazy" hx-trigger="primitiv-dropdown-change from:#lazy" hx-swap="innerHTML"></div>',
  }),
);
// 6: posts each change to the server; vetoes closing once opened.
set(
  "echo-region",
  dropdownHtml({}, "echo", { label: "Echo" }).replace(
    "<primitiv-dropdown ",
    `<primitiv-dropdown hx-get="/fragments/dropdown-echo" hx-trigger="primitiv-dropdown-change" hx-target="#echo-target" hx-vals='js:{open: event.detail.open}' hx-on:primitiv-dropdown-change="if (!event.detail.open) event.preventDefault()" `,
  ),
);

htmx.process(document.body);
