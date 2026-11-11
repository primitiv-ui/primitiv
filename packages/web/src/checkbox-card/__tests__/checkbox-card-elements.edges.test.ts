import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineCheckboxCard } from "../elements";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function mount(html: string) {
  defineCheckboxCard();
  document.body.innerHTML = html;
  await Promise.resolve();
}

describe("<primitiv-checkbox-card> edge cases", () => {
  it.each([
    ["no element child", "<primitiv-checkbox-card>Card</primitiv-checkbox-card>"],
    [
      "two element children",
      '<primitiv-checkbox-card><button type="button">A</button><button type="button">B</button></primitiv-checkbox-card>',
    ],
  ])("reports a card with %s once, and leaves it undecorated and inert", async (_case, html) => {
    // Arrange
    const user = userEvent.setup();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(html);
    document.querySelector("primitiv-checkbox-card")?.setAttribute("disabled", "");
    await Promise.resolve();
    for (const button of screen.queryAllByRole("button")) await user.click(button);

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain("<primitiv-checkbox-card>");
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(document.querySelector("primitiv-checkbox-card")?.hasAttribute("checked")).toBe(false);
  });
});
