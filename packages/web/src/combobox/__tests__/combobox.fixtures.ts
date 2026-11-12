/**
 * Shared Combobox markup for the element tests: one function, pure string
 * output, mirroring how `select.fixtures.ts` keeps its suites' data in one place.
 */
export type ComboboxFixture = {
  id?: string;
  /** The root's `value` attribute, verbatim. */
  value?: string;
  open?: boolean;
  name?: string;
  /** The field's `value` attribute, as a server would render the committed text. */
  text?: string;
  /** Items to mark `disabled`. */
  disabledItems?: readonly string[];
  /** Items to mark `hidden`, as a consumer's filter would. */
  hiddenItems?: readonly string[];
  /** Render an empty part after the items. */
  empty?: boolean;
};

export const ITEMS = [
  { value: "react", label: "React" },
  { value: "preact", label: "Preact" },
  { value: "vue", label: "Vue" },
] as const;

export function comboboxHtml({
  id,
  value,
  open = false,
  name,
  text,
  disabledItems = [],
  hiddenItems = [],
  empty = false,
}: ComboboxFixture = {}): string {
  const attrs = [
    id ? ` id="${id}"` : "",
    value === undefined ? "" : ` value="${value}"`,
    open ? " open" : "",
    name ? ` name="${name}"` : "",
  ].join("");
  const items = ITEMS.map(
    (item) =>
      `<primitiv-combobox-item value="${item.value}"` +
      `${disabledItems.includes(item.value) ? " disabled" : ""}${hiddenItems.includes(item.value) ? " hidden" : ""}>` +
      `${item.label}</primitiv-combobox-item>`,
  ).join("");
  return (
    `<primitiv-combobox${attrs}>` +
    `<primitiv-combobox-input><input aria-label="Framework"${text === undefined ? "" : ` value="${text}"`}></primitiv-combobox-input>` +
    `<primitiv-combobox-content aria-label="Frameworks">${items}${empty ? "<primitiv-combobox-empty>No matches</primitiv-combobox-empty>" : ""}</primitiv-combobox-content>` +
    `</primitiv-combobox>`
  );
}
