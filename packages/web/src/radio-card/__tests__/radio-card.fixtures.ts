/**
 * Shared RadioCard markup for the element tests: one function, pure string
 * output, mirroring how `tabs.fixtures.ts` keeps its suites' data in one place.
 */
export type RadioCardFixture = {
  /** The root's `value` attribute, verbatim. */
  value?: string;
  /** The root's `name`: submit the value with a form. */
  name?: string;
  orientation?: "horizontal" | "vertical" | "both";
  /** The values of the disabled cards. */
  disabled?: readonly string[];
  /** Whether each indicator carries `force-mount`. */
  forceMount?: boolean;
  /** The group's accessible name. */
  label?: string;
};

export const ITEMS = [
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
] as const;

export function radioCardHtml({
  value,
  name,
  orientation,
  disabled = [],
  forceMount = false,
  label = "Plan",
}: RadioCardFixture = {}): string {
  const attrs = [
    ` aria-label="${label}"`,
    value === undefined ? "" : ` value="${value}"`,
    name === undefined ? "" : ` name="${name}"`,
    orientation ? ` orientation="${orientation}"` : "",
  ].join("");
  const items = ITEMS.map(
    (item) =>
      `<primitiv-radio-card-item value="${item.value}"${disabled.includes(item.value) ? " disabled" : ""}>` +
      `<button type="button"><primitiv-radio-card-indicator${forceMount ? " force-mount" : ""}></primitiv-radio-card-indicator>${item.label}</button>` +
      `</primitiv-radio-card-item>`,
  ).join("");
  return `<primitiv-radio-card${attrs}>${items}</primitiv-radio-card>`;
}
