import { runCheckboxCardConformance } from "@primitiv-ui/conformance";

import { defineCheckboxCard } from "../elements";
import { checkboxCardHtml } from "./checkbox-card.fixtures";

runCheckboxCardConformance(async (fixture) => {
  defineCheckboxCard();
  document.body.innerHTML = `<form>${checkboxCardHtml(fixture)}</form>`;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
