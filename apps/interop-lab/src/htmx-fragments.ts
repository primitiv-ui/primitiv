/**
 * The HTML fragments the HTMX page fetches, served by a Vite middleware in
 * place of a real backend. Each is what a server-rendered app would send.
 */
import { accordionHtml } from "./accordion-fixture.ts";
import { collapsibleHtml } from "./collapsible-fixture.ts";
import { modalHtml } from "./modal-fixture.ts";
import { popoverHtml } from "./popover-fixture.ts";
import { tabsHtml } from "./fixture.ts";

let lazyLoads = 0;
let echoes = 0;
let accordionLazyLoads = 0;
let accordionEchoes = 0;
let collapsibleLazyLoads = 0;
let collapsibleEchoes = 0;
let modalEchoes = 0;
let popoverEchoes = 0;

export const fragments: Record<string, string | ((url: string) => string)> = {
  // Case 1: a whole tab set arrives in a fragment.
  tabs: tabsHtml({ value: "two" }, "swapped"),

  // Case 2: a tab set swapped into another tab set's panel.
  nested:
    '<primitiv-tabs id="inner" value="a"><primitiv-tabs-list label="Inner">' +
    '<primitiv-tabs-trigger value="a"><button type="button">Inner A</button></primitiv-tabs-trigger>' +
    '<primitiv-tabs-trigger value="b"><button type="button">Inner B</button></primitiv-tabs-trigger>' +
    '</primitiv-tabs-list><primitiv-tabs-content value="a">Inner first</primitiv-tabs-content>' +
    '<primitiv-tabs-content value="b" hidden>Inner second</primitiv-tabs-content></primitiv-tabs>',

  // Case 3: out-of-band additions to an existing tab set.
  "oob-tab":
    '<div hx-swap-oob="beforeend:#oob-list">' +
    '<primitiv-tabs-trigger value="four"><button type="button">Four</button></primitiv-tabs-trigger></div>' +
    '<div hx-swap-oob="beforeend:#oob">' +
    '<primitiv-tabs-content value="four" hidden>Fourth panel</primitiv-tabs-content></div>',

  // Case 4: the server re-renders the root with a new selection.
  "oob-value": `<div hx-swap-oob="outerHTML:#rerendered">${tabsHtml({ value: "three" }, "rerendered")}</div>`,

  // Case 5: a region swap that must leave an hx-preserve'd tab set in place.
  preserve: `<div id="preserve-region"><p>Swapped region</p>${tabsHtml({ value: "one" }, "preserved").replace("<primitiv-tabs ", '<primitiv-tabs hx-preserve="true" ')}</div>`,

  // Case 6: a second "page" for the history test.
  "page-two": "<p id=\"page-two\">Page two</p>",

  // Case 7: a lazy panel's content, counting how often it is fetched.
  lazy: () => `<p data-testid="lazy-content">Lazy content, load ${++lazyLoads}</p>`,

  // Case 8: the server's answer to a posted tab change.
  echo: (url: string) =>
    `<span data-testid="echo">server saw ${new URL(url, "http://lab").searchParams.get("value")} (${++echoes})</span>`,

  // Case 9: a replacement for the focused region.
  replacement: tabsHtml({ value: "one" }, "replacement"),

  // Case 10: a tab set rendered right to left.
  rtl: `<div dir="rtl">${tabsHtml({ value: "one" }, "rtl")}</div>`,

  // The Accordion page's cases (accordion-htmx.html), named to match.
  accordion: accordionHtml({ value: "two" }, "swapped"),
  "accordion-nested":
    '<primitiv-accordion id="inner"><primitiv-accordion-item value="a"><h4><primitiv-accordion-trigger>' +
    '<button type="button">Inner A</button></primitiv-accordion-trigger></h4>' +
    "<primitiv-accordion-content hidden>Inner first</primitiv-accordion-content></primitiv-accordion-item></primitiv-accordion>",
  "accordion-oob-item":
    '<div hx-swap-oob="beforeend:#oob">' +
    '<primitiv-accordion-item value="four"><h3><primitiv-accordion-trigger><button type="button">Four</button>' +
    "</primitiv-accordion-trigger></h3><primitiv-accordion-content hidden>Fourth panel</primitiv-accordion-content>" +
    "</primitiv-accordion-item></div>",
  "accordion-oob-value": `<div hx-swap-oob="outerHTML:#rerendered">${accordionHtml({ value: "three" }, "rerendered")}</div>`,
  "accordion-preserve": `<div id="preserve-region"><p>Swapped region</p>${accordionHtml({ value: "one" }, "preserved").replace("<primitiv-accordion ", '<primitiv-accordion hx-preserve="true" ')}</div>`,
  "accordion-lazy": () => `<p data-testid="lazy-content">Lazy content, load ${++accordionLazyLoads}</p>`,
  "accordion-echo": (url: string) =>
    `<span data-testid="echo">server saw ${new URL(url, "http://lab").searchParams.get("value")} (${++accordionEchoes})</span>`,
  "accordion-rtl": `<div dir="rtl">${accordionHtml({ value: "", orientation: "horizontal" }, "rtl")}</div>`,

  // The Collapsible page's cases (collapsible-htmx.html), named to match.
  collapsible: collapsibleHtml({ open: true }, "swapped"),
  "collapsible-nested": collapsibleHtml({}, "inner", { label: "Inner", panel: "Inner panel" }),
  "collapsible-oob-panel":
    '<div hx-swap-oob="beforeend:#oob"><primitiv-collapsible-content>Out-of-band panel</primitiv-collapsible-content></div>',
  "collapsible-oob-open": `<div hx-swap-oob="outerHTML:#rerendered">${collapsibleHtml({ open: true }, "rerendered")}</div>`,
  "collapsible-preserve": `<div id="preserve-region"><p>Swapped region</p>${collapsibleHtml({}, "preserved").replace("<primitiv-collapsible ", '<primitiv-collapsible hx-preserve="true" ')}</div>`,
  "collapsible-lazy": () => `<p data-testid="lazy-content">Lazy content, load ${++collapsibleLazyLoads}</p>`,
  "collapsible-echo": (url: string) =>
    `<span data-testid="echo">server saw ${new URL(url, "http://lab").searchParams.get("open")} (${++collapsibleEchoes})</span>`,

  // The Modal page's cases (modal-htmx.html), named to match.
  modal: modalHtml({ open: true }, "swapped", { label: "Open swapped", title: "Swapped" }),
  "modal-nested": modalHtml({}, "inner", { label: "Open inner", title: "Inner" }),
  "modal-oob-content":
    '<div hx-swap-oob="beforeend:#oob"><primitiv-modal-content><dialog>' +
    "<primitiv-modal-title><h2>Out of band</h2></primitiv-modal-title>" +
    '<primitiv-modal-close><button type="button">Cancel</button></primitiv-modal-close>' +
    "</dialog></primitiv-modal-content></div>",
  "modal-oob-open": `<div hx-swap-oob="outerHTML:#rerendered">${modalHtml({ open: true }, "rerendered", { label: "Open rerendered", title: "Rerendered" })}</div>`,
  "modal-preserve": `<div id="preserve-region"><p>Swapped region</p>${modalHtml({}, "preserved", { label: "Open preserved", title: "Preserved" }).replace("<primitiv-modal ", '<primitiv-modal hx-preserve="true" ')}</div>`,
  "modal-echo": (url: string) =>
    `<span data-testid="echo">server saw ${new URL(url, "http://lab").searchParams.get("open")} (${++modalEchoes})</span>`,

  // The Popover page's cases (popover-htmx.html), named to match.
  popover: popoverHtml({ open: true }, "swapped", { label: "Open swapped", title: "Swapped" }),
  "popover-nested": popoverHtml({}, "inner", { label: "Open inner", title: "Inner" }),
  "popover-oob-content":
    '<div hx-swap-oob="beforeend:#oob"><primitiv-popover-content popover="auto">' +
    "<primitiv-popover-title><h2>Out of band</h2></primitiv-popover-title>" +
    '<primitiv-popover-close><button type="button">Done</button></primitiv-popover-close>' +
    "</primitiv-popover-content></div>",
  "popover-oob-open": `<div hx-swap-oob="outerHTML:#rerendered">${popoverHtml({ open: true }, "rerendered", { label: "Open rerendered", title: "Rerendered" })}</div>`,
  "popover-preserve": `<div id="preserve-region"><p>Swapped region</p>${popoverHtml({}, "preserved", { label: "Open preserved", title: "Preserved" }).replace("<primitiv-popover ", '<primitiv-popover hx-preserve="true" ')}</div>`,
  "popover-echo": (url: string) =>
    `<span data-testid="echo">server saw ${new URL(url, "http://lab").searchParams.get("open")} (${++popoverEchoes})</span>`,
};
