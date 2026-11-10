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

it("defines the Accordion elements when define/accordion is imported", async () => {
  // Arrange & Act
  await import("../accordion");

  // Assert
  for (const name of [
    "primitiv-accordion",
    "primitiv-accordion-item",
    "primitiv-accordion-trigger",
    "primitiv-accordion-content",
    "primitiv-accordion-trigger-icon",
  ]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines the Collapsible elements when define/collapsible is imported", async () => {
  // Arrange & Act
  await import("../collapsible");

  // Assert
  for (const name of [
    "primitiv-collapsible",
    "primitiv-collapsible-trigger",
    "primitiv-collapsible-content",
    "primitiv-collapsible-trigger-icon",
  ]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines the Modal elements when define/modal is imported", async () => {
  // Arrange & Act
  await import("../modal");

  // Assert
  for (const name of [
    "primitiv-modal",
    "primitiv-modal-trigger",
    "primitiv-modal-content",
    "primitiv-modal-title",
    "primitiv-modal-description",
    "primitiv-modal-close",
  ]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines the Popover elements when define/popover is imported", async () => {
  // Arrange & Act
  await import("../popover");

  // Assert
  for (const name of [
    "primitiv-popover",
    "primitiv-popover-trigger",
    "primitiv-popover-anchor",
    "primitiv-popover-content",
    "primitiv-popover-title",
    "primitiv-popover-description",
    "primitiv-popover-close",
  ]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines every component's elements when define is imported", async () => {
  // Arrange & Act
  const module = await import("../index");

  // Assert
  expect(module).toBeDefined();
  expect(customElements.get("primitiv-tabs")).toBeDefined();
  expect(customElements.get("primitiv-accordion")).toBeDefined();
  expect(customElements.get("primitiv-collapsible")).toBeDefined();
  expect(customElements.get("primitiv-modal")).toBeDefined();
  expect(customElements.get("primitiv-popover")).toBeDefined();
});
