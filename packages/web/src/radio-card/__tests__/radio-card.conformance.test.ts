import { runRadioCardConformance } from "@primitiv-ui/conformance";

import { defineRadioCard } from "../elements";
import { radioCardHtml } from "./radio-card.fixtures";

runRadioCardConformance(async ({ value, name, orientation, dir, disabled, forceMount, label }) => {
  defineRadioCard();
  const group = radioCardHtml({ value, name, orientation, disabled, forceMount, label });
  document.body.innerHTML = `<form>${dir ? `<div dir="${dir}">${group}</div>` : group}</form>`;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
