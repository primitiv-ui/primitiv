// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Combobox. A combobox has no right-to-left behaviour, so it adds
// the case HTMX is most often reached for with one instead: the server filters,
// swapping the matching items into the open list on every query.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { comboboxHtml } from "./combobox-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: the combobox the out-of-band item is appended to.
set("oob-region", comboboxHtml({}, "oob"));
// 3: the combobox the server re-renders.
set("rerender-region", comboboxHtml({}, "rerendered"));
// 4: a preserved combobox inside a region that gets swapped.
set("preserve-region", comboboxHtml({}, "preserved").replace("<primitiv-combobox ", '<primitiv-combobox hx-preserve="true" '));
// 5: the combobox whose value history restore must bring back.
set("history-region", comboboxHtml({}, "history"));
// 6: posts each change to the server, and vetoes committing Vue.
set("echo-region", comboboxHtml({}, "echo").replace(
  "<primitiv-combobox ",
  `<primitiv-combobox hx-get="/fragments/combobox-echo" hx-trigger="primitiv-combobox-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value}' hx-on:primitiv-combobox-change="if (event.detail.value === 'vue') event.preventDefault()" `,
));
// 7: asks the server for the matching items on every query.
set("filter-region", comboboxHtml({}, "filtered").replace(
  "<primitiv-combobox ",
  `<primitiv-combobox hx-get="/fragments/combobox-filter" hx-trigger="primitiv-combobox-query-change" hx-target="find primitiv-combobox-content" hx-vals='js:{q: event.detail.query}' `,
));
// 8: a named combobox a button includes.
set("include-region", comboboxHtml({ name: "framework" }, "included"));

htmx.process(document.body);
