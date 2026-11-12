import "./popover-polyfill";

import { screen } from "@testing-library/dom";

import { defineSelect, type ElementRegistry } from "../elements";
import { selectHtml } from "./select.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function mount(html: string) {
  defineSelect();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const trigger = () => screen.getByRole("button", { name: "Fruit" });
const listbox = () => screen.getByRole("listbox", { hidden: true });
const option = (name: string) => screen.getByRole("option", { name, hidden: true });
const valuePart = () => document.querySelector("primitiv-select-value") as HTMLElement;

const ELEMENTS = [
  "primitiv-select",
  "primitiv-select-trigger",
  "primitiv-select-value",
  "primitiv-select-content",
  "primitiv-select-item",
  "primitiv-select-item-indicator",
  "primitiv-select-group",
  "primitiv-select-separator",
];

describe("<primitiv-select> rendering", () => {
  it("defines every element, and defining twice is harmless", () => {
    // Arrange & Act
    defineSelect();
    defineSelect();

    // Assert
    for (const name of ELEMENTS) expect(customElements.get(name)).toBeDefined();
  });

  it("defines exactly its tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-select-group" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineSelect(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-select-group"));
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineSelect(undefined)).not.toThrow();
  });

  it("wires the trigger's button to the listbox it opens", async () => {
    // Arrange & Act
    await mount(selectHtml());

    // Assert
    expect(trigger().getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-controls")).toBe(listbox().id);
    expect(listbox().getAttribute("popover")).toBe("auto");
    expect(listbox().getAttribute("tabindex")).toBe("-1");
  });

  it("derives the content's id from the root's, and keeps one the server rendered", async () => {
    // Arrange & Act
    await mount(
      selectHtml().replace("<primitiv-select>", '<primitiv-select id="fruit">') +
        selectHtml().replace("<primitiv-select-content>", '<primitiv-select-content id="mine">'),
    );

    // Assert
    const [derived, kept] = document.querySelectorAll("primitiv-select-content");
    expect(derived.id).toBe("fruit-content");
    expect(kept.id).toBe("mine");
  });

  it("makes each item an option, selected only for the root's value", async () => {
    // Arrange & Act
    await mount(selectHtml({ value: "banana" }));

    // Assert
    expect(option("Banana").getAttribute("aria-selected")).toBe("true");
    expect(option("Banana").getAttribute("data-state")).toBe("checked");
    expect(option("Apple").getAttribute("aria-selected")).toBe("false");
    expect(option("Apple").getAttribute("data-state")).toBe("unchecked");
    expect(option("Apple").getAttribute("tabindex")).toBe("-1");
  });

  it("marks a disabled item, and no other", async () => {
    // Arrange & Act
    await mount(selectHtml({ disabledItems: ["cherry"] }));

    // Assert
    expect(option("Cherry").getAttribute("aria-disabled")).toBe("true");
    expect(option("Cherry").getAttribute("data-disabled")).toBe("");
    expect(option("Apple").hasAttribute("aria-disabled")).toBe(false);
    expect(option("Apple").hasAttribute("data-disabled")).toBe(false);
  });

  it("shows the placeholder in the value part when nothing is selected", async () => {
    // Arrange & Act
    await mount(selectHtml());

    // Assert
    expect(valuePart().textContent).toBe("Pick a fruit");
    expect(valuePart().getAttribute("data-placeholder")).toBe("");
  });

  it("mirrors the selected item's content into the value part, leaving its indicator out", async () => {
    // Arrange & Act
    await mount(selectHtml({ value: "cherry", indicators: true }));

    // Assert
    expect(valuePart().textContent).toBe("Cherry");
    expect(valuePart().hasAttribute("data-placeholder")).toBe(false);
  });

  it("shows only the selected item's indicator, and every one forced to mount", async () => {
    // Arrange & Act
    await mount(selectHtml({ value: "apple", indicators: true }));
    const [apple, banana] = document.querySelectorAll("primitiv-select-item-indicator");

    // Assert
    expect(apple.hasAttribute("hidden")).toBe(false);
    expect(apple.getAttribute("data-state")).toBe("checked");
    expect(banana.getAttribute("hidden")).toBe("");
    expect(banana.getAttribute("data-state")).toBe("unchecked");
  });

  it("keeps a force-mounted indicator shown while its item is unselected", async () => {
    // Arrange & Act
    await mount(
      selectHtml({ indicators: true }).replace(
        "<primitiv-select-item-indicator>",
        "<primitiv-select-item-indicator force-mount>",
      ),
    );

    // Assert
    expect(document.querySelector("primitiv-select-item-indicator")?.hasAttribute("hidden")).toBe(false);
  });

  it("keeps a popover mode the content was written with", async () => {
    // Arrange & Act
    await mount(selectHtml().replace("<primitiv-select-content>", '<primitiv-select-content popover="manual">'));

    // Assert
    expect(listbox().getAttribute("popover")).toBe("manual");
  });

  it("hides an indicator written outside any item", async () => {
    // Arrange & Act
    await mount(selectHtml({ value: "apple" }).replace("<primitiv-select-content>", "<primitiv-select-content><primitiv-select-item-indicator>✓</primitiv-select-item-indicator>"));

    // Assert
    expect(document.querySelector("primitiv-select-item-indicator")?.hasAttribute("hidden")).toBe(true);
  });

  it("names a group by its label and marks a separator", async () => {
    // Arrange & Act
    await mount(selectHtml({ grouped: true }));

    // Assert
    expect(screen.getByRole("group", { name: "Fruit", hidden: true })).toBeDefined();
    expect(document.querySelector("primitiv-select-separator")?.getAttribute("role")).toBe("separator");
  });

  it("reports an item with no value once, and leaves it undecorated", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(selectHtml().replace('<primitiv-select-item value="apple">', "<primitiv-select-item>"));
    document.querySelector("primitiv-select")?.setAttribute("value", "banana");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toBe("<primitiv-select-item> needs a value.");
    expect(document.querySelector("primitiv-select-item")?.hasAttribute("role")).toBe(false);
    error.mockRestore();
  });

  it("reports a trigger without exactly one element child once", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(selectHtml().replace(/<primitiv-select-trigger>.*<\/primitiv-select-trigger>/, "<primitiv-select-trigger>Fruit</primitiv-select-trigger>"));

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toBe("<primitiv-select-trigger> needs exactly one element child (a <button>) to decorate.");
    error.mockRestore();
  });
});
