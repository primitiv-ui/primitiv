// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Listbox. A listbox inside a listbox is not valid ARIA, so the
// nesting case is an out-of-band group joining an existing list instead.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { listboxHtml } from "./listbox-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: the listbox an out-of-band group is appended to.
set("group-region", listboxHtml({}, "grouped"));
// 3: the listbox the out-of-band option is appended to.
set("oob-region", listboxHtml({}, "oob"));
// 4: the listbox the server re-renders.
set("rerender-region", listboxHtml({}, "rerendered"));
// 5: a preserved listbox inside a region that gets swapped.
set("preserve-region", listboxHtml({}, "preserved").replace("<primitiv-listbox ", '<primitiv-listbox hx-preserve="true" '));
// 6: the listbox whose selection history restore must bring back.
set("history-region", listboxHtml({ multiple: true }, "history"));
// 7: posts each change to the server, and vetoes selecting "carrot".
set("echo-region", listboxHtml({}, "echo").replace(
  "<primitiv-listbox ",
  `<primitiv-listbox hx-get="/fragments/listbox-echo" hx-trigger="primitiv-listbox-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value.join(" ")}' hx-on:primitiv-listbox-change="if (event.detail.value.includes('carrot')) event.preventDefault()" `,
));

htmx.process(document.body);
