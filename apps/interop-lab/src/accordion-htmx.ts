// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Accordion.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { accordionHtml } from "./accordion-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer accordion whose first panel will receive a nested one.
set("outer-region", accordionHtml({ value: "one" }, "outer").replace(
  "<primitiv-accordion-content>First panel",
  '<primitiv-accordion-content id="outer-one">First panel',
));
// 3: the accordion the out-of-band fragment appends to.
set("oob-region", accordionHtml({ value: "one" }, "oob"));
// 4: the accordion the server re-renders.
set("rerender-region", accordionHtml({ value: "one" }, "rerendered"));
// 5: a preserved accordion inside a region that gets swapped.
set(
  "preserve-region",
  accordionHtml({ value: "one" }, "preserved").replace("<primitiv-accordion ", '<primitiv-accordion hx-preserve="true" '),
);
// 6: the accordion whose open items history restore must bring back.
set("history-region", accordionHtml({ value: "one", multiple: true }, "history"));
// 7: panel two loads its content on first open.
set("lazy-region", accordionHtml({ value: "one", multiple: true }, "lazy").replace(
  "<primitiv-accordion-content hidden>Second panel</primitiv-accordion-content>",
  '<primitiv-accordion-content hidden hx-get="/fragments/accordion-lazy" hx-trigger="primitiv-accordion-show once">Loading…</primitiv-accordion-content>',
));
// 8: posts each change to the server, and vetoes opening "three".
set("echo-region", accordionHtml({ value: "one" }, "echo").replace(
  "<primitiv-accordion ",
  `<primitiv-accordion hx-get="/fragments/accordion-echo" hx-trigger="primitiv-accordion-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value.join(" ")}' hx-on:primitiv-accordion-change="if (event.detail.value.includes('three')) event.preventDefault()" `,
));

htmx.process(document.body);
