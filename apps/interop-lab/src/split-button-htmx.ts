// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against SplitButton.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { splitButtonHtml } from "./split-button-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: the split button the out-of-band fragment arrives beside.
set("oob-region", splitButtonHtml({}, "first", "First"));
// 3: the split button the server re-renders.
set("rerender-region", splitButtonHtml({}, "rerendered", "Rerendered"));
// 4: a preserved split button inside a region that gets swapped.
set("preserve-region", splitButtonHtml({}, "preserved", "Preserved").replace("<primitiv-split-button ", '<primitiv-split-button hx-preserve="true" '));
// 5: the split button whose open menu history restore must bring back.
set("history-region", splitButtonHtml({}, "history", "History"));
// 6: posts each menu change to the server; the second vetoes every opening.
set(
  "echo-region",
  splitButtonHtml({}, "echo", "Echo").replace(
    "<primitiv-split-button ",
    `<primitiv-split-button hx-get="/fragments/split-button-echo" hx-trigger="primitiv-dropdown-change" hx-target="#echo-target" hx-vals='js:{open: event.detail.open}' `,
  ),
);
set(
  "veto-region",
  splitButtonHtml({}, "veto", "Veto").replace(
    "<primitiv-split-button ",
    `<primitiv-split-button hx-on:primitiv-dropdown-change="event.preventDefault()" `,
  ),
);

htmx.process(document.body);
