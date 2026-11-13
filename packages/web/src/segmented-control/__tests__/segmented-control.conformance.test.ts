import { runSegmentedControlConformance } from "@primitiv-ui/conformance";

import { defineSegmentedControl } from "../elements";
import { segmentedControlHtml } from "./segmented-control.fixtures";

runSegmentedControlConformance(async ({ value, name, orientation, dir, disabled, controlDisabled, label }) => {
  defineSegmentedControl();
  const control = segmentedControlHtml({ value, name, orientation, disabled, controlDisabled, label });
  document.body.innerHTML = `<form>${dir ? `<div dir="${dir}">${control}</div>` : control}</form>`;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
