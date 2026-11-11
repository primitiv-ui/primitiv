// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Slider.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { sliderHtml } from "./slider-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: the slider the out-of-band fragment appends a thumb to.
set("oob-region", sliderHtml({ value: "20 80" }, "oob"));
// 3: the slider the server re-renders.
set("rerender-region", sliderHtml({}, "rerendered"));
// 4: a preserved slider inside a region that gets swapped.
set("preserve-region", sliderHtml({}, "preserved").replace("<primitiv-slider ", '<primitiv-slider hx-preserve="true" '));
// 5: the slider whose values history restore must bring back.
set("history-region", sliderHtml({}, "history"));
// 6: posts each committed value to the server, and vetoes going past 60.
set(
  "echo-region",
  sliderHtml({}, "echo").replace(
    "<primitiv-slider ",
    `<primitiv-slider hx-get="/fragments/slider-echo" hx-trigger="primitiv-slider-commit" hx-target="#echo-target" hx-vals='js:{value: event.detail.value.join(" ")}' hx-on:primitiv-slider-change="if (event.detail.value[0] > 60) event.preventDefault()" `,
  ),
);

htmx.process(document.body);
