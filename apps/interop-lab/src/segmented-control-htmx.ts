// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against SegmentedControl.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { segmentedControlHtml } from "./segmented-control-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an outer control with a slot that will receive a nested one.
set(
  "outer-region",
  segmentedControlHtml({}, "outer").replace(
    "</primitiv-segmented-control>",
    '<span id="outer-slot"></span></primitiv-segmented-control>',
  ),
);
// 3: the control the out-of-band fragment appends to.
set("oob-region", segmentedControlHtml({}, "oob"));
// 4: the control the server re-renders.
set("rerender-region", segmentedControlHtml({}, "rerendered"));
// 5: a preserved control inside a region that gets swapped.
set(
  "preserve-region",
  segmentedControlHtml({}, "preserved").replace(
    "<primitiv-segmented-control ",
    '<primitiv-segmented-control hx-preserve="true" ',
  ),
);
// 6: the control whose selection history restore must bring back.
set("history-region", segmentedControlHtml({}, "history"));
// 7: posts each change to the server, and vetoes selecting "month".
set(
  "echo-region",
  segmentedControlHtml({}, "echo").replace(
    "<primitiv-segmented-control ",
    `<primitiv-segmented-control hx-get="/fragments/segmented-control-echo" hx-trigger="primitiv-segmented-control-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value}' hx-on:primitiv-segmented-control-change="if (event.detail.value === 'month') event.preventDefault()" `,
  ),
);

htmx.process(document.body);
