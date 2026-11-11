import { CONTEXT_MENU, runContextMenuConformance } from "@primitiv-ui/conformance";

import { contextMenuHtml } from "./context-menu.fixtures";
import { mount } from "./mount";

// The elements surface runs the same suite as React (RFC 0033 §6.2); the
// fixture's labels are the suite's, so one markup function serves both.
runContextMenuConformance(async ({ open, disabled }) => {
  await mount(contextMenuHtml({ open, disabled }) + `<button type="button">${CONTEXT_MENU.outside}</button>`);
  return () => document.body.replaceChildren();
});
