// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against ToggleGroup.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { toggleGroupHtml } from "./toggle-group-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer group with a slot that will receive a nested one.
set("outer-region", toggleGroupHtml({}, "outer").replace("</primitiv-toggle-group>", '<span id="outer-slot"></span></primitiv-toggle-group>'));
// 3: the group the out-of-band fragment appends to.
set("oob-region", toggleGroupHtml({}, "oob"));
// 4: the group the server re-renders.
set("rerender-region", toggleGroupHtml({}, "rerendered"));
// 5: a preserved group inside a region that gets swapped.
set(
  "preserve-region",
  toggleGroupHtml({}, "preserved").replace("<primitiv-toggle-group ", '<primitiv-toggle-group hx-preserve="true" '),
);
// 6: the group whose pressed items history restore must bring back.
set("history-region", toggleGroupHtml({ multiple: true }, "history"));
// 7: posts each change to the server, and vetoes pressing "underline".
set("echo-region", toggleGroupHtml({}, "echo").replace(
  "<primitiv-toggle-group ",
  `<primitiv-toggle-group hx-get="/fragments/toggle-group-echo" hx-trigger="primitiv-toggle-group-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value.join(" ")}' hx-on:primitiv-toggle-group-change="if (event.detail.value.includes('underline')) event.preventDefault()" `,
));

htmx.process(document.body);
