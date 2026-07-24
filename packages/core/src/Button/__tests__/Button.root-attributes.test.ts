import { getButtonRootAttributes } from "../button.ts";

describe("getButtonRootAttributes", () => {
  it('defaults type to "button" to prevent accidental form submission', () => {
    // Arrange & Act
    const attributes = getButtonRootAttributes({});

    // Assert
    expect(attributes.type).toBe("button");
  });
});
