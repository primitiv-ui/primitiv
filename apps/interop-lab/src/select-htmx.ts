// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Select. A select has no right-to-left behaviour, so its last case
// is hx-include instead: the value reaches HTMX through the hidden native select.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { selectHtml } from "./select-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: the select the out-of-band item is appended to.
set("oob-region", selectHtml({}, "oob"));
// 3: the select the server re-renders.
set("rerender-region", selectHtml({}, "rerendered"));
// 4: a preserved select inside a region that gets swapped.
set("preserve-region", selectHtml({}, "preserved").replace("<primitiv-select ", '<primitiv-select hx-preserve="true" '));
// 5: the select whose value history restore must bring back.
set("history-region", selectHtml({}, "history"));
// 6: posts each change to the server, and vetoes choosing "cherry".
set("echo-region", selectHtml({}, "echo").replace(
  "<primitiv-select ",
  `<primitiv-select hx-get="/fragments/select-echo" hx-trigger="primitiv-select-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value}' hx-on:primitiv-select-change="if (event.detail.value === 'cherry') event.preventDefault()" `,
));
// 7: a named select a button includes.
set("include-region", selectHtml({ name: "fruit" }, "included"));

htmx.process(document.body);
