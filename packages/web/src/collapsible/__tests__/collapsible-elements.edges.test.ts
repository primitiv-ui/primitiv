import { screen } from "@testing-library/dom";

import { defineCollapsible } from "../elements";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function mount(html: string) {
  defineCollapsible();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const CONTENT = "<primitiv-collapsible-content>Panel</primitiv-collapsible-content>";

describe("<primitiv-collapsible> edge cases", () => {
  it("gives a trigger with no panel no aria-controls", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-collapsible><primitiv-collapsible-trigger><button type="button">Toggle</button>' +
        "</primitiv-collapsible-trigger></primitiv-collapsible>",
    );

    // Assert
    expect(screen.getByRole("button", { name: "Toggle" }).hasAttribute("aria-controls")).toBe(false);
  });

  it("decorates a panel with no trigger", async () => {
    // Arrange & Act
    await mount(`<primitiv-collapsible open>${CONTENT}</primitiv-collapsible>`);

    // Assert
    const panel = document.querySelector("primitiv-collapsible-content") as HTMLElement;
    expect(panel.id).toMatch(/-content$/);
    expect(panel.hidden).toBe(false);
  });

  it.each([
    ["no element child", "<primitiv-collapsible-trigger>Toggle</primitiv-collapsible-trigger>"],
    [
      "two element children",
      '<primitiv-collapsible-trigger><button type="button">A</button><button type="button">B</button></primitiv-collapsible-trigger>',
    ],
  ])("reports a trigger with %s once, and leaves it undecorated", async (_case, trigger) => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(`<primitiv-collapsible>${trigger}${CONTENT}</primitiv-collapsible>`);
    document.querySelector("primitiv-collapsible")?.setAttribute("open", "");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain("<primitiv-collapsible-trigger>");
    expect(document.querySelectorAll("[aria-expanded]")).toHaveLength(0);
    expect((document.querySelector("primitiv-collapsible-content") as HTMLElement).hidden).toBe(false);
  });

  it("decorates only the first trigger and panel", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-collapsible><primitiv-collapsible-trigger><button type="button">Toggle</button></primitiv-collapsible-trigger>' +
        '<primitiv-collapsible-trigger><button type="button">Again</button></primitiv-collapsible-trigger>' +
        `${CONTENT}<primitiv-collapsible-content>Second</primitiv-collapsible-content></primitiv-collapsible>`,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Again" }).hasAttribute("aria-expanded")).toBe(false);
    expect(document.querySelectorAll("primitiv-collapsible-content")[1].hasAttribute("data-state")).toBe(false);
  });

  it("decorates icons outside the button too, but never a nested collapsible's", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-collapsible open><primitiv-collapsible-trigger><button type="button">Toggle</button></primitiv-collapsible-trigger>' +
        "<primitiv-collapsible-trigger-icon></primitiv-collapsible-trigger-icon>" +
        "<primitiv-collapsible-content><primitiv-collapsible><primitiv-collapsible-trigger-icon></primitiv-collapsible-trigger-icon>" +
        "</primitiv-collapsible></primitiv-collapsible-content></primitiv-collapsible>",
    );

    // Assert
    const [outer, nested] = document.querySelectorAll("primitiv-collapsible-trigger-icon");
    expect(outer.getAttribute("data-state")).toBe("open");
    expect(nested.getAttribute("data-state")).toBe("closed");
  });
});
