import "./dialog-polyfill";

import { MODAL, runModalConformance } from "@primitiv-ui/conformance";

import { defineModal } from "../elements";

runModalConformance(async ({ open }) => {
  defineModal();
  document.body.innerHTML =
    `<primitiv-modal${open ? " open" : ""}>` +
    `<primitiv-modal-trigger><button type="button">${MODAL.open}</button></primitiv-modal-trigger>` +
    `<primitiv-modal-content><dialog>` +
    `<primitiv-modal-title><h2>${MODAL.title}</h2></primitiv-modal-title>` +
    `<primitiv-modal-description><p>${MODAL.description}</p></primitiv-modal-description>` +
    `<input aria-label="${MODAL.field}">` +
    `<primitiv-modal-close><button type="button">${MODAL.close}</button></primitiv-modal-close>` +
    `</dialog></primitiv-modal-content></primitiv-modal>`;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
