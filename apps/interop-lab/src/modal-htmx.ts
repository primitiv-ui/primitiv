// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases
// that apply to a dialog, run against Modal. A modal dialog makes the rest of
// the page inert, so the controls that act while one is open sit inside it.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { modalHtml } from "./modal-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer modal whose dialog will receive a nested one.
set(
  "outer-region",
  modalHtml({}, "outer", {
    label: "Open outer",
    title: "Outer",
    inner: `<button type="button" id="load-nested" hx-get="/fragments/modal-nested" hx-target="#outer-slot">Load nested</button><div id="outer-slot"></div>`,
  }),
);
// 3: a modal whose dialog arrives out of band.
set(
  "oob-region",
  '<primitiv-modal id="oob"><primitiv-modal-trigger><button type="button">Open out of band</button>' +
    "</primitiv-modal-trigger></primitiv-modal>",
);
// 4: the modal the server re-renders.
set("rerender-region", modalHtml({}, "rerendered", { label: "Open rerendered", title: "Rerendered" }));
// 5: a preserved modal inside a region that gets swapped from inside its own dialog.
set(
  "preserve-region",
  modalHtml({}, "preserved", {
    label: "Open preserved",
    title: "Preserved",
    inner: `<button type="button" id="swap-preserve" hx-get="/fragments/modal-preserve" hx-target="#preserve-region" hx-swap="outerHTML">Swap region</button>`,
  }).replace("<primitiv-modal ", '<primitiv-modal hx-preserve="true" '),
);
// 6: the modal history restore must bring back open, with the link that leaves it inside.
set(
  "history-region",
  modalHtml({}, "history", {
    label: "Open history",
    title: "History",
    inner: `<a id="go-two" href="/page-two" hx-get="/fragments/page-two" hx-target="#history-target" hx-push-url="/modal-page-two">Go to page two</a>`,
  }),
);
// 7: posts each change to the server; vetoes closing once opened.
set(
  "echo-region",
  modalHtml({}, "echo", { label: "Open echo", title: "Echo" }).replace(
    "<primitiv-modal ",
    `<primitiv-modal hx-get="/fragments/modal-echo" hx-trigger="primitiv-modal-change" hx-target="#echo-target" hx-vals='js:{open: event.detail.open}' hx-on:primitiv-modal-change="if (!event.detail.open) event.preventDefault()" `,
  ),
);

htmx.process(document.body);
