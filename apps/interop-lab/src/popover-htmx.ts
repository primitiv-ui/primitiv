// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases
// that apply to a popover, run against Popover. A popover is not modal, so the
// page stays live while one is open; the controls that act on an open one sit
// inside it so a click does not light-dismiss it first.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { popoverHtml } from "./popover-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer popover whose panel will receive a nested one.
set(
  "outer-region",
  popoverHtml({}, "outer", {
    label: "Open outer",
    title: "Outer",
    inner: `<button type="button" id="load-nested" hx-get="/fragments/popover-nested" hx-target="#outer-slot">Load nested</button><div id="outer-slot"></div>`,
  }),
);
// 3: a popover whose panel arrives out of band.
set(
  "oob-region",
  '<primitiv-popover id="oob"><primitiv-popover-trigger><button type="button">Open out of band</button>' +
    "</primitiv-popover-trigger></primitiv-popover>",
);
// 4: the popover the server re-renders.
set("rerender-region", popoverHtml({}, "rerendered", { label: "Open rerendered", title: "Rerendered" }));
// 5: a preserved popover inside a region that gets swapped from inside its own panel.
set(
  "preserve-region",
  popoverHtml({}, "preserved", {
    label: "Open preserved",
    title: "Preserved",
    inner: `<button type="button" id="swap-preserve" hx-get="/fragments/popover-preserve" hx-target="#preserve-region" hx-swap="outerHTML">Swap region</button>`,
  }).replace("<primitiv-popover ", '<primitiv-popover hx-preserve="true" '),
);
// 6: the popover history restore must bring back open, with the link that leaves it inside.
set(
  "history-region",
  popoverHtml({}, "history", {
    label: "Open history",
    title: "History",
    inner: `<a id="go-two" href="/page-two" hx-get="/fragments/page-two" hx-target="#history-target" hx-push-url="/popover-page-two">Go to page two</a>`,
  }),
);
// 7: posts each change to the server; vetoes closing once opened.
set(
  "echo-region",
  popoverHtml({}, "echo", { label: "Open echo", title: "Echo" }).replace(
    "<primitiv-popover ",
    `<primitiv-popover hx-get="/fragments/popover-echo" hx-trigger="primitiv-popover-change" hx-target="#echo-target" hx-vals='js:{open: event.detail.open}' hx-on:primitiv-popover-change="if (!event.detail.open) event.preventDefault()" `,
  ),
);

htmx.process(document.body);
