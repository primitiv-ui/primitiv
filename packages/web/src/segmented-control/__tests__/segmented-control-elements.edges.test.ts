import { screen } from "@testing-library/dom";

import { defineSegmentedControl } from "../elements";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function mount(html: string) {
  defineSegmentedControl();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const DAY =
  '<primitiv-segmented-control-item value="day"><button type="button">Day</button></primitiv-segmented-control-item>';

describe("<primitiv-segmented-control> edge cases", () => {
  it.each([
    ["no value", '<primitiv-segmented-control-item><button type="button">Two</button></primitiv-segmented-control-item>'],
    ["no element child", '<primitiv-segmented-control-item value="two">Two</primitiv-segmented-control-item>'],
    [
      "two element children",
      '<primitiv-segmented-control-item value="two"><button type="button">Two</button><button type="button">B</button></primitiv-segmented-control-item>',
    ],
  ])("reports a segment with %s once, and leaves it undecorated", async (_case, item) => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(`<primitiv-segmented-control aria-label="Range">${DAY}${item}</primitiv-segmented-control>`);
    document.querySelector("primitiv-segmented-control")?.setAttribute("value", "day");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain("<primitiv-segmented-control-item>");
    expect(screen.getAllByRole("radio")).toHaveLength(1);
  });

  it("leaves no tab stop when its value names no segment", async () => {
    // Arrange & Act
    await mount(`<primitiv-segmented-control aria-label="Range" value="year">${DAY}</primitiv-segmented-control>`);

    // Assert
    expect(screen.getByRole("radio", { name: "Day" }).getAttribute("tabindex")).toBe("-1");
  });
});
