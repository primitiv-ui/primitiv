/** The card the CheckboxCard pages render, read from the URL so one spec drives each page. */
export type CheckboxCardFixture = {
  /** `"true"`, `"indeterminate"`, or null for unchecked. */
  checked: string | null;
  disabled: boolean;
};

export function checkboxCardFixtureFromUrl(search: string = location.search): CheckboxCardFixture {
  const params = new URLSearchParams(search);
  return { checked: params.get("checked"), disabled: params.has("disabled") };
}

/** The plain-HTML rendering, as a server would send it, shared by the html page and the HTMX fragments. */
export function checkboxCardHtml(fixture: Partial<CheckboxCardFixture> = {}, id = "card", label = "Email updates"): string {
  const checked =
    fixture.checked === "indeterminate" ? ' checked="indeterminate"' : fixture.checked === "true" ? " checked" : "";
  return (
    `<primitiv-checkbox-card id="${id}"${checked}${fixture.disabled ? " disabled" : ""}>` +
    `<button type="button"><primitiv-checkbox-card-indicator></primitiv-checkbox-card-indicator>${label}</button>` +
    `</primitiv-checkbox-card>`
  );
}
