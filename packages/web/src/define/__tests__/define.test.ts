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

it("defines the Context Menu elements when define/context-menu is imported", async () => {
  // Arrange & Act
  await import("../context-menu");

  // Assert
  for (const name of [
    "primitiv-context-menu",
    "primitiv-context-menu-trigger",
    "primitiv-context-menu-content",
    "primitiv-context-menu-item",
    "primitiv-context-menu-checkbox-item",
    "primitiv-context-menu-radio-group",
    "primitiv-context-menu-radio-item",
    "primitiv-context-menu-item-indicator",
    "primitiv-context-menu-group",
    "primitiv-context-menu-label",
    "primitiv-context-menu-separator",
    "primitiv-context-menu-sub",
    "primitiv-context-menu-sub-trigger",
    "primitiv-context-menu-sub-content",
  ]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines the Dropdown elements when define/dropdown is imported", async () => {
  // Arrange & Act
  await import("../dropdown");

  // Assert
  for (const name of [
    "primitiv-dropdown",
    "primitiv-dropdown-trigger",
    "primitiv-dropdown-content",
    "primitiv-dropdown-item",
    "primitiv-dropdown-checkbox-item",
    "primitiv-dropdown-radio-group",
    "primitiv-dropdown-radio-item",
    "primitiv-dropdown-item-indicator",
    "primitiv-dropdown-group",
    "primitiv-dropdown-label",
    "primitiv-dropdown-separator",
    "primitiv-dropdown-sub",
    "primitiv-dropdown-sub-trigger",
    "primitiv-dropdown-sub-content",
  ]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines the Tooltip elements when define/tooltip is imported", async () => {
  // Arrange & Act
  await import("../tooltip");

  // Assert
  for (const name of [
    "primitiv-tooltip",
    "primitiv-tooltip-provider",
    "primitiv-tooltip-trigger",
    "primitiv-tooltip-content",
    "primitiv-tooltip-arrow",
  ]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines the ToggleGroup elements when define/toggle-group is imported", async () => {
  // Arrange & Act
  await import("../toggle-group");

  // Assert
  for (const name of ["primitiv-toggle-group", "primitiv-toggle-group-item"]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines the SegmentedControl elements when define/segmented-control is imported", async () => {
  // Arrange & Act
  await import("../segmented-control");

  // Assert
  for (const name of ["primitiv-segmented-control", "primitiv-segmented-control-item"]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines the RadioCard elements when define/radio-card is imported", async () => {
  // Arrange & Act
  await import("../radio-card");

  // Assert
  for (const name of ["primitiv-radio-card", "primitiv-radio-card-item", "primitiv-radio-card-indicator"]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines the CheckboxCard elements when define/checkbox-card is imported", async () => {
  // Arrange & Act
  await import("../checkbox-card");

  // Assert
  for (const name of ["primitiv-checkbox-card", "primitiv-checkbox-card-indicator"]) {
    expect(customElements.get(name)).toBeDefined();
  }
});

it("defines the Slider elements when define/slider is imported", async () => {
  // Arrange & Act
  await import("../slider");

  // Assert
  for (const name of ["primitiv-slider", "primitiv-slider-track", "primitiv-slider-range", "primitiv-slider-thumb"]) {
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
  expect(customElements.get("primitiv-tooltip")).toBeDefined();
  expect(customElements.get("primitiv-dropdown")).toBeDefined();
  expect(customElements.get("primitiv-context-menu")).toBeDefined();
  expect(customElements.get("primitiv-toggle-group")).toBeDefined();
  expect(customElements.get("primitiv-segmented-control")).toBeDefined();
  expect(customElements.get("primitiv-radio-card")).toBeDefined();
  expect(customElements.get("primitiv-checkbox-card")).toBeDefined();
  expect(customElements.get("primitiv-slider")).toBeDefined();
});
