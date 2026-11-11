// @vitest-environment node
//
// A server renderer imports element modules where there is no DOM at all.
// Importing must not throw, and defining must be a no-op (RFC 0033 D21).

it("can be imported and defined where there is no DOM", async () => {
  // Arrange
  expect(globalThis.HTMLElement).toBeUndefined();

  // Act
  const { defineSegmentedControl, PrimitivSegmentedControlElement } = await import("../elements");

  // Assert
  expect(typeof PrimitivSegmentedControlElement).toBe("function");
  expect(() => defineSegmentedControl()).not.toThrow();
});
