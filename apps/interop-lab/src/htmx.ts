// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4).
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { tabsHtml } from "./fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer tab set whose first panel will receive a nested one.
set("outer-region", tabsHtml({ value: "one" }, "outer").replace(
  '<primitiv-tabs-content value="one">First panel</primitiv-tabs-content>',
  '<primitiv-tabs-content value="one" id="outer-one">First panel</primitiv-tabs-content>',
));
// 3: the tab set the out-of-band fragment appends to.
set("oob-region", tabsHtml({ value: "one" }, "oob"));
// 4: the tab set the server re-renders.
set("rerender-region", tabsHtml({ value: "one" }, "rerendered"));
// 5: a preserved tab set inside a region that gets swapped.
set("preserve-region", tabsHtml({ value: "one" }, "preserved").replace("<primitiv-tabs ", '<primitiv-tabs hx-preserve="true" '));
// 6: the tab set whose selection history restore must bring back.
set("history-region", tabsHtml({ value: "one" }, "history"));
// 7: panel two loads its content on first show.
set("lazy-region", tabsHtml({ value: "one" }, "lazy").replace(
  '<primitiv-tabs-content value="two" hidden>Second panel</primitiv-tabs-content>',
  '<primitiv-tabs-content value="two" hidden hx-get="/fragments/lazy" hx-trigger="primitiv-tabs-show once">Loading…</primitiv-tabs-content>',
));
// 8: posts each change to the server, and vetoes selecting "three".
set("echo-region", tabsHtml({ value: "one" }, "echo").replace(
  '<primitiv-tabs ',
  `<primitiv-tabs hx-get="/fragments/echo" hx-trigger="primitiv-tabs-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value}' hx-on:primitiv-tabs-change="if (event.detail.value === 'three') event.preventDefault()" `,
));
// 9: a focused region that is swapped out from under the keyboard.
set("focus-region", tabsHtml({ value: "one" }, "focused"));

htmx.process(document.body);
