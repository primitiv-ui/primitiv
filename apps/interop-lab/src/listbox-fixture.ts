/** The listbox the Listbox pages render: four options, read from the URL so one spec drives each page. */
export const OPTIONS = [
  { value: "apple", label: "Apple" },
  { value: "avocado", label: "Avocado" },
  { value: "banana", label: "Banana" },
  { value: "carrot", label: "Carrot" },
] as const;

export type ListboxFixture = {
  /** The selected options, space-separated, as the `value` attribute takes them. */
  value: string | null;
  multiple: boolean;
  orientation: string | null;
  dir: string | null;
  disabled: string[];
  /** Cap the list's height so it scrolls. */
  scroll: boolean;
};

export function listboxFixtureFromUrl(search: string = location.search): ListboxFixture {
  const params = new URLSearchParams(search);
  return {
    value: params.get("value"),
    multiple: params.has("multiple"),
    orientation: params.get("orientation"),
    dir: params.get("dir"),
    disabled: params.getAll("disabled"),
    scroll: params.has("scroll"),
  };
}

/** The plain-HTML rendering, as a server would send it, shared by the html page and the HTMX fragments. */
export function listboxHtml(fixture: Partial<ListboxFixture> = {}, id = "list"): string {
  // `?? "apple"`, not a destructuring default: a missing URL param is null.
  const value = fixture.value ?? "apple";
  const { multiple, orientation, disabled = [], scroll } = fixture;
  const attrs = [
    `id="${id}"`,
    `aria-label="Produce ${id}"`,
    value ? `value="${value}"` : "",
    multiple ? 'type="multiple"' : "",
    orientation ? `orientation="${orientation}"` : "",
    scroll ? 'style="display: block; max-block-size: 2.5em; overflow-y: auto"' : "",
  ]
    .filter(Boolean)
    .join(" ");
  const options = OPTIONS.map(
    (option) =>
      `<primitiv-listbox-option value="${option.value}"${disabled.includes(option.value) ? " disabled" : ""} style="display: block">` +
      `${option.label}</primitiv-listbox-option>`,
  ).join("");
  return `<primitiv-listbox ${attrs}>${options}</primitiv-listbox>`;
}
