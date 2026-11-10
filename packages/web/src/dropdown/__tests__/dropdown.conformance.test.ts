import { DROPDOWN, runDropdownConformance } from "@primitiv-ui/conformance";

import { dropdownHtml } from "./dropdown.fixtures";
import { mount } from "./mount";

// The elements surface runs the same suite as React (RFC 0033 §6.2); the
// fixture's labels are the suite's, so one markup function serves both.
runDropdownConformance(async ({ open }) => {
  await mount(dropdownHtml({ open }) + `<button type="button">${DROPDOWN.outside}</button>`);
  return () => document.body.replaceChildren();
});
