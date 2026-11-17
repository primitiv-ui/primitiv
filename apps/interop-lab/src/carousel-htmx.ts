// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Carousel.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { carouselHtml } from "./carousel-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: the carousel the out-of-band fragment appends a slide to.
set("oob-region", carouselHtml({}, "oob"));
// 3: the carousel the server re-renders.
set("rerender-region", carouselHtml({}, "rerendered"));
// 4: a preserved carousel inside a region that gets swapped.
set("preserve-region", carouselHtml({}, "preserved").replace("<primitiv-carousel ", '<primitiv-carousel hx-preserve="true" '));
// 5: the carousel whose page history restore must bring back.
set("history-region", carouselHtml({}, "history"));
// 6: posts each page change to the server, and vetoes going past the second page.
set(
  "echo-region",
  carouselHtml({}, "echo").replace(
    "<primitiv-carousel ",
    `<primitiv-carousel hx-get="/fragments/carousel-echo" hx-trigger="primitiv-carousel-change" hx-target="#echo-target" hx-vals='js:{page: event.detail.page}' hx-on:primitiv-carousel-change="if (event.detail.page > 1) event.preventDefault()" `,
  ),
);

htmx.process(document.body);
