import { screen } from "@testing-library/dom";

import { defineToggleGroup, type ElementRegistry } from "../elements";
import { toggleGroupHtml } from "./toggle-group.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile settle. */
async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineToggleGroup();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const button = (name: string) => screen.getByRole("button", { name });
const tabindexes = () => screen.getAllByRole("button").map((b) => b.getAttribute("tabindex"));

const ELEMENTS = ["primitiv-toggle-group", "primitiv-toggle-group-item"];

describe("<primitiv-toggle-group> rendering", () => {
  it("defines both elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineToggleGroup();
    defineToggleGroup();

    // Assert
    for (const name of ELEMENTS) {
      expect(customElements.get(name)).toBeDefined();
    }
  });

  it("defines exactly its tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-toggle-group-item" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineToggleGroup(registry);

    // Assert
    expect(defined).toEqual(["primitiv-toggle-group"]);
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineToggleGroup(undefined)).not.toThrow();
  });

  it("makes the root a group and presses the items in its value", async () => {
    // Arrange & Act
    await mount(toggleGroupHtml({ type: "multiple", value: "bold underline" }));

    // Assert
    expect(screen.getByRole("group", { name: "Formatting" })).toBeDefined();
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "true"]);
    expect(button("Bold").getAttribute("data-state")).toBe("on");
    expect(button("Italic").getAttribute("data-state")).toBe("off");
  });

  it("presses nothing with no value", async () => {
    // Arrange & Act
    await mount(toggleGroupHtml());

    // Assert
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "false", "false"]);
  });

  it("publishes data-orientation on the root, horizontal by default", async () => {
    // Arrange & Act
    await mount(toggleGroupHtml() + toggleGroupHtml({ orientation: "vertical", label: "Other" }));

    // Assert
    const [horizontal, vertical] = document.querySelectorAll("primitiv-toggle-group");
    expect(horizontal.getAttribute("data-orientation")).toBe("horizontal");
    expect(vertical.getAttribute("data-orientation")).toBe("vertical");
  });

  it("marks a disabled item with aria-disabled and data-disabled, and an enabled one with neither", async () => {
    // Arrange & Act
    await mount(toggleGroupHtml({ disabled: ["italic"] }));

    // Assert
    expect(button("Italic").getAttribute("aria-disabled")).toBe("true");
    expect(button("Italic").getAttribute("data-disabled")).toBe("");
    expect(button("Bold").hasAttribute("aria-disabled")).toBe(false);
    expect(button("Bold").hasAttribute("data-disabled")).toBe(false);
  });

  it("makes the first pressed item the tab stop", async () => {
    // Arrange & Act
    await mount(toggleGroupHtml({ type: "multiple", value: "underline italic" }));

    // Assert
    expect(tabindexes()).toEqual(["-1", "-1", "0"]);
  });

  it("makes the first enabled item the tab stop while nothing is pressed", async () => {
    // Arrange & Act
    await mount(toggleGroupHtml({ disabled: ["bold"] }));

    // Assert
    expect(tabindexes()).toEqual(["-1", "0", "-1"]);
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(toggleGroupHtml({ value: "italic", disabled: ["underline"] }));
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
    await mount(toggleGroupHtml({ value: "bold" }));

    // Assert
    expect(document.querySelectorAll("[class], [style]")).toHaveLength(0);
  });
});
