import { accordionToggle, type AccordionState } from "../policy";

const state: AccordionState = {
  values: ["one", "two", "three"],
  disabled: new Set(),
  expanded: [],
  multiple: false,
  orientation: "vertical",
  dir: "ltr",
};

describe("accordionToggle", () => {
  it("opens a closed item", () => {
    // Arrange & Act
    const next = accordionToggle(state, "two");

    // Assert
    expect(next).toEqual(["two"]);
  });

  it("closes an open item", () => {
    // Arrange & Act
    const next = accordionToggle({ ...state, expanded: ["two"] }, "two");

    // Assert
    expect(next).toEqual([]);
  });

  it("closes the open item when another opens, in single mode", () => {
    // Arrange & Act
    const next = accordionToggle({ ...state, expanded: ["one"] }, "two");

    // Assert
    expect(next).toEqual(["two"]);
  });

  it("keeps the other open items when one opens, in multiple mode", () => {
    // Arrange & Act
    const next = accordionToggle({ ...state, multiple: true, expanded: ["one"] }, "two");

    // Assert
    expect(next).toEqual(["one", "two"]);
  });

  it("closes only the toggled item, in multiple mode", () => {
    // Arrange & Act
    const next = accordionToggle({ ...state, multiple: true, expanded: ["one", "two"] }, "one");

    // Assert
    expect(next).toEqual(["two"]);
  });

  it("does nothing for a disabled item", () => {
    // Arrange & Act
    const next = accordionToggle({ ...state, disabled: new Set(["two"]) }, "two");

    // Assert
    expect(next).toBeNull();
  });
});
