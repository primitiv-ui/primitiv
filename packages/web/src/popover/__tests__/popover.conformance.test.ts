import "./popover-polyfill";

import { POPOVER, runPopoverConformance } from "@primitiv-ui/conformance";

import { definePopover } from "../elements";

runPopoverConformance(async ({ open }) => {
  definePopover();
  document.body.innerHTML =
    `<primitiv-popover${open ? " open" : ""}>` +
    `<primitiv-popover-trigger><button type="button">${POPOVER.open}</button></primitiv-popover-trigger>` +
    `<primitiv-popover-content popover="auto">` +
    `<primitiv-popover-title><h2>${POPOVER.title}</h2></primitiv-popover-title>` +
    `<primitiv-popover-description><p>${POPOVER.description}</p></primitiv-popover-description>` +
    `<input aria-label="${POPOVER.field}">` +
    `<primitiv-popover-close><button type="button">${POPOVER.close}</button></primitiv-popover-close>` +
    `</primitiv-popover-content></primitiv-popover>` +
    `<button type="button">${POPOVER.outside}</button>`;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
