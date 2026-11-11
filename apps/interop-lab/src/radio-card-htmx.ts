// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against RadioCard.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { radioCardHtml } from "./radio-card-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer group with a slot that will receive a nested one.
set("outer-region", radioCardHtml({}, "outer").replace("</primitiv-radio-card>", '<span id="outer-slot"></span></primitiv-radio-card>'));
// 3: the group the out-of-band fragment appends to.
set("oob-region", radioCardHtml({}, "oob"));
// 4: the group the server re-renders.
set("rerender-region", radioCardHtml({}, "rerendered"));
// 5: a preserved group inside a region that gets swapped.
set("preserve-region", radioCardHtml({}, "preserved").replace("<primitiv-radio-card ", '<primitiv-radio-card hx-preserve="true" '));
// 6: the group whose selection history restore must bring back.
set("history-region", radioCardHtml({}, "history"));
// 7: posts each change to the server, and vetoes selecting "team".
set(
  "echo-region",
  radioCardHtml({}, "echo").replace(
    "<primitiv-radio-card ",
    `<primitiv-radio-card hx-get="/fragments/radio-card-echo" hx-trigger="primitiv-radio-card-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value}' hx-on:primitiv-radio-card-change="if (event.detail.value === 'team') event.preventDefault()" `,
  ),
);

htmx.process(document.body);
