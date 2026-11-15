// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Tree.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { treeHtml } from "./tree-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer tree with a slot in its Blog item for a nested one.
set(
  "outer-region",
  treeHtml({}, "outer").replace(
    '<primitiv-tree-item value="blog" label="Blog">Blog</primitiv-tree-item>',
    '<primitiv-tree-item value="blog" label="Blog">Blog<div id="outer-slot"></div></primitiv-tree-item>',
  ),
);
// 3: an expanded branch whose group is empty until its children arrive.
set(
  "oob-region",
  '<primitiv-tree id="oob" aria-label="Lazy" expanded="lazy"><primitiv-tree-branch value="lazy" label="Lazy">' +
    '<primitiv-tree-branch-control>Lazy</primitiv-tree-branch-control>' +
    '<primitiv-tree-branch-content id="lazy-children"></primitiv-tree-branch-content>' +
    "</primitiv-tree-branch></primitiv-tree>",
);
// 4: the tree the server re-renders.
set("rerender-region", treeHtml({}, "rerendered"));
// 5: a preserved tree inside a region that gets swapped.
set("preserve-region", treeHtml({}, "preserved", { attrs: ' hx-preserve="true" selection-mode="multiple"' }));
// 6: the tree whose selection history restore must bring back.
set("history-region", treeHtml({ expanded: ["docs"] }, "history"));
// 7: posts each selection to the server; vetoes clearing it.
set(
  "echo-region",
  treeHtml({}, "echo", {
    attrs: ` hx-get="/fragments/tree-echo" hx-trigger="primitiv-tree-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value.join(" ")}' hx-on:primitiv-tree-change="if (event.detail.value.includes('blog')) event.preventDefault()"`,
  }),
);

htmx.process(document.body);
