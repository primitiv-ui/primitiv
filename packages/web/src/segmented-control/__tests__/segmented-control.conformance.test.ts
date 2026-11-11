import { runSegmentedControlConformance } from "@primitiv-ui/conformance";

import { defineSegmentedControl } from "../elements";
import { segmentedControlHtml } from "./segmented-control.fixtures";

runSegmentedControlConformance(async ({ value, orientation, dir, disabled, controlDisabled, label }) => {
  defineSegmentedControl();
  const control = segmentedControlHtml({ value, orientation, disabled, controlDisabled, label });
  document.body.innerHTML = dir ? `<div dir="${dir}">${control}</div>` : control;
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
