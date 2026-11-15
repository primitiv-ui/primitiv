import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineStepper, type ElementRegistry } from "../elements";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

type Step = { value: string; label: string; state?: string; disabled?: boolean };

const STEPS: readonly Step[] = [
  { value: "account", label: "Account", state: "complete" },
  { value: "billing", label: "Billing" },
  { value: "review", label: "Review" },
];

/** A stepper, the way `primitiv add stepper --surface elements` prints it, minus the classes. */
function stepperHtml({
  value = "billing",
  rootAttrs = "",
  steps = STEPS,
}: { value?: string; rootAttrs?: string; steps?: readonly Step[] } = {}): string {
  const items = steps
    .map(
      (step) =>
        `<primitiv-stepper-step value="${step.value}"${step.state ? ` state="${step.state}"` : ""}${step.disabled ? " disabled" : ""}>` +
        `<button type="button">${step.label}</button></primitiv-stepper-step>`,
    )
    .join("");
  const panels = steps
    .map((step) => `<primitiv-stepper-panel value="${step.value}">${step.label} panel</primitiv-stepper-panel>`)
    .join("");
  return `<primitiv-stepper value="${value}"${rootAttrs}><primitiv-stepper-list label="Sign-up progress">${items}</primitiv-stepper-list>${panels}</primitiv-stepper>`;
}

/** Mount markup and let the root's first reconcile settle. */
async function mount(html: string) {
  defineStepper();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const step = (name: string) => screen.getByRole("tab", { name });

describe("<primitiv-stepper>", () => {
  it("defines exactly the four stepper tag names on the registry it is given", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: () => undefined,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineStepper(registry);

    // Assert
    expect(defined).toEqual([
      "primitiv-stepper",
      "primitiv-stepper-list",
      "primitiv-stepper-step",
      "primitiv-stepper-panel",
    ]);
  });

  it("is a tab set: a named tablist whose steps are tabs, showing the current step's panel", async () => {
    // Arrange & Act
    await mount(stepperHtml());

    // Assert
    expect(screen.getByRole("tablist", { name: "Sign-up progress" })).toBeTruthy();
    expect(step("Billing").getAttribute("aria-selected")).toBe("true");
    expect(step("Billing").getAttribute("data-state")).toBe("active");
    const panel = screen.getByRole("tabpanel");
    expect(panel.textContent).toBe("Billing panel");
    expect(panel.getAttribute("aria-labelledby")).toBe(step("Billing").id);
  });

  it("writes each step's state on its button as data-step-state, upcoming unless it says otherwise", async () => {
    // Arrange & Act
    await mount(stepperHtml());

    // Assert
    expect(step("Account").getAttribute("data-step-state")).toBe("complete");
    expect(step("Billing").getAttribute("data-step-state")).toBe("upcoming");
  });

  it("follows a step's state as it changes", async () => {
    // Arrange
    await mount(stepperHtml());

    // Act
    document.querySelector('primitiv-stepper-step[value="billing"]')!.setAttribute("state", "error");
    await Promise.resolve();

    // Assert
    expect(step("Billing").getAttribute("data-step-state")).toBe("error");
  });

  it("activates manually by default: an arrow moves focus, Enter moves the step", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(stepperHtml());
    step("Billing").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(document.activeElement).toBe(step("Review"));
    expect(step("Billing").getAttribute("aria-selected")).toBe("true");

    // Act
    await user.keyboard("{Enter}");

    // Assert
    expect(step("Review").getAttribute("aria-selected")).toBe("true");
    expect(document.querySelector("primitiv-stepper")!.getAttribute("value")).toBe("review");
  });

  it("activates as focus arrives when activation-mode is automatic", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(stepperHtml({ rootAttrs: ` activation-mode="automatic"` }));
    step("Billing").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(step("Review").getAttribute("aria-selected")).toBe("true");
  });

  it("announces a change as a cancelable primitiv-stepper-change, which a listener can veto", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(stepperHtml());
    const root = document.querySelector("primitiv-stepper")!;
    const seen: unknown[] = [];
    root.addEventListener("primitiv-stepper-change", (event) => {
      seen.push((event as CustomEvent).detail);
      event.preventDefault();
    });

    // Act
    await user.click(step("Review"));

    // Assert
    expect(seen).toEqual([{ value: "review", index: 2 }]);
    expect(root.getAttribute("value")).toBe("billing");
  });

  it("announces the panel a step change shows with primitiv-stepper-show", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(stepperHtml());
    const shown: string[] = [];
    document.addEventListener("primitiv-stepper-show", (event) => {
      shown.push((event.target as HTMLElement).getAttribute("value")!);
    });

    // Act
    await user.click(step("Review"));
    await Promise.resolve();

    // Assert
    expect(shown).toEqual(["review"]);
  });

  it("names the stepper's own tag when a step cannot be decorated", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-stepper value="a"><primitiv-stepper-list label="Steps"><primitiv-stepper-step><button type="button">A</button></primitiv-stepper-step></primitiv-stepper-list></primitiv-stepper>`,
    );

    // Assert
    expect(error).toHaveBeenCalledOnce();
    expect(String(error.mock.calls[0]![0])).toContain("<primitiv-stepper-step>");
  });

  it("leaves a tab set nested in a step's panel to itself", async () => {
    // Arrange & Act
    await import("../../tabs/elements").then(({ defineTabs }) => defineTabs());
    await mount(
      stepperHtml().replace(
        "Billing panel",
        `<primitiv-tabs value="x"><primitiv-tabs-list label="Inner"><primitiv-tabs-trigger value="x"><button type="button">Inner</button></primitiv-tabs-trigger></primitiv-tabs-list><primitiv-tabs-content value="x">Inner panel</primitiv-tabs-content></primitiv-tabs>`,
      ),
    );

    // Assert
    const inner = screen.getByRole("tab", { name: "Inner" });
    expect(inner.hasAttribute("data-step-state")).toBe(false);
    expect(screen.getByRole("tablist", { name: "Sign-up progress" }).querySelectorAll('[role="tab"]')).toHaveLength(3);
  });
});
