/**
 * Shared Listbox markup for the element tests: one function, pure string
 * output, mirroring how `tabs.fixtures.ts` keeps its suites' data in one place.
 */
export type ListboxFixture = {
  /** The root's `value` attribute, verbatim. */
  value?: string;
  type?: "single" | "multiple";
  orientation?: "horizontal" | "vertical";
  /** Write `selection-follows-focus` on the root. */
  followFocus?: boolean;
  disabled?: readonly string[];
  /** The listbox's accessible name. */
  label?: string;
  /** An id to pre-render on the first option. */
  optionId?: string;
  /** Put the options in two labelled groups (fruit, then vegetables). */
  grouped?: boolean;
};

export const OPTIONS = [
  { value: "apple", label: "Apple" },
  { value: "avocado", label: "Avocado" },
  { value: "banana", label: "Banana" },
  { value: "carrot", label: "Carrot" },
] as const;

export function listboxHtml({
  value,
  type,
  orientation,
  followFocus = false,
  disabled = [],
  label = "Produce",
  optionId,
  grouped = false,
}: ListboxFixture = {}): string {
  const attrs = [
    ` aria-label="${label}"`,
    type ? ` type="${type}"` : "",
    value === undefined ? "" : ` value="${value}"`,
    orientation ? ` orientation="${orientation}"` : "",
    followFocus ? " selection-follows-focus" : "",
  ].join("");
  const option = (item: (typeof OPTIONS)[number], index: number) =>
    `<primitiv-listbox-option value="${item.value}"${disabled.includes(item.value) ? " disabled" : ""}` +
    `${index === 0 && optionId ? ` id="${optionId}"` : ""}>${item.label}</primitiv-listbox-option>`;
  const options = OPTIONS.map(option);
  const body = grouped
    ? `<primitiv-listbox-group><primitiv-listbox-group-label>Fruit</primitiv-listbox-group-label>${options.slice(0, 3).join("")}</primitiv-listbox-group>` +
      `<primitiv-listbox-group><primitiv-listbox-group-label>Vegetables</primitiv-listbox-group-label>${options[3]}</primitiv-listbox-group>`
    : options.join("");
  return `<primitiv-listbox${attrs}>${body}</primitiv-listbox>`;
}
