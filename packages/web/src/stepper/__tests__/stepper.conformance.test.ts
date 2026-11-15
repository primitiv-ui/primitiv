import { runTabsConformance, TABS, type TabsConformanceFixture } from "@primitiv-ui/conformance";

import { defineStepper } from "../elements";

/**
 * The stepper IS a tab set, so it must pass Tabs' own conformance suite. The
 * mount always writes `activation-mode`: the suite's default is Tabs'
 * (`automatic`), and the stepper's different default is its own suite's subject.
 */
function html({ value, orientation, activationMode = "automatic", dir, disabled = [], label }: TabsConformanceFixture): string {
  const attrs = [
    value === undefined ? "" : ` value="${value}"`,
    orientation ? ` orientation="${orientation}"` : "",
    ` activation-mode="${activationMode}"`,
  ].join("");
  const steps = TABS.map(
    (tab) =>
      `<primitiv-stepper-step value="${tab.value}"${disabled.includes(tab.value) ? " disabled" : ""}>` +
      `<button type="button">${tab.label}</button></primitiv-stepper-step>`,
  ).join("");
  const panels = TABS.map(
    (tab) => `<primitiv-stepper-panel value="${tab.value}">${tab.panel}</primitiv-stepper-panel>`,
  ).join("");
  const stepper = `<primitiv-stepper${attrs}><primitiv-stepper-list label="${label}">${steps}</primitiv-stepper-list>${panels}</primitiv-stepper>`;
  return dir ? `<div dir="${dir}">${stepper}</div>` : stepper;
}

runTabsConformance(async (fixture) => {
  defineStepper();
  document.body.innerHTML = html(fixture);
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
