import { screen } from "@testing-library/dom";

import { defineAccordion } from "../elements";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function mount(html: string) {
  defineAccordion();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const ONE =
  '<primitiv-accordion-item value="one"><h3><primitiv-accordion-trigger><button type="button">One</button>' +
  "</primitiv-accordion-trigger></h3><primitiv-accordion-content>First</primitiv-accordion-content></primitiv-accordion-item>";

describe("<primitiv-accordion> edge cases", () => {
  it("gives a trigger with no panel no aria-controls", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-accordion value="one"><primitiv-accordion-item value="one"><h3><primitiv-accordion-trigger>' +
        '<button type="button">One</button></primitiv-accordion-trigger></h3></primitiv-accordion-item></primitiv-accordion>',
    );

    // Assert
    expect(screen.getByRole("button", { name: "One" }).hasAttribute("aria-controls")).toBe(false);
  });

  it("gives a panel with no trigger no aria-labelledby", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-accordion value="one"><primitiv-accordion-item value="one">' +
        "<primitiv-accordion-content>Loose</primitiv-accordion-content></primitiv-accordion-item></primitiv-accordion>",
    );

    // Assert
    const panel = document.querySelector("primitiv-accordion-content") as HTMLElement;
    expect(panel.getAttribute("role")).toBe("region");
    expect(panel.hasAttribute("aria-labelledby")).toBe(false);
    expect(panel.hidden).toBe(false);
  });

  it.each([
    ["no element child", "<primitiv-accordion-trigger>Two</primitiv-accordion-trigger>", "<primitiv-accordion-trigger>"],
    [
      "two element children",
      '<primitiv-accordion-trigger><button type="button">A</button><button type="button">B</button></primitiv-accordion-trigger>',
      "<primitiv-accordion-trigger>",
    ],
  ])("reports a trigger with %s once, and leaves it undecorated", async (_case, trigger, named) => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-accordion>${ONE}<primitiv-accordion-item value="two"><h3>${trigger}</h3>` +
        "<primitiv-accordion-content>Second</primitiv-accordion-content></primitiv-accordion-item></primitiv-accordion>",
    );
    document.querySelector("primitiv-accordion")?.setAttribute("value", "one");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain(named);
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(1);
    expect(document.querySelectorAll("[aria-expanded]")).toHaveLength(1);
  });

  it("reports an item with no value once, and leaves its parts undecorated", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-accordion>${ONE}<primitiv-accordion-item><h3><primitiv-accordion-trigger>` +
        '<button type="button">Two</button></primitiv-accordion-trigger></h3>' +
        "<primitiv-accordion-content>Second</primitiv-accordion-content></primitiv-accordion-item></primitiv-accordion>",
    );
    document.querySelector("primitiv-accordion")?.setAttribute("value", "one");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain("<primitiv-accordion-item>");
    expect(screen.getByRole("button", { name: "Two" }).hasAttribute("aria-expanded")).toBe(false);
    expect(document.querySelectorAll("primitiv-accordion-content")[1].hasAttribute("role")).toBe(false);
  });

  it("decorates only the first trigger and panel of an item", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-accordion value="one"><primitiv-accordion-item value="one"><h3><primitiv-accordion-trigger>' +
        '<button type="button">One</button></primitiv-accordion-trigger><primitiv-accordion-trigger>' +
        '<button type="button">Again</button></primitiv-accordion-trigger></h3>' +
        "<primitiv-accordion-content>First</primitiv-accordion-content>" +
        "<primitiv-accordion-content>Second</primitiv-accordion-content></primitiv-accordion-item></primitiv-accordion>",
    );

    // Assert
    expect(screen.getByRole("button", { name: "Again" }).hasAttribute("aria-expanded")).toBe(false);
    expect(document.querySelectorAll("primitiv-accordion-content")[1].hasAttribute("role")).toBe(false);
  });
});
