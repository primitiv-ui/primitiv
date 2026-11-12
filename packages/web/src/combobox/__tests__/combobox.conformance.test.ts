import "../../select/__tests__/popover-polyfill";

import { COMBOBOX_ITEMS, runComboboxConformance } from "@primitiv-ui/conformance";

import { defineCombobox } from "../elements";

beforeAll(() => {
  // jsdom has no scrollIntoView; the cursor asks for it on every move.
  Element.prototype.scrollIntoView = () => {};
});

runComboboxConformance(async ({ label }) => {
  defineCombobox();
  const items = COMBOBOX_ITEMS.map(
    (item) => `<primitiv-combobox-item value="${item.value}">${item.label}</primitiv-combobox-item>`,
  ).join("");
  document.body.innerHTML =
    `<primitiv-combobox>` +
    `<primitiv-combobox-input><input aria-label="${label}"></primitiv-combobox-input>` +
    `<primitiv-combobox-content aria-label="Frameworks">${items}</primitiv-combobox-content>` +
    `</primitiv-combobox>`;
  await new Promise((resolve) => setTimeout(resolve, 0));
  return () => document.body.replaceChildren();
});
