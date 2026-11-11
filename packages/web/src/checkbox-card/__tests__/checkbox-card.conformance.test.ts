import { runCheckboxCardConformance } from "@primitiv-ui/conformance";

import { defineCheckboxCard } from "../elements";
import { checkboxCardHtml } from "./checkbox-card.fixtures";

runCheckboxCardConformance(async (fixture) => {
  defineCheckboxCard();
  document.body.innerHTML = checkboxCardHtml(fixture);
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
