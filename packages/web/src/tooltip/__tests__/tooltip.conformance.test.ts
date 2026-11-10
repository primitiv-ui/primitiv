import "./popover-polyfill";

import { runTooltipConformance, TOOLTIP } from "@primitiv-ui/conformance";

import { defineTooltip } from "../elements";

runTooltipConformance(async ({ open }) => {
  defineTooltip();
  document.body.innerHTML =
    `<primitiv-tooltip delay-duration="0"${open ? " open" : ""}>` +
    `<primitiv-tooltip-trigger><button type="button">${TOOLTIP.label}</button></primitiv-tooltip-trigger>` +
    `<primitiv-tooltip-content popover="manual">${TOOLTIP.tip}</primitiv-tooltip-content></primitiv-tooltip>`;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
