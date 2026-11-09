// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Collapsible.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { collapsibleHtml } from "./collapsible-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an open outer collapsible whose panel will receive a nested one.
set(
  "outer-region",
  collapsibleHtml({ open: true }, "outer", { label: "Outer" }).replace(
    "<primitiv-collapsible-content>",
    '<primitiv-collapsible-content id="outer-content">',
  ),
);
// 3: a collapsible whose panel arrives out of band.
set(
  "oob-region",
  '<primitiv-collapsible id="oob" open><primitiv-collapsible-trigger><button type="button">Toggle</button>' +
    "</primitiv-collapsible-trigger></primitiv-collapsible>",
);
// 4: the collapsible the server re-renders.
set("rerender-region", collapsibleHtml({}, "rerendered"));
// 5: a preserved collapsible inside a region that gets swapped.
set(
  "preserve-region",
  collapsibleHtml({}, "preserved").replace("<primitiv-collapsible ", '<primitiv-collapsible hx-preserve="true" '),
);
// 6: the collapsible whose open state history restore must bring back.
set("history-region", collapsibleHtml({}, "history"));
// 7: the panel loads its content on first open.
set(
  "lazy-region",
  collapsibleHtml({}, "lazy").replace(
    "<primitiv-collapsible-content hidden>Hidden content",
    '<primitiv-collapsible-content hidden hx-get="/fragments/collapsible-lazy" hx-trigger="primitiv-collapsible-show once">Loading…',
  ),
);
// 8: posts each change to the server; vetoes closing once opened.
set(
  "echo-region",
  collapsibleHtml({}, "echo").replace(
    "<primitiv-collapsible ",
    `<primitiv-collapsible hx-get="/fragments/collapsible-echo" hx-trigger="primitiv-collapsible-change" hx-target="#echo-target" hx-vals='js:{open: event.detail.open}' hx-on:primitiv-collapsible-change="if (!event.detail.open) event.preventDefault()" `,
  ),
);

htmx.process(document.body);
