import "./popover-polyfill";

import { runSelectConformance, SELECT_ITEMS } from "@primitiv-ui/conformance";

import { defineSelect } from "../elements";

runSelectConformance(async ({ value, name, required, disabled = [], indicators, placeholder, label }) => {
  defineSelect();
  const attrs = [
    value ? ` value="${value}"` : "",
    name ? ` name="${name}"` : "",
    required ? " required" : "",
  ].join("");
  const items = SELECT_ITEMS.map(
    (item) =>
      `<primitiv-select-item value="${item.value}"${disabled.includes(item.value) ? " disabled" : ""}>` +
      `${indicators ? "<primitiv-select-item-indicator>✓</primitiv-select-item-indicator>" : ""}${item.label}</primitiv-select-item>`,
  ).join("");
  document.body.innerHTML =
    `<form><primitiv-select${attrs}>` +
    `<primitiv-select-trigger><button type="button" aria-label="${label}"><primitiv-select-value placeholder="${placeholder}"></primitiv-select-value></button></primitiv-select-trigger>` +
    `<primitiv-select-content>${items}</primitiv-select-content></primitiv-select></form>`;
  await new Promise((resolve) => setTimeout(resolve, 0));
  return () => document.body.replaceChildren();
});
