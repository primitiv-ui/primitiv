/**
 * Shared Select markup for the element tests: one function, pure string
 * output, mirroring how `tabs.fixtures.ts` keeps its suites' data in one place.
 */
export type SelectFixture = {
  /** The root's `value` attribute, verbatim. */
  value?: string;
  open?: boolean;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Items to mark `disabled`. */
  disabledItems?: readonly string[];
  /** Give each item an indicator. */
  indicators?: boolean;
  /** Put the items in a labelled group, after a separator. */
  grouped?: boolean;
};

export const ITEMS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
] as const;

export function selectHtml({
  value,
  open = false,
  name,
  required = false,
  disabled = false,
  placeholder = "Pick a fruit",
  disabledItems = [],
  indicators = false,
  grouped = false,
}: SelectFixture = {}): string {
  const attrs = [
    value === undefined ? "" : ` value="${value}"`,
    open ? " open" : "",
    name ? ` name="${name}"` : "",
    required ? " required" : "",
    disabled ? " disabled" : "",
  ].join("");
  const items = ITEMS.map(
    (item) =>
      `<primitiv-select-item value="${item.value}"${disabledItems.includes(item.value) ? " disabled" : ""}>` +
      `${indicators ? "<primitiv-select-item-indicator>✓</primitiv-select-item-indicator>" : ""}${item.label}` +
      `</primitiv-select-item>`,
  ).join("");
  const body = grouped
    ? `<primitiv-select-separator></primitiv-select-separator><primitiv-select-group label="Fruit">${items}</primitiv-select-group>`
    : items;
  return (
    `<primitiv-select${attrs}>` +
    `<primitiv-select-trigger><button type="button" aria-label="Fruit"><primitiv-select-value placeholder="${placeholder}"></primitiv-select-value></button></primitiv-select-trigger>` +
    `<primitiv-select-content>${body}</primitiv-select-content>` +
    `</primitiv-select>`
  );
}
