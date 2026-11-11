import { screen } from "@testing-library/dom";

import { defineRadioCard, type ElementRegistry } from "../elements";
import { radioCardHtml } from "./radio-card.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile settle. */
async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineRadioCard();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const radio = (name: string) => screen.getByRole("radio", { name });
const tabindexes = () => screen.getAllByRole("radio").map((r) => r.getAttribute("tabindex"));
const root = () => document.querySelector("primitiv-radio-card") as HTMLElement;
const indicators = () => [...document.querySelectorAll("primitiv-radio-card-indicator")];

const ELEMENTS = ["primitiv-radio-card", "primitiv-radio-card-item", "primitiv-radio-card-indicator"];

describe("<primitiv-radio-card> rendering", () => {
  it("defines its elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineRadioCard();
    defineRadioCard();

    // Assert
    for (const name of ELEMENTS) {
      expect(customElements.get(name)).toBeDefined();
    }
  });

  it("defines exactly its tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-radio-card-item" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineRadioCard(registry);

    // Assert
    expect(defined).toEqual(["primitiv-radio-card", "primitiv-radio-card-indicator"]);
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineRadioCard(undefined)).not.toThrow();
  });

  it("makes the root a radio group and checks the card in its value", async () => {
    // Arrange & Act
    await mount(radioCardHtml({ value: "pro" }));

    // Assert
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeDefined();
    expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    expect(radio("Pro").getAttribute("data-state")).toBe("checked");
    expect(radio("Basic").getAttribute("data-state")).toBe("unchecked");
  });

  it("states no orientation for both axes, the default, and one for a single axis", async () => {
    // Arrange & Act
    await mount(
      radioCardHtml() +
        radioCardHtml({ orientation: "both", label: "Both" }) +
        radioCardHtml({ orientation: "horizontal", label: "Row" }) +
        radioCardHtml({ orientation: "vertical", label: "Column" }),
    );

    // Assert
    expect([...document.querySelectorAll("primitiv-radio-card")].map((g) => g.getAttribute("aria-orientation"))).toEqual([
      null,
      null,
      "horizontal",
      "vertical",
    ]);
  });

  it("marks a disabled card with aria-disabled and data-disabled, and an enabled one with neither", async () => {
    // Arrange & Act
    await mount(radioCardHtml({ disabled: ["pro"] }));

    // Assert
    expect(radio("Pro").getAttribute("aria-disabled")).toBe("true");
    expect(radio("Pro").getAttribute("data-disabled")).toBe("");
    expect(radio("Basic").hasAttribute("aria-disabled")).toBe(false);
    expect(radio("Basic").hasAttribute("data-disabled")).toBe(false);
  });

  it("does not disable the group through a disabled attribute on the root", async () => {
    // Arrange & Act
    await mount(radioCardHtml().replace("<primitiv-radio-card ", "<primitiv-radio-card disabled "));

    // Assert
    expect(radio("Basic").hasAttribute("aria-disabled")).toBe(false);
    expect(root().hasAttribute("data-disabled")).toBe(false);
  });

  it("makes the selected card the tab stop, else the first enabled one", async () => {
    // Arrange & Act
    await mount(radioCardHtml({ value: "team" }));
    const selected = tabindexes();
    document.body.replaceChildren();
    await mount(radioCardHtml({ disabled: ["basic"] }));

    // Assert
    expect(selected).toEqual(["-1", "-1", "0"]);
    expect(tabindexes()).toEqual(["-1", "0", "-1"]);
  });

  it("hides every indicator but the checked card's, each decorative and stating its card's state", async () => {
    // Arrange & Act
    await mount(radioCardHtml({ value: "pro" }));

    // Assert
    expect(indicators().map((i) => i.getAttribute("hidden"))).toEqual(["", null, ""]);
    expect(indicators().map((i) => i.getAttribute("data-state"))).toEqual(["unchecked", "checked", "unchecked"]);
    expect(indicators().every((i) => i.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  it("keeps a force-mounted indicator shown while its card is unchecked", async () => {
    // Arrange & Act
    await mount(radioCardHtml({ value: "pro", forceMount: true }));

    // Assert
    expect(indicators().map((i) => i.hasAttribute("hidden"))).toEqual([false, false, false]);
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(radioCardHtml({ value: "pro", disabled: ["team"] }));
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
    await mount(radioCardHtml({ value: "basic" }));

    // Assert
    expect(document.querySelectorAll("[class], [style]")).toHaveLength(0);
  });
});
