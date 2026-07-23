import { render } from "@testing-library/react";

import { ToggleGroup } from "../ToggleGroup";
import { ToggleGroupContext } from "../ToggleGroupContext";

describe("ToggleGroup error handling", () => {
  it("throws a helpful error when ToggleGroup.Item is rendered outside Root", () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Assert
    expect(() =>
      render(<ToggleGroup.Item value="left">Left</ToggleGroup.Item>),
    ).toThrow(/ToggleGroup\.Item must be rendered inside a ToggleGroup\.Root/);

    error.mockRestore();
  });

  it("names the context for React DevTools", () => {
    // Assert — an empty displayName would render the provider as anonymous.
    expect(ToggleGroupContext.displayName).toBe("ToggleGroupContext");
  });
});
