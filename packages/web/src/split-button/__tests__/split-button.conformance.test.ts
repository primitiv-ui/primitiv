import { runSplitButtonConformance } from "@primitiv-ui/conformance";

import { splitButtonHtml } from "./split-button.fixtures";
import { mount } from "./mount";

// The elements surface runs the same suite as React (RFC 0033 §6.2); the
// fixture's labels are the suite's, so one markup function serves both.
runSplitButtonConformance(async ({ triggerLabel, ...fixture }) => {
  await mount(splitButtonHtml({ ...fixture, triggerAttrs: triggerLabel ? ` aria-label="${triggerLabel}"` : "" }));
  return () => document.body.replaceChildren();
});
