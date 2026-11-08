/** The tab set every page renders, read from the URL so one spec drives all of them. */
export const TABS = [
  { value: "one", label: "One", panel: "First panel" },
  { value: "two", label: "Two", panel: "Second panel" },
  { value: "three", label: "Three", panel: "Third panel" },
] as const;

export type Fixture = {
  value: string | null;
  orientation: string | null;
  mode: string | null;
  dir: string | null;
  disabled: string[];
};

export function fixtureFromUrl(search: string = location.search): Fixture {
  const params = new URLSearchParams(search);
  return {
    value: params.get("value"),
    orientation: params.get("orientation"),
    mode: params.get("mode"),
    dir: params.get("dir"),
    disabled: params.getAll("disabled"),
  };
}

/** The plain-HTML rendering, shared by the html page and the HTMX fragments. */
export function tabsHtml(fixture: Partial<Fixture> = {}, id = "tabs"): string {
  // `?? "one"`, not a destructuring default: a missing URL param is null.
  const value = fixture.value ?? "one";
  const { orientation, mode, disabled = [] } = fixture;
  const attrs = [
    `id="${id}"`,
    value ? `value="${value}"` : "",
    orientation ? `orientation="${orientation}"` : "",
    mode ? `activation-mode="${mode}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const triggers = TABS.map(
    (tab) =>
      `<primitiv-tabs-trigger value="${tab.value}"${disabled.includes(tab.value) ? " disabled" : ""}>` +
      `<button type="button">${tab.label}</button></primitiv-tabs-trigger>`,
  ).join("");
  const panels = TABS.map(
    (tab) =>
      `<primitiv-tabs-content value="${tab.value}"${tab.value === value ? "" : " hidden"}>${tab.panel}</primitiv-tabs-content>`,
  ).join("");
  return `<primitiv-tabs ${attrs}><primitiv-tabs-list id="${id}-list" label="Sections">${triggers}</primitiv-tabs-list>${panels}</primitiv-tabs>`;
}
