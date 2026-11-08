import { accordionKeydown, accordionToggle, type AccordionState } from "../policy";

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

describe("accordionKeydown", () => {
  it.each([
    ["ArrowDown", "one", "two"],
    ["ArrowDown", "three", "one"],
    ["ArrowUp", "two", "one"],
    ["ArrowUp", "one", "three"],
    ["Home", "three", "one"],
    ["End", "one", "three"],
  ])("moves focus on %s from %s to %s, wrapping, without toggling", (key, focused, focus) => {
    // Arrange & Act
    const outcome = accordionKeydown(state, focused, key);

    // Assert
    expect(outcome).toEqual({ focus, toggle: null });
  });

  it("skips disabled items, unlike Tabs", () => {
    // Arrange & Act
    const outcome = accordionKeydown({ ...state, disabled: new Set(["two"]) }, "one", "ArrowDown");

    // Assert
    expect(outcome).toEqual({ focus: "three", toggle: null });
  });

  it("jumps past disabled items to the first and last enabled ones", () => {
    // Arrange
    const withEnds = { ...state, disabled: new Set(["one", "three"]) };

    // Act
    const home = accordionKeydown(withEnds, "two", "Home");
    const end = accordionKeydown(withEnds, "two", "End");

    // Assert
    expect(home).toEqual({ focus: "two", toggle: null });
    expect(end).toEqual({ focus: "two", toggle: null });
  });

  it("leaves the arrows alone while focus sits on a disabled item, but still jumps with Home", () => {
    // Arrange
    const disabled = { ...state, disabled: new Set(["two"]) };

    // Act
    const arrow = accordionKeydown(disabled, "two", "ArrowDown");
    const home = accordionKeydown(disabled, "two", "Home");

    // Assert
    expect(arrow).toBeNull();
    expect(home).toEqual({ focus: "one", toggle: null });
  });

  it("uses the horizontal arrows only when horizontal, mirrored right to left", () => {
    // Arrange
    const horizontal = { ...state, orientation: "horizontal" as const };

    // Act
    const vertical = accordionKeydown(state, "one", "ArrowRight");
    const ltr = accordionKeydown(horizontal, "one", "ArrowRight");
    const rtl = accordionKeydown({ ...horizontal, dir: "rtl" }, "one", "ArrowLeft");

    // Assert
    expect(vertical).toBeNull();
    expect(ltr).toEqual({ focus: "two", toggle: null });
    expect(rtl).toEqual({ focus: "two", toggle: null });
  });

  it.each(["Enter", " "])("toggles the focused item on %j, moving no focus", (key) => {
    // Arrange & Act
    const outcome = accordionKeydown(state, "two", key);

    // Assert
    expect(outcome).toEqual({ focus: null, toggle: "two" });
  });

  it("leaves Enter alone on a disabled item", () => {
    // Arrange & Act
    const outcome = accordionKeydown({ ...state, disabled: new Set(["two"]) }, "two", "Enter");

    // Assert
    expect(outcome).toBeNull();
  });

  it("leaves a key it does not handle alone", () => {
    // Arrange & Act
    const outcome = accordionKeydown(state, "one", "a");

    // Assert
    expect(outcome).toBeNull();
  });

  it("does nothing on Home when every item is disabled", () => {
    // Arrange & Act
    const outcome = accordionKeydown({ ...state, disabled: new Set(state.values) }, "one", "Home");

    // Assert
    expect(outcome).toBeNull();
  });
});
