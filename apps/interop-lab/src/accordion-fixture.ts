/** The accordion the Accordion pages render: three items, read from the URL so one spec drives each page. */
export const ITEMS = [
  { value: "one", label: "One", panel: "First panel" },
  { value: "two", label: "Two", panel: "Second panel" },
  { value: "three", label: "Three", panel: "Third panel" },
] as const;

export type AccordionFixture = {
  /** The open items, space-separated, as the `value` attribute takes them. */
  value: string | null;
  multiple: boolean;
  orientation: string | null;
  dir: string | null;
  disabled: string[];
};

export function accordionFixtureFromUrl(search: string = location.search): AccordionFixture {
  const params = new URLSearchParams(search);
  return {
    value: params.get("value"),
    multiple: params.has("multiple"),
    orientation: params.get("orientation"),
    dir: params.get("dir"),
    disabled: params.getAll("disabled"),
  };
}

/**
 * The plain-HTML rendering, as a server would send it — closed panels already
 * `hidden` — shared by the html page and the HTMX fragments.
 */
export function accordionHtml(fixture: Partial<AccordionFixture> = {}, id = "accordion"): string {
  // `?? "one"`, not a destructuring default: a missing URL param is null.
  const value = fixture.value ?? "one";
  const open = value.split(/\s+/);
  const { multiple, orientation, disabled = [] } = fixture;
  const attrs = [
    `id="${id}"`,
    value ? `value="${value}"` : "",
    multiple ? "multiple" : "",
    orientation ? `orientation="${orientation}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const items = ITEMS.map(
    (item) =>
      `<primitiv-accordion-item value="${item.value}"><h3>` +
      `<primitiv-accordion-trigger${disabled.includes(item.value) ? " disabled" : ""}>` +
      `<button type="button">${item.label}</button></primitiv-accordion-trigger></h3>` +
      `<primitiv-accordion-content${open.includes(item.value) ? "" : " hidden"}>${item.panel}</primitiv-accordion-content>` +
      `</primitiv-accordion-item>`,
  ).join("");
  return `<primitiv-accordion ${attrs}>${items}</primitiv-accordion>`;
}
