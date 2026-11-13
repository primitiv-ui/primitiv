/**
 * Shared ToggleGroup markup for the element tests: one function, pure string
 * output, mirroring how `tabs.fixtures.ts` keeps its suites' data in one place.
 */
export type ToggleGroupFixture = {
  /** The root's `value` attribute, verbatim. */
  value?: string;
  /** The root's `name`: submit the value with a form. */
  name?: string;
  type?: "single" | "multiple";
  orientation?: "horizontal" | "vertical";
  disabled?: readonly string[];
  /** The group's accessible name. */
  label?: string;
  /** An id to pre-render on the first item's button. */
  itemId?: string;
};

export const ITEMS = [
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "underline", label: "Underline" },
] as const;

export function toggleGroupHtml({
  value,
  name,
  type,
  orientation,
  disabled = [],
  label = "Formatting",
  itemId,
}: ToggleGroupFixture = {}): string {
  const attrs = [
    ` aria-label="${label}"`,
    type ? ` type="${type}"` : "",
    value === undefined ? "" : ` value="${value}"`,
    name === undefined ? "" : ` name="${name}"`,
    orientation ? ` orientation="${orientation}"` : "",
  ].join("");
  const items = ITEMS.map(
    (item, index) =>
      `<primitiv-toggle-group-item value="${item.value}"${disabled.includes(item.value) ? " disabled" : ""}>` +
      `<button type="button"${index === 0 && itemId ? ` id="${itemId}"` : ""}>${item.label}</button>` +
      `</primitiv-toggle-group-item>`,
  ).join("");
  return `<primitiv-toggle-group${attrs}>${items}</primitiv-toggle-group>`;
}
