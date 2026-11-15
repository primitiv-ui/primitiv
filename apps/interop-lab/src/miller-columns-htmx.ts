// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Miller Columns.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { millerColumnsHtml } from "./miller-columns-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer strip on a leaf, whose preview panel will receive a nested strip.
set(
  "outer-region",
  millerColumnsHtml({ value: ["readme"] }, "outer", "Outer").replace(
    "<primitiv-miller-columns-preview-panel>",
    '<primitiv-miller-columns-preview-panel id="outer-preview">',
  ),
);
// 3: a strip whose Blog column arrives out of band.
set("oob-region", millerColumnsHtml({ value: [], omit: ["blog"] }, "oob", "Out of band"));
// 4: the strip the server re-renders.
set("rerender-region", millerColumnsHtml({ value: ["docs"] }, "rerendered", "Re-rendered"));
// 5: a preserved strip inside a region that gets swapped.
set(
  "preserve-region",
  millerColumnsHtml({ value: [] }, "preserved", "Preserved").replace("<primitiv-miller-columns ", '<primitiv-miller-columns hx-preserve="true" '),
);
// 6: the strip whose path history restore must bring back.
set("history-region", millerColumnsHtml({ value: [] }, "history", "History"));
// 7: Blog's column loads its items the first time it opens.
set(
  "lazy-region",
  millerColumnsHtml({ value: [], omit: ["blog"] }, "lazy", "Lazy").replace(
    "</primitiv-miller-columns-tree>",
    '<primitiv-miller-columns-column parent="blog" hx-get="/fragments/miller-columns-lazy" hx-trigger="primitiv-miller-columns-show once"></primitiv-miller-columns-column></primitiv-miller-columns-tree>',
  ),
);
// 8: posts each change of path; vetoes opening Blog.
set(
  "echo-region",
  millerColumnsHtml({ value: [] }, "echo", "Echo").replace(
    "<primitiv-miller-columns ",
    `<primitiv-miller-columns hx-get="/fragments/miller-columns-echo" hx-trigger="primitiv-miller-columns-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value.join(" ")}' hx-on:primitiv-miller-columns-change="if (event.detail.value[0] === 'blog') event.preventDefault()" `,
  ),
);

htmx.process(document.body);
