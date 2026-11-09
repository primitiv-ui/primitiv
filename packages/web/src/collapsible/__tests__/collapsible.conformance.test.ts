import { runCollapsibleConformance } from "@primitiv-ui/conformance";

import { defineCollapsible } from "../elements";
import { collapsibleHtml } from "./collapsible.fixtures";

runCollapsibleConformance(async ({ open, disabled }) => {
  defineCollapsible();
  document.body.innerHTML = collapsibleHtml({ open, disabled });
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
