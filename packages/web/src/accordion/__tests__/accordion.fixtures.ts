/**
 * Shared Accordion markup for the element tests: one function, pure string
 * output, mirroring how `tabs.fixtures.ts` keeps its suites' data in one place.
 */
export type AccordionFixture = {
  /** The root's `value` attribute, verbatim. */
  value?: string;
  multiple?: boolean;
  orientation?: "vertical" | "horizontal";
  disabled?: readonly string[];
  forceMount?: boolean;
  /** Ids to pre-render on the first trigger's button and first panel. */
  triggerId?: string;
  panelId?: string;
  /** An id for the root. */
  id?: string;
};

export const ITEMS = [
  { value: "one", label: "One", panel: "First panel" },
  { value: "two", label: "Two", panel: "Second panel" },
  { value: "three", label: "Three", panel: "Third panel" },
] as const;

export function accordionHtml({
  value,
  multiple,
  orientation,
  disabled = [],
  forceMount,
  triggerId,
  panelId,
  id,
}: AccordionFixture = {}): string {
  const attrs = [
    id ? ` id="${id}"` : "",
    value === undefined ? "" : ` value="${value}"`,
    multiple ? " multiple" : "",
    orientation ? ` orientation="${orientation}"` : "",
  ].join("");
  const items = ITEMS.map(
    (item, index) =>
      `<primitiv-accordion-item value="${item.value}"><h3>` +
      `<primitiv-accordion-trigger${disabled.includes(item.value) ? " disabled" : ""}>` +
      `<button type="button"${index === 0 && triggerId ? ` id="${triggerId}"` : ""}>${item.label}` +
      `<primitiv-accordion-trigger-icon></primitiv-accordion-trigger-icon></button>` +
      `</primitiv-accordion-trigger></h3>` +
      `<primitiv-accordion-content${forceMount ? " force-mount" : ""}${index === 0 && panelId ? ` id="${panelId}"` : ""}>${item.panel}</primitiv-accordion-content>` +
      `</primitiv-accordion-item>`,
  ).join("");
  return `<primitiv-accordion${attrs}>${items}</primitiv-accordion>`;
}
