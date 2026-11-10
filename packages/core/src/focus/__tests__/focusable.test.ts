import { FOCUSABLE_SELECTOR } from "../focusable";

describe("FOCUSABLE_SELECTOR", () => {
  it("matches the tabbable elements, leaving out disabled controls and tabindex -1", () => {
    // Arrange & Act
    const selectors = FOCUSABLE_SELECTOR.split(",");

    // Assert
    expect(selectors).toEqual([
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ]);
  });
});
