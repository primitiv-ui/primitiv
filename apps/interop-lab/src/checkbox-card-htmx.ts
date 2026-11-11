// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against CheckboxCard.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { checkboxCardHtml } from "./checkbox-card-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: the card the out-of-band fragment arrives beside.
set("oob-region", checkboxCardHtml({}, "first", "First"));
// 3: the card the server re-renders.
set("rerender-region", checkboxCardHtml({}, "rerendered", "Re-rendered"));
// 4: a preserved card inside a region that gets swapped.
set("preserve-region", checkboxCardHtml({}, "preserved", "Preserved").replace("<primitiv-checkbox-card ", '<primitiv-checkbox-card hx-preserve="true" '));
// 5: the card whose state history restore must bring back.
set("history-region", checkboxCardHtml({}, "history", "History"));
// 6: posts each change to the server; the second card vetoes every change.
set(
  "echo-region",
  checkboxCardHtml({}, "echo", "Echo").replace(
    "<primitiv-checkbox-card ",
    `<primitiv-checkbox-card hx-get="/fragments/checkbox-card-echo" hx-trigger="primitiv-checkbox-card-change" hx-target="#echo-target" hx-vals='js:{checked: event.detail.checked}' `,
  ),
);
set(
  "veto-region",
  checkboxCardHtml({}, "veto", "Veto").replace(
    "<primitiv-checkbox-card ",
    `<primitiv-checkbox-card hx-on:primitiv-checkbox-card-change="event.preventDefault()" `,
  ),
);

htmx.process(document.body);
