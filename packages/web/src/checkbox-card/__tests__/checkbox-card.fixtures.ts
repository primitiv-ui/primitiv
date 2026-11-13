/**
 * Shared CheckboxCard markup for the element tests: one function, pure string
 * output, mirroring how `tabs.fixtures.ts` keeps its suites' data in one place.
 */
export type CheckboxCardFixture = {
  checked?: boolean | "indeterminate";
  disabled?: boolean;
  forceMount?: boolean;
  label?: string;
  name?: string;
  value?: string;
};

export function checkboxCardHtml({
  checked = false,
  disabled = false,
  forceMount = false,
  label = "Email updates",
  name,
  value,
}: CheckboxCardFixture = {}): string {
  const attrs = [
    checked === "indeterminate" ? ' checked="indeterminate"' : checked ? " checked" : "",
    disabled ? " disabled" : "",
    name === undefined ? "" : ` name="${name}"`,
    value === undefined ? "" : ` value="${value}"`,
  ].join("");
  return (
    `<primitiv-checkbox-card${attrs}><button type="button">` +
    `<primitiv-checkbox-card-indicator${forceMount ? " force-mount" : ""}></primitiv-checkbox-card-indicator>${label}` +
    `</button></primitiv-checkbox-card>`
  );
}
