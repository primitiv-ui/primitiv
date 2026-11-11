import { screen } from "@testing-library/dom";

import { defineRadioCard } from "../elements";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function mount(html: string) {
  defineRadioCard();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const BASIC = '<primitiv-radio-card-item value="basic"><button type="button">Basic</button></primitiv-radio-card-item>';

describe("<primitiv-radio-card> edge cases", () => {
  it.each([
    ["no value", '<primitiv-radio-card-item><button type="button">Two</button></primitiv-radio-card-item>'],
    ["no element child", '<primitiv-radio-card-item value="two">Two</primitiv-radio-card-item>'],
  ])("reports a card with %s once, and leaves it undecorated", async (_case, item) => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(`<primitiv-radio-card aria-label="Plan">${BASIC}${item}</primitiv-radio-card>`);
    document.querySelector("primitiv-radio-card")?.setAttribute("value", "basic");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain("<primitiv-radio-card-item>");
    expect(screen.getAllByRole("radio")).toHaveLength(1);
  });
});
