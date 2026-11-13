import { runToggleGroupConformance } from "@primitiv-ui/conformance";

import { defineToggleGroup } from "../elements";
import { toggleGroupHtml } from "./toggle-group.fixtures";

runToggleGroupConformance(async ({ type, value = [], name, orientation, dir, disabled, label }) => {
  defineToggleGroup();
  const group = toggleGroupHtml({ type, value: value.join(" "), name, orientation, disabled, label });
  document.body.innerHTML = `<form>${dir ? `<div dir="${dir}">${group}</div>` : group}</form>`;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
