/** The cards the RadioCard pages render: three, read from the URL so one spec drives each page. */
export const ITEMS = [
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
] as const;

export type RadioCardFixture = {
  /** The selected card, as the `value` attribute takes it. */
  value: string | null;
  orientation: string | null;
  dir: string | null;
  disabled: string[];
};

export function radioCardFixtureFromUrl(search: string = location.search): RadioCardFixture {
  const params = new URLSearchParams(search);
  return {
    value: params.get("value"),
    orientation: params.get("orientation"),
    dir: params.get("dir"),
    disabled: params.getAll("disabled"),
  };
}

/** The plain-HTML rendering, as a server would send it, shared by the html page and the HTMX fragments. */
export function radioCardHtml(fixture: Partial<RadioCardFixture> = {}, id = "group"): string {
  // `?? "basic"`, not a destructuring default: a missing URL param is null.
  const value = fixture.value ?? "basic";
  const { orientation, disabled = [] } = fixture;
  const attrs = [`id="${id}"`, `aria-label="Plan ${id}"`, value ? `value="${value}"` : "", orientation ? `orientation="${orientation}"` : ""]
    .filter(Boolean)
    .join(" ");
  const items = ITEMS.map(
    (item) =>
      `<primitiv-radio-card-item value="${item.value}"${disabled.includes(item.value) ? " disabled" : ""}>` +
      `<button type="button"><primitiv-radio-card-indicator></primitiv-radio-card-indicator>${item.label}</button></primitiv-radio-card-item>`,
  ).join("");
  return `<primitiv-radio-card ${attrs}>${items}</primitiv-radio-card>`;
}
