// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases
// that apply to a tooltip, run against Tooltip. A tooltip opened by focus stays
// open while a swap runs from script, so the swaps that act on an open one go
// through htmx.ajax rather than a click, which would close it first.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { tooltipHtml } from "./tooltip-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};
const tip = (id: string, label: string, text: string) => ({ id, label, tip: text });

// 2: a tooltip whose content arrives out of band.
set(
  "oob-region",
  '<primitiv-tooltip id="oob"><primitiv-tooltip-trigger><button type="button">Out of band</button>' +
    "</primitiv-tooltip-trigger></primitiv-tooltip>",
);
// 3: the tooltip the server re-renders.
set("rerender-region", tooltipHtml({}, tip("rerendered", "Rerendered", "Rerendered tip")));
// 4: a preserved tooltip inside a region that gets swapped.
set(
  "preserve-region",
  tooltipHtml({}, tip("preserved", "Preserved", "Preserved tip")).replace(
    "<primitiv-tooltip ",
    '<primitiv-tooltip hx-preserve="true" ',
  ),
);
// 5: a tooltip removed while open, and the one hovered next.
set("doomed-region", tooltipHtml({}, tip("doomed", "Doomed", "Doomed tip")));
set("next-region", tooltipHtml({}, tip("next", "Next", "Next tip")));
// 6: posts each change to the server; vetoes closing once opened.
set(
  "echo-region",
  tooltipHtml({}, tip("echo", "Echo", "Echo tip")).replace(
    "<primitiv-tooltip ",
    `<primitiv-tooltip hx-get="/fragments/tooltip-echo" hx-trigger="primitiv-tooltip-change" hx-target="#echo-target" hx-vals='js:{open: event.detail.open}' hx-on:primitiv-tooltip-change="if (!event.detail.open) event.preventDefault()" `,
  ),
);

htmx.process(document.body);
