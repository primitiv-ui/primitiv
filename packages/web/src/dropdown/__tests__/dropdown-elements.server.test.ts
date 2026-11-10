// @vitest-environment node
import { defineDropdown, PrimitivDropdownElement } from "../elements";

describe("<primitiv-dropdown> on the server", () => {
  it("imports and defines nothing where there is no DOM", () => {
    // Arrange & Act & Assert
    expect(() => defineDropdown()).not.toThrow();
    expect(PrimitivDropdownElement).toBeDefined();
  });
});
