/** The toggle group the ToggleGroup pages render: three items, read from the URL so one spec drives each page. */
export const ITEMS = [
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "underline", label: "Underline" },
] as const;

export type ToggleGroupFixture = {
  /** The pressed items, space-separated, as the `value` attribute takes them. */
  value: string | null;
  multiple: boolean;
  orientation: string | null;
  dir: string | null;
  disabled: string[];
};

export function toggleGroupFixtureFromUrl(search: string = location.search): ToggleGroupFixture {
  const params = new URLSearchParams(search);
  return {
    value: params.get("value"),
    multiple: params.has("multiple"),
    orientation: params.get("orientation"),
    dir: params.get("dir"),
    disabled: params.getAll("disabled"),
  };
}

/** The plain-HTML rendering, as a server would send it, shared by the html page and the HTMX fragments. */
export function toggleGroupHtml(fixture: Partial<ToggleGroupFixture> = {}, id = "group"): string {
  // `?? "bold"`, not a destructuring default: a missing URL param is null.
  const value = fixture.value ?? "bold";
  const { multiple, orientation, disabled = [] } = fixture;
  const attrs = [
    `id="${id}"`,
    `aria-label="Formatting ${id}"`,
    value ? `value="${value}"` : "",
    multiple ? 'type="multiple"' : "",
    orientation ? `orientation="${orientation}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const items = ITEMS.map(
    (item) =>
      `<primitiv-toggle-group-item value="${item.value}"${disabled.includes(item.value) ? " disabled" : ""}>` +
      `<button type="button">${item.label}</button></primitiv-toggle-group-item>`,
  ).join("");
  return `<primitiv-toggle-group ${attrs}>${items}</primitiv-toggle-group>`;
}
