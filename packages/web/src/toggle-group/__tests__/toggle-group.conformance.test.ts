import { runToggleGroupConformance } from "@primitiv-ui/conformance";

import { defineToggleGroup } from "../elements";
import { toggleGroupHtml } from "./toggle-group.fixtures";

runToggleGroupConformance(async ({ type, value = [], orientation, dir, disabled, label }) => {
  defineToggleGroup();
  const group = toggleGroupHtml({ type, value: value.join(" "), orientation, disabled, label });
  document.body.innerHTML = dir ? `<div dir="${dir}">${group}</div>` : group;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
