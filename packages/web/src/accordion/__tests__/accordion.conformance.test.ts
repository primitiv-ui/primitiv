import { runAccordionConformance } from "@primitiv-ui/conformance";

import { defineAccordion } from "../elements";
import { accordionHtml } from "./accordion.fixtures";

runAccordionConformance(async ({ value, multiple, orientation, dir, disabled }) => {
  defineAccordion();
  const accordion = accordionHtml({ value, multiple, orientation, disabled });
  document.body.innerHTML = dir ? `<div dir="${dir}">${accordion}</div>` : accordion;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
