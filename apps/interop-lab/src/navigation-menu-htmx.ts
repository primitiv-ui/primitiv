// HTMX: nothing re-renders the elements on HTMX's behalf, so every swap below
// leans on the elements' own lifecycle (RFC 0033 §5.4, §7.4) — the Tabs cases,
// run against Navigation Menu. Every menu here is click-only, so moving the
// pointer to a control below never opens or closes one.
import "@primitiv-ui/web/define";

import htmx from "htmx.org";

import { navigationMenuHtml } from "./navigation-menu-fixture";

(window as unknown as { htmx: typeof htmx }).htmx = htmx;

const CLICK_ONLY = ' open-on-hover="false"';

const set = (id: string, html: string) => {
  (document.getElementById(id) as HTMLElement).innerHTML = html;
};

// 2: an open outer menu whose Docs panel holds a button that loads a nested one.
set(
  "outer-region",
  navigationMenuHtml({ value: "docs" }, "outer", {
    label: "Outer",
    attrs: CLICK_ONLY,
    inner: `<button type="button" id="load-nested" hx-get="/fragments/navigation-menu-nested" hx-target="#outer-slot">Load nested</button><div id="outer-slot"></div>`,
  }),
);
// 3: a menu with a viewport but no panels yet; its Docs panel arrives out of band.
set(
  "oob-region",
  navigationMenuHtml({ viewport: true }, "oob", { attrs: CLICK_ONLY }).replace(
    /<primitiv-navigation-menu-viewport data-testid="viewport">.*<\/primitiv-navigation-menu-viewport>/,
    '<primitiv-navigation-menu-viewport id="oob-viewport"></primitiv-navigation-menu-viewport>',
  ),
);
// 4: the menu the server re-renders.
set("rerender-region", navigationMenuHtml({}, "rerendered", { attrs: CLICK_ONLY }));
// 5: a preserved menu inside a region that gets swapped.
set(
  "preserve-region",
  navigationMenuHtml({}, "preserved", { attrs: ` hx-preserve="true"${CLICK_ONLY}` }),
);
// 6: the menu history restore must bring back open. Its link sits outside the
// menu, since following a link inside one closes it first.
set("history-region", navigationMenuHtml({}, "history", { attrs: CLICK_ONLY }));
// 7: posts each change to the server; vetoes closing once opened.
set(
  "echo-region",
  navigationMenuHtml({}, "echo", {
    attrs: `${CLICK_ONLY} hx-get="/fragments/navigation-menu-echo" hx-trigger="primitiv-navigation-menu-change" hx-target="#echo-target" hx-vals='js:{value: event.detail.value}' hx-on:primitiv-navigation-menu-change="if (!event.detail.value) event.preventDefault()"`,
  }),
);

htmx.process(document.body);
