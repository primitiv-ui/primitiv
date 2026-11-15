// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the element's own lifecycle (RFC 0033 §5.4, §7.4) — the Collapsible
// cases, run against a table's expandable rows.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { tableHtml } from "./table-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer table with Ada open, whose detail row will receive a nested table.
set("outer-region", tableHtml({ expanded: ["Ada"] }, "outer"));
// 3: a table whose body grows.
set("grow-region", tableHtml({}, "grow", ["Ada"]));
// 4: a table whose open detail row the server re-renders.
set("oob-region", tableHtml({ expanded: ["Ada"] }, "oob"));
// 5: the table the server re-renders.
set("rerender-region", tableHtml({}, "rerendered"));
// 6: a preserved table inside a region that gets swapped.
set("preserve-region", tableHtml({}, "preserved").replace("<table ", '<table hx-preserve="true" '));
// 7: the table whose expanded row history restore must bring back.
set("history-region", tableHtml({}, "history"));
// 8: Ada's detail row loads its content the first time it opens.
set(
  "lazy-region",
  tableHtml({}, "lazy").replace(
    `<tr id="lazy-ada-details" hidden><td colspan="2">Ada's details`,
    `<tr id="lazy-ada-details" hidden hx-get="/fragments/table-lazy" hx-trigger="primitiv-table-expand-show once" hx-target="find td"><td colspan="2">Loading…`,
  ),
);
// 9: posts each change of Ada's row; vetoes closing it once opened.
set(
  "echo-region",
  tableHtml({}, "echo").replace(
    "<primitiv-table-expand-trigger>",
    `<primitiv-table-expand-trigger hx-get="/fragments/table-echo" hx-trigger="primitiv-table-expand-change" hx-target="#echo-target" hx-vals='js:{expanded: event.detail.expanded}' hx-on:primitiv-table-expand-change="if (!event.detail.expanded) event.preventDefault()">`,
  ),
);

htmx.process(document.body);
