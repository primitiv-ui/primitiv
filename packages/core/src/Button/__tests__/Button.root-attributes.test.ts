import { getButtonRootAttributes } from "../button.ts";

describe("getButtonRootAttributes", () => {
  it('defaults type to "button" to prevent accidental form submission', () => {
    // Arrange & Act
    const attributes = getButtonRootAttributes({});

    // Assert
    expect(attributes.type).toBe("button");
  });

  it("honours an explicitly supplied type", () => {
    // Arrange & Act
    const attributes = getButtonRootAttributes({ type: "submit" });

    // Assert
    expect(attributes.type).toBe("submit");
  });

  it("omits type entirely when the adapter delegates rendering (asChild)", () => {
    // Arrange & Act — the host element owns its own type semantics.
    const attributes = getButtonRootAttributes({ asChild: true });

    // Assert — absent, not undefined: an imperative adapter iterates these.
    expect("type" in attributes).toBe(false);
  });

  it("pairs the native disabled attribute with a data-disabled styling hook", () => {
    // Arrange & Act
    const attributes = getButtonRootAttributes({ disabled: true });

    // Assert
    expect(attributes).toStrictEqual({
      type: "button",
      disabled: true,
      "data-disabled": "",
    });
  });
});
