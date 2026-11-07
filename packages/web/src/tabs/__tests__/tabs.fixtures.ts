/**
 * Shared Tabs markup for the element tests: one function, pure string output,
 * mirroring how `Tabs.fixtures.ts` keeps the React suites' data in one place.
 */
export type TabsFixture = {
  value?: string;
  orientation?: "horizontal" | "vertical";
  activationMode?: "automatic" | "manual";
  disabled?: string[];
  /** Ids to pre-render on the first tab and first panel. */
  triggerId?: string;
  panelId?: string;
};

export const TABS = [
  { value: "one", label: "One", panel: "First panel" },
  { value: "two", label: "Two", panel: "Second panel" },
  { value: "three", label: "Three", panel: "Third panel" },
];

export function tabsHtml({
  value,
  orientation,
  activationMode,
  disabled = [],
  triggerId,
  panelId,
}: TabsFixture): string {
  const attrs = [
    value === undefined ? "" : ` value="${value}"`,
    orientation ? ` orientation="${orientation}"` : "",
    activationMode ? ` activation-mode="${activationMode}"` : "",
  ].join("");
  const triggers = TABS.map(
    (tab, index) =>
      `<primitiv-tabs-trigger value="${tab.value}"${disabled.includes(tab.value) ? " disabled" : ""}>` +
      `<button type="button"${index === 0 && triggerId ? ` id="${triggerId}"` : ""}>${tab.label}</button>` +
      `</primitiv-tabs-trigger>`,
  ).join("");
  const panels = TABS.map(
    (tab, index) =>
      `<primitiv-tabs-content value="${tab.value}"${index === 0 && panelId ? ` id="${panelId}"` : ""}>${tab.panel}</primitiv-tabs-content>`,
  ).join("");
  return `<primitiv-tabs${attrs}><primitiv-tabs-list label="Sections">${triggers}</primitiv-tabs-list>${panels}</primitiv-tabs>`;
}
