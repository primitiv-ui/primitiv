import { tabsClick, tabsKeydown, tabsTabStop, type TabsState } from "../policy";

const state: TabsState = {
  values: ["one", "two", "three"],
  disabled: new Set(),
  active: "one",
  orientation: "horizontal",
  dir: "ltr",
  activationMode: "automatic",
};

describe("tabsTabStop", () => {
  it("is the active tab", () => {
    // Arrange & Act
    const stop = tabsTabStop({ ...state, active: "two" });

    // Assert
    expect(stop).toBe("two");
  });

  it("falls back to the first tab when none is active, so the tablist stays reachable", () => {
    // Arrange & Act
    const stop = tabsTabStop({ ...state, active: undefined });

    // Assert
    expect(stop).toBe("one");
  });

  it("stays on an active value that matches no tab, leaving no trigger as the stop", () => {
    // Arrange & Act
    const stop = tabsTabStop({ ...state, active: "missing" });

    // Assert
    expect(stop).toBe("missing");
  });
});

describe("tabsClick", () => {
  it("activates a clicked inactive tab", () => {
    // Arrange & Act
    const activate = tabsClick(state, "two");

    // Assert
    expect(activate).toBe("two");
  });

  it("does nothing for the tab that is already active", () => {
    // Arrange & Act
    const activate = tabsClick(state, "one");

    // Assert
    expect(activate).toBeNull();
  });

  it("does nothing for a disabled tab", () => {
    // Arrange & Act
    const activate = tabsClick({ ...state, disabled: new Set(["two"]) }, "two");

    // Assert
    expect(activate).toBeNull();
  });
});

describe("tabsKeydown", () => {
  it("ignores a key that is not part of the tabs keymap", () => {
    // Arrange & Act
    const outcome = tabsKeydown(state, "one", "a");

    // Assert
    expect(outcome).toBeNull();
  });

  it("moves focus and activates on an arrow key in automatic mode", () => {
    // Arrange & Act
    const outcome = tabsKeydown(state, "one", "ArrowRight");

    // Assert
    expect(outcome).toEqual({ focus: "two", activate: "two" });
  });

  it("uses the vertical arrow pair when vertical", () => {
    // Arrange
    const vertical: TabsState = { ...state, orientation: "vertical" };

    // Act
    const down = tabsKeydown(vertical, "one", "ArrowDown");
    const right = tabsKeydown(vertical, "one", "ArrowRight");

    // Assert
    expect(down).toEqual({ focus: "two", activate: "two" });
    expect(right).toBeNull();
  });

  it("mirrors the horizontal arrows under RTL", () => {
    // Arrange & Act
    const outcome = tabsKeydown({ ...state, dir: "rtl" }, "one", "ArrowLeft");

    // Assert
    expect(outcome).toEqual({ focus: "two", activate: "two" });
  });

  it("jumps with Home and End", () => {
    // Arrange & Act
    const end = tabsKeydown(state, "one", "End");
    const home = tabsKeydown({ ...state, active: "three" }, "three", "Home");

    // Assert
    expect(end).toEqual({ focus: "three", activate: "three" });
    expect(home).toEqual({ focus: "one", activate: "one" });
  });

  it("moves focus without activating in manual mode", () => {
    // Arrange & Act
    const outcome = tabsKeydown({ ...state, activationMode: "manual" }, "one", "ArrowRight");

    // Assert
    expect(outcome).toEqual({ focus: "two", activate: null });
  });

  it("activates the focused tab on Enter or Space in manual mode", () => {
    // Arrange
    const manual: TabsState = { ...state, activationMode: "manual" };

    // Act
    const enter = tabsKeydown(manual, "two", "Enter");
    const space = tabsKeydown(manual, "two", " ");

    // Assert
    expect(enter).toEqual({ focus: "two", activate: "two" });
    expect(space).toEqual({ focus: "two", activate: "two" });
  });

  it("lands on a disabled tab without activating it", () => {
    // Arrange & Act
    const outcome = tabsKeydown({ ...state, disabled: new Set(["two"]) }, "one", "ArrowRight");

    // Assert
    expect(outcome).toEqual({ focus: "two", activate: null });
  });

  it("does not re-activate the tab that is already active", () => {
    // Arrange & Act
    const outcome = tabsKeydown(state, "one", "Enter");

    // Assert
    expect(outcome).toEqual({ focus: "one", activate: null });
  });

  it("resolves nothing when there are no tabs", () => {
    // Arrange & Act
    const outcome = tabsKeydown({ ...state, values: [] }, "one", "ArrowRight");

    // Assert
    expect(outcome).toBeNull();
  });
});
