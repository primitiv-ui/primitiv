import { runRadioCardConformance } from "@primitiv-ui/conformance";

import { defineRadioCard } from "../elements";
import { radioCardHtml } from "./radio-card.fixtures";

runRadioCardConformance(async ({ value, orientation, dir, disabled, forceMount, label }) => {
  defineRadioCard();
  const group = radioCardHtml({ value, orientation, disabled, forceMount, label });
  document.body.innerHTML = dir ? `<div dir="${dir}">${group}</div>` : group;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
