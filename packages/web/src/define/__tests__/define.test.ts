// Importing a `define` entry registers its elements as a side effect, so a
// page can load one module and use the tags (RFC 0033 §7.1). The main entry
// stays free of side effects; only these modules define anything.

it("leaves the elements undefined until a define entry is imported", async () => {
  // Arrange
  const before = customElements.get("primitiv-tabs");

  // Act
  await import("../../index");

  // Assert
  expect(before).toBeUndefined();
  expect(customElements.get("primitiv-tabs")).toBeUndefined();
});

it("defines the Tabs elements when define/tabs is imported", async () => {
  // Arrange & Act
  await import("../tabs");

  // Assert
  for (const name of ["primitiv-tabs", "primitiv-tabs-list", "primitiv-tabs-trigger", "primitiv-tabs-content"]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines every component's elements when define is imported", async () => {
  // Arrange & Act
  const module = await import("../index");

  // Assert
  expect(module).toBeDefined();
  expect(customElements.get("primitiv-tabs")).toBeDefined();
});
