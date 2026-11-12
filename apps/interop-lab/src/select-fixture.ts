/** The select the Select pages render: three items, read from the URL so one spec drives each page. */
export const ITEMS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
] as const;

export type SelectFixture = {
  /** The chosen item, as the `value` attribute takes it. */
  value: string | null;
  name: string | null;
  required: boolean;
  disabled: string[];
};

export function selectFixtureFromUrl(search: string = location.search): SelectFixture {
  const params = new URLSearchParams(search);
  return {
    value: params.get("value"),
    name: params.get("name"),
    required: params.has("required"),
    disabled: params.getAll("disabled"),
  };
}

/** The plain-HTML rendering, as a server would send it, shared by the html page and the HTMX fragments. */
export function selectHtml(fixture: Partial<SelectFixture> = {}, id = "select"): string {
  // `?? "apple"`, not a destructuring default: a missing URL param is null.
  const value = fixture.value ?? "apple";
  const { name, required, disabled = [] } = fixture;
  const attrs = [
    `id="${id}"`,
    value ? `value="${value}"` : "",
    name ? `name="${name}"` : "",
    required ? "required" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const items = ITEMS.map(
    (item) =>
      `<primitiv-select-item value="${item.value}"${disabled.includes(item.value) ? " disabled" : ""} style="display: block">` +
      `${item.label}</primitiv-select-item>`,
  ).join("");
  return (
    `<primitiv-select ${attrs}>` +
    `<primitiv-select-trigger><button type="button" aria-label="Fruit ${id}"><primitiv-select-value placeholder="Pick a fruit"></primitiv-select-value></button></primitiv-select-trigger>` +
    `<primitiv-select-content>${items}</primitiv-select-content>` +
    `</primitiv-select>`
  );
}
