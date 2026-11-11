import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineToggleGroup } from "../elements";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function mount(html: string) {
  defineToggleGroup();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const BOLD = '<primitiv-toggle-group-item value="bold"><button type="button">Bold</button></primitiv-toggle-group-item>';

describe("<primitiv-toggle-group> edge cases", () => {
  it.each([
    ["no value", '<primitiv-toggle-group-item><button type="button">Two</button></primitiv-toggle-group-item>'],
    ["no element child", '<primitiv-toggle-group-item value="two">Two</primitiv-toggle-group-item>'],
    [
      "two element children",
      '<primitiv-toggle-group-item value="two"><button type="button">Two</button><button type="button">B</button></primitiv-toggle-group-item>',
    ],
  ])("reports an item with %s once, and leaves it undecorated", async (_case, item) => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(`<primitiv-toggle-group aria-label="Formatting">${BOLD}${item}</primitiv-toggle-group>`);
    document.querySelector("primitiv-toggle-group")?.setAttribute("value", "bold");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain("<primitiv-toggle-group-item>");
    expect(document.querySelectorAll("[aria-pressed]")).toHaveLength(1);
  });

  it("leaves the tab stop alone when focus lands inside the group but on no item", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<primitiv-toggle-group aria-label="Formatting">${BOLD}<input aria-label="Size"></primitiv-toggle-group>`);

    // Act
    await user.click(screen.getByRole("textbox"));
    await Promise.resolve();

    // Assert
    expect(screen.getByRole("button", { name: "Bold" }).getAttribute("tabindex")).toBe("0");
  });
});
