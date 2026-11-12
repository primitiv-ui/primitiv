/** The combobox the Combobox pages render: four items, read from the URL so one spec drives each page. */
export const ITEMS = [
  { value: "react", label: "React" },
  { value: "preact", label: "Preact" },
  { value: "svelte", label: "Svelte" },
  { value: "vue", label: "Vue" },
] as const;

export type ComboboxFixture = {
  /** The committed item, as the `value` attribute takes it. */
  value: string | null;
  name: string | null;
  disabled: string[];
};

export function comboboxFixtureFromUrl(search: string = location.search): ComboboxFixture {
  const params = new URLSearchParams(search);
  return { value: params.get("value"), name: params.get("name"), disabled: params.getAll("disabled") };
}

/** The items whose label starts with `query`, ignoring case: what a server filtering for the field would send. */
export function comboboxItemsHtml(query = "", disabled: readonly string[] = []): string {
  const items = ITEMS.filter((item) => item.label.toLowerCase().startsWith(query.toLowerCase()))
    .map(
      (item) =>
        `<primitiv-combobox-item value="${item.value}"${disabled.includes(item.value) ? " disabled" : ""}>` +
        `${item.label}</primitiv-combobox-item>`,
    )
    .join("");
  return items + '<primitiv-combobox-empty>No matches</primitiv-combobox-empty>';
}

/** The plain-HTML rendering, as a server would send it, shared by the html page and the HTMX fragments. */
export function comboboxHtml(fixture: Partial<ComboboxFixture> = {}, id = "combobox"): string {
  const { value, name, disabled = [] } = fixture;
  const label = ITEMS.find((item) => item.value === value)?.label;
  const attrs = [`id="${id}"`, value ? `value="${value}"` : "", name ? `name="${name}"` : ""].filter(Boolean).join(" ");
  return (
    `<primitiv-combobox ${attrs}>` +
    `<primitiv-combobox-input><input aria-label="Framework ${id}" autocomplete="off"${label ? ` value="${label}"` : ""}></primitiv-combobox-input>` +
    `<primitiv-combobox-content aria-label="Frameworks">${comboboxItemsHtml("", disabled)}</primitiv-combobox-content>` +
    `</primitiv-combobox>`
  );
}

/**
 * The consumer's filter, as a page would write it: on each query, hide the
 * items whose text does not start with it. The element does the rest — hidden
 * items are skipped, and the empty part shows while none is left.
 */
export function filterOnQuery(root: HTMLElement): void {
  root.addEventListener("primitiv-combobox-query-change", (event) => {
    const query = (event as CustomEvent<{ query: string }>).detail.query.toLowerCase();
    for (const item of root.querySelectorAll<HTMLElement>("primitiv-combobox-item")) {
      item.hidden = !(item.textContent ?? "").toLowerCase().startsWith(query);
    }
  });
}
