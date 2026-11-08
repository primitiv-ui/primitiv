import { runTabsConformance, TABS, type TabsConformanceFixture } from "@primitiv-ui/conformance";

import { defineTabs } from "../elements";

function html({ value, orientation, activationMode, dir, disabled = [], label }: TabsConformanceFixture): string {
  const attrs = [
    value === undefined ? "" : ` value="${value}"`,
    orientation ? ` orientation="${orientation}"` : "",
    activationMode ? ` activation-mode="${activationMode}"` : "",
  ].join("");
  const triggers = TABS.map(
    (tab) =>
      `<primitiv-tabs-trigger value="${tab.value}"${disabled.includes(tab.value) ? " disabled" : ""}>` +
      `<button type="button">${tab.label}</button></primitiv-tabs-trigger>`,
  ).join("");
  const panels = TABS.map(
    (tab) => `<primitiv-tabs-content value="${tab.value}">${tab.panel}</primitiv-tabs-content>`,
  ).join("");
  const tabs = `<primitiv-tabs${attrs}><primitiv-tabs-list label="${label}">${triggers}</primitiv-tabs-list>${panels}</primitiv-tabs>`;
  return dir ? `<div dir="${dir}">${tabs}</div>` : tabs;
}

runTabsConformance(async (fixture) => {
  defineTabs();
  document.body.innerHTML = html(fixture);
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
