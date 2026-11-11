import { screen } from "@testing-library/dom";

import { defineCheckboxCard, type ElementRegistry } from "../elements";
import { checkboxCardHtml } from "./checkbox-card.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile settle. */
async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineCheckboxCard();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const card = () => screen.getByRole("checkbox");
const indicator = () => document.querySelector("primitiv-checkbox-card-indicator") as HTMLElement;

describe("<primitiv-checkbox-card> rendering", () => {
  it("defines both elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineCheckboxCard();
    defineCheckboxCard();

    // Assert
    expect(customElements.get("primitiv-checkbox-card")).toBeDefined();
    expect(customElements.get("primitiv-checkbox-card-indicator")).toBeDefined();
  });

  it("defines exactly its tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-checkbox-card-indicator" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineCheckboxCard(registry);

    // Assert
    expect(defined).toEqual(["primitiv-checkbox-card"]);
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineCheckboxCard(undefined)).not.toThrow();
  });

  it("makes its button a checkbox, unchecked with no checked attribute", async () => {
    // Arrange & Act
    await mount(checkboxCardHtml());

    // Assert
    expect(card().tagName).toBe("BUTTON");
    expect(card().getAttribute("aria-checked")).toBe("false");
    expect(card().getAttribute("data-state")).toBe("unchecked");
    expect(card().hasAttribute("aria-disabled")).toBe(false);
    expect(card().hasAttribute("data-disabled")).toBe(false);
  });

  it.each([
    [true, "true", "checked"],
    ["indeterminate", "mixed", "indeterminate"],
  ] as const)("states checked=%j as aria-checked=%j", async (checked, aria, state) => {
    // Arrange & Act
    await mount(checkboxCardHtml({ checked }));

    // Assert
    expect(card().getAttribute("aria-checked")).toBe(aria);
    expect(card().getAttribute("data-state")).toBe(state);
    expect(indicator().getAttribute("data-state")).toBe(state);
  });

  it("marks a disabled card with aria-disabled and data-disabled", async () => {
    // Arrange & Act
    await mount(checkboxCardHtml({ disabled: true }));

    // Assert
    expect(card().getAttribute("aria-disabled")).toBe("true");
    expect(card().getAttribute("data-disabled")).toBe("");
  });

  it("hides the indicator while unchecked, decorative throughout", async () => {
    // Arrange & Act
    await mount(checkboxCardHtml());

    // Assert
    expect(indicator().getAttribute("hidden")).toBe("");
    expect(indicator().getAttribute("aria-hidden")).toBe("true");
    expect(indicator().getAttribute("data-state")).toBe("unchecked");
  });

  it("keeps a force-mounted indicator shown while unchecked", async () => {
    // Arrange & Act
    await mount(checkboxCardHtml({ forceMount: true }));

    // Assert
    expect(indicator().hasAttribute("hidden")).toBe(false);
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(checkboxCardHtml({ checked: true }) + checkboxCardHtml({ disabled: true, label: "Off" }));
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");

    // Act
    document.body.innerHTML = rendered;
    await Promise.resolve();

    // Assert
    expect(writes).not.toHaveBeenCalled();
    expect(removals).not.toHaveBeenCalled();
    writes.mockRestore();
    removals.mockRestore();
  });

  it("writes no class and no style on anything", async () => {
    // Arrange & Act
    await mount(checkboxCardHtml({ checked: true }));

    // Assert
    expect(document.querySelectorAll("[class], [style]")).toHaveLength(0);
  });
});
