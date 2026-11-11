/**
 * Shared SegmentedControl markup for the element tests: one function, pure
 * string output, mirroring how `tabs.fixtures.ts` keeps its suites' data in
 * one place.
 */
export type SegmentedControlFixture = {
  /** The root's `value` attribute, verbatim. */
  value?: string;
  orientation?: "horizontal" | "vertical";
  /** The values of the disabled segments. */
  disabled?: readonly string[];
  /** Whether the root carries `disabled`. */
  controlDisabled?: boolean;
  /** The control's accessible name. */
  label?: string;
};

export const ITEMS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

export function segmentedControlHtml({
  value,
  orientation,
  disabled = [],
  controlDisabled = false,
  label = "Range",
}: SegmentedControlFixture = {}): string {
  const attrs = [
    ` aria-label="${label}"`,
    value === undefined ? "" : ` value="${value}"`,
    orientation ? ` orientation="${orientation}"` : "",
    controlDisabled ? " disabled" : "",
  ].join("");
  const items = ITEMS.map(
    (item) =>
      `<primitiv-segmented-control-item value="${item.value}"${disabled.includes(item.value) ? " disabled" : ""}>` +
      `<button type="button">${item.label}</button>` +
      `</primitiv-segmented-control-item>`,
  ).join("");
  return `<primitiv-segmented-control${attrs}>${items}</primitiv-segmented-control>`;
}
