/** The steps the Stepper pages render, read from the URL so one spec drives each page. */
export const STEPS = [
  { value: "account", label: "Account", panel: "Account panel" },
  { value: "billing", label: "Billing", panel: "Billing panel" },
  { value: "review", label: "Review", panel: "Review panel" },
] as const;

export type StepperFixture = {
  value: string;
  dir?: "ltr" | "rtl";
  /** Each step's `state`, by value; a step left out is upcoming. */
  states?: Readonly<Record<string, string>>;
  disabled?: readonly string[];
};

export function stepperFixtureFromUrl(search: string = location.search): StepperFixture {
  const params = new URLSearchParams(search);
  return {
    value: params.get("value") ?? "billing",
    dir: params.get("dir") === "rtl" ? "rtl" : undefined,
    states: { account: "complete" },
    disabled: params.getAll("disabled"),
  };
}

/**
 * The plain-HTML rendering, as a server would send it — inactive panels already
 * `hidden` — shared by the html page and the HTMX fragments.
 */
export function stepperHtml(
  { value, dir, states = {}, disabled = [] }: StepperFixture,
  id = "stepper",
  label = "Sign-up progress",
): string {
  const steps = STEPS.map(
    (step) =>
      `<primitiv-stepper-step value="${step.value}"${states[step.value] ? ` state="${states[step.value]}"` : ""}` +
      `${disabled.includes(step.value) ? " disabled" : ""}><button type="button">${step.label}</button></primitiv-stepper-step>`,
  ).join("");
  const panels = STEPS.map(
    (step) =>
      `<primitiv-stepper-panel value="${step.value}"${step.value === value ? "" : " hidden"}>${step.panel}</primitiv-stepper-panel>`,
  ).join("");
  return (
    `<primitiv-stepper id="${id}" value="${value}"${dir ? ` dir="${dir}"` : ""}>` +
    `<primitiv-stepper-list label="${label}">${steps}</primitiv-stepper-list>${panels}</primitiv-stepper>`
  );
}
